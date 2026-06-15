/* ======================================================================
   RetroHub Custom UI Notification & Modal System (ui.js)
   ======================================================================
   Script ini menggantikan fungsi default alert() dan confirm() browser dengan
   kotak notifikasi (toast) dan modal dialog melayang bergaya retro Mario.
====================================================================== */

// Inisialisasi container toast secara otomatis jika belum ada
let toastContainer = document.querySelector('.toast-container');
if (!toastContainer) {
  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
}

// 1. FUNGSI TOAST NOTIFIKASI MELAYANG (SUKSES, PROMO, INFO, PERINGATAN)
// type: 'success', 'error', 'info', 'warning'
function showToast(title, message, type = 'success') {
  const toastBox = document.createElement('div');
  toastBox.className = `toast-box toast-${type}`;

  toastBox.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-message">${message}</div>
  `;

  toastContainer.appendChild(toastBox);

  // Hilangkan otomatis setelah 3.5 detik dengan efek geser keluar
  setTimeout(() => {
    toastBox.style.transform = 'translateX(120%)';
    toastBox.style.opacity = '0';
    setTimeout(() => {
      toastBox.remove();
    }, 200);
  }, 3500);
}

// 2. FUNGSI DIALOG KONFIRMASI RETRO (MENGGANTIKAN CONFIRM)
function showConfirm(title, message, onYes, onNo = null) {
  // Tutup semua confirm modal yang sudah ada dulu agar tidak numpuk
  document.querySelectorAll('.retro-confirm-overlay').forEach(el => el.remove());

  const uid = 'confirm-' + Date.now();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay retro-confirm-overlay';
  overlay.style.zIndex = '99999';

  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-title">${title}</div>
      <div class="modal-message">${message}</div>
      <div class="modal-buttons">
        <button class="btn-retro btn-green" id="${uid}-yes">YA 👍</button>
        <button class="btn-retro btn-red" id="${uid}-no">BATAL ❌</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById(uid + '-yes').addEventListener('click', () => {
    overlay.remove();
    if (onYes) onYes();
  });

  document.getElementById(uid + '-no').addEventListener('click', () => {
    overlay.remove();
    if (onNo) onNo();
  });
}

// 3. FUNGSI ALERT MODAL RETRO (MENGGANTIKAN ALERT BIASA)
function showAlert(title, message, onOk = null) {
  const uid = 'alert-' + Date.now();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '99999';

  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-title" style="color: var(--mario-red);">${title}</div>
      <div class="modal-message">${message}</div>
      <div class="modal-buttons">
        <button class="btn-retro btn-blue" id="${uid}-ok">OK 👌</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById(uid + '-ok').addEventListener('click', () => {
    overlay.remove();
    if (onOk) onOk();
  });
}

// ==========================================
// RETRO PRIVATE CHAT SYSTEM INTEGRATION
// ==========================================

// Sisapkankan style chat dinamis
const styleEl = document.createElement('style');
styleEl.innerHTML = `
/* Retro Chat Modal Styles */
.chat-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(26, 26, 26, 0.6);
    backdrop-filter: blur(2px);
    z-index: 10010;
    display: flex;
    justify-content: center;
    align-items: center;
}

