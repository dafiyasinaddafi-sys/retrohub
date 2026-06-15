/**
 * RetroHub — Cloudflare Pages Function
 * Endpoint : /api/payment/webhook
 * Metode   : POST
 * Fungsi   : Menerima notifikasi pembayaran dari Midtrans (webhook).
 *            Verifikasi signature sebelum update status order di Supabase.
 *            URL ini didaftarkan di Midtrans Dashboard > Configuration > Payment Notification URL
 *
 * Env Variables (Cloudflare Pages > Settings > Environment Variables):
 *   MIDTRANS_SERVER_KEY   — Server Key Midtrans (sama dengan di create.ts)
 *   SUPABASE_URL          — URL project Supabase
 *   SUPABASE_SERVICE_KEY  — Service Role Key Supabase
 *
 * Flow:
 *   Midtrans kirim notifikasi → verifikasi signature → update orders di Supabase
 *
 * Status mapping Midtrans → RetroHub:
 *   capture/settlement → payment_status: 'paid', status: 'to_ship'
 *   expire/cancel/deny → payment_status: 'failed'
 *   pending            → payment_status: 'pending' (tidak berubah)
 */

import { createHash } from 'node:crypto';

interface Env {
  MIDTRANS_SERVER_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // ── 1. Validasi env ────────────────────────────────────────────────────────
  if (!env.MIDTRANS_SERVER_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.error('[RetroHub/webhook] Env variables tidak lengkap');
    return new Response('Server misconfigured', { status: 503 });
  }

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  let notif: MidtransNotification;
  try {
    notif = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = notif;

  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return new Response('Missing required fields', { status: 400 });
  }

  // ── 3. Verifikasi signature Midtrans ──────────────────────────────────────
  // Formula resmi Midtrans: SHA512(order_id + status_code + gross_amount + server_key)
  const expectedSignature = createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${env.MIDTRANS_SERVER_KEY}`)
    .digest('hex');

  if (signature_key !== expectedSignature) {
    console.error('[RetroHub/webhook] Signature tidak valid untuk order:', order_id);
    // Kembalikan 200 agar Midtrans tidak retry, tapi jangan update DB
    return new Response('Invalid signature', { status: 403 });
  }

  // ── 4. Tentukan status RetroHub berdasarkan status Midtrans ───────────────
  type PaymentStatus = 'paid' | 'failed' | 'pending';
  type OrderStatus = 'to_ship' | 'waiting_payment';

  let newPaymentStatus: PaymentStatus = 'pending';
  let newOrderStatus: OrderStatus | null = null;
  let paidAt: string | null = null;

  const isPaid =
    transaction_status === 'capture' && fraud_status === 'accept' ||
    transaction_status === 'settlement';

  const isFailed =
    transaction_status === 'cancel' ||
    transaction_status === 'deny' ||
    transaction_status === 'expire';

  if (isPaid) {
    newPaymentStatus = 'paid';
    newOrderStatus   = 'to_ship'; // siap dikemas seller
    paidAt           = new Date().toISOString();
  } else if (isFailed) {
    newPaymentStatus = 'failed';
  } else {
    // pending / challenge — tidak update, beri tahu Midtrans OK
    console.log(`[RetroHub/webhook] Status pending/challenge untuk order ${order_id}, tidak ada update.`);
    return new Response('OK', { status: 200 });
  }

  // ── 5. Update order di Supabase ───────────────────────────────────────────
  const updatePayload: Record<string, unknown> = { payment_status: newPaymentStatus };
  if (newOrderStatus) updatePayload.status = newOrderStatus;
  if (paidAt)         updatePayload.paid_at = paidAt;

  const isPaymentRef = order_id.startsWith('RH-PAY-');
  const filter = isPaymentRef
    ? `payment_reference=eq.${encodeURIComponent(order_id)}`
    : `id=eq.${encodeURIComponent(order_id)}`;

  try {
    const supabaseRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/orders?${filter}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!supabaseRes.ok) {
      const errText = await supabaseRes.text();
      console.error('[RetroHub/webhook] Supabase update error:', supabaseRes.status, errText);
      // Kembalikan 500 agar Midtrans retry webhook nanti
      return new Response('DB update failed', { status: 500 });
    }

    console.log(`[RetroHub/webhook] Orders matching ${filter} diupdate → payment: ${newPaymentStatus}, status: ${newOrderStatus ?? 'tidak berubah'}`);
    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('[RetroHub/webhook] Fetch error:', err);
    return new Response('Server error', { status: 500 });
  }
};
