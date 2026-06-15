/**
 * RetroHub — Cloudflare Pages Function
 * Endpoint : /api/ongkir
 * Metode   : POST
 * Fungsi   : Proxy aman ke Biteship API untuk kalkulasi ongkir real-time.
 *            Dipanggil HANYA saat user konfirmasi checkout (bukan saat browsing).
 *            Saat browsing, frontend menampilkan estimasi flat-rate dari db.js.
 *
 * Env Variables (set di Cloudflare Pages > Settings > Environment Variables):
 *   BITESHIP_API_KEY  — API key dari dashboard Biteship (wajib)
 *
 * Request body (JSON):
 *   {
 *     origin_postal_code      : string,   // kode pos asal (dari profil seller)
 *     destination_postal_code : string,   // kode pos tujuan (dari alamat buyer)
 *     weight_gram             : number,   // berat dalam gram
 *     couriers                : string    // "jne,jnt,sicepat" (opsional, default semua)
 *   }
 *
 * Response sukses (200):
 *   { success: true, data: [...courier pricing dari Biteship] }
 *
 * Response error (4xx/5xx):
 *   { success: false, error: "pesan error" }
 */

interface Env {
  BITESHIP_API_KEY: string;
}

interface OngkirRequest {
  origin_postal_code: string;
  destination_postal_code: string;
  weight_gram: number;
  couriers?: string;
}

function getAllowedOrigin(request: Request): string {
  const origin = request.headers.get('Origin');
  if (origin) {
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      /^https:\/\/retrohub-[a-z0-9-]+\.pages\.dev$/.test(origin) ||
      origin === 'https://retrohub.pages.dev'
    ) {
      return origin;
    }
  }
  return 'https://retrohub-new.pages.dev';
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const allowedOrigin = getAllowedOrigin(request);
  const jsonResponse = (status: number, body: object) => new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });

  // ── 1. Validasi API key sudah di-set ──────────────────────────────────────
  if (!env.BITESHIP_API_KEY) {
    return jsonResponse(503, {
      success: false,
      error: 'Layanan ongkir belum dikonfigurasi. Hubungi admin.',
    });
  }

  // ── 2. Parse & validasi request body ──────────────────────────────────────
  let body: OngkirRequest;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { success: false, error: 'Request body tidak valid (harus JSON).' });
  }

  const { origin_postal_code, destination_postal_code, weight_gram, couriers } = body;

  if (!origin_postal_code || !destination_postal_code || !weight_gram) {
    return jsonResponse(400, {
      success: false,
      error: 'Field wajib: origin_postal_code, destination_postal_code, weight_gram.',
    });
  }

  if (typeof weight_gram !== 'number' || weight_gram <= 0 || weight_gram > 30000) {
    return jsonResponse(400, {
      success: false,
      error: 'Berat tidak valid (harus angka antara 1–30.000 gram).',
    });
  }

  // ── 3. Hit Biteship API ───────────────────────────────────────────────────
  try {
    const biteshipUrl = 'https://api.biteship.com/v1/rates/couriers';
    const biteshipPayload = {
      origin_postal_code,
      destination_postal_code,
      couriers: couriers || 'jne,jnt,sicepat,anteraja,pos',
      items: [{ name: 'Produk RetroHub', value: 10000, weight: weight_gram, quantity: 1 }],
    };

    const biteshipRes = await fetch(biteshipUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Biteship ${env.BITESHIP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(biteshipPayload),
    });

    if (!biteshipRes.ok) {
      const errText = await biteshipRes.text();
      console.error('[RetroHub/ongkir] Biteship error:', biteshipRes.status, errText);
      return jsonResponse(502, {
        success: false,
        error: 'Gagal mendapatkan data ongkir dari Biteship. Coba lagi.',
      });
    }

    const biteshipData = await biteshipRes.json();

    return jsonResponse(200, {
      success: true,
      data: biteshipData.pricing ?? biteshipData,
    });

  } catch (err) {
    console.error('[RetroHub/ongkir] Fetch error:', err);
    return jsonResponse(500, { success: false, error: 'Terjadi kesalahan server. Coba lagi.' });
  }
};

export const onRequestOptions: PagesFunction = async ({ request }) => {
  const allowedOrigin = getAllowedOrigin(request);
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