.chat-modal-box {
    background-color: #FFFFFF;
    border: 3.5px solid var(--retro-dark);
    border-radius: 6px;
    box-shadow: 6px 6px 0px var(--retro-dark);
    width: 90%;
    max-width: 420px;
    height: 480px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: scaleUp 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.chat-modal-header {
    background-color: var(--mario-blue);
    color: #FFFFFF;
    border-bottom: 3.5px solid var(--retro-dark);
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chat-modal-title {
    font-family: var(--font-retro);
    font-size: 1rem;
    font-weight: 700;
}

.chat-modal-close {
    background: var(--mario-red);
    color: white;
    border: 2px solid var(--retro-dark);
    border-radius: 4px;
    width: 26px;
    height: 26px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.8rem;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 1.5px 1.5px 0px var(--retro-dark);
}
.chat-modal-close:active {
    transform: translate(1px, 1px);
    box-shadow: 0px 0px 0px;
}

.chat-inbox-list {
    flex-grow: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: #F8FAFC;
}

.chat-inbox-item {
    background: #FFFFFF;
    border: 2px solid var(--retro-dark);
    border-radius: 5px;
    box-shadow: 2px 2px 0px var(--retro-dark);
    padding: 10px;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.chat-inbox-item:hover {
    background-color: #FFFDF0;
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0px var(--retro-dark);
}

.chat-inbox-partner {
    font-family: var(--font-retro);
    font-size: 0.85rem;
    font-weight: bold;
    color: var(--retro-dark);
}

.chat-inbox-preview {
    font-size: 0.75rem;
    color: #64748B;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 240px;
    margin-top: 2px;
}

.chat-history-area {
    flex-grow: 1;
    overflow-y: auto;
    padding: 12px;
    background-color: #F1F5F9;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.chat-bubble {
    max-width: 80%;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    line-height: 1.4;
    border: 1.5px solid var(--retro-dark);
    position: relative;
}

.chat-bubble-sent {
    background-color: #E0F2FE;
    align-self: flex-end;
    box-shadow: 2px 2px 0px var(--retro-dark);
}

.chat-bubble-received {
    background-color: #FFFFFF;
    align-self: flex-start;
    box-shadow: 2px 2px 0px var(--retro-dark);
}

.chat-bubble-time {
    font-size: 0.6rem;
    color: #94A3B8;
    margin-top: 4px;
    text-align: right;
}

.chat-input-area {
    border-top: 3.5px solid var(--retro-dark);
    padding: 10px;
    display: flex;
    gap: 8px;
    background-color: #FFFFFF;
}

.chat-input-text {
    flex-grow: 1;
    border: 2px solid var(--retro-dark);
    border-radius: 4px;
    padding: 8px;
    font-size: 0.8rem;
    outline: none;
}

/* Attachment support */
.chat-attach-btn {
    background: #F1F5F9;
    border: 2px solid var(--retro-dark);
    border-radius: 4px;
    padding: 6px 10px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.15s;
    flex-shrink: 0;
}
.chat-attach-btn:hover { background: #E2E8F0; }

.chat-media-preview-strip {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 6px 10px 0;
    background: white;
    flex-wrap: wrap;
}
.chat-media-thumb {
    position: relative;
    width: 52px; height: 52px;
    border: 2px solid var(--retro-dark);
    border-radius: 5px;
    overflow: hidden;
    flex-shrink: 0;
}
.chat-media-thumb img, .chat-media-thumb video {
    width: 100%; height: 100%; object-fit: cover;
}
.chat-media-thumb .remove-attach {
    position: absolute; top: 1px; right: 1px;
    background: rgba(0,0,0,0.6);
    color: white;
    font-size: 0.55rem;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    padding: 1px 3px;
    line-height: 1;
}
.chat-media-size-label {
    font-size: 0.6rem;
    color: #64748B;
    align-self: flex-end;
}

/* Media inside bubble */
.chat-bubble-media-img {
    max-width: 200px;
    max-height: 180px;
    border-radius: 5px;
    border: 1.5px solid var(--retro-dark);
    display: block;
    margin-top: 5px;
    cursor: zoom-in;
    object-fit: cover;
}
.chat-bubble-media-video {
    max-width: 220px;
    border-radius: 5px;
    border: 1.5px solid var(--retro-dark);
    display: block;
    margin-top: 5px;
}

.chat-inbox-empty {
    text-align: center;
    color: #64748B;
    font-size: 0.8rem;
    margin-top: 40px;
}

/* Retro Dropdown & Popout Styles */
.retro-dropdown {
    background-color: #FFFFFF;
    border: 3px solid var(--retro-dark);
    border-radius: 6px;
    box-shadow: 4px 4px 0px var(--retro-dark);
    padding: 16px;
    width: 260px;
    display: flex;
    flex-direction: column;
    animation: scaleUp 0.1s ease-out forwards;
}
`;
document.head.appendChild(styleEl);

// 1. Render global header dengan 3 ikon saja
function renderGlobalHeader() {
    const header = document.querySelector('header');
    if (!header) return;

    const cart = (typeof db !== 'undefined') ? db.getCart() : [];
    const currentUserId = (typeof db !== 'undefined') ? db.getCurrentUserId() : null;
    const user = (typeof db !== 'undefined' && currentUserId) ? db.getProfileById(currentUserId) : null;
    const storeName = user ? '@' + user.store_name : 'Guest';

    header.innerHTML = `
        <div class="logo-container">
            <a href="index.html" style="display:flex;align-items:center;gap:8px;text-decoration:none;">
                <img src="/icons/icon-192.png" alt="RH" style="height:30px;width:30px;object-fit:contain;border-radius:4px;">
                <span class="logo-text">RetroHub</span>
            </a>
        </div>
        <div class="header-toolbar" style="display: flex; gap: 8px; align-items: center;">
            <!-- Tombol Lokasi -->
            <button id="global-location-btn" title="Atur lokasi pengiriman"
                style="background:rgba(0,0,0,0.2);border:1.5px solid rgba(255,255,255,0.3);border-radius:4px;color:#fff;font-family:var(--font-retro);font-size:0.65rem;font-weight:700;padding:4px 8px;cursor:pointer;display:flex;align-items:center;gap:4px;max-width:130px;white-space:nowrap;overflow:hidden;">
                📍 <span id="location-label" style="overflow:hidden;text-overflow:ellipsis;max-width:90px;">Atur Lokasi</span>
            </button>

            <!-- 1. Notifikasi -->
            <a href="#" class="toolbar-btn" id="global-chat-btn" title="Pesan & Notifikasi" style="position: relative;">
                💬<span id="global-notif-badge" style="display:none;background:var(--mario-red);color:white;border:1.5px solid var(--retro-dark);border-radius:50%;font-size:0.6rem;width:16px;height:16px;position:absolute;top:-5px;right:-5px;align-items:center;justify-content:center;font-family:var(--font-number);font-weight:bold;line-height:1;">0</span>
            </a>

            <!-- 2. Keranjang -->
            <a href="#" class="toolbar-btn" id="global-cart-btn" title="Keranjang Belanja" style="position: relative;">
                🛒<span class="cart-badge" id="cart-counter" style="position:absolute;top:-5px;right:-5px;background:var(--mario-yellow);color:var(--retro-dark);font-size:0.65rem;border:1.5px solid var(--retro-dark);border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-family:var(--font-number);font-weight:bold;line-height:1;">${cart.length}</span>
            </a>

            <!-- 3. Profil -->
            <a href="#" class="toolbar-btn" id="global-profile-btn" title="Profil & Menu">
                👤
            </a>
        </div>
    `;

    // Pasang Event Listeners
    document.getElementById('global-chat-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openNotifPanel();
    });

    document.getElementById('global-cart-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCartPopout(e);
    });

    document.getElementById('global-profile-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleProfileDropdown(e);
    });

    document.getElementById('global-location-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openLocationModal();
    });

    // Update label lokasi dari storage
    _updateLocationLabel();
}

// Update label lokasi di navbar
function _updateLocationLabel() {
    const label = document.getElementById('location-label');
    if (!label) return;
    const loc = db.getUserLocation();
    label.textContent = loc ? loc.kecamatan : 'Atur Lokasi';
}

// Update badge notifikasi di navbar
function updateChatBadgeGlobal() {
    const badge = document.getElementById('global-notif-badge');
    if (!badge || typeof db === 'undefined') return;
    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) { badge.style.display = 'none'; return; }
    const count = db.getUnreadNotifCount(currentUserId) + db.getUnreadChatCountGlobal(currentUserId);
    if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Modal atur lokasi pengiriman
function openLocationModal() {
    if (document.getElementById('retrohub-location-modal')) return;

    // Load data wilayah dari API publik
    const modal = document.createElement('div');
    modal.id = 'retrohub-location-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:20000;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
        <div style="background:#fff;border:2.5px solid var(--retro-dark);border-radius:8px;box-shadow:4px 4px 0 var(--retro-dark);padding:20px;width:100%;max-width:380px;">
            <div style="font-family:var(--font-retro);font-size:1rem;font-weight:700;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
                📍 Atur Lokasi Pengiriman
                <button onclick="document.getElementById('retrohub-location-modal').remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;">✕</button>
            </div>
            <div style="font-size:0.75rem;color:#64748B;margin-bottom:12px;">
                Lokasi ini digunakan untuk menampilkan estimasi ongkir di seluruh halaman RetroHub.
            </div>

            <label style="font-size:0.72rem;font-weight:700;display:block;margin-bottom:4px;">Provinsi</label>
            <select id="loc-provinsi" style="width:100%;padding:7px;border:2px solid var(--retro-dark);border-radius:4px;font-size:0.8rem;margin-bottom:10px;">
                <option value="">-- Pilih Provinsi --</option>
            </select>

            <label style="font-size:0.72rem;font-weight:700;display:block;margin-bottom:4px;">Kota / Kabupaten</label>
            <select id="loc-kota" style="width:100%;padding:7px;border:2px solid var(--retro-dark);border-radius:4px;font-size:0.8rem;margin-bottom:10px;" disabled>
                <option value="">-- Pilih Kota/Kabupaten --</option>
            </select>

            <label style="font-size:0.72rem;font-weight:700;display:block;margin-bottom:4px;">Kecamatan</label>
            <select id="loc-kecamatan" style="width:100%;padding:7px;border:2px solid var(--retro-dark);border-radius:4px;font-size:0.8rem;margin-bottom:16px;" disabled>
                <option value="">-- Pilih Kecamatan --</option>
            </select>

            <div style="display:flex;gap:8px;">
                <button id="loc-save-btn" class="btn-retro btn-red" style="flex:1;font-size:0.8rem;padding:8px;" disabled>
                    💾 Simpan Lokasi
                </button>
                <button onclick="db.clearUserLocation();_updateLocationLabel();document.getElementById('retrohub-location-modal').remove();"
                    style="background:none;border:1.5px solid #94A3B8;border-radius:4px;padding:8px 12px;font-size:0.75rem;cursor:pointer;color:#64748B;">
                    Reset
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Tutup klik di luar
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    // Load provinsi dari API Emsifa (gratis, tanpa key)
    const selProvinsi  = document.getElementById('loc-provinsi');
    const selKota      = document.getElementById('loc-kota');
    const selKecamatan = document.getElementById('loc-kecamatan');
    const saveBtn      = document.getElementById('loc-save-btn');

    // Isi nilai tersimpan jika ada
    const saved = db.getUserLocation();

    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
        .then(r => r.json())
        .then(data => {
            data.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.name;
                if (saved && saved.provinsi === p.name) opt.selected = true;
                selProvinsi.appendChild(opt);
            });
            if (saved && saved.provinsi_id) {
                selKota.disabled = false;
                _loadKota(saved.provinsi_id, saved);
            }
        })
        .catch(() => {
            selProvinsi.innerHTML = '<option>Gagal memuat data. Cek koneksi.</option>';
        });

    selProvinsi.addEventListener('change', () => {
        const id = selProvinsi.value;
        const name = selProvinsi.options[selProvinsi.selectedIndex].text;
        selKota.innerHTML = '<option value="">-- Pilih Kota/Kabupaten --</option>';
        selKota.disabled = true;
        selKecamatan.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
        selKecamatan.disabled = true;
        saveBtn.disabled = true;
        if (id) { selKota.disabled = false; _loadKota(id, null); }
    });

    selKota.addEventListener('change', () => {
        const id = selKota.value;
        selKecamatan.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
        selKecamatan.disabled = true;
        saveBtn.disabled = true;
        if (id) { selKecamatan.disabled = false; _loadKecamatan(id, null); }
    });

    selKecamatan.addEventListener('change', () => {
        saveBtn.disabled = !selKecamatan.value;
    });

    saveBtn.addEventListener('click', () => {
        const loc = {
            provinsi:     selProvinsi.options[selProvinsi.selectedIndex].text,
            provinsi_id:  selProvinsi.value,
            kota:         selKota.options[selKota.selectedIndex].text,
            kota_id:      selKota.value,
            kecamatan:    selKecamatan.options[selKecamatan.selectedIndex].text,
            kecamatan_id: selKecamatan.value,
        };
        db.setUserLocation(loc);
        _updateLocationLabel();
        modal.remove();
        showToast('📍 Lokasi berhasil disimpan!', 'success');
        // Refresh estimasi ongkir di halaman produk jika ada
        if (typeof initShippingCalculator === 'function') {
            const urlParams = new URLSearchParams(window.location.search);
            const product = db.getProductById(urlParams.get('id'));
            if (product) initShippingCalculator(product.weight_grams || 250, product.seller_kecamatan);
        }
    });
}

function _loadKota(provinsiId, saved) {
    const selKota = document.getElementById('loc-kota');
    if (!selKota) return;
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinsiId}.json`)
        .then(r => r.json())
        .then(data => {
            data.forEach(k => {
                const opt = document.createElement('option');
                opt.value = k.id;
                opt.textContent = k.name;
                if (saved && saved.kota === k.name) opt.selected = true;
                selKota.appendChild(opt);
            });
            if (saved && saved.kota_id) {
                const selKec = document.getElementById('loc-kecamatan');
                if (selKec) selKec.disabled = false;
                _loadKecamatan(saved.kota_id, saved);
            }
        });
}

function _loadKecamatan(kotaId, saved) {
    const selKec = document.getElementById('loc-kecamatan');
    if (!selKec) return;
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${kotaId}.json`)
        .then(r => r.json())
        .then(data => {
            data.forEach(k => {
                const opt = document.createElement('option');
                opt.value = k.id;
                opt.textContent = k.name;
                if (saved && saved.kecamatan === k.name) { opt.selected = true; }
                selKec.appendChild(opt);
            });
            if (saved && saved.kecamatan_id) {
                document.getElementById('loc-save-btn').disabled = false;
            }
        });
}

// Panel notifikasi (klik lonceng)
function openNotifPanel() {
    // Toggle: jika panel sudah terbuka, tutup saja
    const existing = document.getElementById('global-notif-panel');
    if (existing) {
        existing.remove();
        document.removeEventListener('click', _closeNotifOnOutside);
        return;
    }
    closeAllHeaderPopups();
    const currentUserId = db.getCurrentUserId();

    const panel = document.createElement('div');
    panel.id = 'global-notif-panel';
    panel.className = 'retro-dropdown';
    panel.style.cssText = 'position:fixed;top:60px;right:16px;width:300px;z-index:10005;max-height:420px;overflow-y:auto;';
    const isMobile = window.innerWidth <= 480;
    if (isMobile) { panel.style.left = '12px'; panel.style.right = '12px'; panel.style.width = 'auto'; }

    if (!currentUserId) {
        panel.innerHTML = `<div style="text-align:center;padding:20px;font-size:0.8rem;color:#64748B;">Login untuk melihat pesan & notifikasi.</div>`;
    } else {
        // Tandai semua notifikasi sistem sebagai sudah dibaca
        db.markNotificationsRead(currentUserId);
        updateChatBadgeGlobal();

        const notifs = db.getNotifications(currentUserId);
        const conversations = db.getChatConversations(currentUserId);

        let html = `<div style="font-family:var(--font-retro);font-size:0.8rem;font-weight:700;padding:10px 12px;border-bottom:2px dashed var(--retro-light-gray);">💬 Pesan & Notifikasi</div>`;

        let hasContent = false;

        // Tampilkan semua percakapan chat (baca & belum dibaca) di panel
        if (conversations.length > 0) {
            hasContent = true;
            conversations.slice(0, 5).forEach(conv => {
                const partner = db.getProfileById(conv.partner_id);
                const avatar = partner && partner.avatar_url ? `<img src="${partner.avatar_url}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;">` : `<div style="width:32px;height:32px;border-radius:50%;background:#E2E8F0;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">👤</div>`;
                const timeStr = conv.last_time ? new Date(conv.last_time).toLocaleString('id-ID', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '';
                const hasUnread = conv.unread_count > 0;
                const unreadBadge = hasUnread ? `<span style="background-color: var(--mario-red); color: white; border: 1.5px solid var(--retro-dark); border-radius: 50%; font-size: 0.6rem; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-family: var(--font-number); font-weight: bold; flex-shrink:0;">${conv.unread_count}</span>` : '';
                html += `<div onclick="closeAllHeaderPopups();openPrivateChat('${conv.partner_id}');" style="display:flex;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid #F1F5F9;cursor:pointer;transition:background 0.1s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'">
                    ${avatar}
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:0.75rem;font-weight:700;">${conv.partner_name || 'User'}</div>
                        <div style="font-size:0.7rem;color:${hasUnread ? 'var(--retro-dark)' : '#64748B'};${hasUnread ? 'font-weight:700;' : ''}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${conv.last_message || ''}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
                        <div style="font-size:0.6rem;color:#94A3B8;">${timeStr}</div>
                        ${unreadBadge}
                    </div>
                </div>`;
            });
        }

        // Tampilkan notifikasi sistem (price drop, order, dll)
        if (notifs.length > 0) {
            hasContent = true;
            if (conversations.length > 0) html += `<div style="font-size:0.65rem;font-weight:700;color:#94A3B8;padding:6px 12px;background:#F8FAFC;border-bottom:1px solid #F1F5F9;">NOTIFIKASI SISTEM</div>`;
            notifs.slice(0, 8).forEach(n => {
                const url = n.url || '#';
                html += `<a href="${url}" style="display:block;padding:10px 12px;border-bottom:1px solid #F1F5F9;text-decoration:none;color:inherit;font-size:0.78rem;line-height:1.4;">
                    ${n.message}
                    <div style="font-size:0.65rem;color:#94A3B8;margin-top:3px;">${new Date(n.created_at).toLocaleString('id-ID')}</div>
                </a>`;
            });
        }

        if (!hasContent) {
            html += `<div style="text-align:center;padding:24px;font-size:0.8rem;color:#94A3B8;">Tidak ada pesan atau notifikasi baru.</div>`;
        }

        html += `<div style="padding:8px 12px;border-top:2px dashed var(--retro-light-gray);">
            <button onclick="closeAllHeaderPopups();openChatInbox();" style="width:100%;background:none;border:1.5px solid var(--retro-dark);border-radius:4px;padding:6px;font-size:0.75rem;cursor:pointer;font-family:var(--font-retro);">
                💬 Buka Semua Pesan
            </button>
        </div>`;
        panel.innerHTML = html;
    }

    document.body.appendChild(panel);
    setTimeout(() => document.addEventListener('click', _closeNotifOnOutside), 10);
}

function _closeNotifOnOutside(e) {
    const panel = document.getElementById('global-notif-panel');
    if (panel && !panel.contains(e.target)) {
        panel.remove();
        document.removeEventListener('click', _closeNotifOnOutside);
    }
}



// 2. Dropdown menu Profil — Role-based, tanpa selector simulasi
function toggleProfileDropdown(event) {
    // Toggle: cek dulu sebelum closeAll
    const existing = document.getElementById('global-profile-dropdown');
    if (existing) {
        existing.remove();
        return;
    }
    closeAllHeaderPopups();

    dropdown = document.createElement('div');
    dropdown.id = 'global-profile-dropdown';
    dropdown.className = 'retro-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.top = '60px';
    dropdown.style.zIndex = '10005';
    const isMobileProfile = window.innerWidth <= 480;
    if (isMobileProfile) {
        dropdown.style.left = '12px';
        dropdown.style.right = '12px';
        dropdown.style.width = 'auto';
    } else {
        dropdown.style.right = '16px';
        dropdown.style.width = '240px';
    }

    const currentUserId = db.getCurrentUserId();
    const user = currentUserId ? db.getProfileById(currentUserId) : null;
    const role = user
        ? (user.is_admin ? 'admin'
          : (user.is_seller && user.seller_status === 'active' ? 'seller'
          : (user.is_seller ? 'seller_pending' : 'buyer')))
        : 'guest';
    const isSeller        = role === 'seller';
    const isAdmin         = role === 'admin';
    const isBuyer         = role === 'buyer';
    const isPendingSeller = role === 'seller_pending';

    // Tampilan header avatar + nama
    const avatarEmoji = isAdmin ? '🔑' : isSeller ? '🏪' : isBuyer || isPendingSeller ? '👤' : '👻';
    const roleLabel   = isAdmin ? 'Administrator' : isSeller ? 'Seller' : isPendingSeller ? 'Seller (Pending ACC)' : isBuyer ? 'Pembeli' : 'Tamu';
    const displayName = user ? `@${user.store_name}` : 'Belum Login';

    // Tombol-tombol berdasarkan role
    let btns = '';
    if (!currentUserId) {
        // GUEST
        if (typeof isSimMode !== 'undefined' && isSimMode) {
            btns = `
                <div style="font-size:0.78rem; color:#64748B; text-align:center; margin-bottom:8px;">
                    Login untuk menikmati fitur lengkap RetroHub.
                </div>
                <div id="dropdown-session-dev" style="font-size:0.65rem; color:#94A3B8; text-align:center; margin-bottom:8px;">⚙️ Dev: simulasi login via selector di bawah</div>
                <select id="dropdown-session-selector" class="login-select" style="width:100%;margin-bottom:8px;padding:5px;font-size:0.75rem;">
                    ${_buildSessionOptions(currentUserId)}
                </select>
            `;
        } else {
            btns = `
                <div style="font-size:0.78rem; color:#64748B; text-align:center; margin-bottom:12px;">
                    Masuk ke RetroHub menggunakan Akun Google Anda.
                </div>
                <button class="btn-retro btn-blue" id="google-login-btn" style="width:100%; font-size:0.8rem; padding:8px 12px; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer;">
                    <svg style="width:16px; height:16px;" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M21.35,11.1H12v2.7h5.38c-0.24,1.28-0.96,2.37-2.04,3.1v2.57h3.3c1.93-1.78,3.04-4.4,3.04-7.44C21.68,11.96,21.56,11.5,21.35,11.1z" />
                        <path fill="#currentColor" d="M12,20.76c2.61,0,4.8-0.87,6.4-2.36l-3.3-2.57c-0.91,0.61-2.08,0.98-3.1,0.98c-3.14,0-5.8-2.12-6.75-4.97H1.87v2.65C3.51,18.06,7.5,20.76,12,20.76z" />
                        <path fill="#currentColor" d="M5.25,11.84c-0.24-0.72-0.38-1.5-0.38-2.3s0.14-1.58,0.38-2.3V4.59H1.87C1.07,6.18,0.62,7.96,0.62,9.54s0.45,3.36,1.25,4.95L5.25,11.84z" />
                        <path fill="#currentColor" d="M12,4.8c1.78,0,3.38,0.61,4.64,1.82l3.48-3.48C18.01,1.29,15.2,0.32,12,0.32C7.5,0.32,3.51,3.02,1.87,6.59l3.38,2.65C6.2,6.92,8.86,4.8,12,4.8z" />
                    </svg>
                    Login dengan Google
                </button>
            `;
        }
    } else {
        // LOGGED IN — menu sesuai role
        // Menu umum semua role
        btns += `<button class="btn-retro btn-green" id="dropdown-orders-btn" style="font-size:0.75rem;padding:7px 12px;width:100%;">📦 Histori Transaksi</button>`;
        btns += `<button class="btn-retro btn-white" id="dropdown-wishlist-btn" style="font-size:0.75rem;padding:7px 12px;width:100%;">❤️ Wishlist Saya</button>`;
        btns += `<button class="btn-retro btn-red" id="dropdown-settings-btn" style="font-size:0.75rem;padding:7px 12px;width:100%;">⚙️ Pengaturan Akun</button>`;
        btns += `<button class="btn-retro btn-white" id="dropdown-help-btn" onclick="openHelpModal()" style="font-size:0.75rem;padding:7px 12px;width:100%;border-color:#6B7280;color:#374151;">🎮 Bantuan & Support</button>`;

        // Divider sebelum SellerHub/AdminHub
        btns += `<div style="border-top:1.5px dashed var(--retro-light-gray);margin:4px 0;"></div>`;

        if (isAdmin) {
            btns += `<a href="admin.html" class="btn-retro btn-yellow" style="font-size:0.75rem;padding:7px 12px;width:100%;">🔑 Masuk AdminHub</a>`;
            btns += `<a href="seller.html" class="btn-retro btn-blue" style="font-size:0.75rem;padding:7px 12px;width:100%;">🏪 Masuk SellerHub</a>`;
        } else if (isSeller) {
            btns += `<a href="seller.html" class="btn-retro btn-blue" style="font-size:0.75rem;padding:7px 12px;width:100%;">🏪 Masuk SellerHub</a>`;
        } else if (isPendingSeller) {
            btns += `<button class="btn-retro btn-white" disabled style="font-size:0.75rem;padding:7px 12px;width:100%;opacity:0.6;cursor:not-allowed;">🏪 SellerHub (Pending)</button>`;
        } else {
            btns += `<a href="seller.html" class="btn-retro btn-white" style="font-size:0.75rem;padding:7px 12px;width:100%;border-color:#3B82F6;color:#3B82F6;">🏪 Gabung SellerHub</a>`;
        }

        // Divider + Logout
        btns += `<div style="border-top:1.5px dashed var(--retro-light-gray);margin:4px 0;"></div>`;
        if (typeof isSimMode !== 'undefined' && isSimMode) {
            btns += `
                <details style="margin-top:6px;">
                    <summary style="font-size:0.65rem;color:#94A3B8;cursor:pointer;">⚙️ Simulasi Ganti Akun (Dev)</summary>
                    <select id="dropdown-session-selector" class="login-select" style="width:100%;margin-top:6px;padding:5px;font-size:0.72rem;">
                        ${_buildSessionOptions(currentUserId)}
                    </select>
                </details>
            `;
        } else {
            btns += `<button class="btn-retro btn-red" id="google-logout-btn" style="font-size:0.75rem;padding:7px 12px;width:100%;">🚪 Keluar / Logout</button>`;
        }
    }

    const walletBalance = user ? (Number(user.wallet_balance) || 0) : 0;
    let walletInfoHTML = '';
    if (currentUserId && (isBuyer || isSeller || isPendingSeller)) {
        walletInfoHTML = `
            <div style="margin-top: 6px; background: #FFFBEB; border: 1.5px solid var(--mario-yellow); border-radius: 4px; padding: 6px; font-size: 0.72rem; font-weight: bold; color: var(--retro-dark);">
                🪙 Saldo Dompet: <span style="color: var(--mario-red); font-family: var(--font-number);">Rp${walletBalance.toLocaleString('id-ID')}</span>
                ${walletBalance > 0 ? `<button class="btn-retro btn-green" id="dropdown-withdraw-btn" style="font-size:0.6rem; padding: 2px 6px; margin-top: 4px; width: 100%; min-width: auto; box-shadow: 1px 1px 0px var(--retro-dark); cursor: pointer;">Tarik Saldo 💸</button>` : ''}
            </div>
        `;
    }

    dropdown.innerHTML = `
        <div style="text-align:center;border-bottom:2px dashed var(--retro-light-gray);padding-bottom:10px;margin-bottom:10px;">
            <div style="font-size:1.6rem;margin-bottom:2px;">${avatarEmoji}</div>
            <div style="font-family:var(--font-retro);font-size:0.9rem;font-weight:700;">${displayName}</div>
            <div style="font-size:0.68rem;color:#64748B;margin-top:2px;">${roleLabel}</div>
            ${walletInfoHTML}
        </div>
        <div style="display:flex;flex-direction:column;gap:7px;">
            ${btns}
        </div>
    `;

    document.body.appendChild(dropdown);

    // Event listener selector simulasi (dev)
    const sel = document.getElementById('dropdown-session-selector');
    if (sel) {
        sel.addEventListener('change', (e) => {
            const val = e.target.value;
            db.setCurrentUserId(val);
            renderGlobalHeader();
            if (window.toggleLoginSession) window.toggleLoginSession(val);
            else if (window.toggleSellerSession) window.toggleSellerSession(val);
            else if (window.toggleAdminSession) window.toggleAdminSession(val);
            else window.location.reload();
            dropdown.remove();
        });
    }

    // Google Login click handler
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                const { error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + window.location.pathname + window.location.search
                    }
                });
                if (error) {
                    showAlert("Login Gagal ❌", "Terjadi kesalahan saat otentikasi Google: " + error.message);
                }
            }
        });
    }

    // Google Logout click handler
    const googleLogoutBtn = document.getElementById('google-logout-btn');
    if (googleLogoutBtn) {
        googleLogoutBtn.addEventListener('click', async () => {
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                const { error } = await supabaseClient.auth.signOut();
                if (error) {
                    showAlert("Logout Gagal ❌", "Terjadi kesalahan saat logout: " + error.message);
                } else {
                    localStorage.removeItem('retrohub_supabase_user_id');
                    localStorage.setItem(DB_KEYS.CURRENT_USER_ID, 'guest');
                    sessionStorage.removeItem('retrohub_session_synced');
                    window.location.reload();
                }
            }
        });
    }

    const ordersBtn = document.getElementById('dropdown-orders-btn');
    if (ordersBtn) ordersBtn.addEventListener('click', () => { openBuyerOrderHistoryModal(); });

    const wishlistBtn = document.getElementById('dropdown-wishlist-btn');
    if (wishlistBtn) wishlistBtn.addEventListener('click', () => { openWishlistModal(); });

    const withdrawBtn = document.getElementById('dropdown-withdraw-btn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.remove();
            openBuyerWithdrawModal();
        });
    }

    const settingsBtn = document.getElementById('dropdown-settings-btn');
    if (settingsBtn) settingsBtn.addEventListener('click', () => { openEditProfileModal(); });

    dropdown.addEventListener('click', (e) => { e.stopPropagation(); });
}

// Helper buat option list selector simulasi
function _buildSessionOptions(currentUserId) {
    const profiles = db.getProfiles();
    let html = profiles.map(p => {
        const _pRole = p.is_admin ? 'admin' : (p.is_seller && p.seller_status === 'active' ? 'seller' : (p.is_seller ? 'seller_pending' : 'buyer'));
        let label = `@${p.store_name} (${_pRole === 'seller' ? 'Seller' : _pRole === 'admin' ? 'Admin' : _pRole === 'seller_pending' ? 'Pending Seller' : 'Buyer'})`;
        return `<option value="${p.id}" ${p.id === currentUserId ? 'selected' : ''}>${label}</option>`;
    }).join('');
    html += `<option value="guest" ${!currentUserId ? 'selected' : ''}>Guest (Belum Login)</option>`;
    return html;
}


// 3. Popout Keranjang Belanja
function toggleCartPopout(event) {
    // Toggle: cek dulu sebelum closeAll
    const existing = document.getElementById('global-cart-popout');
    if (existing) {
        existing.remove();
        return;
    }
    closeAllHeaderPopups();

    popout = document.createElement('div');
    popout.id = 'global-cart-popout';
    popout.className = 'retro-dropdown';
    popout.style.position = 'fixed';
    popout.style.top = '60px';
    popout.style.zIndex = '10005';
    // Responsive: mobile menggunakan full width
    const isMobile = window.innerWidth <= 480;
    if (isMobile) {
        popout.style.left = '12px';
        popout.style.right = '12px';
        popout.style.width = 'auto';
    } else {
        popout.style.right = '16px';
        popout.style.width = '320px';
    }

    const cartItems = db.getCart(); // [{ productId, quantity }]
    let cartHTML = '';
    let totalPrice = 0;

    // Pisahkan barang yang tersedia dan habis/terjual
    const availableItems = [];
    const unavailableItems = [];

    cartItems.forEach(item => {
        const prod = db.getProductById(item.productId);
        if (prod) {
            const isAvailable = prod.status === 'active' && Number(prod.stock) > 0;
            if (isAvailable) {
                availableItems.push({ item, prod });
            } else {
                unavailableItems.push({ item, prod });
            }
        }
    });

    if (availableItems.length === 0 && unavailableItems.length === 0) {
        cartHTML = `<div style="text-align: center; color: #64748B; font-size: 0.8rem; padding: 20px;">Keranjang belanjaan Anda kosong.</div>`;
    } else {
        cartHTML = `<div style="display: flex; flex-direction: column; gap: 10px; max-height: 260px; overflow-y: auto; margin-bottom: 12px; padding-right: 4px;">`;
        
        // 1. Tampilkan barang tersedia dengan Qty Adjuster
        if (availableItems.length > 0) {
            availableItems.forEach(({ item, prod }) => {
                const discountedPrice = prod.discount_percent ? prod.price - (prod.price * prod.discount_percent / 100) : prod.price;
                const itemTotalPrice = discountedPrice * item.quantity;
                totalPrice += itemTotalPrice;
                
                cartHTML += `
                    <div style="display: flex; gap: 8px; align-items: center; border-bottom: 1px dashed var(--retro-light-gray); padding-bottom: 6px;">
                        <img src="${prod.image_url}" style="width: 42px; height: 42px; border: 1.5px solid var(--retro-dark); border-radius: 4px; object-fit: cover; flex-shrink: 0;">
                        <div style="flex-grow: 1; min-width: 0;">
                            <div style="font-size: 0.75rem; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${prod.title}">${prod.title}</div>
                            <div style="font-size: 0.75rem; font-family: var(--font-number); font-weight: bold; color: var(--mario-red);">Rp${discountedPrice.toLocaleString('id-ID')}</div>
                            <!-- Qty Adjuster -->
                            <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px;">
                                <button class="btn-retro" onclick="changeCartQty('${prod.id}', ${item.quantity - 1})" style="padding: 1px 5px; font-size: 0.6rem; min-width: auto; height: 18px; line-height: 1; cursor: pointer;">-</button>
                                <span style="font-size: 0.7rem; font-family: var(--font-number); font-weight: bold; min-width: 14px; text-align: center;">${item.quantity}</span>
                                <button class="btn-retro" onclick="changeCartQty('${prod.id}', ${item.quantity + 1})" style="padding: 1px 5px; font-size: 0.6rem; min-width: auto; height: 18px; line-height: 1; cursor: pointer;">+</button>
                                <span style="font-size: 0.58rem; color: #94A3B8; margin-left: 2px;">(Stok: ${prod.stock})</span>
                            </div>
                        </div>
                        <button class="btn-retro btn-red" onclick="removeCartItemFromPopout('${prod.id}')" style="padding: 2px 6px; font-size: 0.65rem; align-self: flex-start; cursor: pointer;">✖</button>
                    </div>
                `;
            });
        }

        // 2. Tampilkan barang habis / terjual di bagian bawah dengan section khusus
        if (unavailableItems.length > 0) {
            cartHTML += `
                <div style="margin-top: 6px; border: 2.5px solid var(--mario-red); border-radius: 6px; background: #FEF2F2; padding: 8px; box-shadow: 2px 2px 0px var(--retro-dark);">
                    <div style="font-size: 0.7rem; font-weight: bold; color: var(--mario-red); margin-bottom: 6px; font-family: var(--font-retro); letter-spacing: 0.5px;">
                        🚫 STOK HABIS / TERJUAL
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
            `;
            
            unavailableItems.forEach(({ item, prod }) => {
                cartHTML += `
                        <div style="display: flex; gap: 8px; align-items: center; opacity: 0.65;">
                            <img src="${prod.image_url}" style="width: 32px; height: 32px; border: 1px solid var(--retro-dark); border-radius: 4px; object-fit: cover; filter: grayscale(100%); flex-shrink: 0;">
                            <div style="flex-grow: 1; min-width: 0;">
                                <div style="font-size: 0.7rem; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-decoration: line-through; color: #64748B;">${prod.title}</div>
                                <span style="background: #EF4444; color: white; padding: 0.5px 3px; font-size: 0.52rem; font-family: var(--font-retro); border-radius: 3px; font-weight: bold;">Terjual / Habis</span>
                            </div>
                            <button class="btn-retro btn-red" onclick="removeCartItemFromPopout('${prod.id}')" style="padding: 1px 4px; font-size: 0.58rem; cursor: pointer;">✖</button>
                        </div>
                `;
            });

            cartHTML += `
                    </div>
                </div>
            `;
        }

        cartHTML += `</div>`;
        
        if (availableItems.length > 0) {
            cartHTML += `
                <div style="border-top: 2px dashed var(--retro-dark); padding-top: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: bold;">
                    <span>Total:</span>
                    <span style="font-family: var(--font-number); color: var(--mario-red);">Rp${totalPrice.toLocaleString('id-ID')}</span>
                </div>
                <button class="btn-retro btn-green" onclick="checkoutCartFromPopout()" style="width: 100%; font-size: 0.8rem; padding: 8px; cursor: pointer;">Checkout Sekarang 🛍️</button>
            `;
        } else {
            cartHTML += `
                <button class="btn-retro" disabled style="width: 100%; font-size: 0.8rem; padding: 8px; opacity: 0.5; cursor: not-allowed;">Tidak ada barang untuk di-checkout</button>
            `;
        }
    }

    popout.innerHTML = `
        <div style="text-align: center; font-weight: bold; border-bottom: 2px dashed var(--retro-light-gray); padding-bottom: 8px; margin-bottom: 10px; font-family: var(--font-retro); font-size: 0.9rem;">
            🛒 Keranjang Belanja
        </div>
        ${cartHTML}
    `;

    document.body.appendChild(popout);

    popout.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

function removeCartItemFromPopout(productId) {
    db.removeFromCart(productId);
    showToast("Dihapus 🗑️", "Mainan berhasil dihapus dari keranjang.", "info");
    
    const badge = document.getElementById('cart-counter');
    if (badge) badge.innerText = db.getCart().length;
    
    const popout = document.getElementById('global-cart-popout');
    if (popout) popout.remove();
    toggleCartPopout();

    if (window.updateCartBadge) {
        window.updateCartBadge();
    }
    if (window.renderProductDetail) {
        window.renderProductDetail();
    }
}

window.changeCartQty = function(productId, qty) {
    if (qty <= 0) {
        removeCartItemFromPopout(productId);
        return;
    }
    db.updateCartQuantity(productId, qty);
    
    // Update badge counter
    const badge = document.getElementById('cart-counter');
    if (badge) badge.innerText = db.getCart().length;
    
    // Redraw cart popout
    const popout = document.getElementById('global-cart-popout');
    if (popout) popout.remove();
    toggleCartPopout();

    if (window.updateCartBadge) window.updateCartBadge();
};

function checkoutCartFromPopout() {
    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) {
        showAlert("Akses Terbatas ⚠️", "Silakan login pembeli terlebih dahulu untuk checkout keranjang belanja.");
        return;
    }

    const buyer = db.getProfileById(currentUserId);
    if (buyer && buyer.penalty_points && buyer.penalty_points >= 6) {
        const popout = document.getElementById('global-cart-popout');
        if (popout) popout.remove();
        showAlert("Akun Ditangguhkan ⚠️", "Akun Anda ditangguhkan karena poin penalti telah mencapai batas maksimal (6/6 Poin). Anda tidak dapat melakukan checkout.");
        return;
    }

    if (!buyer || !buyer.address_kecamatan || !buyer.address_detail || !buyer.phone_number) {
        const popout = document.getElementById('global-cart-popout');
        if (popout) popout.remove();
        showAlert(
            "Alamat Belum Lengkap 📍",
            "Silakan lengkapi biodata, nomor HP, kecamatan, dan alamat detail pengiriman Anda terlebih dahulu di Pusat Akun agar ongkos kirim dapat dihitung secara akurat.",
            () => {
                openEditProfileModal();
            }
        );
        return;
    }

    const cartItems = db.getCart(); // [{ productId, quantity }]
    const cartIds = cartItems.map(i => i.productId);
    if (cartIds.length === 0) return;

    // Proteksi agar pembeli tidak meng-checkout barang miliknya sendiri yang ada di keranjang
    const products = db.getProducts();
    const ownProductsInCart = cartIds.filter(pid => {
        const prod = products.find(p => p.id === pid);
        return prod && prod.seller_id === currentUserId;
    });

    if (ownProductsInCart.length > 0) {
        const popout = document.getElementById('global-cart-popout');
        if (popout) popout.remove();
        showAlert(
            "Tindakan Ditolak ⚠️", 
            "Keranjang belanja Anda mengandung mainan milik Anda sendiri. Harap hapus mainan tersebut sebelum melanjutkan checkout."
        );
        return;
    }

    // Proteksi Kemiripan Data Kontak, Lokasi, dan Nomor Rekening (Collision Detector)
    const collidedProducts = cartIds.filter(pid => {
        const prod = products.find(p => p.id === pid);
        if (!prod) return false;
        const seller = db.getProfileById(prod.seller_id);
        if (!seller) return false;
        
        const isPhoneSame = buyer.phone_number && seller.whatsapp && buyer.phone_number.trim() === seller.whatsapp.trim();
        const isWASame = buyer.whatsapp && seller.whatsapp && buyer.whatsapp.trim() === seller.whatsapp.trim();
        const isBankSame = buyer.bank_account && seller.bank_account && buyer.bank_account.trim() === seller.bank_account.trim();
        const isLocationSame = buyer.address_lat && seller.address_lat &&
            Math.abs(Number(buyer.address_lat) - Number(seller.address_lat)) < 0.0005 &&
            Math.abs(Number(buyer.address_lng) - Number(seller.address_lng)) < 0.0005;

        return isPhoneSame || isWASame || isBankSame || isLocationSame;
    });

    if (collidedProducts.length > 0) {
        const popout = document.getElementById('global-cart-popout');
        if (popout) popout.remove();
        showAlert(
            "Indikasi Transaksi Fiktif ⚠️",
            "Sistem mendeteksi kemiripan data alamat, WhatsApp, atau nomor rekening Anda dengan Seller. Transaksi dibatalkan untuk mencegah manipulasi rating platform."
        );
        return;
    }

    const popout = document.getElementById('global-cart-popout');
    if (popout) popout.remove();

    // Kelompokkan produk berdasarkan seller
    const groups = {};
    cartItems.forEach(item => {
        const prod = db.getProductById(item.productId);
        if (prod && prod.status === 'active' && Number(prod.stock) > 0) {
            const sellerId = prod.seller_id;
            if (!groups[sellerId]) {
                groups[sellerId] = {
                    sellerId: sellerId,
                    sellerName: prod.seller_name || `@Seller_${sellerId}`,
                    sellerKecamatan: prod.seller_kecamatan || 'Menteng',
                    products: [],
                    totalWeight: 0,
                    subtotal: 0
                };
            }
            const qty = Math.min(item.quantity, Number(prod.stock) || 1);
            const price = prod.discount_percent ? prod.price - (prod.price * prod.discount_percent / 100) : prod.price;
            const itemSubtotal = price * qty;
            const itemWeight = (prod.weight_grams || 200) * qty;

            groups[sellerId].products.push({
                id: prod.id,
                title: prod.title,
                price: price,
                quantity: qty,
                weight: prod.weight_grams || 200
            });
            groups[sellerId].totalWeight += itemWeight;
            groups[sellerId].subtotal += itemSubtotal;
        }
    });

    const sellerIds = Object.keys(groups);
    if (sellerIds.length === 0) {
        showAlert("Keranjang Kosong 🛒", "Semua produk di keranjang Anda sudah tidak aktif atau terjual.");
        return;
    }

    // Hitung ongkir untuk setiap seller group
    let grandSubtotal = 0;
    let grandShipping = 0;
    const buyerKec = buyer.address_kecamatan;

    sellerIds.forEach(sId => {
        const group = groups[sId];
        const sellerProfile = db.getProfileById(sId);
        const originInfo = sellerProfile ? {
            provinsi: sellerProfile.address_provinsi,
            kota: sellerProfile.address_kota,
            kecamatan: sellerProfile.address_kecamatan,
            lat: sellerProfile.address_lat,
            lng: sellerProfile.address_lng
        } : null;
        
        const destInfo = buyer ? {
            provinsi: buyer.address_provinsi,
            kota: buyer.address_kota,
            kecamatan: buyer.address_kecamatan,
            lat: buyer.address_lat,
            lng: buyer.address_lng
        } : null;

        // Default ke 'jnt'
        group.shippingCost = db.getRealShippingRate(group.sellerKecamatan, buyerKec, group.totalWeight, 'jnt', originInfo, destInfo);
        grandSubtotal += group.subtotal;
        grandShipping += group.shippingCost;
    });

    const adminFee = 5000;
    const grandTotal = grandSubtotal + grandShipping + adminFee;

    // Render HTML breakdown untuk modal konfirmasi
    let breakdownHTML = `
        <div style="font-family: var(--font-body); font-size: 0.8rem; text-align: left; background: #FFFDF5; border: 2.5px solid var(--retro-dark); border-radius: 6px; padding: 12px; max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; box-shadow: 2px 2px 0px var(--retro-dark);">
            <div style="font-family: var(--font-retro); font-size: 0.85rem; font-weight: bold; border-bottom: 2px dashed var(--retro-light-gray); padding-bottom: 6px; color: var(--mario-blue); display: flex; justify-content: space-between;">
                <span>📍 Alamat Kirim:</span>
                <span style="color: var(--retro-dark);">${buyerKec}</span>
            </div>
    `;

    sellerIds.forEach(sId => {
        const group = groups[sId];
        breakdownHTML += `
            <div style="border-bottom: 1.5px dashed var(--retro-light-gray); padding-bottom: 8px;">
                <div style="font-weight: bold; color: var(--mario-red); display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; margin-bottom: 4px;">
                    <span>🏪 Toko: ${group.sellerName}</span>
                    <span style="background: var(--mario-yellow); color: var(--retro-dark); padding: 1px 4px; border: 1px solid var(--retro-dark); border-radius: 3px; font-size: 0.6rem; font-weight: bold;">Asal: ${group.sellerKecamatan}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; padding-left: 6px; border-left: 2px solid var(--retro-light-gray);">
        `;
        group.products.forEach(p => {
            const itemTotal = p.price * p.quantity;
            breakdownHTML += `
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; gap: 10px;">
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px;">• ${p.title} (${p.quantity}x)</span>
                    <span style="font-family: var(--font-number); font-weight: bold;">Rp${itemTotal.toLocaleString('id-ID')}</span>
                </div>
            `;
        });
        breakdownHTML += `
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #475569; margin-top: 6px; font-weight: 500;">
                    <span>Berat: ${(group.totalWeight / 1000).toFixed(2)} kg (via J&T)</span>
                    <span>Ongkir: <strong style="color: var(--retro-dark); font-family: var(--font-number);">Rp${group.shippingCost.toLocaleString('id-ID')}</strong></span>
                </div>
            </div>
        `;
    });

    breakdownHTML += `
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem; font-weight: bold; padding-top: 4px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>Subtotal Produk:</span>
                    <span style="font-family: var(--font-number);">Rp${grandSubtotal.toLocaleString('id-ID')}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Total Ongkos Kirim:</span>
                    <span style="font-family: var(--font-number);">Rp${grandShipping.toLocaleString('id-ID')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; color: #475569;">
                    <span>Biaya Rekber & Admin:</span>
                    <span style="font-family: var(--font-number);">Rp${adminFee.toLocaleString('id-ID')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 2px solid var(--retro-dark); padding-top: 6px; font-size: 0.85rem; color: var(--mario-blue); font-family: var(--font-retro);">
                    <span>TOTAL TRANSFER:</span>
                    <span style="font-family: var(--font-number); color: var(--mario-red); font-size: 0.95rem; text-shadow: 0.5px 0.5px 0px var(--retro-dark);">Rp${grandTotal.toLocaleString('id-ID')}</span>
                </div>
            </div>
        </div>
        <p style="font-size: 0.65rem; color: #64748B; text-align: center; margin-top: 8px; font-weight: 500;">⚠️ Menggunakan sistem Rekber RetroHub. Dana aman sampai paket dikonfirmasi tiba.</p>
    `;

    showConfirm(
        "Rincian Checkout 🛍️",
        breakdownHTML,
        () => {
            // Lakukan order splitting — status awal: waiting_payment
            const newOrderIds = [];
            sellerIds.forEach(sId => {
                const group = groups[sId];
                group.products.forEach((p, index) => {
                    const assignedShippingCost = (index === 0) ? group.shippingCost : 0;
                    const assignedAdminFee = (sId === sellerIds[0] && index === 0) ? adminFee : 0;
                    const orderPayment = (p.price * p.quantity) + assignedShippingCost + assignedAdminFee;

                    const newOrder = db.createOrder({
                        product_id: p.id,
                        buyer_id: currentUserId,
                        seller_id: group.sellerId,
                        price_deal: p.price,
                        quantity: p.quantity,
                        shipping_cost: assignedShippingCost,
                        admin_fee: assignedAdminFee,
                        total_payment: orderPayment,
                        shipping_courier: 'JNT',
                        status: 'waiting_payment'
                    });

                    newOrderIds.push(newOrder.id);
                    db.removeFromCart(p.id);
                });
            });

            // Notifikasi seller via chat
            sellerIds.forEach(sId => {
                const group = groups[sId];
                const listTitles = group.products.map(p => `"${p.title}"`).join(', ');
                db.sendPrivateChat('admin-demo', group.sellerId, `Halo! Pembeli @${buyer.store_name} baru saja checkout produk Anda: ${listTitles}. Menunggu konfirmasi pembayaran.`);
            });

            // Tampilkan modal pembayaran simulasi
            // Untuk cart multi-seller: simpan info seller agar checkout bisa recalc ongkir per seller
            // Ambil seller kecamatan & total weight dari group pertama (simplified untuk cart)
            const primarySellerId = sellerIds[0];
            const primaryGroup = groups[primarySellerId];
            openCheckoutModal(
                newOrderIds, grandSubtotal, grandShipping, adminFee, buyer, groups, sellerIds,
                primaryGroup ? primaryGroup.sellerKecamatan : null,
                primaryGroup ? primaryGroup.totalWeight : 250,
                groups  // pass semua groups untuk recalc multi-seller
            );
        }
    );
}

// ============================================================
// MODAL CHECKOUT: Pilih Alamat + Kurir + Catatan Seller
// ============================================================

// State checkout sementara
window._checkoutState = {};

function openCheckoutModal(orderIds, grandSubtotal, grandShipping, adminFee, buyer, groups, sellerIds, sellerKecamatan, weightGrams, allGroups) {
    const addresses = db.getAddresses(buyer.id);
    const defaultAddr = addresses.find(a => a.is_default) || addresses[0] || null;
    window._checkoutState = {
        orderIds, grandSubtotal, adminFee, buyer, groups, sellerIds,
        selectedAddressId: defaultAddr ? defaultAddr.id : null,
        selectedCourier: 'jnt',
        shippingCost: grandShipping,
        shippingIsEstimate: true,
        buyerNotes: '',
        sellerKecamatan: sellerKecamatan || null,
        weightGrams: weightGrams || 250,
        allGroups: allGroups || null  // multi-seller cart groups
    };
    // Hitung ongkir awal jika sudah ada alamat default
    if (defaultAddr && sellerKecamatan) {
        _recalcShipping();
    }
    _renderCheckoutModal();
}

function _calcCheckoutTotal() {
    const s = window._checkoutState;
    return s.grandSubtotal + s.shippingCost + s.adminFee;
}

function _getSelectedAddrKec() {
    const s = window._checkoutState;
    if (!s.selectedAddressId) return null;
    const addresses = db.getAddresses(s.buyer.id);
    const addr = addresses.find(a => a.id === s.selectedAddressId);
    return addr ? (addr.kecamatan || addr.kota || '') : null;
}

function _recalcShipping() {
    const s = window._checkoutState;
    if (!s.selectedAddressId || !s.sellerKecamatan) return;
    const addresses = db.getAddresses(s.buyer.id);
    const addr = addresses.find(a => a.id === s.selectedAddressId);
    if (!addr) return;
    const destKec = addr.kecamatan || addr.kota || '';
    if (!destKec) return;
    const rate = db.getRealShippingRate(
        s.sellerKecamatan,
        destKec,
        s.weightGrams || 250,
        s.selectedCourier
    );
    s.shippingCost = rate;
    s.shippingIsEstimate = false;
}

function _renderCheckoutModal() {
    document.getElementById('checkout-modal-overlay')?.remove();
    const s = window._checkoutState;
    const addresses = db.getAddresses(s.buyer.id);
    const selectedAddr = addresses.find(a => a.id === s.selectedAddressId) || null;
    const grandTotal = _calcCheckoutTotal();

    const courierOptions = [
        { id: 'jnt', label: 'J&T Express', icon: '🟡', desc: 'Regular – estimasi 2-4 hari' },
        { id: 'pos', label: 'Pos Indonesia', icon: '🔴', desc: 'Regular – estimasi 3-6 hari' }
    ];

    const addrListHTML = addresses.length === 0 ? `
        <div style="text-align:center;padding:16px;color:#94A3B8;font-size:0.75rem;">
            Belum ada alamat tersimpan. Tambahkan alamat pengiriman di bawah.
        </div>` :
        addresses.map(addr => `
        <div onclick="window._selectAddress('${addr.id}')" style="
            cursor:pointer;
            border: 2.5px solid ${addr.id === s.selectedAddressId ? 'var(--mario-blue)' : 'var(--retro-dark)'};
            border-radius:6px; padding:10px 12px; margin-bottom:8px;
            background:${addr.id === s.selectedAddressId ? '#EEF4FF' : '#FAFAFA'};
            position:relative;
            box-shadow: ${addr.id === s.selectedAddressId ? '2px 2px 0 var(--mario-blue)' : '2px 2px 0 #ccc'};
            transition: all 0.15s;
        ">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                        <span style="font-family:var(--font-retro);font-size:0.72rem;font-weight:700;
                            background:${addr.is_default ? 'var(--mario-yellow)' : '#E2E8F0'};
                            border:1.5px solid var(--retro-dark);border-radius:3px;padding:1px 6px;">
                            ${addr.label}
                        </span>
                        ${addr.is_default ? '<span style="font-size:0.62rem;color:#16A34A;font-weight:700;">✓ Utama</span>' : ''}
                    </div>
                    <div style="font-family:var(--font-retro);font-size:0.8rem;font-weight:700;">${addr.recipient_name}</div>
                    <div style="font-size:0.72rem;color:#475569;">${addr.recipient_phone}</div>
                    <div style="font-size:0.7rem;color:#64748B;margin-top:2px;line-height:1.4;">
                        ${addr.address_detail}${addr.kecamatan ? ', ' + addr.kecamatan : ''}${addr.kota ? ', ' + addr.kota : ''}${addr.kode_pos ? ' ' + addr.kode_pos : ''}
                    </div>
                    ${addr.patokan ? `<div style="font-size:0.65rem;color:#94A3B8;font-style:italic;">📍 ${addr.patokan}</div>` : ''}
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                    <button onclick="event.stopPropagation();openEditAddressForm('${addr.id}')"
                        style="font-size:0.65rem;border:1.5px solid var(--retro-dark);border-radius:3px;padding:2px 7px;background:white;cursor:pointer;font-family:var(--font-retro);">✏️</button>
                    <button onclick="event.stopPropagation();_deleteAddress('${addr.id}')"
                        style="font-size:0.65rem;border:1.5px solid #EF4444;border-radius:3px;padding:2px 7px;background:white;cursor:pointer;color:#EF4444;font-family:var(--font-retro);">🗑️</button>
                </div>
            </div>
            ${addr.id === s.selectedAddressId ? '<div style="position:absolute;top:8px;right:40px;width:16px;height:16px;background:var(--mario-blue);border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px var(--mario-blue);"></div>' : ''}
        </div>`).join('');

    const overlay = document.createElement('div');
    overlay.id = 'checkout-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9000;display:flex;align-items:flex-end;justify-content:center;';
    overlay.innerHTML = `
    <div style="
        background:var(--bg-card);
        border:3px solid var(--retro-dark);
        border-bottom:none;
        border-radius:12px 12px 0 0;
        box-shadow:-4px -4px 0 var(--retro-dark);
        width:100%;
        max-width:520px;
        max-height:92vh;
        overflow-y:auto;
        display:flex;
        flex-direction:column;
    ">
        <!-- Header -->
        <div style="
            background:var(--mario-blue);
            color:white;
            padding:14px 16px;
            border-radius:10px 10px 0 0;
            display:flex;
            align-items:center;
            justify-content:space-between;
            position:sticky;top:0;z-index:1;
            border-bottom:3px solid var(--retro-dark);
        ">
            <div>
                <div style="font-family:var(--font-retro);font-size:1rem;font-weight:700;">📦 Detail Pengiriman</div>
                <div style="font-size:0.68rem;opacity:0.85;">Langkah 1 dari 2 — Konfirmasi sebelum bayar</div>
            </div>
            <button onclick="document.getElementById('checkout-modal-overlay').remove()"
                style="background:rgba(255,255,255,0.2);color:white;border:2px solid white;border-radius:4px;width:30px;height:30px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">✖</button>
        </div>

        <div style="padding:14px 16px;flex:1;">

            <!-- SECTION: Alamat Pengiriman -->
            <div style="margin-bottom:16px;">
                <div style="font-family:var(--font-retro);font-size:0.78rem;font-weight:700;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
                    <span>📍 Alamat Pengiriman</span>
                    <button onclick="openAddAddressForm()"
                        style="font-family:var(--font-retro);font-size:0.65rem;border:2px solid var(--mario-blue);border-radius:4px;padding:3px 8px;background:white;color:var(--mario-blue);cursor:pointer;font-weight:700;">+ Tambah Alamat</button>
                </div>
                <div id="checkout-address-list">
                    ${addrListHTML}
                </div>
            </div>

            <!-- Pesan kecamatan kosong -->
        ${s.selectedAddressId && !_getSelectedAddrKec() ? `
        <div style="background:#FEF9C3;border:1.5px dashed #FCD34D;border-radius:6px;padding:8px 10px;font-size:0.7rem;color:#92400E;margin-top:-8px;margin-bottom:12px;">
            ⚠️ Isi <strong>Kecamatan</strong> pada alamat untuk mendapatkan ongkir yang akurat. Saat ini menggunakan tarif estimasi.
        </div>` : ''}

        <!-- SECTION: Pilih Kurir -->
            <div style="margin-bottom:16px;">
                <div style="font-family:var(--font-retro);font-size:0.78rem;font-weight:700;margin-bottom:8px;">🚚 Jasa Pengiriman</div>
                <div style="display:flex;gap:8px;">
                    ${courierOptions.map(c => `
                    <div onclick="window._selectCourier('${c.id}')" style="
                        flex:1;cursor:pointer;
                        border:2.5px solid ${s.selectedCourier === c.id ? 'var(--mario-blue)' : 'var(--retro-dark)'};
                        border-radius:6px;padding:10px;
                        background:${s.selectedCourier === c.id ? '#EEF4FF' : '#FAFAFA'};
                        box-shadow:${s.selectedCourier === c.id ? '2px 2px 0 var(--mario-blue)' : '2px 2px 0 #ccc'};
                        transition:all 0.15s;
                    ">
                        <div style="font-size:1.2rem;text-align:center;margin-bottom:3px;">${c.icon}</div>
                        <div style="font-family:var(--font-retro);font-size:0.72rem;font-weight:700;text-align:center;">${c.label}</div>
                        <div style="font-size:0.62rem;color:#64748B;text-align:center;">${c.desc}</div>
                    </div>`).join('')}
                </div>
            </div>

            <!-- SECTION: Catatan ke Seller -->
            <div style="margin-bottom:16px;">
                <div style="font-family:var(--font-retro);font-size:0.78rem;font-weight:700;margin-bottom:6px;">📝 Catatan ke Penjual <span style="font-weight:400;font-size:0.65rem;color:#94A3B8;">(opsional)</span></div>
                <textarea id="checkout-buyer-notes"
                    placeholder="Misal: Tolong bubble wrap ekstra, kondisi kotak harus mulus..."
                    oninput="window._checkoutState.buyerNotes = this.value"
                    style="width:100%;border:2.5px solid var(--retro-dark);border-radius:4px;padding:8px;font-size:0.75rem;resize:vertical;min-height:60px;box-sizing:border-box;font-family:sans-serif;"
                >${s.buyerNotes || ''}</textarea>
            </div>

            <!-- SECTION: Ringkasan Biaya -->
            <div style="background:#F8FAFC;border:2px solid var(--retro-dark);border-radius:6px;padding:12px;margin-bottom:16px;">
                <div style="font-family:var(--font-retro);font-size:0.75rem;font-weight:700;margin-bottom:8px;">💰 Ringkasan Biaya</div>
                <div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:4px;">
                    <span>Harga Barang</span>
                    <span>Rp${s.grandSubtotal.toLocaleString('id-ID')}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:4px;" id="checkout-shipping-row">
                    <span>Ongkos Kirim (${s.selectedCourier === 'jnt' ? 'J&T' : 'Pos Indonesia'})${s.shippingIsEstimate ? ' <span style=\"font-size:0.6rem;color:#F59E0B;background:#FEF3C7;border-radius:3px;padding:1px 5px;font-weight:700;\">estimasi</span>' : ''}</span>
                    <span style="${s.shippingIsEstimate ? 'color:#94A3B8;' : ''}">Rp${s.shippingCost.toLocaleString('id-ID')}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:8px;">
                    <span>Biaya Admin Rekber</span>
                    <span>Rp${s.adminFee.toLocaleString('id-ID')}</span>
                </div>
                <div style="border-top:2px dashed var(--retro-dark);padding-top:8px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-retro);font-size:0.8rem;font-weight:700;">TOTAL DIBAYAR</span>
                    <span style="font-family:var(--font-retro);font-size:1rem;font-weight:700;color:var(--mario-red);" id="checkout-grand-total">Rp${grandTotal.toLocaleString('id-ID')}</span>
                </div>
            </div>

        </div>

        <!-- Footer Tombol -->
        <div style="padding:12px 16px;border-top:2.5px solid var(--retro-dark);background:var(--bg-card);position:sticky;bottom:0;">
            <button onclick="_proceedToPayment()" id="checkout-proceed-btn"
                style="width:100%;background:var(--mario-green);color:white;border:3px solid var(--retro-dark);border-radius:6px;padding:13px;font-family:var(--font-retro);font-size:0.88rem;font-weight:700;cursor:pointer;box-shadow:3px 3px 0 var(--retro-dark);">
                Lanjut ke Pembayaran 💳
            </button>
            <div style="font-size:0.62rem;color:#94A3B8;text-align:center;margin-top:6px;">🔒 Dana aman di Rekber RetroHub hingga barang diterima</div>
        </div>
    </div>`;

    document.body.appendChild(overlay);

    // Restore catatan jika ada
    const notesEl = document.getElementById('checkout-buyer-notes');
    if (notesEl && s.buyerNotes) notesEl.value = s.buyerNotes;
}

window._selectAddress = function(addrId) {
    window._checkoutState.selectedAddressId = addrId;
    window._checkoutState.shippingIsEstimate = true;
    _recalcShipping();  // hitung ulang ongkir berdasarkan kecamatan alamat baru
    _renderCheckoutModal();
};

window._selectCourier = function(courierId) {
    window._checkoutState.selectedCourier = courierId;
    _recalcShipping();  // hitung ulang ongkir dengan kurir baru
    _renderCheckoutModal();
};

window._deleteAddress = function(addrId) {
    if (!confirm('Hapus alamat ini?')) return;
    db.deleteAddress(addrId);
    if (window._checkoutState.selectedAddressId === addrId) {
        const remaining = db.getAddresses(window._checkoutState.buyer.id);
        window._checkoutState.selectedAddressId = remaining.length > 0 ? remaining[0].id : null;
    }
    _renderCheckoutModal();
};

function _proceedToPayment() {
    const s = window._checkoutState;
    if (!s.selectedAddressId) {
        showAlert('Alamat Belum Dipilih ⚠️', 'Silakan pilih atau tambahkan alamat pengiriman terlebih dahulu.');
        return;
    }
    const addresses = db.getAddresses(s.buyer.id);
    const addr = addresses.find(a => a.id === s.selectedAddressId);
    if (!addr) {
        showAlert('Alamat Tidak Valid ⚠️', 'Alamat yang dipilih tidak ditemukan. Silakan pilih ulang.');
        return;
    }

    // Update semua order dengan alamat + kurir + catatan
    s.orderIds.forEach(id => {
        const orders = db.getOrders();
        const idx = orders.findIndex(o => o.id === id);
        if (idx !== -1) {
            orders[idx].shipping_address = `${addr.address_detail}${addr.kecamatan ? ', ' + addr.kecamatan : ''}${addr.kota ? ', ' + addr.kota : ''}${addr.kode_pos ? ' ' + addr.kode_pos : ''}`;
            orders[idx].recipient_name = addr.recipient_name;
            orders[idx].recipient_phone = addr.recipient_phone;
            orders[idx].buyer_notes = s.buyerNotes || '';
            orders[idx].shipping_courier = s.selectedCourier;
            orders[idx].courier = s.selectedCourier;
            orders[idx].address_label = addr.label;
            orders[idx].address_patokan = addr.patokan || '';
            localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
            // Sync ke Supabase
            if (!isSimMode && supabaseClient) {
                supabaseClient.from('orders').update({
                    shipping_address: orders[idx].shipping_address,
                    recipient_name: orders[idx].recipient_name,
                    recipient_phone: orders[idx].recipient_phone,
                    buyer_notes: orders[idx].buyer_notes,
                    shipping_courier: s.selectedCourier
                }).eq('id', id).then(({ error }) => {
                    if (error) console.warn('[RetroHub] update order address failed:', error.message);
                });
            }
        }
    });

    document.getElementById('checkout-modal-overlay')?.remove();
    const grandTotal = s.grandSubtotal + s.shippingCost + s.adminFee;
    openPaymentModal(s.orderIds, grandTotal, s.grandSubtotal, s.shippingCost, s.adminFee, s.buyer, s.groups, s.sellerIds);
}

// ---- Form Tambah / Edit Alamat ----
function openAddAddressForm() {
    _renderAddressForm(null);
}
function openEditAddressForm(addrId) {
    _renderAddressForm(addrId);
}

function _renderAddressForm(addrId) {
    const isEdit = !!addrId;
    const buyerId = window._checkoutState?.buyer?.id || db.getCurrentUserId();
    const addresses = db.getAddresses(buyerId);
    const existing = isEdit ? addresses.find(a => a.id === addrId) : null;

    document.getElementById('address-form-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'address-form-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9500;display:flex;align-items:flex-end;justify-content:center;';

    const inputStyle = 'width:100%;border:2.5px solid var(--retro-dark);border-radius:4px;padding:7px;font-size:0.78rem;box-sizing:border-box;background:white;';
    const selectStyle = inputStyle + 'cursor:pointer;';
    const labelStyle = 'font-family:var(--font-retro);font-size:0.68rem;font-weight:700;display:block;margin-bottom:3px;color:var(--retro-dark);';

    overlay.innerHTML = `
    <div style="background:var(--bg-card);border:3px solid var(--retro-dark);border-bottom:none;border-radius:12px 12px 0 0;box-shadow:-4px -4px 0 var(--retro-dark);width:100%;max-width:520px;max-height:92vh;overflow-y:auto;display:flex;flex-direction:column;">
        <div style="background:var(--mario-blue);color:white;padding:13px 16px;border-radius:10px 10px 0 0;border-bottom:3px solid var(--retro-dark);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:1;">
            <div>
                <div style="font-family:var(--font-retro);font-size:0.9rem;font-weight:700;">${isEdit ? '✏️ Edit Alamat' : '➕ Tambah Alamat Baru'}</div>
                <div style="font-size:0.65rem;opacity:0.85;">Lengkapi data penerima dan lokasi pengiriman</div>
            </div>
            <button onclick="document.getElementById('address-form-overlay').remove()"
                style="background:rgba(255,255,255,0.2);color:white;border:2px solid white;border-radius:4px;width:30px;height:30px;cursor:pointer;font-size:0.9rem;flex-shrink:0;">✖</button>
        </div>
        <div style="padding:16px;display:flex;flex-direction:column;gap:12px;">
            <!-- Autofill from Profile Button -->
            <button onclick="window._fillAddressFromProfile()" class="btn-retro btn-white" style="font-size:0.7rem;padding:6.8px 12px;margin-bottom:4px;border-color:var(--mario-blue);color:var(--mario-blue);font-weight:bold;width:100%;box-sizing:border-box;">⚡ Gunakan Alamat Sesuai Ketika Registrasi</button>

            <!-- Label & Nama -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                    <label style="${labelStyle}">🏷️ Label Alamat *</label>
                    <select id="af-label-select" style="${selectStyle}" onchange="document.getElementById('af-label-custom').style.display=this.value==='Lainnya'?'block':'none'">
                        <option value="Rumah" ${!existing || existing?.label==='Rumah' ? 'selected' : ''}>🏠 Rumah</option>
                        <option value="Kantor" ${existing?.label==='Kantor' ? 'selected' : ''}>🏢 Kantor</option>
                        <option value="Kos" ${existing?.label==='Kos' ? 'selected' : ''}>🛏️ Kos</option>
                        <option value="Lainnya" ${existing?.label && !['Rumah','Kantor','Kos'].includes(existing.label) ? 'selected' : ''}>📌 Lainnya</option>
                    </select>
                    <input id="af-label-custom" type="text" placeholder="Nama label..."
                        value="${existing?.label && !['Rumah','Kantor','Kos'].includes(existing?.label||'') ? (existing?.label||'') : ''}"
                        style="${inputStyle}margin-top:4px;display:${existing?.label && !['Rumah','Kantor','Kos'].includes(existing?.label||'') ? 'block' : 'none'};">
                </div>
                <div>
                    <label style="${labelStyle}">👤 Nama Penerima *</label>
                    <input id="af-name" type="text" placeholder="Nama lengkap penerima..."
                        value="${existing?.recipient_name || ''}"
                        style="${inputStyle}">
                </div>
            </div>

            <!-- No HP -->
            <div>
                <label style="${labelStyle}">📱 No. HP / WhatsApp *</label>
                <input id="af-phone" type="tel" placeholder="08xx-xxxx-xxxx"
                    value="${existing?.recipient_phone || ''}"
                    style="${inputStyle}">
            </div>

            <!-- Alamat Detail -->
            <div>
                <label style="${labelStyle}">🏘️ Alamat Lengkap (Jalan, No. Rumah, RT/RW, Gang) *</label>
                <textarea id="af-detail" placeholder="Contoh: Jl. Mawar No. 12B, RT 03/RW 07, Gang Kenanga"
                    style="${inputStyle}resize:vertical;min-height:62px;">${existing?.address_detail || ''}</textarea>
            </div>

            <!-- Divider wilayah -->
            <div style="border-top:2px dashed var(--retro-dark);padding-top:12px;">
                <div style="font-family:var(--font-retro);font-size:0.72rem;font-weight:700;margin-bottom:10px;color:var(--mario-blue);">📍 Wilayah Pengiriman</div>

                <!-- Provinsi -->
                <div style="margin-bottom:8px;">
                    <label style="${labelStyle}">Provinsi *</label>
                    <select id="af-provinsi-select" style="${selectStyle}" onchange="_afOnProvinsiChange()">
                        <option value="">— Pilih Provinsi —</option>
                    </select>
                </div>

                <!-- Kota/Kabupaten -->
                <div style="margin-bottom:8px;">
                    <label style="${labelStyle}">Kota / Kabupaten *</label>
                    <select id="af-kota-select" style="${selectStyle};opacity:0.5" disabled onchange="_afOnKotaChange()">
                        <option value="">— Pilih Provinsi dulu —</option>
                    </select>
                </div>

                <!-- Kecamatan -->
                <div style="margin-bottom:8px;">
                    <label style="${labelStyle}">Kecamatan *</label>
                    <select id="af-kecamatan-select" style="${selectStyle};opacity:0.5" disabled onchange="_afOnKecamatanChange()">
                        <option value="">— Pilih Kota dulu —</option>
                    </select>
                </div>

                <!-- Kelurahan -->
                <div style="margin-bottom:8px;">
                    <label style="${labelStyle}">Kelurahan / Desa</label>
                    <select id="af-kelurahan-select" style="${selectStyle};opacity:0.5" disabled>
                        <option value="">— Pilih Kecamatan dulu —</option>
                    </select>
                </div>

                <!-- Kode Pos -->
                <div>
                    <label style="${labelStyle}">Kode Pos</label>
                    <input id="af-kodepos" type="text" placeholder="Contoh: 55281"
                        value="${existing?.kode_pos || ''}"
                        style="${inputStyle}max-width:140px;">
                </div>
            </div>

            <!-- Patokan -->
            <div>
                <label style="${labelStyle}">🗺️ Patokan / Petunjuk Lokasi <span style="font-weight:400;color:#94A3B8;">(opsional)</span></label>
                <input id="af-patokan" type="text" placeholder="Misal: Dekat Indomaret, seberang masjid Al-Ikhlas..."
                    value="${existing?.patokan || ''}"
                    style="${inputStyle}">
            </div>

            <!-- Default checkbox -->
            <label style="display:flex;align-items:center;gap:8px;font-size:0.75rem;cursor:pointer;background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:4px;padding:8px 10px;">
                <input type="checkbox" id="af-default" ${existing?.is_default || addresses.length === 0 ? 'checked' : ''}
                    style="width:16px;height:16px;accent-color:var(--mario-blue);flex-shrink:0;">
                <span>Jadikan sebagai <strong>alamat utama</strong> pengiriman</span>
            </label>

        </div>
        <!-- Footer sticky -->
        <div style="padding:12px 16px;border-top:2.5px solid var(--retro-dark);background:var(--bg-card);position:sticky;bottom:0;display:flex;gap:8px;">
            <button onclick="document.getElementById('address-form-overlay').remove()"
                class="btn-retro btn-white" style="flex:1;font-size:0.78rem;padding:10px;">Batal</button>
            <button onclick="_saveAddressForm('${addrId || ''}')"
                class="btn-retro btn-green" style="flex:2;font-size:0.78rem;padding:10px;">💾 Simpan Alamat</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);

    // Inisialisasi dropdown wilayah
    _afInitWilayah(existing);
}

// ---- Inisialisasi & cascade dropdown wilayah ----
async function _afInitWilayah(existing) {
    const provSel = document.getElementById('af-provinsi-select');
    if (!provSel) return;
    try {
        const provinces = await db.wilayah.getProvinces();
        provinces.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            // Cocokkan nama provinsi yang tersimpan
            if (existing?.provinsi && p.name.toLowerCase().includes(existing.provinsi.toLowerCase())) {
                opt.selected = true;
            }
            provSel.appendChild(opt);
        });
        provSel.style.opacity = '1';
        if (existing?.provinsi) await _afOnProvinsiChange(existing);
    } catch(e) {
        console.warn('Gagal load provinsi:', e);
        provSel.innerHTML = '<option value="">Gagal memuat — isi manual</option>';
        // Fallback: tampilkan input teks
        _afShowManualFallback();
    }
}

async function _afOnProvinsiChange(existing = null) {
    const provSel = document.getElementById('af-provinsi-select');
    const kotaSel = document.getElementById('af-kota-select');
    const kecSel = document.getElementById('af-kecamatan-select');
    const kelSel = document.getElementById('af-kelurahan-select');
    if (!provSel || !kotaSel) return;

    const provinceId = provSel.value;
    if (!provinceId) {
        kotaSel.innerHTML = '<option value="">— Pilih Provinsi dulu —</option>';
        kotaSel.disabled = true; kotaSel.style.opacity = '0.5';
        kecSel.innerHTML = '<option value="">— Pilih Kota dulu —</option>';
        kecSel.disabled = true; kecSel.style.opacity = '0.5';
        kelSel.innerHTML = '<option value="">— Pilih Kecamatan dulu —</option>';
        kelSel.disabled = true; kelSel.style.opacity = '0.5';
        return;
    }
    kotaSel.innerHTML = '<option value="">Memuat...</option>';
    kotaSel.disabled = true; kotaSel.style.opacity = '0.6';
    try {
        const regencies = await db.wilayah.getRegencies(provinceId);
        kotaSel.innerHTML = '<option value="">— Pilih Kota/Kabupaten —</option>';
        regencies.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = r.name;
            if (existing?.kota && r.name.toLowerCase().includes(existing.kota.toLowerCase())) opt.selected = true;
            kotaSel.appendChild(opt);
        });
        kotaSel.disabled = false; kotaSel.style.opacity = '1';
        if (existing?.kota) await _afOnKotaChange(existing);
    } catch(e) { kotaSel.innerHTML = '<option value="">Gagal memuat</option>'; }
}

