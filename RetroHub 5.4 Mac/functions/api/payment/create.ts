/**
 * RetroHub — Cloudflare Pages Function
 * Endpoint : /api/payment/create
 * Metode   : POST
 * Fungsi   : Membuat transaksi pembayaran Midtrans (Snap).
 *            Harga SELALU diambil dari Supabase (tidak percaya browser).
 *
 * Env Variables (Cloudflare Pages > Settings > Environment Variables):
 *   MIDTRANS_SERVER_KEY   — Server Key dari Midtrans Dashboard (wajib, RAHASIA)
 *   MIDTRANS_IS_SANDBOX   — "true" untuk sandbox/testing, "false" untuk production
 *   SUPABASE_URL          — URL project Supabase kamu
 *   SUPABASE_SERVICE_KEY  — Service Role Key Supabase (bukan anon key!)
 *
 * Request body (JSON):
 *   { order_id: string }   // ID order dari tabel public.orders
 *
 * Response sukses (200):
 *   { success: true, snap_token: string, redirect_url: string }
 *
 * Response error:
 *   { success: false, error: string }
 */

interface Env {
  MIDTRANS_SERVER_KEY: string;
  MIDTRANS_IS_SANDBOX: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // ── 1. Validasi env variables ──────────────────────────────────────────────
  if (!env.MIDTRANS_SERVER_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return jsonResponse(503, {
      success: false,
      error: 'Payment gateway belum dikonfigurasi. Hubungi admin.',
    });
  }

  // ── 2. Parse request ───────────────────────────────────────────────────────
  let body: { order_id?: string; order_ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { success: false, error: 'Request body tidak valid.' });
  }

  let orderIds: string[] = [];
  if (body.order_ids && Array.isArray(body.order_ids)) {
    orderIds = body.order_ids;
  } else if (body.order_id) {
    orderIds = [body.order_id];
  }

  if (orderIds.length === 0) {
    return jsonResponse(400, { success: false, error: 'order_id atau order_ids wajib diisi.' });
  }

  // ── 3. Ambil data order dari Supabase (BUKAN dari browser) ─────────────────
  let orders: Record<string, any>[] = [];
  const filter = orderIds.length > 1
    ? `id=in.(${orderIds.map(id => encodeURIComponent(id)).join(',')})`
    : `id=eq.${encodeURIComponent(orderIds[0])}`;

  try {
    const supabaseRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/orders?${filter}&select=id,total_payment,payment_status,buyer_id,product_title,buyer_name`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    if (!supabaseRes.ok) {
      throw new Error(`Supabase error: ${supabaseRes.status}`);
    }

    orders = await supabaseRes.json();
    if (!orders || orders.length === 0) {
      return jsonResponse(404, { success: false, error: 'Order tidak ditemukan.' });
    }
  } catch (err) {
    console.error('[RetroHub/payment/create] Supabase fetch error:', err);
    return jsonResponse(500, { success: false, error: 'Gagal memverifikasi order.' });
  }

  // ── 4. Validasi status order ───────────────────────────────────────────────
  const alreadyPaid = orders.filter(o => o.payment_status !== 'pending');
  if (alreadyPaid.length > 0) {
    return jsonResponse(409, {
      success: false,
      error: `Terdapat pesanan yang sudah dibayar atau kedaluwarsa.`,
    });
  }

  // ── 5. Hasilkan payment_reference unik & update orders di Supabase ─────────
  const paymentRef = `RH-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const updateRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/orders?${filter}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ payment_reference: paymentRef }),
      }
    );

    if (!updateRes.ok) {
      throw new Error(`Gagal menyimpan payment_reference: ${updateRes.status}`);
    }
  } catch (err) {
    console.error('[RetroHub/payment/create] Supabase patch error:', err);
    return jsonResponse(500, { success: false, error: 'Gagal menyiapkan referensi pembayaran.' });
  }

  // ── 6. Buat transaksi Midtrans Snap ───────────────────────────────────────
  const isSandbox = env.MIDTRANS_IS_SANDBOX !== 'false';
  const midtransBaseUrl = isSandbox
    ? 'https://app.sandbox.midtrans.com/snap/v1/transactions'
    : 'https://app.midtrans.com/snap/v1/transactions';

  const totalAmount = orders.reduce((sum, o) => sum + Number(o.total_payment || 0), 0);

  const midtransPayload = {
    transaction_details: {
      order_id: paymentRef,
      gross_amount: totalAmount,
    },
    customer_details: {
      first_name: String(orders[0].buyer_name || 'Pembeli RetroHub'),
    },
    item_details: orders.map(o => ({
      id: String(o.id).substring(0, 50),
      price: Number(o.total_payment),
      quantity: 1,
      name: String(o.product_title || 'Produk RetroHub').substring(0, 50),
    })),
    callbacks: {
      finish: 'https://retrohub-8sv.pages.dev/index.html',
    },
  };

  try {
    const basicAuth = btoa(`${env.MIDTRANS_SERVER_KEY}:`);

    const midtransRes = await fetch(midtransBaseUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify(midtransPayload),
    });

    const midtransData: { token?: string; redirect_url?: string; error_messages?: string[] }
      = await midtransRes.json();

    if (!midtransRes.ok || !midtransData.token) {
      console.error('[RetroHub/payment/create] Midtrans error:', midtransData);
      return jsonResponse(502, {
        success: false,
        error: midtransData.error_messages?.join(', ') || 'Gagal membuat transaksi Midtrans.',
      });
    }

    return jsonResponse(200, {
      success: true,
      snap_token: midtransData.token,
      redirect_url: midtransData.redirect_url,
    });

  } catch (err) {
    console.error('[RetroHub/payment/create] Fetch error:', err);
    return jsonResponse(500, { success: false, error: 'Terjadi kesalahan server.' });
  }
};

function jsonResponse(status: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://retrohub-8sv.pages.dev',
    },
  });
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://retrohub-8sv.pages.dev',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