async function _afOnKotaChange(existing = null) {
    const kotaSel = document.getElementById('af-kota-select');
    const kecSel = document.getElementById('af-kecamatan-select');
    const kelSel = document.getElementById('af-kelurahan-select');
    if (!kotaSel || !kecSel) return;

    const kotaId = kotaSel.value;
    if (!kotaId) {
        kecSel.innerHTML = '<option value="">— Pilih Kota dulu —</option>';
        kecSel.disabled = true; kecSel.style.opacity = '0.5';
        kelSel.innerHTML = '<option value="">— Pilih Kecamatan dulu —</option>';
        kelSel.disabled = true; kelSel.style.opacity = '0.5';
        return;
    }
    kecSel.innerHTML = '<option value="">Memuat...</option>';
    kecSel.disabled = true; kecSel.style.opacity = '0.6';
    try {
        const districts = await db.wilayah.getDistricts(kotaId);
        kecSel.innerHTML = '<option value="">— Pilih Kecamatan —</option>';
        districts.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.name;
            if (existing?.kecamatan && d.name.toLowerCase().includes(existing.kecamatan.toLowerCase())) opt.selected = true;
            kecSel.appendChild(opt);
        });
        kecSel.disabled = false; kecSel.style.opacity = '1';
        if (existing?.kecamatan) await _afOnKecamatanChange(existing);
    } catch(e) { kecSel.innerHTML = '<option value="">Gagal memuat</option>'; }
}

async function _afOnKecamatanChange(existing = null) {
    const kecSel = document.getElementById('af-kecamatan-select');
    const kelSel = document.getElementById('af-kelurahan-select');
    if (!kecSel || !kelSel) return;

    const kecId = kecSel.value;
    if (!kecId) {
        kelSel.innerHTML = '<option value="">— Pilih Kecamatan dulu —</option>';
        kelSel.disabled = true; kelSel.style.opacity = '0.5';
        return;
    }
    kelSel.innerHTML = '<option value="">Memuat...</option>';
    kelSel.disabled = true; kelSel.style.opacity = '0.6';
    try {
        const villages = await db.wilayah.getVillages(kecId);
        kelSel.innerHTML = '<option value="">— Pilih Kelurahan (opsional) —</option>';
        villages.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = v.name;
            if (existing?.kelurahan && v.name.toLowerCase().includes(existing.kelurahan.toLowerCase())) opt.selected = true;
            kelSel.appendChild(opt);
        });
        kelSel.disabled = false; kelSel.style.opacity = '1';
    } catch(e) { kelSel.innerHTML = '<option value="">Gagal memuat</option>'; }
}

function _afShowManualFallback() {
    // Jika API wilayah gagal, ganti semua select ke input teks
    ['af-provinsi-select','af-kota-select','af-kecamatan-select','af-kelurahan-select'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = id.replace('-select', '-manual');
            input.style.cssText = sel.style.cssText || '';
            input.style = 'width:100%;border:2.5px solid var(--retro-dark);border-radius:4px;padding:7px;font-size:0.78rem;box-sizing:border-box;';
            input.placeholder = sel.options[0]?.text?.replace('—','').trim() || '';
            sel.parentNode.replaceChild(input, sel);
        }
    });
}

window._saveAddressForm = function(addrId) {
    // Label — bisa dari select atau custom input
    const labelSel = document.getElementById('af-label-select');
    const labelCustom = document.getElementById('af-label-custom');
    const label = (labelSel?.value === 'Lainnya' ? labelCustom?.value.trim() : labelSel?.value) || '';

    const name = document.getElementById('af-name')?.value.trim() || '';
    const phone = document.getElementById('af-phone')?.value.trim() || '';
    const detail = document.getElementById('af-detail')?.value.trim() || '';

    // Wilayah dari dropdown (atau fallback manual jika API gagal)
    const provSel = document.getElementById('af-provinsi-select');
    const kotaSel = document.getElementById('af-kota-select');
    const kecSel  = document.getElementById('af-kecamatan-select');
    const kelSel  = document.getElementById('af-kelurahan-select');

    const provinsi   = provSel ? provSel.options[provSel.selectedIndex]?.text?.replace('— ','').replace(' —','') || '' : (document.getElementById('af-provinsi-manual')?.value.trim() || '');
    const kota       = kotaSel ? kotaSel.options[kotaSel.selectedIndex]?.text?.replace('— ','').replace(' —','') || '' : (document.getElementById('af-kota-manual')?.value.trim() || '');
    const kecamatan  = kecSel  ? kecSel.options[kecSel.selectedIndex]?.text?.replace('— ','').replace(' —','') || '' : (document.getElementById('af-kecamatan-manual')?.value.trim() || '');
    const kelurahan  = kelSel  ? (kelSel.value ? kelSel.options[kelSel.selectedIndex]?.text : '') || '' : (document.getElementById('af-kelurahan-manual')?.value.trim() || '');

    // Bersihkan dari placeholder text
    const cleanWilayah = (s) => s && !s.startsWith('—') && !s.includes('Pilih') && !s.includes('Memuat') && !s.includes('Gagal') ? s : '';

    const kodePos = document.getElementById('af-kodepos')?.value.trim() || '';
    const patokan = document.getElementById('af-patokan')?.value.trim() || '';
    const isDefault = document.getElementById('af-default')?.checked || false;

    if (!label || !name || !phone || !detail) {
        showAlert('Data Tidak Lengkap ⚠️', 'Label, Nama Penerima, No. HP, dan Alamat Detail wajib diisi.');
        return;
    }
    if (!cleanWilayah(provinsi) || !cleanWilayah(kota) || !cleanWilayah(kecamatan)) {
        showAlert('Wilayah Belum Dipilih ⚠️', 'Pilih Provinsi, Kota/Kabupaten, dan Kecamatan terlebih dahulu.');
        return;
    }

    const buyerId = window._checkoutState?.buyer?.id || db.getCurrentUserId();

    const addrData = {
        label,
        recipient_name: name,
        recipient_phone: phone,
        address_detail: detail,
        provinsi: cleanWilayah(provinsi),
        kota: cleanWilayah(kota),
        kecamatan: cleanWilayah(kecamatan),
        kelurahan: cleanWilayah(kelurahan),
        kode_pos: kodePos,
        patokan,
        is_default: isDefault
    };

    if (addrId) {
        db.updateAddress(addrId, addrData);
    } else {
        const newAddr = db.addAddress(buyerId, addrData);
        if (window._checkoutState) {
            window._checkoutState.selectedAddressId = newAddr.id;
        }
        if (window._activeOrderAddressSelectionId) {
            const orderId = window._activeOrderAddressSelectionId;
            const order = db.getOrderById(orderId);
            if (order) {
                const product = db.getProductById(order.product_id);
                const seller = db.getProfileById(order.seller_id);
                const rate = db.getRealShippingRate(
                    seller?.address_kecamatan || 'Depok',
                    newAddr.kecamatan || newAddr.kota || '',
                    product?.weight_grams || 250,
                    order.shipping_courier || 'jnt'
                );
                const fullAddressString = `${newAddr.address_detail}${newAddr.kecamatan ? ', ' + newAddr.kecamatan : ''}${newAddr.kota ? ', ' + newAddr.kota : ''}${newAddr.kode_pos ? ' ' + newAddr.kode_pos : ''}`;
                const priceDeal = Number(order.price_deal || order.price || 0);
                const adminFee = Number(order.admin_fee || 0);
                const newTotal = priceDeal + rate + adminFee;

                db.updateOrderField(orderId, {
                    shipping_address: fullAddressString,
                    recipient_name: newAddr.recipient_name,
                    recipient_phone: newAddr.recipient_phone,
                    address_label: newAddr.label,
                    address_patokan: newAddr.patokan || '',
                    shipping_cost: rate,
                    total_payment: newTotal
                });
            }
        }
    }

    document.getElementById('address-form-overlay').remove();
    if (window._checkoutState) {
        _recalcShipping();
        _renderCheckoutModal();
    } else if (window._activeOrderAddressSelectionId) {
        const orderId = window._activeOrderAddressSelectionId;
        window._activeOrderAddressSelectionId = null; // reset
        openOrderDetailModal(orderId);
        showToast('Alamat Ditambahkan & Diterapkan 📍', 'Alamat baru berhasil disimpan dan diterapkan pada pesanan ini.', 'success');
    }
};

// ---- Fungsi Autofill Alamat dari Profil Registrasi ----
window._fillAddressFromProfile = async function() {
    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) return;
    const profile = db.getProfileById(currentUserId);
    if (!profile) return;

    const nameInput = document.getElementById('af-name');
    if (nameInput) nameInput.value = profile.full_name || profile.store_name || '';

    const phoneInput = document.getElementById('af-phone');
    if (phoneInput) phoneInput.value = profile.phone_number || '';

    const detailInput = document.getElementById('af-detail');
    if (detailInput) detailInput.value = profile.address_detail || '';

    // Cascade dropdown wilayah
    const provSel = document.getElementById('af-provinsi-select');
    if (profile.address_provinsi && provSel) {
        let foundProv = false;
        for (let i = 0; i < provSel.options.length; i++) {
            if (provSel.options[i].text.toLowerCase().includes(profile.address_provinsi.toLowerCase())) {
                provSel.selectedIndex = i;
                foundProv = true;
                break;
            }
        }
        if (foundProv) {
            const existingData = {
                provinsi: profile.address_provinsi,
                kota: profile.address_kota,
                kecamatan: profile.address_kecamatan,
                kelurahan: profile.address_kelurahan
            };
            await _afOnProvinsiChange(existingData);
        }
    }
    showToast('Autofill Berhasil ⚡', 'Berhasil memuat data alamat dari profil registrasi. Silakan lengkapi dan simpan.', 'success');
};

// ---- Modal Pilihan Alamat untuk Pesanan di Histori ----
window.openChangeAddressForOrderModal = function(orderId) {
    const order = db.getOrderById(orderId);
    if (!order) return;
    
    // Set active order address selection context
    window._activeOrderAddressSelectionId = orderId;
    
    const buyerId = order.buyer_id;
    const addresses = db.getAddresses(buyerId);
    
    // Remove if already exists
    document.getElementById('order-change-address-overlay')?.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'order-change-address-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10020;display:flex;align-items:flex-end;justify-content:center;';
    
    const addrListHTML = addresses.length === 0 ? `
        <div style="text-align:center;padding:24px;color:#94A3B8;font-size:0.8rem;">
            📍 Belum ada alamat tersimpan.<br>Silakan tambahkan alamat baru untuk mengirim pesanan ini.
        </div>` :
        addresses.map(addr => {
            const isSelected = order.shipping_address && order.shipping_address.includes(addr.address_detail);
            return `
            <div onclick="window.selectAddressForOrder('${orderId}', '${addr.id}')" style="
                cursor:pointer;
                border: 2.5px solid ${isSelected ? 'var(--mario-blue)' : 'var(--retro-dark)'};
                border-radius:6px; padding:10px 12px; margin-bottom:8px;
                background:${isSelected ? '#EEF4FF' : '#FAFAFA'};
                position:relative;
                box-shadow: ${isSelected ? '2px 2px 0 var(--mario-blue)' : '2px 2px 0 #ccc'};
                transition: all 0.15s;
            ">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                    <div style="flex:1;min-width:0;text-align:left;">
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                            <span style="font-family:var(--font-retro);font-size:0.72rem;font-weight:700;
                                background:${addr.is_default ? 'var(--mario-yellow)' : '#E2E8F0'};
                                border:1.5px solid var(--retro-dark);border-radius:3px;padding:1px 6px;">
                                ${addr.label}
                            </span>
                            ${addr.is_default ? '<span style="font-size:0.62rem;color:#16A34A;font-weight:700;">✓ Utama</span>' : ''}
                        </div>
                        <div style="font-family:var(--font-retro);font-size:0.8rem;font-weight:700;">${addr.recipient_name}</div>
                        <div style="font-size:0.72rem;color:#475569;">${addr.recipient_phone}</div>
                        <div style="font-size:0.7rem;color:#64748B;margin-top:2px;line-height:1.4;">
                            ${addr.address_detail}${addr.kecamatan ? ', ' + addr.kecamatan : ''}${addr.kota ? ', ' + addr.kota : ''}${addr.kode_pos ? ' ' + addr.kode_pos : ''}
                        </div>
                        ${addr.patokan ? `<div style="font-size:0.65rem;color:#94A3B8;font-style:italic;">📍 ${addr.patokan}</div>` : ''}
                    </div>
                </div>
                ${isSelected ? '<div style="position:absolute;top:10px;right:10px;width:16px;height:16px;background:var(--mario-blue);border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px var(--mario-blue);"></div>' : ''}
            </div>`;
        }).join('');
        
    overlay.innerHTML = `
    <div style="
        background:var(--bg-card);
        border:3px solid var(--retro-dark);
        border-bottom:none;
        border-radius:12px 12px 0 0;
        box-shadow:-4px -4px 0 var(--retro-dark);
        width:100%;
        max-width:480px;
        max-height:85vh;
        overflow-y:auto;
        display:flex;
        flex-direction:column;
    ">
        <!-- Header -->
        <div style="
            background:var(--mario-blue);
            color:white;
            padding:14px 16px;
            border-radius:10px 10px 0 0;
            display:flex;
            align-items:center;
            justify-content:space-between;
            position:sticky;top:0;z-index:1;
            border-bottom:3px solid var(--retro-dark);
        ">
            <div>
                <div style="font-family:var(--font-retro);font-size:0.95rem;font-weight:700;">📍 Pilih Alamat Pengiriman</div>
                <div style="font-size:0.65rem;opacity:0.85;">Pilih salah satu alamat untuk pesanan #${orderId}</div>
            </div>
            <button onclick="document.getElementById('order-change-address-overlay').remove()"
                style="background:rgba(255,255,255,0.2);color:white;border:2px solid white;border-radius:4px;width:30px;height:30px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">✖</button>
        </div>
        
        <div style="padding:14px 16px;flex:1;overflow-y:auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-family:var(--font-retro);font-size:0.75rem;font-weight:700;color:var(--retro-dark);">Alamat Tersimpan</span>
                <button onclick="openAddAddressForm()" style="font-family:var(--font-retro);font-size:0.65rem;border:2px solid var(--mario-blue);border-radius:4px;padding:3px 8px;background:white;color:var(--mario-blue);cursor:pointer;font-weight:700;">+ Tambah Alamat Baru</button>
            </div>
            
            <div style="display:flex;flex-direction:column;gap:4px;">
                ${addrListHTML}
            </div>
        </div>
        
        <div style="padding:12px 16px;border-top:2.5px solid var(--retro-dark);background:var(--bg-card);position:sticky;bottom:0;display:flex;gap:8px;">
            <button onclick="document.getElementById('order-change-address-overlay').remove()" class="btn-retro btn-white" style="width:100%;font-size:0.78rem;padding:9px;">Batal</button>
        </div>
    </div>`;
    
    document.body.appendChild(overlay);
};

// ---- Handler Pemilihan Alamat untuk Pesanan ----
window.selectAddressForOrder = function(orderId, addrId) {
    const order = db.getOrderById(orderId);
    if (!order) return;
    const addresses = db.getAddresses(order.buyer_id);
    const addr = addresses.find(a => a.id === addrId);
    if (!addr) return;

    const product = db.getProductById(order.product_id);
    const seller = db.getProfileById(order.seller_id);
    const rate = db.getRealShippingRate(
        seller?.address_kecamatan || 'Depok',
        addr.kecamatan || addr.kota || '',
        product?.weight_grams || 250,
        order.shipping_courier || 'jnt'
    );
    const fullAddressString = `${addr.address_detail}${addr.kecamatan ? ', ' + addr.kecamatan : ''}${addr.kota ? ', ' + addr.kota : ''}${addr.kode_pos ? ' ' + addr.kode_pos : ''}`;
    const priceDeal = Number(order.price_deal || order.price || 0);
    const adminFee = Number(order.admin_fee || 0);
    const newTotal = priceDeal + rate + adminFee;

    db.updateOrderField(orderId, {
        shipping_address: fullAddressString,
        recipient_name: addr.recipient_name,
        recipient_phone: addr.recipient_phone,
        address_label: addr.label,
        address_patokan: addr.patokan || '',
        shipping_cost: rate,
        total_payment: newTotal
    });

    document.getElementById('order-change-address-overlay')?.remove();
    // Reset selection context
    window._activeOrderAddressSelectionId = null;
    
    openOrderDetailModal(orderId);
    showToast('Alamat Diperbarui 📍', 'Alamat pengiriman dan ongkos kirim pesanan berhasil diperbarui.', 'success');
};

// Modal Pembayaran Simulasi QRIS / Transfer Rekber
// ---- INTEGRASI MIDTRANS SNAP ASLI ----
function loadMidtransSnap(isSandbox) {
    return new Promise((resolve, reject) => {
        const scriptId = 'midtrans-snap-script';
        let script = document.getElementById(scriptId);
        const scriptUrl = isSandbox 
            ? 'https://app.sandbox.midtrans.com/snap/snap.js'
            : 'https://app.midtrans.com/snap/snap.js';
        
        if (script) {
            if (script.getAttribute('src') === scriptUrl) {
                resolve();
                return;
            } else {
                script.remove();
            }
        }
        
        script = document.createElement('script');
        script.id = scriptId;
        script.src = scriptUrl;
        script.setAttribute('data-client-key', 'Mid-client-JM4j6IvXwGW8MoqH');
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Gagal memuat script Midtrans Snap.'));
        document.head.appendChild(script);
    });
}

async function payWithMidtrans(orderIds, onSuccessCallback) {
    showToast('Menghubungkan... ⏳', 'Sedang membuat tagihan pembayaran Midtrans.', 'info');
    
    try {
        const response = await fetch('/api/payment/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ order_ids: orderIds })
        });
        
        const data = await response.json();
        
        if (!data.success || !data.snap_token) {
            showAlert('Gagal Pembayaran ❌', data.error || 'Gagal memproses pembayaran ke Midtrans.');
            return;
        }
        
        const isSandbox = data.redirect_url ? data.redirect_url.includes('sandbox') : true;
        
        await loadMidtransSnap(isSandbox);
        
        window.snap.pay(data.snap_token, {
            onSuccess: function(result) {
                console.log('Payment success:', result);
                showAlert('Pembayaran Berhasil 🎉', 
                    'Terima kasih! Pembayaran Anda telah dikonfirmasi dan sedang diverifikasi secara otomatis.',
                    () => { 
                        if (typeof onSuccessCallback === 'function') {
                            onSuccessCallback();
                        } else {
                            window.location.href = 'index.html'; 
                        }
                    }
                );
            },
            onPending: function(result) {
                console.log('Payment pending:', result);
                showAlert('Menunggu Pembayaran ⏳', 
                    'Pesanan Anda telah dibuat. Silakan selesaikan pembayaran Anda sesuai petunjuk Midtrans.',
                    () => { 
                        if (typeof onSuccessCallback === 'function') {
                            onSuccessCallback();
                        } else {
                            window.location.href = 'index.html'; 
                        }
                    }
                );
            },
            onError: function(result) {
                console.error('Payment error:', result);
                showAlert('Pembayaran Gagal ❌', 'Terjadi kesalahan saat melakukan pembayaran. Silakan coba lagi.');
            },
            onClose: function() {
                console.log('Payment popup closed');
                showToast('Pembayaran Ditangguhkan ⏳', 'Anda menutup pembayaran. Lanjutkan pembayaran kapan saja di Histori Transaksi.', 'warning');
            }
        });
        
    } catch (error) {
        console.error('Midtrans error:', error);
        showAlert('Kesalahan Server ❌', 'Gagal menghubungi server pembayaran. Silakan coba lagi beberapa saat lagi.');
    }
}

function openPaymentModal(orderIds, grandTotal, grandSubtotal, grandShipping, adminFee, buyer, groups, sellerIds) {
    payWithMidtrans(orderIds, () => {
        window.location.href = 'index.html';
    });
}

let currentBuyerTxFilter = 'all';

window.filterBuyerTransactions = function(filterType) {
    currentBuyerTxFilter = filterType;
    ['all', 'waiting_payment', 'shipping', 'problem', 'cancelled', 'completed'].forEach(type => {
        const btn = document.getElementById(`btn-buyer-tx-${type}`);
        if (btn) {
            if (type === filterType) {
                btn.classList.add('active');
                btn.style.backgroundColor = 'var(--mario-yellow)';
                btn.style.borderColor = 'var(--retro-dark)';
            } else {
                btn.classList.remove('active');
                btn.style.backgroundColor = '#FFFFFF';
                btn.style.borderColor = 'var(--retro-light-gray)';
            }
        }
    });

    const container = document.getElementById('buyer-orders-container');
    if (container) {
        container.innerHTML = getBuyerOrdersHTML();
    }
};

function getBuyerOrdersHTML() {
    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) return '';

    const STATUS_MAP = {
        'waiting_payment': { label: '⏳ Menunggu Pembayaran', color: '#D97706', bg: '#FEF9C3' },
        'to_ship':         { label: '📦 Diproses Penjual',   color: '#002FBE', bg: '#EFF6FF' },
        'shipping':        { label: '🚚 Sedang Dikirim',      color: '#EA580C', bg: '#FFF7ED' },
        'delivered':       { label: '✅ Tiba — Konfirmasi?',  color: '#16A34A', bg: '#ECFDF5' },
        'completed':       { label: '🎉 Selesai',              color: '#16A34A', bg: '#ECFDF5' },
        'disputed':        { label: '⚠️ Sengketa',            color: '#DC2626', bg: '#FEF2F2' },
        'cancelled':       { label: '🚫 Dibatalkan',          color: '#6B7280', bg: '#F3F4F6' },
        'expired':         { label: '⏰ Kedaluwarsa',         color: '#6B7280', bg: '#F3F4F6' },
        'refunded':        { label: '💸 Refund Selesai',       color: '#64748B', bg: '#F8FAFC' },
    };

    let orders = db.getOrders().filter(o => o.buyer_id === currentUserId);

    if (currentBuyerTxFilter === 'waiting_payment') {
        orders = orders.filter(o => ['waiting_payment', 'pending_payment'].includes(o.status));
    } else if (currentBuyerTxFilter === 'shipping') {
        orders = orders.filter(o => ['to_ship', 'paid', 'shipping', 'delivered'].includes(o.status));
    } else if (currentBuyerTxFilter === 'problem') {
        orders = orders.filter(o => o.status === 'disputed');
    } else if (currentBuyerTxFilter === 'cancelled') {
        orders = orders.filter(o => ['cancelled', 'expired', 'refunded'].includes(o.status));
    } else if (currentBuyerTxFilter === 'completed') {
        orders = orders.filter(o => o.status === 'completed');
    }

    // Filter pencarian
    const searchInput = document.getElementById('buyer-order-search-input');
    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchQuery) {
        orders = orders.filter(o => 
            o.id.toLowerCase().includes(searchQuery) ||
            o.seller_name.toLowerCase().includes(searchQuery) ||
            o.product_title.toLowerCase().includes(searchQuery)
        );
    }

    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (orders.length === 0) {
        return `<div style="text-align:center; color:#64748B; padding: 24px; font-size: 0.85rem;">Tidak ada riwayat transaksi kategori ini.</div>`;
    }

    return orders.map(o => {
        const product = db.getProductById(o.product_id);
        const seller = db.getProfileById(o.seller_id);
        const imgUrl = product ? product.image_url : 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=100';
        const titleText = o.product_title || (product ? product.title : 'Produk');
        const price = Number(o.price_deal || o.price || 0);
        const shipping = Number(o.shipping_cost || 0);
        const total = Number(o.total_payment || (price + shipping));
        const statusInfo = STATUS_MAP[o.status] || { label: o.status, color: '#64748B', bg: '#F1F5F9' };
        const dateStr = new Date(o.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });

        let quickAction = '';
        if (o.status === 'waiting_payment') {
            quickAction = `<button class="btn-retro btn-yellow"
                onclick="event.stopPropagation();openSingleOrderPaymentModal('${o.id}',${total})"
                style="font-size:0.65rem;padding:4px 10px;margin-top:5px;color:var(--retro-dark);">
                💳 Bayar Sekarang
            </button>`;
        } else if (o.status === 'delivered') {
            quickAction = `<button class="btn-retro btn-green"
                onclick="event.stopPropagation();openOrderDetailModal('${o.id}')"
                style="font-size:0.65rem;padding:4px 10px;margin-top:5px;">
                ✅ Konfirmasi Terima
            </button>`;
        } else if (o.status === 'completed' && !db.hasUserReviewedOrder(o.id)) {
            quickAction = `<button class="btn-retro btn-yellow"
                onclick="event.stopPropagation();openOrderDetailModal('${o.id}')"
                style="font-size:0.65rem;padding:4px 10px;margin-top:5px;color:var(--retro-dark);">
                ⭐ Tulis Ulasan
            </button>`;
        } else if (o.status === 'cancelled' || o.status === 'expired' || o.status === 'refunded') {
            let label = '🚫 Dibatalkan';
            if (o.status === 'expired') label = '⏰ Kedaluwarsa';
            if (o.status === 'refunded') label = '💸 Direfund';
            quickAction = `<span style="font-size:0.6rem;background:#FEE2E2;color:#DC2626;border:1.5px solid #DC2626;border-radius:3px;padding:2px 7px;font-weight:bold;margin-top:5px;display:inline-block;">
                ${label}
            </span>`;
        }

        return `
            <div style="border: 2px solid var(--retro-light-gray); border-radius: 6px; padding: 10px; background: ${statusInfo.bg}; margin-bottom: 8px; cursor:pointer; transition:transform 0.1s, box-shadow 0.1s;"
                onclick="openOrderDetailModal('${o.id}')"
                onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 3px 8px rgba(0,0,0,0.12)'"
                onmouseout="this.style.transform='';this.style.boxShadow=''">
                <div style="display:flex; gap:8px; align-items:flex-start;">
                    <img src="${imgUrl}" style="width:44px; height:44px; border-radius:4px; border:1.5px solid var(--retro-dark); object-fit:cover; flex-shrink:0;">
                    <div style="flex-grow:1; min-width:0;">
                        <div style="font-weight:bold; font-size:0.75rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${titleText}</div>
                        <div style="font-size:0.62rem; color:#64748B;">🏪 ${o.seller_name || (seller ? '@'+seller.store_name : '-')} • ${dateStr}</div>
                        <div style="font-size:0.6rem;color:#94A3B8;font-family:var(--font-retro);">${o.id}</div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                            <span style="font-family:var(--font-number); font-weight:bold; color:var(--mario-red); font-size:0.8rem;">Rp${total.toLocaleString('id-ID')}</span>
                            <span style="font-size:0.62rem; font-weight:bold; color:${statusInfo.color}; background:white; border:1.5px solid ${statusInfo.color}; border-radius:3px; padding: 1px 5px;">${statusInfo.label}</span>
                        </div>
                        ${quickAction}
                    </div>
                    <div style="color:#CBD5E1;font-size:0.9rem;align-self:center;">›</div>
                </div>
            </div>
        `;
    }).join('');
}

// Buyer Order History Modal — lengkap dengan status & aksi pembayaran
function openBuyerOrderHistoryModal() {
    closeAllHeaderPopups();

    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) {
        showAlert("Akses Terbatas ⚠️", "Silakan login terlebih dahulu untuk melihat histori transaksi.");
        return;
    }

    currentBuyerTxFilter = 'all';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'order-history-modal-overlay';

    overlay.innerHTML = `
        <div class="modal-box" style="max-width: 440px; text-align: left; padding: 0; overflow: hidden; display: flex; flex-direction: column; max-height: 85vh;">
            <div style="background: var(--mario-red); color: white; padding: 14px 18px; border-bottom: 3px solid var(--retro-dark); display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                <div style="font-family: var(--font-retro); font-size: 1rem; font-weight: 700; text-shadow: 1px 1px 0px var(--retro-dark);">📦 Histori Transaksi</div>
                <button onclick="document.getElementById('order-history-modal-overlay').remove()" style="background: rgba(255,255,255,0.2); color: white; border: 2px solid white; border-radius: 4px; width:28px; height:28px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center;">✖</button>
            </div>
            
            <!-- Filter Transaksi Buyer -->
            <div style="display: flex; gap: 6px; padding: 10px 14px; border-bottom: 2px dashed var(--retro-light-gray); overflow-x: auto; scrollbar-width: none; background: #F8FAFC; flex-shrink: 0; -webkit-overflow-scrolling: touch;">
                <button class="btn-retro btn-white active" id="btn-buyer-tx-all" onclick="filterBuyerTransactions('all')" style="font-size: 0.65rem; padding: 4px 8px; white-space: nowrap;">Semua</button>
                <button class="btn-retro btn-white" id="btn-buyer-tx-waiting_payment" onclick="filterBuyerTransactions('waiting_payment')" style="font-size: 0.65rem; padding: 4px 8px; white-space: nowrap;">Menunggu Bayar 💳</button>
                <button class="btn-retro btn-white" id="btn-buyer-tx-shipping" onclick="filterBuyerTransactions('shipping')" style="font-size: 0.65rem; padding: 4px 8px; white-space: nowrap;">Dikirim 🚚</button>
                <button class="btn-retro btn-white" id="btn-buyer-tx-problem" onclick="filterBuyerTransactions('problem')" style="font-size: 0.65rem; padding: 4px 8px; white-space: nowrap;">Bermasalah ⚠️</button>
                <button class="btn-retro btn-white" id="btn-buyer-tx-cancelled" onclick="filterBuyerTransactions('cancelled')" style="font-size: 0.65rem; padding: 4px 8px; white-space: nowrap;">Dibatalkan 🚫</button>
                <button class="btn-retro btn-white" id="btn-buyer-tx-completed" onclick="filterBuyerTransactions('completed')" style="font-size: 0.65rem; padding: 4px 8px; white-space: nowrap;">Selesai ✅</button>
            </div>

            <!-- Search Transaksi Buyer -->
            <div style="padding: 8px 14px; border-bottom: 2px dashed var(--retro-light-gray); background: #F8FAFC; flex-shrink: 0;">
                <div class="search-bar-wrapper" style="box-shadow: 2px 2px 0px var(--retro-dark); margin: 0;">
                    <input type="text" id="buyer-order-search-input" class="search-input" placeholder="Cari Order ID, seller, atau produk..." oninput="filterBuyerTransactions(currentBuyerTxFilter)" style="padding: 6px 10px; font-size: 0.75rem;">
                </div>
            </div>
 
            <div id="buyer-orders-container" style="padding: 14px; max-height: 40vh; overflow-y: auto; flex-grow: 1; border-bottom: 2px dashed var(--retro-light-gray);">
                ${getBuyerOrdersHTML()}
            </div>
            
            <div id="buyer-withdrawals-container" style="padding: 14px; max-height: 25vh; overflow-y: auto; flex-shrink: 0; background: #F8FAFC;">
                ${getBuyerWithdrawalsHTML()}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// Modal bayar ulang untuk satu order yang masih waiting_payment
function openSingleOrderPaymentModal(orderId, totalAmount) {
    // Tutup semua popup yang ada dulu untuk mencegah stacking
    document.getElementById('order-history-modal-overlay')?.remove();
    document.getElementById('order-detail-overlay')?.remove();
    document.getElementById('single-pay-modal')?.remove();

    payWithMidtrans([orderId], () => {
        if (typeof openBuyerOrderHistoryModal === 'function') {
            openBuyerOrderHistoryModal();
        }
    });
}

function confirmOrderReceived(orderId) {
    showConfirm(
        'Konfirmasi Terima Barang ✅',
        'Apakah Anda sudah menerima barang dalam kondisi baik dan sesuai? Setelah dikonfirmasi, dana akan diteruskan ke penjual dan transaksi selesai.',
        () => {
            db.updateOrderStatus(orderId, 'completed');
            const order = db.getOrderById(orderId);
            if (order) {
                db.sendPrivateChat('admin-demo', order.seller_id, `🎉 Pembeli telah mengkonfirmasi penerimaan barang untuk pesanan (ID: ${orderId}). Transaksi selesai! Dana akan dicairkan ke rekening Anda.`);
            }
            showToast('Transaksi Selesai 🎉', 'Terima kasih! Dana penjual telah diproses.', 'success');
            // Reload histori setelah confirm
            const oldOverlay = document.getElementById('order-history-modal-overlay');
            if (oldOverlay) oldOverlay.remove();
            openBuyerOrderHistoryModal();
        }
    );
}

// 4. Modal Wishlist Saya

function openWishlistModal() {
    closeAllHeaderPopups();

    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) {
        showAlert("Akses Terbatas ⚠️", "Silakan login pembeli terlebih dahulu untuk melihat wishlist.");
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'wishlist-modal-overlay';

    overlay.innerHTML = `
        <div class="modal-box" style="max-width: 360px; text-align: left; padding: 18px;">
            <div class="modal-title" style="color: var(--mario-red); margin-bottom: 12px; font-family: var(--font-retro); font-size: 1.1rem; text-align: center;">❤️ Wishlist Saya</div>
            
            <!-- Search Input -->
            <div class="search-bar-wrapper" style="box-shadow: 2px 2px 0px var(--retro-dark); margin-bottom: 12px;">
                <input type="text" id="buyer-wishlist-search-input" class="search-input" placeholder="Cari di wishlist..." oninput="renderWishlistItems(this.value)" style="padding: 6px 10px; font-size: 0.75rem;">
            </div>
            
            <div id="wishlist-items-container" style="display: flex; flex-direction: column; gap: 10px; max-height: 250px; overflow-y: auto; margin-bottom: 12px;">
                <!-- Diisi dinamis -->
            </div>
            
            <div class="modal-buttons" style="margin: 0; justify-content: flex-end;">
                <button class="btn-retro btn-blue" onclick="document.getElementById('wishlist-modal-overlay').remove()">TUTUP</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    renderWishlistItems();
}

function renderWishlistItems(query) {
    const container = document.getElementById('wishlist-items-container');
    if (!container) return;

    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) { container.innerHTML = ''; return; }

    let items = db.getWishlistProducts(currentUserId);
    if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        items = items.filter(p => p.title && p.title.toLowerCase().includes(q));
    }

    if (items.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:24px;font-size:0.8rem;color:#94A3B8;">
            ${query ? '🔍 Tidak ditemukan di wishlist.' : '❤️ Wishlist kamu masih kosong.'}
        </div>`;
        return;
    }

    container.innerHTML = items.map(p => {
        const price = p.price || p.starting_bid || 0;
        const img = p.image_url || (p.photos && p.photos[0]) || '';
        const savedPrice = p._price_at_save || price;
        const isPriceDrop = savedPrice > 0 && price < savedPrice * 0.95;
        return `
            <div style="display:flex;gap:10px;align-items:center;padding:8px;border:1.5px solid var(--retro-light-gray);border-radius:4px;cursor:pointer;" onclick="window.location.href='product.html?id=${p.id}'">
                ${img ? `<img src="${img}" alt="${p.title}" style="width:52px;height:52px;object-fit:cover;border-radius:4px;flex-shrink:0;">` : `<div style="width:52px;height:52px;background:#F1F5F9;border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📦</div>`}
                <div style="flex:1;min-width:0;">
                    <div style="font-size:0.75rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.title}</div>
                    <div style="font-size:0.8rem;font-weight:700;color:var(--mario-red);font-family:var(--font-number);">
                        Rp${price.toLocaleString('id-ID')}
                        ${isPriceDrop ? `<span style="font-size:0.65rem;color:#94A3B8;text-decoration:line-through;margin-left:4px;">Rp${savedPrice.toLocaleString('id-ID')}</span>` : ''}
                    </div>
                </div>
                <button onclick="event.stopPropagation();db.toggleWishlist('${p.id}',db.getCurrentUserId());renderWishlistItems(document.getElementById('buyer-wishlist-search-input')?.value);"
                    style="background:none;border:none;font-size:1.1rem;cursor:pointer;padding:4px;flex-shrink:0;" title="Hapus dari wishlist">🗑️</button>
            </div>`;
    }).join('');
}


function openEditProfileModal() {
    closeAllHeaderPopups();

    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) {
        showAlert("Akses Terbatas ⚠️", "Silakan login simulasi terlebih dahulu untuk mengedit biodata profil.");
        return;
    }

    const user = db.getProfileById(currentUserId);
    if (!user) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'edit-profile-modal-overlay';
    overlay.style = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(26, 26, 26, 0.85);
        backdrop-filter: blur(4px);
        z-index: 100000;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow-y: auto;
        padding: 20px;
        box-sizing: border-box;
    `;

    overlay.innerHTML = `
        <div class="modal-box" style="width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto; background: #FFFFFF; border: 3.5px solid var(--retro-dark, #1A1A1A); border-radius: 6px; box-shadow: 6px 6px 0px var(--retro-dark, #1A1A1A); padding: 20px; box-sizing: border-box; text-align: left;">
            <div class="modal-title" style="color: var(--mario-blue); text-align: center; border-bottom: 2px dashed var(--retro-light-gray); padding-bottom: 8px; margin-bottom: 12px; font-family: var(--font-retro);">
                👤 Pusat Akun & Biodata
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.8rem;">
                
                <!-- Email Google (Readonly) -->
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 4px;">Email (Google Login):</label>
                    <input type="text" value="${user.email || ''}" readonly style="width: 100%; padding: 8px; border: 2px solid var(--retro-dark); border-radius: 4px; background-color: #F1F5F9; color: #64748B; cursor: not-allowed; outline: none; font-size: 0.8rem; box-sizing: border-box;">
                    <span style="font-size: 0.65rem; color: #94A3B8;">🔐 Email tidak dapat diubah karena terikat otomatis dengan Google Auth.</span>
                </div>

                <!-- Nama Lengkap -->
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 4px;">Nama Lengkap:</label>
                    <input type="text" id="edit-full-name" value="${user.full_name || ''}" style="width: 100%; padding: 8px; border: 2px solid var(--retro-dark); border-radius: 4px; outline: none; font-size: 0.8rem; box-sizing: border-box;">
                </div>

                <!-- Nama Toko / Username -->
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 4px;">Nama Toko / Username:</label>
                    <input type="text" id="edit-store-name" value="${user.store_name || ''}" style="width: 100%; padding: 8px; border: 2px solid var(--retro-dark); border-radius: 4px; outline: none; font-size: 0.8rem; box-sizing: border-box;">
                </div>

                <!-- No HP / WhatsApp -->
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 4px;">Nomor HP / WhatsApp:</label>
                    <input type="text" id="edit-phone" value="${user.phone_number || user.whatsapp || ''}" style="width: 100%; padding: 8px; border: 2px solid var(--retro-dark); border-radius: 4px; outline: none; font-size: 0.8rem; box-sizing: border-box;" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                </div>

                <!-- Provinsi & Kota -->
                <div style="display: flex; gap: 8px;">
                    <div style="flex: 1;">
                        <label style="font-weight: bold; display: block; margin-bottom: 4px;">Provinsi:</label>
                        <select id="edit-provinsi" required onchange="onEditProvinsiChange()" style="width: 100%; padding: 8px; border: 2px solid var(--retro-dark); border-radius: 4px; outline: none; font-size: 0.8rem; background-color: white; box-sizing: border-box;">
                            <option value="">Memuat data provinsi...</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="font-weight: bold; display: block; margin-bottom: 4px;">Kota / Kabupaten:</label>
                        <select id="edit-kota" required disabled onchange="onEditKotaChange()" style="width: 100%; padding: 8px; border: 2px solid var(--retro-dark); border-radius: 4px; outline: none; font-size: 0.8rem; background-color: white; box-sizing: border-box;">
                            <option value="">-- Pilih Provinsi Dahulu --</option>
                        </select>
                    </div>
                </div>

                <!-- Kecamatan & Kelurahan -->
                <div style="display: flex; gap: 8px;">
                    <div style="flex: 1;">
                        <label style="font-weight: bold; display: block; margin-bottom: 4px;">Kecamatan:</label>
                        <select id="edit-kecamatan" required disabled onchange="onEditKecamatanChange()" style="width: 100%; padding: 8px; border: 2px solid var(--retro-dark); border-radius: 4px; outline: none; font-size: 0.8rem; background-color: white; box-sizing: border-box;">
                            <option value="">-- Pilih Kota/Kabupaten Dahulu --</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="font-weight: bold; display: block; margin-bottom: 4px;">Kelurahan / Desa:</label>
                        <select id="edit-kelurahan" required disabled style="width: 100%; padding: 8px; border: 2px solid var(--retro-dark); border-radius: 4px; outline: none; font-size: 0.8rem; background-color: white; box-sizing: border-box;">
                            <option value="">-- Pilih Kecamatan Dahulu --</option>
                        </select>
                    </div>
                </div>

                <!-- Kode Pos & Koordinat -->
                <div style="display: flex; gap: 8px;">
                    <div style="flex: 1;">
                        <label style="font-weight: bold; display: block; margin-bottom: 4px;">Kode Pos:</label>
                        <input type="text" id="edit-kodepos" inputmode="numeric" maxlength="5" pattern="[0-9]{5}" placeholder="Contoh: 40264" value="${user.address_kodepos || ''}" required style="width: 100%; padding: 8px; border: 2px solid var(--retro-dark); border-radius: 4px; outline: none; font-size: 0.8rem; box-sizing: border-box;">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-weight: bold; display: block; margin-bottom: 4px;">Koordinat Lokasi 📍</label>
                        <input type="text" id="edit-koordinat-display" placeholder="Belum dipilih" readonly style="width: 100%; padding: 8px; border: 2px solid var(--retro-dark); border-radius: 4px; outline: none; font-size: 0.8rem; background-color:#F1F5F9; color:#64748B; box-sizing: border-box;">
                        <input type="hidden" id="edit-lat" value="${user.address_lat || ''}">
                        <input type="hidden" id="edit-lng" value="${user.address_lng || ''}">
                    </div>
                </div>

                <!-- Map Pinpoint -->
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 4px;">Titik Lokasi (Pinpoint untuk Kurir) 📍</label>
                    <p style="font-size: 0.65rem; color: #64748B; margin: -2px 0 8px 0; line-height: 1.3;">Geser pin atau klik pada peta untuk menandai lokasi tepat.</p>
                    <div id="edit-map" style="height: 180px; width: 100%; border: 2.5px solid var(--retro-dark); border-radius: 4px; margin-bottom: 6px; box-sizing: border-box; z-index: 1;"></div>
                    <button type="button" class="btn-retro btn-blue" style="font-size: 0.68rem; padding: 6px 10px; width: 100%; cursor: pointer;" onclick="useEditGeolocation()">Gunakan Lokasi GPS Saya 🛰️</button>
                </div>

                <!-- Alamat Detail -->
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 4px;">Alamat Detail (Penjemputan Kurir):</label>
                    <textarea id="edit-address-detail" required style="width: 100%; padding: 8px; border: 2px solid var(--retro-dark); border-radius: 4px; outline: none; resize: vertical; min-height: 60px; font-size: 0.8rem; font-family: var(--font-body); box-sizing: border-box;">${user.address_detail || ''}</textarea>
                </div>

            </div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 12px; border-top: 1.5px dashed var(--retro-light-gray); padding-top: 10px;">
                <button class="btn-retro btn-green" id="save-profile-btn" style="padding: 8px 16px; font-size: 0.8rem;">Simpan Perubahan 💾</button>
                <button class="btn-retro btn-red" onclick="document.getElementById('edit-profile-modal-overlay').remove()" style="padding: 8px 16px; font-size: 0.8rem;">BATAL ❌</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    initEditWilayahForm(user);

    document.getElementById('save-profile-btn').addEventListener('click', () => {
        const fullName = document.getElementById('edit-full-name').value.trim();
        const storeName = document.getElementById('edit-store-name').value.trim().replace('@', '');
        const phone = document.getElementById('edit-phone').value.trim();
        const detail = document.getElementById('edit-address-detail').value.trim();

        const provSel = document.getElementById('edit-provinsi');
        const kotaSel = document.getElementById('edit-kota');
        const kecSel = document.getElementById('edit-kecamatan');
        const kelSel = document.getElementById('edit-kelurahan');
        const kodepos = document.getElementById('edit-kodepos').value.trim();
        const lat = document.getElementById('edit-lat').value;
        const lng = document.getElementById('edit-lng').value;

        if (fullName === '' || storeName === '' || phone === '' || detail === '') {
            showAlert("Form Belum Lengkap ❌", "Harap isi semua kolom dengan lengkap!");
            return;
        }

        // Validasi wilayah bertingkat
        if (!provSel.value || !kotaSel.value || !kecSel.value || !kelSel.value) {
            showAlert("Alamat Belum Lengkap 📍", "Pilih Provinsi, Kota/Kabupaten, Kecamatan, dan Kelurahan/Desa terlebih dahulu.");
            return;
        }
        // Validasi kode pos (5 digit)
        if (!/^[0-9]{5}$/.test(kodepos)) {
            showAlert("Kode Pos Tidak Valid", "Masukkan kode pos 5 digit sesuai wilayah Anda.");
            document.getElementById('edit-kodepos').focus();
            return;
        }
        // Validasi titik lokasi (pinpoint)
        if (!lat || !lng) {
            showAlert("Titik Lokasi Belum Ditandai 📍", "Geser pin pada peta atau gunakan tombol Lokasi GPS untuk menandai alamat Anda.");
            return;
        }

        const profiles = db.getProfiles();
        const isTaken = profiles.some(p => p.store_name && p.store_name.toLowerCase() === storeName.toLowerCase() && p.id !== currentUserId);
        if (isTaken) {
            showAlert("Nama Toko Sudah Terpakai ❌", "Username/Nama Toko ini sudah digunakan pengguna lain!");
            return;
        }

        user.full_name = fullName;
        user.store_name = storeName;
        user.phone_number = phone;
        user.whatsapp = phone; // set both for compatibility
        user.address_provinsi_id = provSel.value;
        user.address_provinsi = provSel.options[provSel.selectedIndex].text;
        user.address_kota_id = kotaSel.value;
        user.address_kota = kotaSel.options[kotaSel.selectedIndex].text;
        user.address_kecamatan_id = kecSel.value;
        user.address_kecamatan = kecSel.options[kecSel.selectedIndex].text;
        user.address_kelurahan_id = kelSel.value;
        user.address_kelurahan = kelSel.options[kelSel.selectedIndex].text;
        user.address_kodepos = kodepos;
        user.address_lat = lat;
        user.address_lng = lng;
        user.address_detail = detail;

        db.saveProfile(user);

        overlay.remove();
        
        // Reset edit map & marker
        editMap = null;
        editMarker = null;
        editWilayahLoaded = false;
        
        showToast("Profil Disimpan 💾", "Biodata akun Anda berhasil diperbarui reaktif!", "success");

        renderGlobalHeader();

        if (window.toggleLoginSession) {
            window.toggleLoginSession(currentUserId);
        } else if (window.toggleSellerSession) {
            window.toggleSellerSession(currentUserId);
        } else if (window.toggleAdminSession) {
            window.toggleAdminSession(currentUserId);
        } else {
            window.location.reload();
        }
    });
}

let editMap = null, editMarker = null, editWilayahLoaded = false;

async function initEditWilayahForm(user) {
    if (!editWilayahLoaded) {
        editWilayahLoaded = true;
        const provSel = document.getElementById('edit-provinsi');
        if (provSel) {
            try {
                const provinces = await db.wilayah.getProvinces();
                provSel.innerHTML = '<option value="">-- Pilih Provinsi --</option>' +
                    provinces.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            } catch (e) {
                provSel.innerHTML = '<option value="">Gagal memuat data (cek koneksi internet)</option>';
            }
        }
    }

    loadLeafletAndInitEditMap(user);

    // Jika user sudah pernah mengisi wilayah sebelumnya, isi ulang cascade-nya
    if (user && user.address_provinsi_id) {
        try {
            const provSel = document.getElementById('edit-provinsi');
            if (provSel) {
                provSel.value = user.address_provinsi_id;
                await onEditProvinsiChange();
                
                const kotaSel = document.getElementById('edit-kota');
                if (kotaSel && user.address_kota_id) {
                    kotaSel.value = user.address_kota_id;
                    await onEditKotaChange();
                }
                
                const kecSel = document.getElementById('edit-kecamatan');
                if (kecSel && user.address_kecamatan_id) {
                    kecSel.value = user.address_kecamatan_id;
                    await onEditKecamatanChange();
                }
                
                const kelSel = document.getElementById('edit-kelurahan');
                if (kelSel && user.address_kelurahan_id) {
                    kelSel.value = user.address_kelurahan_id;
                }
            }
        } catch (e) { /* abaikan jika gagal, user bisa pilih ulang manual */ }
    }
}

window.onEditProvinsiChange = async function() {
    const provId = document.getElementById('edit-provinsi').value;
    const kotaSel = document.getElementById('edit-kota');
    const kecSel = document.getElementById('edit-kecamatan');
    const kelSel = document.getElementById('edit-kelurahan');

    if (kecSel) {
        kecSel.innerHTML = '<option value="">-- Pilih Kota/Kabupaten Dahulu --</option>';
        kecSel.disabled = true;
    }
    if (kelSel) {
        kelSel.innerHTML = '<option value="">-- Pilih Kecamatan Dahulu --</option>';
        kelSel.disabled = true;
    }

    if (!kotaSel) return;

    if (!provId) {
        kotaSel.innerHTML = '<option value="">-- Pilih Provinsi Dahulu --</option>';
        kotaSel.disabled = true;
        return;
    }

    kotaSel.innerHTML = '<option value="">Memuat...</option>';
    kotaSel.disabled = true;
    try {
        const regencies = await db.wilayah.getRegencies(provId);
        kotaSel.innerHTML = '<option value="">-- Pilih Kota/Kabupaten --</option>' +
            regencies.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
        kotaSel.disabled = false;
    } catch (e) {
        kotaSel.innerHTML = '<option value="">Gagal memuat data</option>';
    }
};

window.onEditKotaChange = async function() {
    const kotaId = document.getElementById('edit-kota').value;
    const kecSel = document.getElementById('edit-kecamatan');
    const kelSel = document.getElementById('edit-kelurahan');

    if (kelSel) {
        kelSel.innerHTML = '<option value="">-- Pilih Kecamatan Dahulu --</option>';
        kelSel.disabled = true;
    }

    if (!kecSel) return;

    if (!kotaId) {
        kecSel.innerHTML = '<option value="">-- Pilih Kota/Kabupaten Dahulu --</option>';
        kecSel.disabled = true;
        return;
    }

    kecSel.innerHTML = '<option value="">Memuat...</option>';
    kecSel.disabled = true;
    try {
        const districts = await db.wilayah.getDistricts(kotaId);
        kecSel.innerHTML = '<option value="">-- Pilih Kecamatan --</option>' +
            districts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        kecSel.disabled = false;
    } catch (e) {
        kecSel.innerHTML = '<option value="">Gagal memuat data</option>';
    }
};

window.onEditKecamatanChange = async function() {
    const kecId = document.getElementById('edit-kecamatan').value;
    const kelSel = document.getElementById('edit-kelurahan');

    if (!kelSel) return;

    if (!kecId) {
        kelSel.innerHTML = '<option value="">-- Pilih Kecamatan Dahulu --</option>';
        kelSel.disabled = true;
        return;
    }

    kelSel.innerHTML = '<option value="">Memuat...</option>';
    kelSel.disabled = true;
    try {
        const villages = await db.wilayah.getVillages(kecId);
        kelSel.innerHTML = '<option value="">-- Pilih Kelurahan/Desa --</option>' +
            villages.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
        kelSel.disabled = false;
    } catch (e) {
        kelSel.innerHTML = '<option value="">Gagal memuat data</option>';
    }
};

function updateEditCoordDisplay(lat, lng) {
    const latInput = document.getElementById('edit-lat');
    const lngInput = document.getElementById('edit-lng');
    const coordDisplay = document.getElementById('edit-koordinat-display');
    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lng;
    if (coordDisplay) coordDisplay.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

window.useEditGeolocation = function() {
    if (!navigator.geolocation) {
        if (typeof showToast === 'function') {
            showToast("Tidak Didukung", "Browser Anda tidak mendukung GPS.", "error");
        } else {
            alert("Browser Anda tidak mendukung GPS.");
        }
        return;
    }
    if (typeof showToast === 'function') {
        showToast("Mencari Lokasi 🛰️", "Mohon izinkan akses lokasi pada browser Anda.", "info");
    }
    navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        if (editMarker && editMap) {
            editMarker.setLatLng([latitude, longitude]);
            editMap.setView([latitude, longitude], 16);
        }
        updateEditCoordDisplay(latitude, longitude);
        if (typeof showToast === 'function') {
            showToast("Lokasi Ditemukan 📍", "Titik lokasi berhasil ditandai pada peta.", "success");
        }
    }, () => {
        if (typeof showToast === 'function') {
            showToast("Gagal Mengambil Lokasi", "Pastikan GPS aktif dan izin lokasi sudah diberikan.", "error");
        } else {
            alert("Gagal mengambil lokasi. Pastikan GPS aktif.");
        }
    }, { enableHighAccuracy: true, timeout: 10000 });
};

function loadLeafletAndInitEditMap(user) {
    if (typeof L !== 'undefined') {
        initEditMap(user);
        return;
    }

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
        script.onload = () => {
            initEditMap(user);
        };
        document.head.appendChild(script);
    }
}

function initEditMap(user) {
    if (editMap || typeof L === 'undefined') return;
    
    const mapContainer = document.getElementById('edit-map');
    if (!mapContainer) return;

    const defaultLatLng = [-6.9147, 107.6098]; // Bandung
    editMap = L.map('edit-map').setView(defaultLatLng, 6);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(editMap);

    const existingLat = user && user.address_lat ? parseFloat(user.address_lat) : NaN;
    const existingLng = user && user.address_lng ? parseFloat(user.address_lng) : NaN;
    
    const startLatLng = (!isNaN(existingLat) && !isNaN(existingLng)) ? [existingLat, existingLng] : defaultLatLng;
    if (!isNaN(existingLat) && !isNaN(existingLng)) {
        editMap.setView(startLatLng, 16);
    }
    updateEditCoordDisplay(startLatLng[0], startLatLng[1]);

    editMarker = L.marker(startLatLng, { draggable: true }).addTo(editMap);
    
    editMarker.on('dragend', () => {
        const ll = editMarker.getLatLng();
        updateEditCoordDisplay(ll.lat, ll.lng);
    });
    
    editMap.on('click', (e) => {
        editMarker.setLatLng(e.latlng);
        updateEditCoordDisplay(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => {
        if (editMap) editMap.invalidateSize();
    }, 300);
}

// 5. Fungsi Utility Popups
function closeAllHeaderPopups() {
    const dropdown = document.getElementById('global-profile-dropdown');
    if (dropdown) dropdown.remove();
    const popout = document.getElementById('global-cart-popout');
    if (popout) popout.remove();
    const notifPanel = document.getElementById('global-notif-panel');
    if (notifPanel) {
        notifPanel.remove();
        document.removeEventListener('click', _closeNotifOnOutside);
    }
}

// Tutup popups ketika klik di luar area
document.addEventListener('click', () => {
    closeAllHeaderPopups();
});

function getSimulatedTrackingHistory(order, shippedAtStr, trackingNumber, buyerName) {
    const shippedAt = new Date(shippedAtStr);
    const now = new Date();
    const diffMs = now - shippedAt;
    const diffHours = diffMs / (1000 * 60 * 60);

    const steps = [
        {
            time: new Date(shippedAt.getTime()).toISOString(),
            status: "MANIFESTED",
            desc: `Paket telah diserahkan ke kurir J&T dengan nomor resi ${trackingNumber}.`
        }
    ];

    if (diffHours >= 6) {
        steps.push({
            time: new Date(shippedAt.getTime() + 6 * 3600000).toISOString(),
            status: "ON_PROCESS",
            desc: "Paket telah berangkat dari gudang sortir asal (Transit Hub)."
        });
    }
    if (diffHours >= 24) {
        steps.push({
            time: new Date(shippedAt.getTime() + 24 * 3600000).toISOString(),
            status: "ON_PROCESS",
            desc: "Paket dalam proses transit antar kota/pulau menuju wilayah tujuan."
        });
    }
    if (diffHours >= 48) {
        steps.push({
            time: new Date(shippedAt.getTime() + 48 * 3600000).toISOString(),
            status: "RECEIVED_AT_DESTINATION",
            desc: "Paket tiba di gudang sortir kota tujuan (Destination Hub)."
        });
    }
    if (diffHours >= 72) {
        steps.push({
            time: new Date(shippedAt.getTime() + 72 * 3600000).toISOString(),
            status: "ON_PROCESS",
            desc: "Paket telah disortir dan menuju kecamatan tujuan."
        });
    }
    if (diffHours >= 96) {
        steps.push({
            time: new Date(shippedAt.getTime() + 96 * 3600000).toISOString(),
            status: "WITH_COURIER",
            desc: `Paket sedang dibawa oleh kurir J&T (Sprinter) menuju alamat pembeli.`
        });
    }
    if (diffHours >= 120) {
        steps.push({
            time: new Date(shippedAt.getTime() + 120 * 3600000).toISOString(),
            status: "DELIVERED",
            desc: `Paket berhasil diterima oleh @${buyerName}. Status: Diterima.`
        });
    }

    return { steps, currentStatus: steps[steps.length - 1].status, isDelivered: diffHours >= 120 };
}

// ============================================================
// MODAL DETAIL TRANSAKSI — Bisa dibuka oleh Buyer DAN Seller
// ============================================================
function openOrderDetailModal(orderId) {
    const order = db.getOrderById(orderId);
    if (!order) { showAlert('Tidak Ditemukan ❌', 'Data pesanan tidak ditemukan.'); return; }

    // Auto status update: shipping -> delivered after 5x24 jam (estimasi realistis pengiriman seluruh Indonesia)
    if (order.status === 'shipping' && order.shipped_at) {
        const shippedAt = new Date(order.shipped_at);
        const now = new Date();
        const diffMs = now - shippedAt;
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours >= 120) {
            db.updateOrderStatus(orderId, 'delivered');
            order.status = 'delivered'; // Update in local reference
            order.delivered_at = new Date(shippedAt.getTime() + 120 * 3600000).toISOString();
        }
    }

    const currentUserId = db.getCurrentUserId();
    const currentUser = currentUserId ? db.getProfileById(currentUserId) : null;
    const isBuyer  = currentUserId === order.buyer_id;
    const isSeller = currentUserId === order.seller_id;
    const isAdmin  = currentUser && currentUser.is_admin === true;

    const product  = db.getProductById(order.product_id);
    const buyer    = db.getProfileById(order.buyer_id);
    const seller   = db.getProfileById(order.seller_id);
    const hasReview = db.hasUserReviewedOrder(orderId);

    const price    = Number(order.price_deal || order.price || 0);
    const shipping = Number(order.shipping_cost || 0);
    const adminFee = Number(order.admin_fee || 0);
    const total    = Number(order.total_payment || (price + shipping + adminFee));
    const imgUrl   = order.product_image_url || (product ? product.image_url : 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=100');
    const title    = order.product_title || (product ? product.title : 'Produk');
    const qty      = order.quantity || 1;
    const snapshotDescription = order.product_description || '';
    const dateStr  = new Date(order.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });

    // === STATUS STEPPER ===
    const STEPS = [
        { key: 'waiting_payment', label: 'Menunggu\nPembayaran', icon: '💳' },
        { key: 'to_ship',         label: 'Dikemas\nPenjual',    icon: '📦' },
        { key: 'shipping',        label: 'Sedang\nDikirim',     icon: '🚚' },
        { key: 'delivered',       label: 'Tiba di\nPembeli',    icon: '📬' },
        { key: 'completed',       label: 'Selesai',             icon: '🎉' },
    ];
    const statusOrder = ['waiting_payment','to_ship','shipping','delivered','completed','disputed'];
    const currentStepIdx = statusOrder.indexOf(order.status);
    const isDisputed = order.status === 'disputed';

    const stepperHTML = isDisputed
        ? `<div style="text-align:center;background:#FEF2F2;border:2px solid var(--mario-red);border-radius:6px;padding:10px;font-size:0.8rem;color:var(--mario-red);font-weight:bold;">⚠️ Pesanan dalam SENGKETA / Komplain — Admin sedang menangani</div>`
        : `<div style="display:flex;align-items:flex-start;gap:0;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;">
            ${STEPS.map((s, i) => {
                const stepIdx = statusOrder.indexOf(s.key);
                const isDone    = currentStepIdx > stepIdx;
                const isCurrent = currentStepIdx === stepIdx;
                const lineColor = isDone ? 'var(--mario-green)' : '#E2E8F0';
                const circleStyle = isDone
                    ? 'background:var(--mario-green);border-color:var(--mario-green);color:white;'
                    : isCurrent
                        ? 'background:var(--mario-blue);border-color:var(--mario-blue);color:white;box-shadow:0 0 0 3px rgba(0,47,190,0.2);'
                        : 'background:#F1F5F9;border-color:#CBD5E1;color:#94A3B8;';
                const labelStyle = isCurrent
                    ? 'color:var(--mario-blue);font-weight:bold;'
                    : isDone ? 'color:var(--mario-green);' : 'color:#94A3B8;';
                const lineHTML = i < STEPS.length - 1
                    ? `<div style="flex:1;height:2px;background:${lineColor};margin-top:16px;min-width:12px;"></div>` : '';
                return `
                    <div style="display:flex;flex-direction:column;align-items:center;min-width:54px;">
                        <div style="width:32px;height:32px;border-radius:50%;border:2.5px solid;display:flex;align-items:center;justify-content:center;font-size:0.9rem;transition:all 0.2s;${circleStyle}">${isDone ? '✓' : s.icon}</div>
                        <div style="font-size:0.55rem;text-align:center;margin-top:4px;white-space:pre-line;${labelStyle}">${s.label}</div>
                    </div>
                    ${lineHTML}
                `;
            }).join('')}
        </div>`;

    // === PAYMENT DEADLINE WARNING FOR AUCTIONS & SALES ===
    let paymentDeadlineHTML = '';
    if (order.status === 'waiting_payment') {
        const isLelang = product && product.transaction_type === 'lelang';
        const limitHrs = isLelang ? 24 : 6;
        const limitTime = new Date(new Date(order.created_at).getTime() + limitHrs * 60 * 60 * 1000);
        const now = new Date();
        const diffMs = limitTime - now;
        
        if (diffMs > 0) {
            const diffHrs = Math.floor(diffMs / (3600 * 1000));
            const diffMins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
            paymentDeadlineHTML = `
                <div style="background:#FFFDF5;border:1.5px solid var(--mario-blue);border-radius:6px;padding:10px;font-size:0.75rem;">
                    <div style="font-weight:bold;color:var(--mario-blue);margin-bottom:4px;">⏳ Sisa Waktu Pembayaran</div>
                    <div>Waktu tersisa bagi pembeli untuk melakukan pembayaran: <strong>${diffHrs} jam ${diffMins} menit</strong>.</div>
                </div>`;
        } else {
            if (isSeller) {
                paymentDeadlineHTML = `
                    <div style="background:#FEF2F2;border:1.5px solid var(--mario-red);border-radius:6px;padding:10px;font-size:0.75rem;color:var(--mario-red);">
                        <div style="font-weight:bold;margin-bottom:4px;">⚠️ Batas Waktu Pembayaran Habis</div>
                        <div>Pembeli belum membayar pesanan ini melebihi batas waktu <strong>${limitHrs} jam</strong>. Anda berhak membatalkan pesanan ini untuk mengembalikan produk ke status berakhir.</div>
                    </div>`;
            } else if (isBuyer) {
                paymentDeadlineHTML = `
                    <div style="background:#FEF2F2;border:1.5px solid var(--mario-red);border-radius:6px;padding:10px;font-size:0.75rem;color:var(--mario-red);">
                        <div style="font-weight:bold;margin-bottom:4px;">⚠️ Batas Waktu Pembayaran Habis</div>
                        <div>Batas waktu pembayaran Anda (<strong>${limitHrs} jam</strong>) telah berakhir. Penjual dapat membatalkan pesanan ini sewaktu-waktu. Segera lakukan pembayaran jika ingin melanjutkan transaksi.</div>
                    </div>`;
            } else {
                paymentDeadlineHTML = `
                    <div style="background:#FEF2F2;border:1.5px solid var(--mario-red);border-radius:6px;padding:10px;font-size:0.75rem;color:var(--mario-red);">
                        <div style="font-weight:bold;margin-bottom:4px;">⚠️ Batas Waktu Pembayaran Habis</div>
                        <div>Batas waktu pembayaran pembeli (<strong>${limitHrs} jam</strong>) telah berakhir.</div>
                    </div>`;
            }
        }
    }

    // === TRACKING INFO (hanya tampil jika sudah dikirim/setelah to_ship) ===
    let trackingHTML = '';
    if (order.tracking_number && order.status !== 'to_ship' && order.shipped_at) {
        const buyerStoreName = buyer ? buyer.store_name : 'buyer';
        const tracking = getSimulatedTrackingHistory(order, order.shipped_at, order.tracking_number, buyerStoreName);
        
        let timelineStepsHTML = tracking.steps.map(step => {
            const stepTime = new Date(step.time).toLocaleDateString('id-ID', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            return `
                <div style="display: flex; gap: 8px; margin-bottom: 10px; position: relative;">
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${step.status === 'DELIVERED' ? 'var(--mario-green)' : 'var(--mario-blue)'}; border: 1.5px solid var(--retro-dark);"></div>
                        <div style="flex-grow: 1; width: 2px; background: #CBD5E1; margin-top: 4px;"></div>
                    </div>
                    <div style="font-size: 0.7rem; line-height: 1.2; text-align: left;">
                        <div style="color: #64748B; font-weight: bold; font-size: 0.6rem;">${stepTime} - [${step.status}]</div>
                        <div style="color: var(--retro-dark);">${step.desc}</div>
                    </div>
                </div>
            `;
        }).join('');

        trackingHTML = `
            <div style="background:#FFFDF5;border:2.5px solid var(--retro-dark);border-radius:6px;padding:12px;font-size:0.75rem;box-shadow: 2px 2px 0px var(--retro-dark);">
                <div style="font-weight:bold;color:var(--mario-blue);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                    <span>🚚 Lacak Pengiriman (${(order.shipping_courier || 'JNT').toUpperCase()})</span>
                    <button onclick="navigator.clipboard.writeText('${order.tracking_number}');showToast('Disalin ✓','Nomor resi tersalin ke clipboard','success')" style="background:white;border:2.5px solid var(--retro-dark);border-radius:4px;padding:2px 6px;font-size:0.6rem;cursor:pointer;font-weight:bold;box-shadow:1px 1px 0px var(--retro-dark);">Resi: ${order.tracking_number} 📋</button>
                </div>
                <div style="margin-top: 10px; max-height: 180px; overflow-y: auto; padding-right: 4px;">
                    ${timelineStepsHTML}
                </div>
                ${!tracking.isDelivered ? `
                    <div style="background:#EFF6FF; border: 1.5px dashed var(--mario-blue); border-radius: 4px; padding: 6px; font-size: 0.65rem; color: #1E40AF; margin-top: 8px; text-align: center;">
                        ⏳ Paket dalam perjalanan. Tombol "Selesai" aktif setelah paket berstatus <strong>Diterima</strong> (estimasi maks. 5 hari).
                    </div>
                ` : `
                    <div style="background:#ECFDF5; border: 1.5px dashed var(--mario-green); border-radius: 4px; padding: 6px; font-size: 0.65rem; color: #065F46; margin-top: 8px; text-align: center;">
                        🎉 Paket telah sampai! Silakan konfirmasi terima barang.<br>
                        ⏰ Jika dalam <strong>2x24 jam</strong> tidak dikonfirmasi/komplain, pesanan akan <strong>diselesaikan otomatis</strong> oleh sistem dan dana diteruskan ke penjual.
                    </div>
                `}
            </div>`;
    }

    // === SELLER ONLY: Terima Pesanan (mulai dikemas) — wajib sebelum input resi ===
    let sellerAcceptHTML = '';
    if ((isSeller || isAdmin) && order.status === 'to_ship' && !order.seller_accepted_at) {
        sellerAcceptHTML = `
            <div style="background:#FFFBEB;border:2px dashed var(--mario-yellow);border-radius:6px;padding:10px;">
                <div style="font-size:0.75rem;font-weight:bold;color:#92400E;margin-bottom:6px;">📥 Pesanan Baru — Konfirmasi Penerimaan</div>
                <div style="font-size:0.65rem;color:#64748B;margin-bottom:8px;">Klik tombol di bawah jika Anda menerima & akan mengemas pesanan ini. Setelah dikonfirmasi, pembeli tidak dapat membatalkan pesanan secara sepihak.</div>
                <button class="btn-retro btn-green" onclick="acceptOrderFromModal('${orderId}')" style="width:100%;font-size:0.78rem;padding:8px;">✅ Terima Pesanan & Mulai Kemas</button>
            </div>`;
    }

    // === SELLER ONLY: Input Resi (hanya tampil jika sudah diterima & belum ada resi) ===
    let sellerResiHTML = '';
    if ((isSeller || isAdmin) && order.status === 'to_ship' && order.seller_accepted_at && !order.tracking_number) {
        sellerResiHTML = `
            <div style="background:#EFF6FF;border:2px dashed var(--mario-blue);border-radius:6px;padding:10px;">
                <div style="font-size:0.75rem;font-weight:bold;color:var(--mario-blue);margin-bottom:6px;">📦 Input Nomor Resi Pengiriman</div>
                <div style="font-size:0.65rem;color:#64748B;margin-bottom:6px;">⚠️ Wajib videokan proses packing barang sebelum mengirim sebagai bukti keselamatan transaksi.</div>
                <div style="display:flex;gap:6px;">
                    <input type="text" id="modal-resi-input-${orderId}" placeholder="Masukkan No. Resi (JNT/Pos/dll)" style="flex:1;padding:7px;border:2px solid var(--retro-dark);border-radius:4px;font-size:0.75rem;outline:none;">
                    <button class="btn-retro btn-green" onclick="handleModalResiSubmit('${orderId}')" style="font-size:0.72rem;padding:7px 12px;white-space:nowrap;">Kirim 🚚</button>
                </div>
            </div>`;
    }

    // === BUYER ONLY: Konfirmasi Terima + Komplain ===
    let buyerActionsHTML = '';
    if (isBuyer || isAdmin) {
        const canConfirm = order.status === 'delivered';
        const canComplain = ['shipping','delivered'].includes(order.status);
        const canPay = order.status === 'waiting_payment';

        if (canPay) {
            buyerActionsHTML += `<button class="btn-retro btn-green" onclick="openSingleOrderPaymentModal('${orderId}', ${total})" style="flex:1;font-size:0.78rem;padding:9px;">💳 Bayar Sekarang</button>`;
        }
        if (canConfirm) {
            buyerActionsHTML += `<button class="btn-retro btn-green" onclick="confirmOrderReceivedFromModal('${orderId}')" style="flex:1;font-size:0.78rem;padding:9px;">✅ Konfirmasi Terima</button>`;
        } else if (order.status !== 'completed' && order.status !== 'disputed' && !canPay) {
            buyerActionsHTML += `<button class="btn-retro" disabled style="flex:1;font-size:0.78rem;padding:9px;opacity:0.4;cursor:not-allowed;background:#94A3B8;border:2px solid #CBD5E1;border-radius:4px;">✅ Konfirmasi Terima</button>`;
        }
        if (canComplain && !isAdmin) {
            buyerActionsHTML += `<button class="btn-retro btn-red" onclick="openComplainModal('${orderId}')" style="font-size:0.72rem;padding:9px 12px;">⚠️ Komplain</button>`;
        }
        if (buyerActionsHTML) {
            buyerActionsHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap;">${buyerActionsHTML}</div>`;
        }
    }

    // === CANCEL ORDER BUTTON ===
    const canCancelBuyer  = isBuyer  && (order.status === 'waiting_payment' || (order.status === 'to_ship' && !order.seller_accepted_at));
    const canCancelSeller = isSeller && ['waiting_payment','to_ship'].includes(order.status);
    const canCancelAdmin  = isAdmin  && ['waiting_payment','to_ship','shipping'].includes(order.status);
    const showCancel = canCancelBuyer || canCancelSeller || canCancelAdmin;
    const cancelHTML = showCancel
        ? `<button class="btn-retro" onclick="openCancelOrderModal('${orderId}')" style="width:100%;font-size:0.72rem;padding:7px;background:white;color:#DC2626;border:2px solid #DC2626;border-radius:4px;cursor:pointer;">🚫 Batalkan Pesanan</button>`
        : (isBuyer && order.status === 'to_ship' && order.seller_accepted_at
            ? `<div style="font-size:0.65rem;color:#64748B;text-align:center;background:#F1F5F9;border-radius:4px;padding:6px;">💬 Pesanan sedang dikemas penjual — hubungi penjual via chat untuk membatalkan</div>`
            : (order.status === 'shipping' && isBuyer
                ? `<div style="font-size:0.65rem;color:#64748B;text-align:center;background:#F1F5F9;border-radius:4px;padding:6px;">💬 Barang sudah dikirim — hubungi penjual via chat untuk membatalkan</div>`
                : ''));

    // === REVIEW FORM (buyer, setelah completed) ===
    let reviewHTML = '';
    if (isBuyer && order.status === 'completed') {
        if (hasReview) {
            const rev = db.getReviews().find(r => r.order_id === orderId);
            const stars = '⭐'.repeat(rev ? rev.rating : 5);
            reviewHTML = `
                <div style="background:#FFFBEB;border:1.5px solid var(--mario-yellow);border-radius:6px;padding:10px;font-size:0.75rem;">
                    <div style="font-weight:bold;margin-bottom:4px;">⭐ Ulasan Anda</div>
                    <div>${stars} — "${rev ? rev.text : ''}"</div>
                    <div style="font-size:0.62rem;color:#64748B;margin-top:4px;">Ulasan telah dikirim. Terima kasih!</div>
                </div>`;
        } else {
            reviewHTML = `
                <div style="background:#FFFBEB;border:2px dashed var(--mario-yellow);border-radius:6px;padding:10px;">
                    <div style="font-size:0.75rem;font-weight:bold;color:#92400E;margin-bottom:8px;">⭐ Tulis Ulasan Produk</div>
                    <div style="display:flex;gap:4px;margin-bottom:8px;" id="star-row-${orderId}">
                        ${[1,2,3,4,5].map(s => `<span style="font-size:1.5rem;cursor:pointer;transition:transform 0.1s;" data-val="${s}" onclick="selectStar('${orderId}',${s})" onmouseover="hoverStar('${orderId}',${s})" onmouseout="resetStarHover('${orderId}')">☆</span>`).join('')}
                    </div>
                    <input type="hidden" id="star-val-${orderId}" value="0">
                    <textarea id="review-text-${orderId}" placeholder="Ceritakan pengalaman belanja Anda..." style="width:100%;padding:7px;border:2px solid var(--retro-dark);border-radius:4px;font-size:0.75rem;resize:vertical;min-height:54px;outline:none;font-family:var(--font-body);box-sizing:border-box;"></textarea>
                    <div style="margin-top:6px;">
                        <label style="font-size:0.65rem;color:#64748B;display:flex;align-items:center;gap:6px;cursor:pointer;">
                            <input type="file" id="review-photo-${orderId}" accept="image/*" style="display:none;" onchange="previewReviewPhoto('${orderId}')">
                            <span style="background:#F1F5F9;border:1.5px solid #CBD5E1;border-radius:4px;padding:4px 8px;font-size:0.65rem;">📷 Tambah Foto (opsional)</span>
                            <span id="review-photo-name-${orderId}" style="font-size:0.62rem;color:#64748B;">Belum ada file</span>
                        </label>
                        <div id="review-photo-preview-${orderId}"></div>
                    </div>
                    <button class="btn-retro btn-yellow" onclick="submitReview('${orderId}','${order.product_id}','${order.seller_id}')" style="width:100%;margin-top:6px;font-size:0.75rem;padding:8px;color:var(--retro-dark);">Kirim Ulasan ⭐</button>
                </div>`;

        }
    }

    // === ALAMAT PENGIRIMAN ===
    let shippingAddrHTML = '';
    if (order.recipient_name || order.shipping_address) {
        shippingAddrHTML = `<div style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:6px;padding:10px 12px;margin-bottom:10px;position:relative;">
            <div style="font-family:var(--font-retro);font-size:0.7rem;font-weight:700;color:var(--mario-blue);margin-bottom:4px;">📍 Alamat Pengiriman</div>
            ${order.recipient_name ? `<div style="font-weight:700;font-size:0.78rem;">${order.recipient_name}</div>` : ''}
            ${order.recipient_phone ? `<div style="font-size:0.72rem;color:#475569;">${order.recipient_phone}</div>` : ''}
            ${order.shipping_address ? `<div style="font-size:0.72rem;color:#475569;margin-top:2px;line-height:1.4;">${order.shipping_address}</div>` : ''}
            ${order.address_patokan ? `<div style="font-size:0.65rem;color:#94A3B8;font-style:italic;margin-top:2px;">📍 ${order.address_patokan}</div>` : ''}
            ${isBuyer && order.status === 'waiting_payment' ? `<button onclick="window.openChangeAddressForOrderModal('${orderId}')" style="margin-top:8px;background:#EFF6FF;border:1.5px solid var(--mario-blue);border-radius:4px;padding:4px 8px;font-size:0.68rem;color:var(--mario-blue);font-weight:bold;cursor:pointer;width:100%;box-sizing:border-box;">✏️ Ubah Alamat Pengiriman</button>` : ''}
        </div>`;
    } else {
        shippingAddrHTML = `<div style="background:#FEF9C3;border:1.5px dashed #FCD34D;border-radius:6px;padding:10px;font-size:0.72rem;color:#92400E;margin-bottom:10px;">
            <div style="margin-bottom:6px;">⚠️ Alamat pengiriman belum diisi oleh pembeli.</div>
            ${isBuyer && order.status === 'waiting_payment' ? `<button class="btn-retro btn-yellow" onclick="window.openChangeAddressForOrderModal('${orderId}')" style="font-size:0.72rem;padding:6px 12px;width:100%;color:var(--retro-dark);box-sizing:border-box;font-weight:bold;">📍 Pilih Alamat Pengiriman</button>` : ''}
        </div>`;
    }

    // === BUYER NOTES ===
    const notesHTML = order.buyer_notes
        ? `<div style="background:#F8FAFC;border:1.5px dashed #CBD5E1;border-radius:6px;padding:8px;font-size:0.72rem;"><span style="font-weight:bold;">📝 Catatan dari Pembeli:</span> ${order.buyer_notes}</div>`
        : '';

    // === CHAT BUTTON ===
    let chatTargetId = null, chatTargetLabel = '';
    if (isBuyer) { chatTargetId = order.seller_id; chatTargetLabel = `Chat Penjual (@${seller ? seller.store_name : '?'})`; }
    else if (isSeller) { chatTargetId = order.buyer_id; chatTargetLabel = `Chat Pembeli (@${buyer ? buyer.store_name : '?'})`; }

    // Konteks pesanan untuk dikirim otomatis saat chat dibuka
    const orderDateStr = new Date(order.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
    const orderContext = `📦 *[Konteks Pesanan]*\n` +
        `No. Pesanan : ${order.id}\n` +
        `Produk      : ${order.product_title || (product ? product.title : '-')}\n` +
        `Tanggal     : ${orderDateStr}\n` +
        `Total       : Rp${(order.total_payment||order.price_deal||0).toLocaleString('id-ID')}\n` +
        `Status      : ${order.status}`;

    const chatBtnHTML = chatTargetId
        ? `<button class="btn-retro btn-white" id="order-detail-chat-btn" style="font-size:0.75rem;padding:8px;width:100%;border-color:var(--mario-blue);color:var(--mario-blue);">💬 ${chatTargetLabel}</button>`
        : '';

    // === PAID AT DATE ===
    const paidAtStr = order.paid_at
        ? new Date(order.paid_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
        : null;

    // === BUILD MODAL ===
    const existingOverlay = document.getElementById('order-detail-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'order-detail-overlay';
    overlay.dataset.orderId = orderId;
    overlay.style.zIndex = '10010';

    overlay.innerHTML = `
        <div class="modal-box" style="max-width:440px;padding:0;overflow:hidden;text-align:left;max-height:92vh;display:flex;flex-direction:column;">
            <!-- Header -->
            <div style="background:var(--mario-blue);color:white;padding:12px 16px;border-bottom:3px solid var(--retro-dark);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                <div>
                    <div style="font-family:var(--font-retro);font-size:0.95rem;font-weight:700;text-shadow:1px 1px 0px var(--retro-dark);">📋 Detail Pesanan</div>
                    <div style="font-size:0.65rem;opacity:0.85;font-family:var(--font-retro);">${orderId} • ${dateStr}</div>
                </div>
                <button onclick="document.getElementById('order-detail-overlay').remove()" style="background:rgba(255,255,255,0.2);color:white;border:2px solid white;border-radius:4px;width:28px;height:28px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">✖</button>
            </div>

            <!-- Scrollable Content -->
            <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding:14px;">
                <!-- Status Stepper -->
                ${stepperHTML}

                <!-- Produk -->
                <div style="display:flex;gap:10px;align-items:flex-start;background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:6px;padding:10px;">
                    <img src="${imgUrl}" style="width:54px;height:54px;object-fit:cover;border-radius:4px;border:1.5px solid var(--retro-dark);flex-shrink:0;">
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:bold;font-size:0.8rem;line-height:1.3;">${title} ${qty > 1 ? `<span style="color:var(--mario-blue);">x${qty}</span>` : ''}</div>
                        <div style="font-size:0.65rem;color:#64748B;margin-top:2px;">🏪 ${order.seller_name || '@seller'} → 👤 ${order.buyer_name || '@buyer'}</div>
                        ${product ? `<a href="product.html?id=${product.id}" style="font-size:0.62rem;color:var(--mario-blue);text-decoration:none;">Lihat Produk →</a>` : ''}
                    </div>
                </div>
                ${snapshotDescription ? `
                <div style="background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:6px;padding:8px 10px;font-size:0.68rem;color:#475569;">
                    <div style="font-weight:bold;font-size:0.65rem;color:#94A3B8;margin-bottom:2px;">📝 Deskripsi Produk (saat pesanan dibuat)</div>
                    ${snapshotDescription}
                </div>
                ` : ''}

                <!-- Alamat Pengiriman -->
                ${shippingAddrHTML}

                <!-- Rincian Harga -->
                <div style="background:#FFFDF5;border:1.5px solid var(--retro-dark);border-radius:6px;padding:10px;font-size:0.75rem;">
                    <div style="font-weight:bold;margin-bottom:6px;font-family:var(--font-retro);">💰 Rincian Pembayaran</div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;"><span>Harga Barang</span><span style="font-family:var(--font-number);">Rp${price.toLocaleString('id-ID')}</span></div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;"><span>Ongkos Kirim (${(order.shipping_courier || 'JNT').toUpperCase()})</span><span style="font-family:var(--font-number);">Rp${shipping.toLocaleString('id-ID')}</span></div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;"><span>Biaya Admin Rekber</span><span style="font-family:var(--font-number);">Rp${adminFee.toLocaleString('id-ID')}</span></div>
                    <div style="border-top:1.5px dashed var(--retro-dark);margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-weight:bold;">
                        <span style="font-family:var(--font-retro);">TOTAL DIBAYAR</span>
                        <span style="font-family:var(--font-number);color:var(--mario-red);font-size:0.9rem;">Rp${total.toLocaleString('id-ID')}</span>
                    </div>
                    ${paidAtStr ? `<div style="font-size:0.62rem;color:#64748B;margin-top:4px;">✅ Dibayar pada: ${paidAtStr}</div>` : ''}
                </div>

                ${notesHTML}
                ${trackingHTML}
                ${paymentDeadlineHTML}
                ${sellerAcceptHTML}
                ${sellerResiHTML}
                ${buyerActionsHTML}
                ${chatBtnHTML}
                ${cancelHTML}
                ${reviewHTML}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    const orderChatBtn = document.getElementById('order-detail-chat-btn');
    if (orderChatBtn) {
        orderChatBtn.addEventListener('click', () => {
            overlay.remove(); // Close order detail modal
            openPrivateChat(chatTargetId, orderContext);
        });
    }
}

// Cancel Order Modal
function openCancelOrderModal(orderId) {
    const REASONS = ['Stok habis / produk tidak tersedia','Perubahan harga/kesepakatan','Salah order / klik tidak sengaja','Ingin ganti produk lain','Penjual tidak responsif','Lainnya'];
    const cancelOverlay = document.createElement('div');
    cancelOverlay.className = 'modal-overlay';
    cancelOverlay.id = 'cancel-order-modal';
    cancelOverlay.style.zIndex = '10015';
    cancelOverlay.innerHTML = `
        <div class="modal-box" style="max-width:360px;text-align:left;">
            <div style="font-family:var(--font-retro);font-size:0.95rem;font-weight:bold;color:#DC2626;margin-bottom:8px;border-bottom:2px dashed var(--retro-light-gray);padding-bottom:8px;">🚫 Batalkan Pesanan</div>
            <div style="font-size:0.75rem;margin-bottom:8px;">Pesanan: <strong>${orderId}</strong></div>
            <div style="font-size:0.72rem;color:#64748B;margin-bottom:8px;background:#FEF2F2;border-radius:4px;padding:7px;">⚠️ Pembatalan akan mengembalikan produk ke katalog umum. Tindakan ini tidak bisa diurungkan.</div>
            <div style="font-size:0.75rem;font-weight:bold;margin-bottom:4px;">Alasan Pembatalan:</div>
            <select id="cancel-reason-select" style="width:100%;padding:7px;border:2px solid var(--retro-dark);border-radius:4px;font-size:0.75rem;margin-bottom:10px;">
                ${REASONS.map(r => `<option>${r}</option>`).join('')}
            </select>
            <div style="display:flex;gap:8px;">
                <button class="btn-retro btn-red" onclick="submitCancelOrder('${orderId}')" style="flex:1;font-size:0.78rem;">Ya, Batalkan</button>
                <button class="btn-retro btn-white" onclick="document.getElementById('cancel-order-modal').remove()" style="font-size:0.78rem;padding:8px 14px;">Tidak</button>
            </div>
        </div>
    `;
    document.body.appendChild(cancelOverlay);
    cancelOverlay.addEventListener('click', e => { if (e.target === cancelOverlay) cancelOverlay.remove(); });
}

function submitCancelOrder(orderId) {
    const reason = document.getElementById('cancel-reason-select')?.value || 'Tidak disebutkan';
    const currentUserId = db.getCurrentUserId();
    const order = db.getOrderById(orderId);
    const result = db.cancelOrder(orderId, currentUserId, reason);
    if (!result) {
        showAlert('Tidak Bisa Dibatalkan ❌', 'Pesanan ini tidak dapat dibatalkan sepihak (sudah diterima/dikemas penjual, sedang dikirim, atau sudah selesai). Silakan hubungi pihak terkait via chat.');
        document.getElementById('cancel-order-modal')?.remove();
        return;
    }
    if (order) {
        const notifTarget = currentUserId === order.buyer_id ? order.seller_id : order.buyer_id;
        db.sendPrivateChat('admin-demo', notifTarget, `🚫 Pesanan (${orderId}) telah DIBATALKAN oleh ${currentUserId === order.buyer_id ? 'pembeli' : 'penjual'}. Alasan: ${reason}`);
    }
    document.getElementById('cancel-order-modal')?.remove();
    document.getElementById('order-detail-overlay')?.remove();
    if (typeof filterBuyerTransactions === 'function') {
        filterBuyerTransactions(currentBuyerTxFilter);
    }
    showAlert('Pesanan Dibatalkan ✅', `Pesanan ${orderId} berhasil dibatalkan. Produk kembali tersedia di katalog.`);
}

// Help & Support Modal
function openHelpModal() {
    closeAllHeaderPopups();
    const currentUserId = db.getCurrentUserId();
    const user = currentUserId ? db.getProfileById(currentUserId) : null;
    if (!user) { showAlert('Login Dulu ⚠️', 'Silakan login untuk mengakses fitur bantuan.'); return; }

    const FAQ = [
        { q: 'Bagaimana cara membeli produk?', a: 'Klik produk → pilih ongkir → klik Beli → bayar via QRIS/Transfer → tunggu penjual mengemas.' },
        { q: 'Berapa lama waktu pembayaran?', a: 'Setelah checkout, Anda punya 6 jam untuk bayar. Lewat dari itu, pesanan otomatis dibatalkan.' },
        { q: 'Bagaimana cara tracking paket?', a: 'Buka Histori Transaksi → klik pesanan → nomor resi tampil setelah penjual menginput resi.' },
        { q: 'Apa itu Rekening Bersama (Rekber)?', a: 'Dana Anda aman dipegang RetroHub, baru dicairkan ke penjual setelah Anda konfirmasi terima barang.' },
        { q: 'Bagaimana jika barang tidak sesuai?', a: 'Buka detail pesanan → klik "Ajukan Komplain" → isi alasan. Admin akan menangani dalam 1x24 jam.' },
        { q: 'Apakah bisa jadi seller?', a: 'Ya! Daftar sebagai seller, proses verifikasi membutuhkan KTP dan foto selfie.' },
        { q: 'Bagaimana cara mengikuti lelang?', a: 'Buka produk lelang → klik "Pasang Bid" → masukkan nominal. Bid tertinggi menang saat waktu habis.' },
    ];

    const helpOverlay = document.createElement('div');
    helpOverlay.className = 'modal-overlay';
    helpOverlay.id = 'help-modal';
    helpOverlay.style.zIndex = '10010';
    helpOverlay.innerHTML = `
        <div class="modal-box" style="max-width:420px;padding:0;overflow:hidden;text-align:left;max-height:90vh;display:flex;flex-direction:column;">
            <div style="background:linear-gradient(135deg,var(--mario-blue),#1a3fa0);color:white;padding:14px 18px;border-bottom:3px solid var(--retro-dark);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                <div>
                    <div style="font-family:var(--font-retro);font-size:1rem;font-weight:700;">🎮 Bantuan & Support</div>
                    <div style="font-size:0.65rem;opacity:0.8;">Halo, @${user.store_name}! Ada yang bisa kami bantu?</div>
                </div>
                <button onclick="document.getElementById('help-modal').remove()" style="background:rgba(255,255,255,0.2);color:white;border:2px solid white;border-radius:4px;width:28px;height:28px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">✖</button>
            </div>
            <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;">
                <div style="background:#EFF6FF;border:1.5px solid var(--mario-blue);border-radius:6px;padding:10px;">
                    <div style="font-size:0.75rem;font-weight:bold;color:var(--mario-blue);margin-bottom:6px;">🤖 FAQ — Pilih pertanyaan:</div>
                    <select id="faq-select" style="width:100%;padding:6px;border:2px solid var(--retro-dark);border-radius:4px;font-size:0.72rem;margin-bottom:8px;" onchange="document.getElementById('faq-answer').textContent=this.value">
                        <option value="Pilih pertanyaan di atas...">-- Pilih Pertanyaan --</option>
                        ${FAQ.map(f => `<option value="${f.a}">${f.q}</option>`).join('')}
                    </select>
                    <div id="faq-answer" style="font-size:0.72rem;color:#1E40AF;background:white;border:1.5px solid var(--mario-blue);border-radius:4px;padding:8px;min-height:36px;">Pilih pertanyaan di atas...</div>
                </div>
                <div style="background:#F0FDF4;border:1.5px solid var(--mario-green);border-radius:6px;padding:10px;">
                    <div style="font-size:0.75rem;font-weight:bold;color:var(--mario-green);margin-bottom:4px;">💬 Chat Admin Langsung</div>
                    <div style="font-size:0.65rem;color:#64748B;margin-bottom:4px;">🟢 Admin online — estimasi balasan 5-15 menit</div>
                    <div style="font-size:0.65rem;color:#64748B;margin-bottom:8px;">Antrian: <strong>2 orang</strong> di depan Anda</div>
                    <button class="btn-retro btn-green" onclick="document.getElementById('help-modal').remove();openPrivateChat('admin-demo')" style="width:100%;font-size:0.75rem;padding:8px;">Chat Admin Sekarang 💬</button>
                </div>
                <div style="font-size:0.65rem;color:#94A3B8;text-align:center;">📧 support@retrohub.id &nbsp;|&nbsp; ⏰ 08.00–21.00 WIB</div>
            </div>
        </div>
    `;
    document.body.appendChild(helpOverlay);
    helpOverlay.addEventListener('click', e => { if (e.target === helpOverlay) helpOverlay.remove(); });
}

// Handler: seller menerima pesanan (mulai dikemas) dari dalam modal
function acceptOrderFromModal(orderId) {
    showConfirm('Terima Pesanan ✅', 'Pesanan akan ditandai sebagai diterima dan mulai dikemas. Setelah ini, pembeli tidak dapat membatalkan pesanan secara sepihak. Lanjutkan?', () => {
        const currentUserId = db.getCurrentUserId();
        const result = db.acceptOrder(orderId, currentUserId);
        if (!result) {
            showAlert('Gagal ❌', 'Pesanan tidak dapat diterima (mungkin sudah diproses sebelumnya).');
            return;
        }
        showToast('Pesanan Diterima 📦', 'Pesanan berhasil diterima. Silakan kemas barang dan input nomor resi.', 'success');
        document.getElementById('order-detail-overlay')?.remove();
        openOrderDetailModal(orderId);
    });
}

// Handler: input resi dari dalam modal
function handleModalResiSubmit(orderId) {
    const input = document.getElementById(`modal-resi-input-${orderId}`);
    if (!input || input.value.trim() === '') {
        showAlert('Resi Kosong ❌', 'Mohon masukkan nomor resi pengiriman!');
        return;
    }
    db.updateOrderTracking(orderId, input.value.trim());
    const order = db.getOrderById(orderId);
    if (order) {
        const product = db.getProductById(order.product_id);
        db.sendPrivateChat('admin-demo', order.buyer_id, `📦 Pesanan "${product ? product.title : 'Anda'}" (${orderId}) telah dikirim! No. Resi: ${input.value.trim()} via ${(order.shipping_courier||'JNT').toUpperCase()}`);
    }
    showToast('Barang Dikirim 🚚', `Resi ${input.value.trim()} berhasil disimpan!`, 'success');
    document.getElementById('order-detail-overlay')?.remove();
    openOrderDetailModal(orderId);
}

// Konfirmasi terima dari dalam modal
function confirmOrderReceivedFromModal(orderId) {
    showConfirm('Konfirmasi Terima ✅', 'Apakah Anda sudah menerima barang dalam kondisi baik? Setelah dikonfirmasi, dana diteruskan ke penjual.', () => {
        db.updateOrderStatus(orderId, 'completed');
        const order = db.getOrderById(orderId);
        if (order) {
            db.sendPrivateChat('admin-demo', order.seller_id, `🎉 Pembeli telah mengkonfirmasi penerimaan pesanan (${orderId}). Dana akan dicairkan segera!`);
        }
        showToast('Selesai 🎉', 'Transaksi berhasil dikonfirmasi!', 'success');
        document.getElementById('order-detail-overlay')?.remove();
        if (typeof filterBuyerTransactions === 'function') {
            filterBuyerTransactions(currentBuyerTxFilter);
        }
        openOrderDetailModal(orderId);
    });
}

// Star rating UI helpers
function selectStar(orderId, val) {
    document.getElementById('star-val-' + orderId).value = val;
    const row = document.getElementById('star-row-' + orderId);
    if (!row) return;
    row.querySelectorAll('span').forEach((el, i) => {
        el.textContent = i < val ? '⭐' : '☆';
    });
}
function hoverStar(orderId, val) {
    const row = document.getElementById('star-row-' + orderId);
    if (!row) return;
    row.querySelectorAll('span').forEach((el, i) => {
        el.textContent = i < val ? '⭐' : '☆';
        el.style.transform = i < val ? 'scale(1.2)' : '';
    });
}
function resetStarHover(orderId) {
    const val = parseInt(document.getElementById('star-val-' + orderId)?.value || '0', 10);
    selectStar(orderId, val);
    const row = document.getElementById('star-row-' + orderId);
    if (row) row.querySelectorAll('span').forEach(el => el.style.transform = '');
}

// Submit review
function previewReviewPhoto(orderId) {
    const input = document.getElementById('review-photo-' + orderId);
    const nameEl = document.getElementById('review-photo-name-' + orderId);
    const previewEl = document.getElementById('review-photo-preview-' + orderId);
    if (!input || !input.files[0]) return;
    const file = input.files[0];
    if (nameEl) nameEl.textContent = file.name.length > 20 ? file.name.substring(0,20) + '...' : file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
        if (previewEl) previewEl.innerHTML = `<img src="${e.target.result}" style="width:72px;height:72px;object-fit:cover;border-radius:6px;border:2px solid var(--retro-dark);margin-top:4px;">`;
    };
    reader.readAsDataURL(file);
}

function submitReview(orderId, productId, sellerId) {
    const rating = parseInt(document.getElementById('star-val-' + orderId)?.value || '0', 10);
    const text   = document.getElementById('review-text-' + orderId)?.value.trim() || '';
    if (rating === 0) { showAlert('Pilih Bintang ⭐', 'Berikan rating bintang terlebih dahulu!'); return; }
    if (text.length < 5) { showAlert('Terlalu Singkat ✏️', 'Tulis ulasan minimal 5 karakter ya!'); return; }

    const currentUserId = db.getCurrentUserId();
    const photoInput = document.getElementById('review-photo-' + orderId);
    const file = photoInput && photoInput.files[0];

    function doSave(photoUrl) {
        db.addReview({ order_id: orderId, product_id: productId, seller_id: sellerId, buyer_id: currentUserId, rating, text, photo_url: photoUrl || null });
        showToast('Ulasan Terkirim ⭐', 'Terima kasih atas ulasan Anda!', 'success');
        document.getElementById('order-detail-overlay')?.remove();
        openOrderDetailModal(orderId);
    }

    if (file) {
        const reader = new FileReader();
        reader.onload = e => doSave(e.target.result);
        reader.readAsDataURL(file);
    } else {
        doSave(null);
    }
}

// Komplain / Return Request
function openComplainModal(orderId) {
    const order = db.getOrderById(orderId);
    if (!order) return;
    const REASONS = ['Barang tidak sesuai deskripsi', 'Barang rusak/cacat saat diterima', 'Barang tidak sampai', 'Barang tidak lengkap', 'Seller tidak responsif > 3 hari', 'Lainnya'];
    document.getElementById('complain-modal')?.remove();
    const overlay2 = document.createElement('div');
    overlay2.className = 'modal-overlay';
    overlay2.id = 'complain-modal';
    overlay2.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:10015;display:flex;align-items:flex-end;justify-content:center;';
    overlay2.innerHTML = `
    <div style="background:var(--bg-card);border:3px solid var(--retro-dark);border-bottom:none;border-radius:12px 12px 0 0;box-shadow:-4px -4px 0 var(--retro-dark);width:100%;max-width:520px;max-height:92vh;overflow-y:auto;display:flex;flex-direction:column;">
        <div style="background:#DC2626;color:white;padding:13px 16px;border-radius:10px 10px 0 0;border-bottom:3px solid var(--retro-dark);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:1;">
            <div>
                <div style="font-family:var(--font-retro);font-size:0.95rem;font-weight:700;">⚠️ Ajukan Komplain</div>
                <div style="font-size:0.65rem;opacity:0.9;">Order: <strong>${orderId}</strong> — Bukti wajib diunggah</div>
            </div>
            <button onclick="document.getElementById('complain-modal').remove()"
                style="background:rgba(255,255,255,0.2);color:white;border:2px solid white;border-radius:4px;width:30px;height:30px;cursor:pointer;font-size:0.9rem;flex-shrink:0;">✖</button>
        </div>
        <div style="padding:16px;display:flex;flex-direction:column;gap:12px;">

            <!-- Alasan -->
            <div>
                <label style="font-family:var(--font-retro);font-size:0.7rem;font-weight:700;display:block;margin-bottom:4px;">📋 Alasan Komplain *</label>
                <select id="complain-reason" style="width:100%;padding:8px;border:2.5px solid var(--retro-dark);border-radius:4px;font-size:0.78rem;background:white;">
                    ${REASONS.map(r => `<option value="${r}">${r}</option>`).join('')}
                </select>
            </div>

            <!-- Detail -->
            <div>
                <label style="font-family:var(--font-retro);font-size:0.7rem;font-weight:700;display:block;margin-bottom:4px;">📝 Keterangan Detail *</label>
                <textarea id="complain-detail" placeholder="Jelaskan masalah secara lengkap: kondisi barang, perbedaan dengan deskripsi, kapan diterima, dsb. Minimal 30 karakter."
                    style="width:100%;padding:8px;border:2.5px solid var(--retro-dark);border-radius:4px;font-size:0.75rem;min-height:90px;resize:vertical;box-sizing:border-box;font-family:sans-serif;"></textarea>
            </div>

            <!-- Upload Foto -->
            <div style="background:#FFF7ED;border:2px solid #FED7AA;border-radius:6px;padding:12px;">
                <label style="font-family:var(--font-retro);font-size:0.7rem;font-weight:700;display:block;margin-bottom:4px;color:#C2410C;">📸 Foto Bukti * (wajib, maks 3 foto, maks 5MB/foto)</label>
                <div style="font-size:0.65rem;color:#92400E;margin-bottom:8px;">Upload foto kondisi barang yang diterima. Pastikan foto jelas dan terang.</div>
                <input type="file" id="complain-photos" accept="image/jpeg,image/png,image/webp" multiple
                    style="width:100%;font-size:0.72rem;border:2px dashed #F97316;border-radius:4px;padding:8px;background:white;cursor:pointer;box-sizing:border-box;"
                    onchange="_previewComplainPhotos(this)">
                <div id="complain-photo-preview" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;"></div>
                <div id="complain-photo-error" style="color:#DC2626;font-size:0.65rem;margin-top:4px;display:none;"></div>
            </div>

            <!-- Upload Video -->
            <div style="background:#FFF1F2;border:2px solid #FECDD3;border-radius:6px;padding:12px;">
                <label style="font-family:var(--font-retro);font-size:0.7rem;font-weight:700;display:block;margin-bottom:4px;color:#BE123C;">🎥 Video Unboxing * (wajib, maks 50MB, tidak dipotong)</label>
                <div style="font-size:0.65rem;color:#9F1239;margin-bottom:8px;">Rekam video dari paket belum dibuka sampai kondisi isi terlihat. <strong>Video tidak boleh dipotong/diedit.</strong></div>
                <input type="file" id="complain-video" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                    style="width:100%;font-size:0.72rem;border:2px dashed #F43F5E;border-radius:4px;padding:8px;background:white;cursor:pointer;box-sizing:border-box;"
                    onchange="_previewComplainVideo(this)">
                <div id="complain-video-preview" style="margin-top:8px;"></div>
                <div id="complain-video-error" style="color:#DC2626;font-size:0.65rem;margin-top:4px;display:none;"></div>
            </div>

            <!-- Progress bar (hidden by default) -->
            <div id="complain-upload-progress" style="display:none;">
                <div style="font-family:var(--font-retro);font-size:0.7rem;font-weight:700;margin-bottom:6px;" id="complain-progress-label">Mengunggah bukti...</div>
                <div style="background:#E2E8F0;border:1.5px solid var(--retro-dark);border-radius:4px;height:18px;overflow:hidden;">
                    <div id="complain-progress-bar" style="background:var(--mario-blue);height:100%;width:0%;transition:width 0.3s;display:flex;align-items:center;justify-content:center;">
                        <span id="complain-progress-pct" style="font-size:0.6rem;color:white;font-weight:700;"></span>
                    </div>
                </div>
            </div>

            <!-- Info penting -->
            <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:4px;padding:8px;font-size:0.68rem;color:#166534;line-height:1.5;">
                ✅ <strong>Dana aman</strong> — Setelah komplain dikirim, dana ditahan oleh Rekber hingga admin memutuskan.<br>
                ⏱️ Admin akan meninjau komplain dalam <strong>1×24 jam</strong> kerja.<br>
                ❌ Komplain dengan bukti tidak valid atau palsu dapat dikenai <strong>penalti akun</strong>.
            </div>
        </div>

        <!-- Footer sticky -->
        <div style="padding:12px 16px;border-top:2.5px solid var(--retro-dark);background:var(--bg-card);position:sticky;bottom:0;display:flex;gap:8px;">
            <button onclick="document.getElementById('complain-modal').remove()"
                class="btn-retro btn-white" style="flex:1;font-size:0.78rem;padding:10px;">Batal</button>
            <button id="complain-submit-btn" onclick="submitComplain('${orderId}')"
                class="btn-retro btn-red" style="flex:2;font-size:0.78rem;padding:10px;">⚠️ Kirim Komplain</button>
        </div>
    </div>`;
    document.body.appendChild(overlay2);
}

// Preview foto komplain
function _previewComplainPhotos(input) {
    const MAX_FILES = 3;
    const MAX_SIZE_MB = 5;
    const errEl = document.getElementById('complain-photo-error');
    const preview = document.getElementById('complain-photo-preview');
    errEl.style.display = 'none';
    preview.innerHTML = '';

    const files = Array.from(input.files);
    if (files.length > MAX_FILES) {
        errEl.textContent = `Maksimal ${MAX_FILES} foto. Hapus foto berlebih.`;
        errEl.style.display = 'block';
        input.value = '';
        return;
    }
    for (const f of files) {
        if (f.size > MAX_SIZE_MB * 1024 * 1024) {
            errEl.textContent = `"${f.name}" melebihi ${MAX_SIZE_MB}MB. Kompres foto dulu.`;
            errEl.style.display = 'block';
            input.value = '';
            preview.innerHTML = '';
            return;
        }
        const url = URL.createObjectURL(f);
        preview.innerHTML += `<div style="position:relative;">
            <img src="${url}" style="width:80px;height:80px;object-fit:cover;border:2px solid var(--retro-dark);border-radius:4px;">
            <div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.6);color:white;font-size:0.5rem;padding:1px 3px;border-radius:2px;">${(f.size/1024/1024).toFixed(1)}MB</div>
        </div>`;
    }
}

// Preview video komplain
function _previewComplainVideo(input) {
    const MAX_SIZE_MB = 50;
    const errEl = document.getElementById('complain-video-error');
    const preview = document.getElementById('complain-video-preview');
    errEl.style.display = 'none';
    preview.innerHTML = '';

    const file = input.files[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        errEl.textContent = `Video melebihi ${MAX_SIZE_MB}MB. Gunakan resolusi lebih rendah atau durasi lebih pendek.`;
        errEl.style.display = 'block';
        input.value = '';
        return;
    }
    const url = URL.createObjectURL(file);
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    preview.innerHTML = `
        <video src="${url}" controls style="width:100%;max-height:200px;border:2px solid var(--retro-dark);border-radius:4px;background:#000;"></video>
        <div style="font-size:0.65rem;color:#475569;margin-top:3px;">📁 ${file.name} — ${sizeMB}MB</div>`;
}

async function submitComplain(orderId) {
    const reason = document.getElementById('complain-reason')?.value || '';
    const detail = document.getElementById('complain-detail')?.value.trim() || '';
    const photoInput = document.getElementById('complain-photos');
    const videoInput = document.getElementById('complain-video');

    // Validasi
    if (detail.length < 30) {
        showAlert('Detail Kurang ✏️', 'Jelaskan masalah Anda minimal 30 karakter agar admin dapat memahami situasinya.');
        return;
    }
    const photos = photoInput ? Array.from(photoInput.files) : [];
    const video = videoInput ? videoInput.files[0] : null;

    if (photos.length === 0) {
        showAlert('Foto Wajib 📸', 'Upload minimal 1 foto kondisi barang yang diterima sebagai bukti komplain.');
        return;
    }
    if (!video) {
        showAlert('Video Wajib 🎥', 'Upload video unboxing (dari paket belum dibuka hingga kondisi isi terlihat). Video tidak boleh dipotong.');
        return;
    }

    // Disable tombol & tampilkan progress
    const submitBtn = document.getElementById('complain-submit-btn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Mengunggah...'; }
    const progressEl = document.getElementById('complain-upload-progress');
    const progressBar = document.getElementById('complain-progress-bar');
    const progressLabel = document.getElementById('complain-progress-label');
    const progressPct = document.getElementById('complain-progress-pct');
    if (progressEl) progressEl.style.display = 'block';

    const disputeId = 'disp-' + orderId + '-' + Date.now();
    const photoUrls = [];
    let videoUrl = '';

    const updateProgress = (step, total, label) => {
        const pct = Math.round((step / total) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
        if (progressPct) progressPct.textContent = pct + '%';
        if (progressLabel) progressLabel.textContent = label;
    };

    const totalSteps = photos.length + 1; // foto + video
    let step = 0;

    // Mode sim: gunakan object URL lokal saja
    const isSimMode = !window.supabaseClient;

    try {
        // Upload foto
        for (let i = 0; i < photos.length; i++) {
            step++;
            updateProgress(step, totalSteps + 1, `Mengunggah foto ${i+1} dari ${photos.length}...`);
            if (!isSimMode) {
                const url = await db.uploadDisputeEvidence(photos[i], disputeId, `photo-${i+1}`);
                photoUrls.push(url);
            } else {
                photoUrls.push(URL.createObjectURL(photos[i]));
            }
        }

        // Upload video
        step++;
        updateProgress(step, totalSteps + 1, 'Mengunggah video unboxing (ini mungkin butuh beberapa menit)...');
        if (!isSimMode) {
            videoUrl = await db.uploadDisputeEvidence(video, disputeId, 'video-unboxing');
        } else {
            videoUrl = URL.createObjectURL(video);
        }

        updateProgress(totalSteps + 1, totalSteps + 1, 'Menyimpan komplain...');

        // Simpan dispute
        const order = db.getOrderById(orderId);
        const buyer = order ? db.getProfileById(order.buyer_id) : null;
        const dispute = {
            id: disputeId,
            order_id: orderId,
            buyer_id: order?.buyer_id || '',
            seller_id: order?.seller_id || '',
            reason,
            detail,
            photo_urls: photoUrls,
            video_url: videoUrl,
            video_filename: video.name,
            video_size_mb: +(video.size / 1024 / 1024).toFixed(1),
            photo_count: photos.length,
            status: 'pending',
            admin_note: '',
            created_at: new Date().toISOString(),
            resolved_at: null
        };
        db.saveDispute(dispute);
        db.updateOrderStatus(orderId, 'disputed');
        // Simpan dispute_id ke order untuk referensi
        const orders = db.getOrders();
        const oi = orders.findIndex(o => o.id === orderId);
        if (oi !== -1) { orders[oi].dispute_id = disputeId; orders[oi].cancel_reason = reason + ' — ' + detail; localStorage.setItem('retrohub_orders', JSON.stringify(orders)); }

        // Notifikasi
        if (order) {
            db.sendPrivateChat('admin-demo', 'admin-demo', `⚠️ KOMPLAIN MASUK [${disputeId}]\nOrder: ${orderId}\nPembeli: @${buyer?.store_name||'?'}\nAlasan: ${reason}\nDetail: ${detail}\nBukti: ${photos.length} foto + 1 video`);
            db.sendPrivateChat('admin-demo', order.buyer_id, `✅ Komplain untuk pesanan ${orderId} telah diterima dan bukti berhasil diunggah. Dana ditahan hingga admin memutuskan (maks 1×24 jam kerja).`);
            db.sendPrivateChat('admin-demo', order.seller_id, `⚠️ Pembeli mengajukan komplain pada pesanan ${orderId} (Alasan: ${reason}). Admin sedang meninjau bukti yang diunggah.`);
        }

        document.getElementById('complain-modal')?.remove();
        document.getElementById('order-detail-overlay')?.remove();
        showAlert('Komplain Terkirim ✅', `Bukti (${photos.length} foto + video) berhasil diunggah. Tim admin akan meninjau dalam 1×24 jam. Dana Anda aman ditahan Rekber.`);

    } catch(err) {
        console.error('Upload evidence failed:', err);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '⚠️ Kirim Komplain'; }
        if (progressEl) progressEl.style.display = 'none';
        showAlert('Upload Gagal ❌', `Gagal mengunggah bukti: ${err.message}. Coba lagi atau gunakan file yang lebih kecil.`);
    }
}

// Buka Modal Inbox Chat

function openChatInbox() {
    if (typeof db === 'undefined') return;

    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) {
        showAlert("Akses Terbatas ⚠️", "Silakan login simulasi menggunakan dropdown di header terlebih dahulu untuk mengirim chat privat.");
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'chat-modal-overlay';
    overlay.id = 'chat-inbox-overlay';

    const conversations = db.getChatConversations(currentUserId);
    
    let conversationListHTML = '';
    if (conversations.length === 0) {
        conversationListHTML = `<div class="chat-inbox-empty">Belum ada obrolan privat aktif.<br>Mulai obrolan dari halaman detail mainan!</div>`;
    } else {
        conversationListHTML = conversations.map(c => {
            const hasUnread = c.unread_count > 0;
            const unreadBadge = hasUnread ? `<span style="background-color: var(--mario-red); color: white; border: 1.5px solid var(--retro-dark); border-radius: 50%; font-size: 0.65rem; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-family: var(--font-number); font-weight: bold;">${c.unread_count}</span>` : '';
            return `
                <div class="chat-inbox-item" onclick="openPrivateChat('${c.partner_id}')">
                    <div>
                        <div class="chat-inbox-partner">@${c.partner_name}</div>
                        <div class="chat-inbox-preview" style="${hasUnread ? 'font-weight: bold; color: var(--retro-dark);' : ''}">${c.last_message}</div>
                    </div>
                    ${unreadBadge}
                </div>
            `;
        }).join('');
    }

    overlay.innerHTML = `
        <div class="chat-modal-box">
            <div class="chat-modal-header">
                <div class="chat-modal-title">💬 Kotak Masuk Obrolan</div>
                <div class="chat-modal-close" onclick="document.getElementById('chat-inbox-overlay').remove()">✖</div>
            </div>
            <div class="chat-inbox-list">
                ${conversationListHTML}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

let activeChatInterval = null;

function openPrivateChat(partnerId, initialContext = null) {
    const inbox = document.getElementById('chat-inbox-overlay');
    if (inbox) inbox.remove();

    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) return;

    const partner = db.getProfileById(partnerId);
    const partnerName = partner ? partner.store_name : partnerId;
    window._activeChatPartnerId = partnerId;

    const overlay = document.createElement('div');
    overlay.className = 'chat-modal-overlay';
    overlay.id = 'private-chat-overlay';

    overlay.innerHTML = `
        <div class="chat-modal-box">
            <div class="chat-modal-header">
                <div class="chat-modal-title">💬 Chat dengan @${partnerName}</div>
                <div class="chat-modal-close" id="close-private-chat-btn">✖</div>
            </div>
            <div class="chat-history-area" id="chat-history-area">
                <!-- Pesan dimuat dinamis -->
            </div>
            <!-- Preview lampiran (foto/video) -->
            <div class="chat-media-preview-strip" id="chat-attach-preview" style="display:none;"></div>
            <div class="chat-input-area">
                <label class="chat-attach-btn" title="Lampirkan foto, video, atau PDF (maks 1.5MB)">
                    📎
                    <input type="file" id="chat-file-input" accept="image/jpeg,image/png,image/jpg,image/webp,video/mp4,video/quicktime,video/webm,application/pdf" style="display:none;" onchange="onChatFileSelected()">
                </label>
                <input type="text" class="chat-input-text" id="chat-msg-input" placeholder="Tulis pesan..." autocomplete="off">
                <button class="btn-retro btn-blue" id="send-chat-btn" style="padding:6px 12px;font-size:0.75rem;">Kirim</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const input   = document.getElementById('chat-msg-input');
    const sendBtn  = document.getElementById('send-chat-btn');
    const closeBtn = document.getElementById('close-private-chat-btn');

    input.focus();
    renderPrivateChatHistory(currentUserId, partnerId);

    // Jika ada konteks (produk/pesanan), auto-kirim sebagai pesan pertama
    // agar seller langsung tahu konteks bahasan
    if (initialContext) {
        // Cek apakah konteks yang sama sudah pernah dikirim sebelumnya
        const existingChats = db.getPrivateChats(currentUserId, partnerId);
        const alreadySent = existingChats.some(c =>
            c.sender_id === currentUserId && c.message === initialContext
        );
        if (!alreadySent) {
            db.sendPrivateChat(currentUserId, partnerId, initialContext);
            renderPrivateChatHistory(currentUserId, partnerId, true);
        }
        // Pre-fill input dengan placeholder yang siap diketik
        input.value = '';
        input.placeholder = 'Tulis pertanyaan Anda...';
        input.focus();
    }

    activeChatInterval = setInterval(() => {
        renderPrivateChatHistory(currentUserId, partnerId, false);
    }, 1500);

    // Attachment state
    let pendingFile = null;
    let pendingDataUrl = null;
    let pendingMediaType = null;

    function compressChatImage(file) {
        return new Promise((resolve, reject) => {
            const fileType = (file.type || '').toLowerCase();
            const extension = (file.name || '').split('.').pop().toLowerCase();
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

            if (!allowedTypes.includes(fileType) && !allowedExtensions.includes(extension)) {
                reject(new Error("Format gambar tidak didukung. Harap unggah JPG, JPEG, PNG, atau WEBP."));
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 800; // Optimal max dimension for chat

                    if (width > height) {
                        if (width > maxSize) {
                            height = Math.round((height * maxSize) / width);
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = Math.round((width * maxSize) / height);
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
                    resolve(compressedBase64);
                };
                img.onerror = function() {
                    reject(new Error("File gambar rusak atau gagal dimuat."));
                };
                img.src = e.target.result;
            };
            reader.onerror = function() {
                reject(new Error("Gagal membaca file gambar."));
            };
            reader.readAsDataURL(file);
        });
    }

    window.onChatFileSelected = async () => {
        const fileInput = document.getElementById('chat-file-input');
        const previewStrip = document.getElementById('chat-attach-preview');
        if (!fileInput || !fileInput.files[0]) return;

        const file = fileInput.files[0];
        const fileType = (file.type || '').toLowerCase();
        const extension = (file.name || '').split('.').pop().toLowerCase();
        
        const isVideo = fileType.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(extension);
        const isImage = fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(extension);
        const isPdf = fileType === 'application/pdf' || extension === 'pdf';

        // 1. Validasi Format Berkas (Gagalkan sedari awal)
        if (!isImage && !isVideo && !isPdf) {
            showAlert(
                'Format Tidak Didukung ❌', 
                `Berkas <strong>"${file.name}"</strong> tidak dapat dilampirkan.<br><br>Hanya diperbolehkan mengirim foto (<strong>JPG/PNG/WEBP</strong>), video (<strong>MP4/MOV/WEBM</strong>), atau berkas <strong>PDF</strong>.`
            );
            fileInput.value = '';
            return;
        }

        // 2. Validasi Ukuran Berkas untuk Video & PDF (Gagalkan sedari awal)
        const MAX_SIZE = 1.5 * 1024 * 1024; // 1.5MB
        if (!isImage && file.size > MAX_SIZE) {
            showAlert(
                'File Terlalu Besar ❌', 
                `Berkas video/PDF <strong>"${file.name}"</strong> terlalu besar (${(file.size/1024/1024).toFixed(1)}MB).<br><br>Untuk menjaga kapasitas penyimpanan chat, ukuran maksimal yang diperbolehkan adalah <strong>1.5MB</strong>.`
            );
            fileInput.value = '';
            return;
        }

        pendingMediaType = isImage ? 'image' : (isVideo ? 'video' : 'pdf');

        if (isImage) {
            showToast("Memproses Gambar ⏳", "Mengompresi gambar chat...", "info");
            try {
                pendingDataUrl = await compressChatImage(file);
                pendingFile = file;
                if (previewStrip) {
                    previewStrip.style.display = 'flex';
                    previewStrip.innerHTML = `
                        <div class="chat-media-thumb">
                            <img src="${pendingDataUrl}" style="width:100%;height:100%;object-fit:cover;">
                            <button class="remove-attach" onclick="clearChatAttachment()" title="Hapus lampiran">✖</button>
                        </div>
                        <span class="chat-media-size-label">${file.name.substring(0,22)}${file.name.length>22?'…':''} (Kompresi)</span>
                    `;
                }
            } catch (err) {
                showAlert('Gagal Memuat ❌', err.message);
                fileInput.value = '';
            }
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                pendingDataUrl = e.target.result;
                pendingFile = file;

                if (previewStrip) {
                    previewStrip.style.display = 'flex';
                    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
                    const thumbContent = isVideo
                        ? `<video src="${pendingDataUrl}" style="width:100%;height:100%;object-fit:cover;"></video>`
                        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#E2E8F0;font-size:1.5rem;border-radius:4px;border:1.5px solid var(--retro-dark);">📄</div>`;
                    previewStrip.innerHTML = `
                        <div class="chat-media-thumb">
                            ${thumbContent}
                            <button class="remove-attach" onclick="clearChatAttachment()" title="Hapus lampiran">✖</button>
                        </div>
                        <span class="chat-media-size-label">${file.name.substring(0,22)}${file.name.length>22?'…':''} (${sizeMB}MB)</span>
                    `;
                }
            };
            reader.readAsDataURL(file);
        }
    };

    window.clearChatAttachment = () => {
        pendingFile = null;
        pendingDataUrl = null;
        pendingMediaType = null;
        const fileInput = document.getElementById('chat-file-input');
        if (fileInput) fileInput.value = '';
        const previewStrip = document.getElementById('chat-attach-preview');
        if (previewStrip) { previewStrip.style.display = 'none'; previewStrip.innerHTML = ''; }
    };

    const performSend = () => {
        const text = input.value.trim();
        if (text === '' && !pendingDataUrl) return;

        db.sendPrivateChat(currentUserId, partnerId, text, pendingDataUrl, pendingMediaType);
        input.value = '';
        clearChatAttachment();
        renderPrivateChatHistory(currentUserId, partnerId, true);
        updateChatBadgeGlobal();
        
        if (window.refreshActiveTabData) {
            window.refreshActiveTabData();
        }
    };

    sendBtn.addEventListener('click', performSend);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            performSend();
        }
    });

    closeBtn.addEventListener('click', () => {
        clearInterval(activeChatInterval);
        window._activeChatPartnerId = null;
        overlay.remove();
        updateChatBadgeGlobal();
    });
}

let lastMessageCount = 0;

function renderPrivateChatHistory(currentUserId, partnerId, forceScroll = true) {
    const area = document.getElementById('chat-history-area');
    if (!area) {
        clearInterval(activeChatInterval);
        return;
    }

    const chats = db.getPrivateChats(currentUserId, partnerId);
    const hasNewMessage = chats.length !== lastMessageCount;
    lastMessageCount = chats.length;

    area.innerHTML = chats.map(c => {
        const isSent = c.sender_id === currentUserId;
        const bubbleClass = isSent ? 'chat-bubble-sent' : 'chat-bubble-received';
        const date = new Date(c.created_at);
        const timeStr = `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;

        // --- Deteksi & render Context Card (produk / pesanan) ---
        const isProductCtx = c.message && c.message.includes('*[Pertanyaan tentang Produk]*');
        const isOrderCtx   = c.message && c.message.includes('*[Konteks Pesanan]*');
        if ((isProductCtx || isOrderCtx) && !c.media_url) {
            const cardColor  = isProductCtx ? '#2563EB' : '#16A34A';
            const cardBg     = isProductCtx ? '#EFF6FF' : '#ECFDF5';
            const cardBorder = isProductCtx ? '#BFDBFE' : '#BBF7D0';
            const cardIcon   = isProductCtx ? '🛍️' : '📦';
            // Parse baris-baris context jadi tabel mini
            const lines = c.message.split('\n').filter(l => l.trim());
            const header = lines[0].replace(/\*|\[|\]/g, '').trim();
            const rows = lines.slice(1).map(l => {
                const [key, ...val] = l.split(':');
                const valStr = val.join(':').trim();
                // Buat link jika baris Link
                const isLink = key && key.trim().toLowerCase() === 'link';
                const valHTML = isLink
                    ? `<a href="${valStr}" target="_blank" style="color:${cardColor};text-decoration:underline;word-break:break-all;">${valStr}</a>`
                    : `<span style="color:#374151;">${valStr}</span>`;
                return key
                    ? `<div style="display:flex;gap:6px;font-size:0.68rem;padding:2px 0;border-bottom:1px solid ${cardBorder};">
                        <span style="color:#64748B;font-weight:bold;flex-shrink:0;min-width:70px;">${key.trim()}</span>
                        ${valHTML}
                       </div>`
                    : '';
            }).join('');
            const align = isSent ? 'flex-end' : 'flex-start';
            return `
                <div id="chatbubble-${c.id}" style="display:flex;justify-content:${align};">
                    <div style="max-width:88%;background:${cardBg};border:1.5px solid ${cardColor};border-radius:8px;overflow:hidden;box-shadow:2px 2px 0 ${cardColor}40;">
                        <div style="background:${cardColor};color:white;padding:5px 10px;font-size:0.68rem;font-weight:bold;">
                            ${cardIcon} ${header}
                        </div>
                        <div style="padding:8px 10px;">
                            ${rows}
                        </div>
                        <div style="text-align:right;padding:2px 8px 4px;font-size:0.58rem;color:#94A3B8;">${timeStr}</div>
                    </div>
                </div>
            `;
        }

        // --- Render media attachment ---
        let mediaHTML = '';
        if (c.media_url) {
            if (c.media_type === 'image') {
                mediaHTML = `<img src="${c.media_url}" class="chat-bubble-media-img" alt="Lampiran foto"
                    onclick="openChatMediaLightbox('${c.id}')" title="Klik untuk perbesar">`;
            } else if (c.media_type === 'video') {
                mediaHTML = `<video src="${c.media_url}" class="chat-bubble-media-video" controls preload="metadata"></video>`;
            } else if (c.media_type === 'pdf') {
                mediaHTML = `
                    <a href="${c.media_url}" download="lampiran.pdf" style="display:flex; align-items:center; gap:8px; padding:8px; border: 1.5px solid var(--retro-dark); border-radius: 4px; background: #F8FAFC; text-decoration: none; color: var(--retro-dark); font-family: var(--font-retro); font-size: 0.65rem; margin-top: 4px; box-shadow: 1.5px 1.5px 0px var(--retro-dark);">
                        <span style="font-size:1.25rem;">📄</span>
                        <div style="text-align:left;">
                            <strong style="display:block;">Unduh Berkas PDF</strong>
                            <span style="font-size:0.55rem; color:#64748B;">Klik untuk mengunduh</span>
                        </div>
                    </a>
                `;
            }
        }

        return `
            <div class="chat-bubble ${bubbleClass}" id="chatbubble-${c.id}">
                ${c.message ? `<div>${c.message}</div>` : ''}
                ${mediaHTML}
                <div class="chat-bubble-time">${timeStr}${c.media_url ? (c.media_type === 'image' ? ' 📷' : (c.media_type === 'video' ? ' 🎬' : ' 📄')) : ''}</div>
            </div>
        `;
    }).join('');

    if (forceScroll || hasNewMessage) {
        area.scrollTop = area.scrollHeight;
    }
}

// Lightbox untuk foto di chat
function openChatMediaLightbox(chatId) {
    const existing = document.getElementById('chat-lightbox');
    if (existing) existing.remove();
    // Cari src dari gambar
    const imgEl = document.querySelector(`#chatbubble-${chatId} .chat-bubble-media-img`);
    if (!imgEl) return;
    const lb = document.createElement('div');
    lb.id = 'chat-lightbox';
    lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
    lb.innerHTML = `<img src="${imgEl.src}" style="max-width:92vw;max-height:92vh;border-radius:8px;border:3px solid white;">`;
    lb.onclick = () => lb.remove();
    document.body.appendChild(lb);
}


// Modal Dukung Kualitas RetroHub (Apresiasi QRIS)
function showDonationModal() {
    const modalHTML = `
        <div style="text-align: center; display: flex; flex-direction: column; gap: 16px; font-size: 0.85rem; align-items: center;">
            <p style="text-align: left; line-height: 1.4; color: var(--retro-dark);">
                Terima kasih atas apresiasi Anda untuk terus menyemangati kami meningkatkan kualitas dan performa platform <strong>RetroHub</strong>!
            </p>
            <p style="text-align: left; line-height: 1.4; color: var(--retro-dark); margin-top: -6px;">
                Dukungan sukarela Anda sangat berharga bagi kelangsungan server dan pengembangan fitur-fitur baru ke depan. ❤️
            </p>
            
            <!-- QRIS Standee Mockup -->
            <div style="border: 3px solid var(--retro-dark); border-radius: 8px; width: 240px; background: white; box-shadow: 4px 4px 0px var(--retro-dark); overflow: hidden; display: flex; flex-direction: column; align-items: center; padding-bottom: 12px; margin-top: 4px; flex-shrink: 0;">
                <!-- QRIS Header Banner -->
                <div style="width: 100%; display: flex; font-family: var(--font-retro); font-size: 0.9rem; font-weight: bold; border-bottom: 3px solid var(--retro-dark); flex-shrink: 0;">
                    <div style="flex: 1.2; background: #E52521; color: white; padding: 6px; text-align: center;">QRIS</div>
                    <div style="flex: 2; background: #002FBE; color: white; padding: 6px 4px; text-align: center; font-size: 0.65rem; display: flex; flex-direction: column; justify-content: center; line-height: 1.1;">
                        <span>GPN / RETROPAY</span>
                        <span style="font-size: 0.5rem; opacity: 0.8;">INDONESIAN STANDARD</span>
                    </div>
                </div>
                
                <!-- QR Code SVG -->
                <div style="margin: 16px 0; flex-shrink: 0;">
                    <svg width="150" height="150" viewBox="0 0 29 29" style="image-rendering: pixelated; border: 2.5px solid var(--retro-dark); border-radius: 4px; background: white; display: block;">
                        <!-- Finder patterns -->
                        <path d="M 0 0 h 7 v 7 h -7 z M 1 1 h 5 v 5 h -5 z M 2 2 h 3 v 3 h -3 z" fill="black" />
                        <path d="M 22 0 h 7 v 7 h -7 z M 23 1 h 5 v 5 h -5 z M 24 2 h 3 v 3 h -3 z" fill="black" />
                        <path d="M 0 22 h 7 v 7 h -7 z M 1 23 h 5 v 5 h -5 z M 2 24 h 3 v 3 h -3 z" fill="black" />
                        <!-- Timing & Alignment -->
                        <path d="M 22 22 h 5 v 5 h -5 z M 23 23 h 3 v 3 h -3 z M 24 24 h 1 v 1 h -1 z" fill="black" />
                        <path d="M 8 2 h 1 v 1 h -1 z M 10 2 h 2 v 1 h -2 z M 14 2 h 1 v 1 h -1 z" fill="black" />
                        <path d="M 2 8 h 1 v 1 h -1 z M 2 10 h 2 v 1 h -2 z M 2 14 h 1 v 1 h -1 z" fill="black" />
                        <!-- Mock bits -->
                        <path d="M 9 9 h 2 v 2 h -2 z M 13 8 h 3 v 1 h -3 z M 10 12 h 1 v 3 h -1 z M 15 11 h 2 v 2 h -2 z M 12 15 h 4 v 1 h -4 z" fill="black" />
                        <path d="M 18 9 h 1 v 4 h -1 z M 20 8 h 1 v 2 h -1 z M 19 14 h 2 v 1 h -2 z M 17 16 h 3 v 2 h -3 z" fill="black" />
                        <path d="M 8 18 h 4 v 1 h -4 z M 9 20 h 2 v 2 h -2 z M 13 19 h 2 v 1 h -2 z" fill="black" />
                        <path d="M 18 19 h 3 v 1 h -3 z M 19 21 h 1 v 3 h -1 z M 20 25 h 2 v 1 h -2 z M 17 27 h 4 v 1 h -4 z" fill="black" />
                        <!-- Center Logo (Red cross controller style) -->
                        <rect x="12" y="12" width="5" height="5" fill="#E52521" />
                        <rect x="13" y="14" width="3" height="1" fill="white" />
                        <rect x="14" y="13" width="1" height="3" fill="white" />
                    </svg>
                </div>
                
                <!-- Bottom Info -->
                <div style="font-family: var(--font-retro); font-size: 0.65rem; color: var(--retro-dark); font-weight: bold; letter-spacing: 0.5px;">
                    RETROHUB APRESIASI
                </div>
                <div style="font-size: 0.55rem; color: #64748B; font-family: var(--font-number); margin-top: 2px;">
                    NMID: ID2026889175123
                </div>
            </div>
            <p style="font-size: 0.65rem; color: #64748B; font-style: italic; margin-top: 4px;">
                *Ini adalah mockup QRIS untuk kebutuhan simulasi apresiasi (API QRIS akan dihubungkan otomatis kemudian).
            </p>
        </div>
    `;
    showAlert("Dukung Kualitas RetroHub ☕", modalHTML);
}

// Jalankan otomatis
document.addEventListener('DOMContentLoaded', () => {
    renderGlobalHeader();
    updateChatBadgeGlobal();
    setupDonationListeners();
    setInterval(updateChatBadgeGlobal, 3000);
    // Cek wishlist alerts saat halaman dibuka
    if (typeof db !== 'undefined') {
        const uid = db.getCurrentUserId();
        if (uid) db.checkWishlistAlerts(uid);
    }
});

// Pesan masuk realtime: update badge, refresh chat aktif/inbox/panel notif tanpa reload
window.addEventListener('retrohub_chat_received', (e) => {
    if (typeof db === 'undefined') return;
    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) return;

    // 1. Update badge notifikasi global seketika
    updateChatBadgeGlobal();

    const c = e.detail || {};

    // 2. Jika modal chat privat dengan pengirim ini sedang terbuka, refresh riwayatnya
    const activeChatOverlay = document.getElementById('private-chat-overlay');
    if (activeChatOverlay && window._activeChatPartnerId && c.sender_id === window._activeChatPartnerId) {
        renderPrivateChatHistory(currentUserId, window._activeChatPartnerId, true);
    }

    // 3. Jika panel notifikasi sedang terbuka, refresh isinya
    if (document.getElementById('global-notif-panel')) {
        openNotifPanel(); // toggle tutup
        openNotifPanel(); // buka ulang dengan data terbaru
    }

    // 4. Jika modal inbox sedang terbuka, refresh listnya
    if (document.getElementById('chat-inbox-overlay')) {
        openChatInbox();
    }
});


if (document.readyState === 'complete' || document.readyState === 'interactive') {
    renderGlobalHeader();
    updateChatBadgeGlobal();
    setupDonationListeners();
}

function setupDonationListeners() {
    document.querySelectorAll('.donation-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            showDonationModal();
        };
    });
}

function openBuyerWithdrawModal() {
    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) return;

    const user = db.getProfileById(currentUserId);
    const walletBalance = user ? (Number(user.wallet_balance) || 0) : 0;

    if (walletBalance <= 0) {
        showAlert("Saldo Kosong ❌", "Anda tidak memiliki saldo dompet refund untuk ditarik.");
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'buyer-withdraw-modal-overlay';

    overlay.innerHTML = `
        <div class="modal-box" style="max-width: 380px; text-align: left;">
            <h3 style="font-family: var(--font-retro); color: var(--mario-red); margin-top: 0; font-size: 1.1rem; border-bottom: 2px solid var(--retro-dark); padding-bottom: 8px;">Tarik Saldo Dompet 💸</h3>
            <p style="font-size: 0.72rem; color: #64748B; margin-bottom: 12px;">Ajukan penarikan saldo dompet refund Anda ke rekening bank tujuan.</p>
            
            <div style="background: #FFFBEB; border: 1.5px dashed var(--mario-yellow); padding: 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; color: var(--retro-dark); margin-bottom: 15px;">
                Saldo Dompet Tersedia: <span style="color: var(--mario-red); font-family: var(--font-number); font-size: 0.85rem;">Rp${walletBalance.toLocaleString('id-ID')}</span>
            </div>

            <form id="buyer-withdraw-form" onsubmit="handleBuyerWithdrawSubmit(event)">
                <div style="margin-bottom: 10px;">
                    <label style="display: block; font-size: 0.72rem; font-weight: bold; margin-bottom: 4px;">Nama Bank Tujuan:</label>
                    <select id="bw-bank-name" class="shipping-select" style="width: 100%; box-sizing: border-box; padding: 6px;" required>
                        <option value="BCA">BCA (Bank Central Asia)</option>
                        <option value="Mandiri">Bank Mandiri</option>
                        <option value="BNI">BNI (Bank Negara Indonesia)</option>
                        <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                        <option value="Retropay">Retropay (E-Wallet)</option>
                    </select>
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; font-size: 0.72rem; font-weight: bold; margin-bottom: 4px;">Nomor Rekening:</label>
                    <input type="text" id="bw-account-number" class="search-input" style="width: 100%; box-sizing: border-box; padding: 6px; font-family: var(--font-number);" placeholder="Masukkan nomor rekening..." required>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 0.72rem; font-weight: bold; margin-bottom: 4px;">Nominal Penarikan (Rp):</label>
                    <input type="number" id="bw-amount" class="search-input" min="10000" max="${walletBalance}" style="width: 100%; box-sizing: border-box; padding: 6px; font-family: var(--font-number); font-weight: bold;" value="${walletBalance}" required>
                    <span style="font-size: 0.6rem; color: #94A3B8;">Minimal penarikan Rp10.000</span>
                </div>
                <div class="modal-buttons" style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 15px;">
                    <button type="button" class="btn-retro btn-white" onclick="document.getElementById('buyer-withdraw-modal-overlay').remove()" style="font-size: 0.75rem; padding: 6px 12px;">Batal ❌</button>
                    <button type="submit" class="btn-retro btn-green" style="font-size: 0.75rem; padding: 6px 12px;">Kirim Pengajuan 🚀</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

window.handleBuyerWithdrawSubmit = function(event) {
    event.preventDefault();
    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) return;

    const bankName = document.getElementById('bw-bank-name').value;
    const accountNumber = document.getElementById('bw-account-number').value.trim();
    const amount = Number(document.getElementById('bw-amount').value);

    const user = db.getProfileById(currentUserId);
    const walletBalance = user ? (Number(user.wallet_balance) || 0) : 0;

    if (!accountNumber) {
        showAlert("Error ❌", "Nomor rekening harus diisi!");
        return;
    }

    if (amount < 10000) {
        showAlert("Error ❌", "Minimal penarikan dana adalah Rp10.000");
        return;
    }

    if (amount > walletBalance) {
        showAlert("Error ❌", "Nominal penarikan melebihi saldo dompet Anda!");
        return;
    }

    // Deduct wallet balance
    db.refundToBuyerWallet(currentUserId, -amount);

    // Create withdrawal transaction
    db.createWithdrawal(currentUserId, amount, bankName, accountNumber, [], 'buyer_wallet');

    // Remove modal
    document.getElementById('buyer-withdraw-modal-overlay')?.remove();

    showToast("Pengajuan Terkirim 💸", `Pengajuan withdraw sebesar Rp${amount.toLocaleString('id-ID')} berhasil diajukan ke Admin.`, "success");

    // Refresh header (to update balance count)
    renderGlobalHeader();
};

function getBuyerWithdrawalsHTML() {
    const currentUserId = db.getCurrentUserId();
    if (!currentUserId) return '';

    const withdrawals = db.getWithdrawals().filter(w => w.user_id === currentUserId && w.type === 'buyer_wallet');

    if (withdrawals.length === 0) {
        return `
            <h4 style="margin: 0 0 6px 0; font-size: 0.75rem; color: var(--retro-dark); border-bottom: 2px dashed var(--retro-light-gray); padding-bottom: 4px;">Riwayat Penarikan Dana (Withdraw)</h4>
            <div style="font-size: 0.7rem; color: #94A3B8; text-align: center; padding: 10px 0;">Belum ada histori penarikan dana.</div>
        `;
    }

    // Sort by date newest first
    withdrawals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const listHTML = withdrawals.map(w => {
        const dateStr = new Date(w.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        let statusBadge = '';
        if (w.status === 'pending') statusBadge = '<span style="color: var(--mario-yellow); font-weight: bold;">Pending ⏳</span>';
        else if (w.status === 'processing') statusBadge = '<span style="color: var(--mario-blue); font-weight: bold;">Diproses 🔄</span>';
        else if (w.status === 'success') {
            if (w.deduction_amount > 0) {
                statusBadge = '<span style="color: var(--mario-yellow); font-weight: bold;">Sebagian ⚠️</span>';
            } else {
                statusBadge = '<span style="color: var(--mario-green); font-weight: bold;">Berhasil ✅</span>';
            }
        }
        else if (w.status === 'rejected') statusBadge = '<span style="color: var(--mario-red); font-weight: bold;" title="Dana dikembalikan ke saldo dompet">Ditolak ❌</span>';

        const amountHTML = w.deduction_amount > 0
            ? `<strong>Rp${w.amount.toLocaleString('id-ID')}</strong> <span style="font-size:0.6rem;text-decoration:line-through;color:#94A3B8;">Awal: Rp${w.original_amount.toLocaleString('id-ID')}</span> <span style="font-size:0.6rem;color:var(--mario-red);">(Potong Rp${w.deduction_amount.toLocaleString('id-ID')})</span>`
            : `<strong>Rp${w.amount.toLocaleString('id-ID')}</strong>`;

        let reasonHTML = '';
        if (w.deduction_amount > 0 && w.deduction_reason) {
            reasonHTML = `<div style="font-size: 0.6rem; color: var(--mario-red); margin-top: 2px;">Alasan Potong: ${w.deduction_reason}</div>`;
        } else if (w.status === 'rejected' && w.rejection_reason) {
            reasonHTML = `<div style="font-size: 0.6rem; color: var(--mario-red); margin-top: 2px;">Alasan Tolak: ${w.rejection_reason}</div>`;
        }

        return `
            <div style="border-bottom: 1px dashed var(--retro-light-gray); padding: 6px 0; font-size: 0.72rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    ${amountHTML}<br>
                    <span style="font-size: 0.62rem; color: #64748B;">${w.bank_name} • ${w.account_number} • ${dateStr}</span>
                    ${reasonHTML}
                </div>
                <div style="font-size: 0.68rem;">
                    ${statusBadge}
                </div>
            </div>
        `;
    }).join('');

    return `
        <h4 style="margin: 0 0 6px 0; font-size: 0.75rem; color: var(--retro-dark); border-bottom: 2px dashed var(--retro-light-gray); padding-bottom: 4px;">Riwayat Penarikan Dana (Withdraw)</h4>
        <div style="display: flex; flex-direction: column; gap: 4px;">
            ${listHTML}
        </div>
    `;
}

// ==========================================
// GOOGLE AUTH USER BIODATA COMPLETION
// ==========================================

function checkBiodataCompletion() {
    if (typeof isSimMode !== 'undefined' && isSimMode) return; // ignore in simulation
    
    const currentUserId = db.getCurrentUserId();
    if (!currentUserId || currentUserId === 'guest') return;
    
    const user = db.getProfileById(currentUserId);
    // User is new from Google if they have default store name
    if (user && (!user.store_name || user.store_name === 'User RetroHub' || user.store_name.trim() === '')) {
        showBiodataModal(user);
    }
}

function showBiodataModal(user) {
    if (document.getElementById('retrohub-biodata-completion-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'retrohub-biodata-completion-overlay';
    overlay.className = 'modal-overlay';
    overlay.style = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(26, 26, 26, 0.85);
        backdrop-filter: blur(4px);
        z-index: 100000;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow-y: auto;
        padding: 20px;
        box-sizing: border-box;
    `;
    
    overlay.innerHTML = `
        <div class="modal-box" style="width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto; background: #FFFFFF; border: 3.5px solid var(--retro-dark, #1A1A1A); border-radius: 6px; box-shadow: 6px 6px 0px var(--retro-dark, #1A1A1A); padding: 20px; box-sizing: border-box; text-align: left; animation: scaleUp 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
            <div class="modal-title" style="font-family: var(--font-retro, sans-serif); color: var(--mario-blue, #3B82F6); font-size: 1.1rem; margin-bottom: 15px; border-bottom: 2px dashed #CBD5E1; padding-bottom: 8px;">
                🎮 LENGKAPI BIODATA RETROHUB
            </div>
            <p style="font-size: 0.75rem; color: #4B5563; line-height: 1.4; margin-bottom: 15px;">
                Selamat datang di <strong>RetroHub</strong>! Sebelum mulai berbelanja atau berjualan, Anda wajib melengkapi data profil Anda terlebih dahulu:
            </p>
            
            <form id="biodata-completion-form" onsubmit="submitBiodataForm(event)">
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 0.72rem; font-weight: bold; display: block; margin-bottom: 4px;">Nama Lengkap:</label>
                    <input type="text" id="bio-full-name" value="${user.full_name || ''}" required style="width: 100%; border: 2.5px solid var(--retro-dark); padding: 6px; font-size: 0.75rem; border-radius: 4px; box-sizing: border-box;">
                </div>
                
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 0.72rem; font-weight: bold; display: block; margin-bottom: 4px;">Username / Nama Toko (Tanpa spasi/simbol):</label>
                    <input type="text" id="bio-store-name" placeholder="contoh: kaset_retro" value="${user.store_name || ''}" required pattern="^[a-zA-Z0-9_-]+$" style="width: 100%; border: 2.5px solid var(--retro-dark); padding: 6px; font-size: 0.75rem; border-radius: 4px; box-sizing: border-box;">
                    <span style="font-size: 0.6rem; color: #94A3B8;">* Dipakai untuk username login/chat dan nama toko Anda.</span>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 0.72rem; font-weight: bold; display: block; margin-bottom: 4px;">Nomor WhatsApp:</label>
                    <input type="tel" id="bio-whatsapp" placeholder="contoh: 08123456789" value="${user.whatsapp || ''}" required style="width: 100%; border: 2.5px solid var(--retro-dark); padding: 6px; font-size: 0.75rem; border-radius: 4px; box-sizing: border-box;">
                </div>

                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <label style="font-size: 0.72rem; font-weight: bold; display: block; margin-bottom: 4px;">Provinsi:</label>
                        <select id="bio-provinsi" required onchange="onBioProvinsiChange()" style="width: 100%; border: 2.5px solid var(--retro-dark); padding: 5px; font-size: 0.72rem; border-radius: 4px; box-sizing: border-box;">
                            <option value="">Memuat data provinsi...</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.72rem; font-weight: bold; display: block; margin-bottom: 4px;">Kota / Kabupaten:</label>
                        <select id="bio-kota" required disabled onchange="onBioKotaChange()" style="width: 100%; border: 2.5px solid var(--retro-dark); padding: 5px; font-size: 0.72rem; border-radius: 4px; box-sizing: border-box;">
                            <option value="">-- Pilih Provinsi Dahulu --</option>
                        </select>
                    </div>
                </div>

                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <label style="font-size: 0.72rem; font-weight: bold; display: block; margin-bottom: 4px;">Kecamatan:</label>
                        <select id="bio-kecamatan" required disabled onchange="onBioKecamatanChange()" style="width: 100%; border: 2.5px solid var(--retro-dark); padding: 5px; font-size: 0.72rem; border-radius: 4px; box-sizing: border-box;">
                            <option value="">-- Pilih Kota/Kabupaten Dahulu --</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.72rem; font-weight: bold; display: block; margin-bottom: 4px;">Kelurahan / Desa:</label>
                        <select id="bio-kelurahan" required disabled style="width: 100%; border: 2.5px solid var(--retro-dark); padding: 5px; font-size: 0.72rem; border-radius: 4px; box-sizing: border-box;">
                            <option value="">-- Pilih Kecamatan Dahulu --</option>
                        </select>
                    </div>
                </div>

                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <label style="font-size: 0.72rem; font-weight: bold; display: block; margin-bottom: 4px;">Kode Pos:</label>
                        <input type="text" id="bio-kodepos" inputmode="numeric" maxlength="5" pattern="[0-9]{5}" placeholder="Contoh: 40264" value="${user.address_kodepos || ''}" required style="width: 100%; border: 2.5px solid var(--retro-dark); padding: 6px; font-size: 0.75rem; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 0.72rem; font-weight: bold; display: block; margin-bottom: 4px;">Koordinat Lokasi 📍</label>
                        <input type="text" id="bio-koordinat-display" placeholder="Belum dipilih" readonly style="width: 100%; border: 2.5px solid var(--retro-dark); padding: 6px; font-size: 0.72rem; border-radius: 4px; box-sizing: border-box; background-color:#F1F5F9; color:#64748B;">
                        <input type="hidden" id="bio-lat" value="${user.address_lat || ''}">
                        <input type="hidden" id="bio-lng" value="${user.address_lng || ''}">
                    </div>
                </div>

                <div style="margin-bottom: 10px;">
                    <label style="font-size: 0.72rem; font-weight: bold; display: block; margin-bottom: 4px;">Titik Lokasi (Pinpoint untuk Kurir) 📍</label>
                    <p style="font-size: 0.65rem; color: #64748B; margin: -2px 0 8px 0; line-height: 1.3;">Geser pin atau klik pada peta untuk menandai lokasi tepat.</p>
                    <div id="bio-map" style="height: 180px; width: 100%; border: 2.5px solid var(--retro-dark); border-radius: 4px; margin-bottom: 6px; box-sizing: border-box; z-index: 1;"></div>
                    <button type="button" class="btn-retro btn-blue" style="font-size: 0.68rem; padding: 6px 10px; width: 100%; cursor: pointer;" onclick="useBioGeolocation()">Gunakan Lokasi GPS Saya 🛰️</button>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="font-size: 0.72rem; font-weight: bold; display: block; margin-bottom: 4px;">Alamat Lengkap (Jalan, No Rumah, RT/RW):</label>
                    <textarea id="bio-address-detail" required style="width: 100%; height: 50px; border: 2.5px solid var(--retro-dark); padding: 6px; font-size: 0.72rem; border-radius: 4px; box-sizing: border-box; resize: none;">${user.address_detail || ''}</textarea>
                </div>

                <button type="submit" class="btn-retro btn-green" style="width: 100%; font-size: 0.8rem; padding: 10px; cursor: pointer; text-shadow: 1px 1px 0px #000; box-shadow: 3px 3px 0px #000;">
                    Simpan Biodata & Mulai Nostalgia! 🍄
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(overlay);
    initBioWilayahForm(user);
}

let bioMap = null, bioMarker = null, bioWilayahLoaded = false;

async function initBioWilayahForm(user) {
    if (!bioWilayahLoaded) {
        bioWilayahLoaded = true;
        const provSel = document.getElementById('bio-provinsi');
        if (provSel) {
            try {
                const provinces = await db.wilayah.getProvinces();
                provSel.innerHTML = '<option value="">-- Pilih Provinsi --</option>' +
                    provinces.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            } catch (e) {
                provSel.innerHTML = '<option value="">Gagal memuat data (cek koneksi internet)</option>';
            }
        }
    }

    loadLeafletAndInitMap(user);

    // Jika user sudah pernah mengisi wilayah sebelumnya, isi ulang cascade-nya
    if (user && user.address_provinsi_id) {
        try {
            const provSel = document.getElementById('bio-provinsi');
            if (provSel) {
                provSel.value = user.address_provinsi_id;
                await onBioProvinsiChange();
                
                const kotaSel = document.getElementById('bio-kota');
                if (kotaSel && user.address_kota_id) {
                    kotaSel.value = user.address_kota_id;
                    await onBioKotaChange();
                }
                
                const kecSel = document.getElementById('bio-kecamatan');
                if (kecSel && user.address_kecamatan_id) {
                    kecSel.value = user.address_kecamatan_id;
                    await onBioKecamatanChange();
                }
                
                const kelSel = document.getElementById('bio-kelurahan');
                if (kelSel && user.address_kelurahan_id) {
                    kelSel.value = user.address_kelurahan_id;
                }
            }
        } catch (e) { /* abaikan jika gagal, user bisa pilih ulang manual */ }
    }
}

window.onBioProvinsiChange = async function() {
    const provId = document.getElementById('bio-provinsi').value;
    const kotaSel = document.getElementById('bio-kota');
    const kecSel = document.getElementById('bio-kecamatan');
    const kelSel = document.getElementById('bio-kelurahan');

    if (kecSel) {
        kecSel.innerHTML = '<option value="">-- Pilih Kota/Kabupaten Dahulu --</option>';
        kecSel.disabled = true;
    }
    if (kelSel) {
        kelSel.innerHTML = '<option value="">-- Pilih Kecamatan Dahulu --</option>';
        kelSel.disabled = true;
    }

    if (!kotaSel) return;

    if (!provId) {
        kotaSel.innerHTML = '<option value="">-- Pilih Provinsi Dahulu --</option>';
        kotaSel.disabled = true;
        return;
    }

    kotaSel.innerHTML = '<option value="">Memuat...</option>';
    kotaSel.disabled = true;
    try {
        const regencies = await db.wilayah.getRegencies(provId);
        kotaSel.innerHTML = '<option value="">-- Pilih Kota/Kabupaten --</option>' +
            regencies.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
        kotaSel.disabled = false;
    } catch (e) {
        kotaSel.innerHTML = '<option value="">Gagal memuat data</option>';
    }
};

window.onBioKotaChange = async function() {
    const kotaId = document.getElementById('bio-kota').value;
    const kecSel = document.getElementById('bio-kecamatan');
    const kelSel = document.getElementById('bio-kelurahan');

    if (kelSel) {
        kelSel.innerHTML = '<option value="">-- Pilih Kecamatan Dahulu --</option>';
        kelSel.disabled = true;
    }

    if (!kecSel) return;

    if (!kotaId) {
        kecSel.innerHTML = '<option value="">-- Pilih Kota/Kabupaten Dahulu --</option>';
        kecSel.disabled = true;
        return;
    }

    kecSel.innerHTML = '<option value="">Memuat...</option>';
    kecSel.disabled = true;
    try {
        const districts = await db.wilayah.getDistricts(kotaId);
        kecSel.innerHTML = '<option value="">-- Pilih Kecamatan --</option>' +
            districts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        kecSel.disabled = false;
    } catch (e) {
        kecSel.innerHTML = '<option value="">Gagal memuat data</option>';
    }
};

window.onBioKecamatanChange = async function() {
    const kecId = document.getElementById('bio-kecamatan').value;
    const kelSel = document.getElementById('bio-kelurahan');

    if (!kelSel) return;

    if (!kecId) {
        kelSel.innerHTML = '<option value="">-- Pilih Kecamatan Dahulu --</option>';
        kelSel.disabled = true;
        return;
    }

    kelSel.innerHTML = '<option value="">Memuat...</option>';
    kelSel.disabled = true;
    try {
        const villages = await db.wilayah.getVillages(kecId);
        kelSel.innerHTML = '<option value="">-- Pilih Kelurahan/Desa --</option>' +
            villages.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
        kelSel.disabled = false;
    } catch (e) {
        kelSel.innerHTML = '<option value="">Gagal memuat data</option>';
    }
};

function updateBioCoordDisplay(lat, lng) {
    const latInput = document.getElementById('bio-lat');
    const lngInput = document.getElementById('bio-lng');
    const coordDisplay = document.getElementById('bio-koordinat-display');
    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lng;
    if (coordDisplay) coordDisplay.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

window.useBioGeolocation = function() {
    if (!navigator.geolocation) {
        if (typeof showToast === 'function') {
            showToast("Tidak Didukung", "Browser Anda tidak mendukung GPS.", "error");
        } else {
            alert("Browser Anda tidak mendukung GPS.");
        }
        return;
    }
    if (typeof showToast === 'function') {
        showToast("Mencari Lokasi 🛰️", "Mohon izinkan akses lokasi pada browser Anda.", "info");
    }
    navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        if (bioMarker && bioMap) {
            bioMarker.setLatLng([latitude, longitude]);
            bioMap.setView([latitude, longitude], 16);
        }
        updateBioCoordDisplay(latitude, longitude);
        if (typeof showToast === 'function') {
            showToast("Lokasi Ditemukan 📍", "Titik lokasi berhasil ditandai pada peta.", "success");
        }
    }, () => {
        if (typeof showToast === 'function') {
            showToast("Gagal Mengambil Lokasi", "Pastikan GPS aktif dan izin lokasi sudah diberikan.", "error");
        } else {
            alert("Gagal mengambil lokasi. Pastikan GPS aktif.");
        }
    }, { enableHighAccuracy: true, timeout: 10000 });
};

function loadLeafletAndInitMap(user) {
    if (typeof L !== 'undefined') {
        initBioMap(user);
        return;
    }

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
        script.onload = () => {
            initBioMap(user);
        };
        document.head.appendChild(script);
    }
}

function initBioMap(user) {
    if (bioMap || typeof L === 'undefined') return;
    
    const mapContainer = document.getElementById('bio-map');
    if (!mapContainer) return;

    const defaultLatLng = [-6.9147, 107.6098]; // Bandung
    bioMap = L.map('bio-map').setView(defaultLatLng, 6);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(bioMap);

    const existingLat = user && user.address_lat ? parseFloat(user.address_lat) : NaN;
    const existingLng = user && user.address_lng ? parseFloat(user.address_lng) : NaN;
    
    const startLatLng = (!isNaN(existingLat) && !isNaN(existingLng)) ? [existingLat, existingLng] : defaultLatLng;
    if (!isNaN(existingLat) && !isNaN(existingLng)) {
        bioMap.setView(startLatLng, 16);
    }
    updateBioCoordDisplay(startLatLng[0], startLatLng[1]);

    bioMarker = L.marker(startLatLng, { draggable: true }).addTo(bioMap);
    
    bioMarker.on('dragend', () => {
        const ll = bioMarker.getLatLng();
        updateBioCoordDisplay(ll.lat, ll.lng);
    });
    
    bioMap.on('click', (e) => {
        bioMarker.setLatLng(e.latlng);
        updateBioCoordDisplay(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => {
        if (bioMap) bioMap.invalidateSize();
    }, 300);
}

window.submitBiodataForm = function(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('bio-full-name').value.trim();
    const storeName = document.getElementById('bio-store-name').value.trim().replace('@', '');
    const whatsapp = document.getElementById('bio-whatsapp').value.trim();
    const addressDetail = document.getElementById('bio-address-detail').value.trim();
    
    const provSel = document.getElementById('bio-provinsi');
    const kotaSel = document.getElementById('bio-kota');
    const kecSel = document.getElementById('bio-kecamatan');
    const kelSel = document.getElementById('bio-kelurahan');
    const kodepos = document.getElementById('bio-kodepos').value.trim();
    const lat = document.getElementById('bio-lat').value;
    const lng = document.getElementById('bio-lng').value;
    
    // Validasi wilayah bertingkat
    if (!provSel.value || !kotaSel.value || !kecSel.value || !kelSel.value) {
        if (typeof showToast === 'function') {
            showToast("Alamat Belum Lengkap 📍", "Pilih Provinsi, Kota/Kabupaten, Kecamatan, dan Kelurahan/Desa terlebih dahulu.", "error");
        } else {
            alert("Pilih Provinsi, Kota/Kabupaten, Kecamatan, dan Kelurahan/Desa terlebih dahulu.");
        }
        return;
    }
    // Validasi kode pos (5 digit)
    if (!/^[0-9]{5}$/.test(kodepos)) {
        if (typeof showToast === 'function') {
            showToast("Kode Pos Tidak Valid", "Masukkan kode pos 5 digit sesuai wilayah Anda.", "error");
        } else {
            alert("Masukkan kode pos 5 digit sesuai wilayah Anda.");
        }
        document.getElementById('bio-kodepos').focus();
        return;
    }
    // Validasi titik lokasi (pinpoint)
    if (!lat || !lng) {
        if (typeof showToast === 'function') {
            showToast("Titik Lokasi Belum Ditandai 📍", "Geser pin pada peta atau gunakan tombol Lokasi GPS untuk menandai alamat Anda.", "error");
        } else {
            alert("Geser pin pada peta atau gunakan tombol Lokasi GPS untuk menandai alamat Anda.");
        }
        return;
    }
    
    const profiles = db.getProfiles();
    const isTaken = profiles.some(p => p.store_name && p.store_name.toLowerCase() === storeName.toLowerCase() && p.id !== db.getCurrentUserId());
    if (isTaken) {
        alert("Username/Nama Toko ini sudah digunakan pengguna lain! Harap cari nama lain.");
        return;
    }
    
    const currentUserId = db.getCurrentUserId();
    const user = db.getProfileById(currentUserId);
    if (!user) return;
    
    user.full_name = fullName;
    user.store_name = storeName;
    user.whatsapp = whatsapp;
    user.phone_number = whatsapp; // set both for compatibility
    user.address_provinsi_id = provSel.value;
    user.address_provinsi = provSel.options[provSel.selectedIndex].text;
    user.address_kota_id = kotaSel.value;
    user.address_kota = kotaSel.options[kotaSel.selectedIndex].text;
    user.address_kecamatan_id = kecSel.value;
    user.address_kecamatan = kecSel.options[kecSel.selectedIndex].text;
    user.address_kelurahan_id = kelSel.value;
    user.address_kelurahan = kelSel.options[kelSel.selectedIndex].text;
    user.address_kodepos = kodepos;
    user.address_lat = lat;
    user.address_lng = lng;
    user.address_detail = addressDetail;
    user.is_buyer  = true;
    user.is_seller = user.is_seller || false;
    user.is_admin  = user.is_admin  || false;
    
    db.saveProfile(user);
    
    const overlay = document.getElementById('retrohub-biodata-completion-overlay');
    if (overlay) overlay.remove();
    
    // Reset bio map & marker
    bioMap = null;
    bioMarker = null;
    bioWilayahLoaded = false;
    
    renderGlobalHeader();
    if (typeof showToast === 'function') {
        showToast("Profil Disimpan! 🎉", "Biodata Anda berhasil dilengkapi. Selamat bersenang-senang!", "success");
    } else {
        alert("Profil Disimpan! Selamat berbelanja.");
    }
};

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        checkBiodataCompletion();
    });
}


// ─────────────────────────────────────────────────────────────────────────────
// REALTIME ORDER UPDATE HANDLER
// Saat order diupdate dari device/user lain (cancel, accept, ship, dll),
// refresh SEMUA panel UI yang relevan tanpa perlu reload halaman.
// ─────────────────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
    window.addEventListener('retrohub_order_updated', async (e) => {
        const updatedOrder = e.detail;
        if (!updatedOrder || !updatedOrder.id) return;

        // 1. Sinkronisasi localStorage dengan data terbaru dari Supabase (atau dari event)
        try {
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                const { data, error } = await supabaseClient
                    .from('orders')
                    .select('*')
                    .eq('id', updatedOrder.id)
                    .single();
                if (!error && data) {
                    const orders = JSON.parse(localStorage.getItem('retrohub_orders') || '[]');
                    const idx = orders.findIndex(o => o.id === data.id);
                    if (idx !== -1) orders[idx] = { ...orders[idx], ...data };
                    else orders.push(data);
                    localStorage.setItem('retrohub_orders', JSON.stringify(orders));
                }
            } else {
                // Mode simulasi: update langsung dari event detail
                const orders = JSON.parse(localStorage.getItem('retrohub_orders') || '[]');
                const idx = orders.findIndex(o => o.id === updatedOrder.id);
                if (idx !== -1) orders[idx] = { ...orders[idx], ...updatedOrder };
                else orders.push(updatedOrder);
                localStorage.setItem('retrohub_orders', JSON.stringify(orders));
            }
        } catch(err) { console.warn('[RetroHub] order_updated sync error:', err); }

        // 2. Refresh modal detail order jika sedang dibuka untuk order ini
        const detailModal = document.getElementById('order-detail-overlay');
        if (detailModal) {
            const modalOrderId = detailModal.dataset.orderId;
            if (modalOrderId === updatedOrder.id) {
                // Jika status cancelled, tutup modal dan tampilkan notif
                if (updatedOrder.status === 'cancelled' || updatedOrder.status === 'expired') {
                    detailModal.remove();
                    showToast('Pesanan Dibatalkan 🚫',
                        'Status pesanan ini telah berubah menjadi dibatalkan.', 'warning');
                } else {
                    openOrderDetailModal(updatedOrder.id);
                }
            }
        }

        // 3. Refresh daftar pesanan buyer jika modal histori sedang terbuka
        const historyModal = document.getElementById('order-history-modal-overlay');
        if (historyModal) {
            const listContainer = historyModal.querySelector('#buyer-orders-list');
            if (listContainer) {
                listContainer.innerHTML = getBuyerOrdersHTML();
            }
        }

        // 4. Refresh panel order seller (halaman seller.html) jika fungsi tersedia
        if (typeof window.renderSellerOrders === 'function') {
            window.renderSellerOrders();
        }

        // 5. Refresh panel transaksi admin (halaman admin.html) jika fungsi tersedia
        if (typeof window.renderTransactionsMonitor === 'function') {
            window.renderTransactionsMonitor();
        }

        // 6. Update badge notifikasi di header
        if (typeof updateChatBadgeGlobal === 'function') {
            updateChatBadgeGlobal();
        }
    });
}
