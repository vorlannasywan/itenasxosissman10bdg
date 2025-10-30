// /public/js/scripts.js

// ===================================
// INITIALIZATION & ROUTING
// ===================================

/**
 * Event listener utama yang berjalan setelah seluruh halaman HTML dimuat.
 * Bertindak sebagai "router" frontend sederhana untuk menjalankan fungsi
 * pemuat data (loader) yang sesuai dengan halaman yang sedang dibuka.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Dapatkan nama file HTML saat ini dari URL
    let path = window.location.pathname.split('/').pop();
    // Jika path kosong (misal, halaman root) atau index.html, anggap sebagai index.html
    if (path === '' || path === 'index.html') {
        path = 'index.html';
    }
    
    // Render sidebar dinamis di semua halaman *internal* (kecuali index dan login)
    if (path !== 'login.html' && path !== 'index.html') {
        renderSidebar(path);
    }

    // Jalankan fungsi page loader berdasarkan nama file HTML
    switch (path) {
        case 'index.html':        loadIndexPage(); break;
        case 'dashboard.html':    loadDashboardPage(); break;
        case 'proker.html':       loadProkerPage(); break;
        case 'proker-detail.html': loadProkerDetailPage(); break;
        case 'berita.html':       loadBeritaPage(); break;
        case 'berita-detail.html': loadBeritaDetailPage(); break;
        case 'profil.html':       loadProfilPage(); break;
        case 'login.html':        setupLoginForm(); break;
        // Tambahkan case lain jika ada halaman baru
    }
});


// ===================================
// UTILITIES & AUTHENTICATION
// ===================================

const API_URL = ''; // Base URL API Anda (jika backend di domain berbeda)

/** Mengambil token autentikasi dari localStorage */
const getToken = () => localStorage.getItem('authToken');

/** Mengambil peran pengguna (role) dari localStorage */
const getRole = () => localStorage.getItem('userRole');

/** Memeriksa apakah pengguna sudah login (berdasarkan adanya token) */
const isLoggedIn = () => !!getToken();

/**
 * Fungsi pembungkus (wrapper) untuk melakukan request API menggunakan fetch.
 * Secara otomatis menambahkan header Authorization jika user login,
 * mengatur Content-Type untuk JSON (jika bukan FormData),
 * dan melakukan logout otomatis jika menerima status 401 (Unauthorized).
 * @param {string} endpoint - Path API (misal, '/proker' atau '/public/berita').
 * @param {object} options - Opsi konfigurasi fetch (method, body, dll.).
 * @returns {Promise<Response|undefined>} - Promise yang resolve dengan objek Response atau undefined jika error.
 */
async function apiFetch(endpoint, options = {}) {
    const headers = { ...options.headers };
    if (getToken()) {
        headers['Authorization'] = `Bearer ${getToken()}`;
    }
    // Hanya set Content-Type jika body bukan FormData (FormData punya Content-Type sendiri)
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_URL}/api${endpoint}`, {
            ...options,
            headers,
            cache: 'no-store' // Mencegah caching response, berguna saat token berubah
        });
        
        // Jika token tidak valid atau kedaluwarsa, logout user
        if (response.status === 401) {
            logout(); 
            return; // Hentikan proses lebih lanjut
        }
        return response;
    } catch (error) {
        // Abaikan AbortError (terjadi jika request dibatalkan), log error lainnya
        if (error.name !== 'AbortError') {
             console.error('API Fetch Error:', error);
        }
        // Bisa tambahkan notifikasi error ke user di sini jika perlu
    }
}

/**
 * Menghapus data autentikasi dari localStorage dan mengarahkan ke halaman login.
 */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
}


// ===================================
// DYNAMIC UI RENDERERS
// ===================================

/**
 * Merender konten sidebar secara dinamis berdasarkan status login dan halaman saat ini.
 * @param {string} currentPage - Nama file HTML halaman yang sedang aktif.
 */
async function renderSidebar(currentPage) {
    const container = document.getElementById('sidebar-container');
    if (!container) return; // Pastikan elemen sidebar ada

    const role = getRole();
    const roleText = role || 'OSIS'; // Default jika tidak login

    // Daftar link navigasi di sidebar
    const navLinks = [
        { href: 'dashboard.html', icon: '🏠', text: 'Dashboard' },
        { href: 'proker.html', icon: '📅', text: 'Program Kerja' },
        { href: 'berita.html', icon: '📰', text: 'Berita' },
        { href: 'profil.html', icon: '👥', text: `Profil ${roleText}` },
        // Tambahkan link lain sesuai kebutuhan
    ];

    /** Membuat HTML untuk setiap link navigasi, menandai yang aktif */
    const generateNavLinks = () => navLinks.map(link => {
        let isActive = currentPage === link.href;

        // Logika untuk menandai 'Program Kerja' aktif di halaman detailnya
        if (link.href === 'proker.html' && currentPage === 'proker-detail.html') {
            isActive = true;
        }
        // Logika untuk menandai 'Berita' aktif di halaman detailnya
        if (link.href === 'berita.html' && currentPage === 'berita-detail.html') {
            isActive = true;
        }

        const activeClass = isActive ? 'tw-bg-[#124351]' : 'hover:tw-bg-[#124351]';
        return `
            <a href="${link.href}" class="tw-flex tw-items-center tw-gap-3 tw-py-2 tw-px-3 tw-rounded-md tw-mb-1 ${activeClass}">
                ${link.icon} ${link.text}
            </a>`;
    }).join('');

    // Tampilkan tombol Logout jika login, atau tombol Login jika belum
    const authButtonHTML = isLoggedIn()
        ? `<button onclick="logout()" class="tw-w-full tw-bg-red-600 tw-text-white tw-py-2 tw-rounded-md hover:tw-bg-red-500 tw-transition-colors">Logout</button>`
        : `<a href="login.html" class="tw-w-full tw-block tw-text-center tw-bg-[#124351] tw-text-white tw-py-2 tw-rounded-md hover:tw-bg-[#0C2830] tw-transition-colors">Login</a>`;

    // Ambil data periode aktif dari API
    let periode = 'Memuat...';
    try {
        const endpoint = isLoggedIn() ? `/settings/tahun` : `/public/settings`;
        const res = await apiFetch(endpoint);
        if (res && res.ok) {
            const data = await res.json();
            // Data bisa berupa objek tunggal (admin) atau array (publik)
            let setting = isLoggedIn() ? data : (Array.isArray(data) ? data.find(s => s.role === roleText) : data);
            if (setting && setting.nilai) periode = setting.nilai;
            else periode = 'Belum diatur';
        } else {
             periode = 'Gagal memuat';
        }
    } catch(e) { 
        console.error("Gagal memuat periode:", e);
        periode = 'Error';
    }

    // Bangun HTML lengkap untuk sidebar
    container.innerHTML = `
      <div class="tw-py-6 tw-px-5 tw-border-b tw-border-[#124351]/50">
        <div>
            <h1 class="tw-text-xl tw-font-bold">${roleText} Panel</h1>
            <p class="tw-text-xs tw-opacity-80">SMAN 10 Bandung</p>
        </div>
      </div>
      <nav class="tw-px-3 tw-pt-4 tw-flex-1">
        ${generateNavLinks()}
      </nav>
      <div class="tw-px-4 tw-py-4 tw-border-t tw-border-[#124351]/50">
        <div class="tw-mb-4">
            <p class="tw-text-xs tw-opacity-80">Periode aktif</p>
            <p class="tw-text-sm tw-font-semibold">${periode}</p>
        </div>
        ${authButtonHTML}
      </div>`;
}

/**
 * Memperbarui teks dinamis di halaman (seperti judul) berdasarkan peran pengguna.
 */
function updateDynamicText() {
    const role = getRole() || 'OSIS'; // Default OSIS jika tidak login
    
    // Update judul halaman (<title>) jika elemennya ada
    const pageTitleDashboard = document.getElementById('page-title-dashboard');
    if (pageTitleDashboard) pageTitleDashboard.textContent = `${role} Panel — Dashboard`;
    const pageTitleProfil = document.getElementById('page-title-profil');
    if (pageTitleProfil) pageTitleProfil.textContent = `Profil Pengurus ${role}`;
    
    // Update judul di dalam konten (<h1>, <h2>) jika elemennya ada
    const dashboardTitle = document.getElementById('dashboard-title');
    if (dashboardTitle) dashboardTitle.textContent = `Dashboard ${role}`;
    const profilTitle = document.getElementById('profil-title');
    if (profilTitle) profilTitle.textContent = `Profil Pengurus ${role}`;
    const leadershipTitle = document.getElementById('leadership-title');
    if (leadershipTitle) leadershipTitle.textContent = `Ketua & Wakil Ketua ${role}`;
    const staffTitle = document.getElementById('staff-title');
    if(staffTitle) staffTitle.textContent = `Anggota ${role}`;
    const totalAnggotaDesc = document.getElementById('total-anggota-desc');
    if(totalAnggotaDesc) totalAnggotaDesc.textContent = `Seluruh anggota ${role} yang terdaftar`;
}


// ===================================
// PAGE LOADERS (Fungsi untuk memuat data spesifik per halaman)
// ===================================

/**
 * Memuat data dinamis untuk halaman index (portal utama).
 * Menampilkan beberapa proker dan berita terbaru.
 */
async function loadIndexPage() {
    try {
        const [prokerRes, beritaRes] = await Promise.all([
            apiFetch('/public/proker'), 
            apiFetch('/public/berita')
        ]);

        if (!prokerRes || !beritaRes) {
             throw new Error("Gagal mengambil data publik.");
        }

        const allProker = await prokerRes.json();
        const allBerita = await beritaRes.json();

        // Render Program Kerja (maksimal 4)
        const prokerListEl = document.getElementById('prokerList');
        if (prokerListEl) {
            const prokerToShow = allProker.slice(0, 4);
            prokerListEl.innerHTML = prokerToShow.map(p => createProkerCard(p, false)).join('') // false = bukan admin
                           || `<p class="tw-col-span-full tw-text-gray-500 tw-text-center">Belum ada program kerja.</p>`;
        }

        // Render Berita (maksimal 3)
        const beritaListEl = document.getElementById('berita-list');
        if (beritaListEl) {
            const beritaToShow = allBerita.slice(0, 3);
            beritaListEl.innerHTML = beritaToShow.map(b => createBeritaCard(b, false)).join('') // false = bukan admin
                           || `<p class="tw-col-span-full tw-text-gray-500 tw-text-center">Belum ada berita.</p>`;
        }

    } catch (error) {
        console.error("Gagal memuat data index page:", error);
        // Tampilkan pesan error di UI
        const prokerListEl = document.getElementById('prokerList');
        if (prokerListEl) prokerListEl.innerHTML = `<p class="tw-col-span-full tw-text-red-500 tw-text-center">Gagal memuat program kerja.</p>`;
        const beritaListEl = document.getElementById('berita-list');
        if (beritaListEl) beritaListEl.innerHTML = `<p class="tw-col-span-full tw-text-red-500 tw-text-center">Gagal memuat berita.</p>`;
    }
}

/**
 * Menyiapkan form login dan menangani proses login.
 */
function setupLoginForm() {
    // Jika sudah login, redirect ke dashboard
    if(isLoggedIn()){ window.location.href = 'dashboard.html'; return; }
    
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return; // Pastikan form ada
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorMsg = document.getElementById('error-message');
        if (!usernameInput || !passwordInput || !errorMsg) return; // Pastikan elemen ada

        const username = usernameInput.value;
        const password = passwordInput.value;
        errorMsg.textContent = ''; // Hapus pesan error sebelumnya

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            
            if (!response.ok) {
                 throw new Error(data.error || 'Login gagal!');
            }

            // Simpan token dan role, lalu redirect
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.role);
            window.location.href = 'dashboard.html';

        } catch (error) {
            errorMsg.textContent = error.message;
        }
    });
}

/**
 * Memuat data dinamis untuk halaman dashboard.
 * Menampilkan statistik, agenda terbaru, berita terbaru, dan pengaturan periode (admin).
 */
async function loadDashboardPage() {
    updateDynamicText(); // Update judul sesuai role
    try {
        // Tentukan endpoint berdasarkan status login
        const memberEndpoint = isLoggedIn() ? '/members' : '/public/members';
        const prokerEndpoint = isLoggedIn() ? '/proker' : '/public/proker';
        const beritaEndpoint = isLoggedIn() ? '/berita' : '/public/berita';

        // Ambil semua data secara paralel
        const [membersRes, prokerRes, beritaRes] = await Promise.all([
            apiFetch(memberEndpoint), apiFetch(prokerEndpoint), apiFetch(beritaEndpoint)
        ]);

        // Cek jika salah satu request gagal
        if (!membersRes || !prokerRes || !beritaRes || !membersRes.ok || !prokerRes.ok || !beritaRes.ok) {
            throw new Error("Gagal mengambil data dashboard.");
        }

        let members = await membersRes.json();
        const allProker = await prokerRes.json();
        const allBerita = await beritaRes.json();

        // Jika tidak login, filter anggota hanya OSIS (sesuai kebutuhan Anda)
        if (!isLoggedIn()) {
            members = members.filter(m => m.role === 'OSIS');
        }
        
        // Update Statistik
        const totalAnggotaEl = document.getElementById('total-anggota');
        if (totalAnggotaEl) totalAnggotaEl.textContent = members.length;
        const prokerAktifEl = document.getElementById('proker-aktif');
        if (prokerAktifEl) prokerAktifEl.textContent = allProker.filter(p => p.status === 'Berlangsung').length;
        
        // Update Tabel Agenda (3 terdekat)
        const agendaBodyEl = document.getElementById('agenda-tbody');
        if (agendaBodyEl) {
            const sortedAgenda = [...allProker].sort((a, b) => new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai));
            agendaBodyEl.innerHTML = sortedAgenda.slice(0, 3).map(p => {
                let statusClass = 'tw-text-gray-700 tw-bg-gray-100'; // Default: Selesai/Lainnya
                if (p.status === 'Berlangsung') statusClass = 'tw-text-green-700 tw-bg-green-100';
                if (p.status === 'Direncanakan') statusClass = 'tw-text-yellow-800 tw-bg-yellow-100';
                const formattedDate = new Date(p.tanggal_mulai).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'});
                return `
                <tr class="tw-border-t">
                    <td class="tw-p-3">${formattedDate}</td>
                    <td class="tw-p-3">${p.nama}</td>
                    <td class="tw-p-3">${p.divisi}</td>
                    <td class="tw-p-3"><span class="tw-inline-block tw-px-3 tw-py-1 tw-rounded-full tw-text-xs tw-font-semibold ${statusClass}">${p.status}</span></td>
                </tr>`;
            }).join('') || `<tr><td colspan="4" class="tw-p-3 tw-text-center tw-text-gray-400">Tidak ada agenda.</td></tr>`;
        }

        // Update Daftar Berita Terbaru (3 terakhir)
        const beritaContainerEl = document.getElementById('berita-list-dashboard');
        if (beritaContainerEl) {
            // Urutkan berita berdasarkan tanggal publikasi (terbaru dulu) jika perlu
             const sortedBerita = [...allBerita].sort((a, b) => new Date(b.tanggal_publikasi) - new Date(a.tanggal_publikasi));
            beritaContainerEl.innerHTML = sortedBerita.slice(0, 3).map(b => `
                <article class="tw-bg-white tw-rounded-lg tw-shadow tw-p-4 hover:tw-shadow-md tw-transition-shadow">
                     <a href="berita-detail.html?id=${b.id}">
                        <img src="${b.gambar[0] || 'https://via.placeholder.com/600x300?text=Berita'}" alt="${b.judul}" class="tw-w-full tw-h-40 tw-object-cover tw-rounded-md tw-mb-3">
                        <h4 class="tw-font-semibold tw-text-[#1C768F]">${b.judul}</h4>
                        <p class="tw-text-sm tw-text-gray-600 tw-mt-1">${b.konten.substring(0, 80)}...</p>
                     </a>
                </article>
            `).join('') || `<p class="tw-col-span-full tw-text-gray-500 tw-text-center">Tidak ada berita.</p>`;
        }

        // Tampilkan elemen khusus admin jika login
        if (isLoggedIn()) {
            const adminSection = document.getElementById('admin-periode-section');
            const userInfoContainer = document.getElementById('user-info-container');
            if (adminSection) adminSection.classList.remove('tw-hidden');
            if (userInfoContainer) {
                userInfoContainer.classList.remove('tw-hidden');
                userInfoContainer.innerHTML = `
                    <div class="tw-text-right">
                        <p class="tw-text-xs tw-text-gray-500">Pengguna</p>
                        <p class="tw-font-semibold">${getRole()}</p>
                    </div>`;
            }
            loadPeriodeSetting(); // Muat pengaturan periode
        }
    } catch (error) { 
        console.error("Gagal memuat data dashboard:", error); 
        // Tambahkan feedback error ke UI jika perlu
    }
}

/**
 * Memuat dan menyiapkan form pengaturan periode untuk admin.
 */
async function loadPeriodeSetting() {
    try {
        const res = await apiFetch('/settings/tahun'); 
        if (!res || !res.ok) throw new Error('Gagal memuat periode');
        
        const setting = await res.json();
        const inputPeriode = document.getElementById('tahun-periode');
        if (inputPeriode && setting) inputPeriode.value = setting.nilai || '';
        
        // Pasang event listener HANYA SEKALI
        const periodeForm = document.getElementById('periode-form');
        if (periodeForm && !periodeForm.dataset.listenerAttached) {
            periodeForm.addEventListener('submit', handlePeriodeUpdate);
            periodeForm.dataset.listenerAttached = 'true'; // Tandai sudah dipasang
        }
    } catch(e) {
        console.error(e.message);
        const messageEl = document.getElementById('periode-message');
        if (messageEl) messageEl.textContent = 'Gagal memuat data periode.';
    }
}

/**
 * Menangani submit form pembaruan periode oleh admin.
 */
async function handlePeriodeUpdate(event) {
    event.preventDefault();
    const inputPeriode = document.getElementById('tahun-periode');
    const messageEl = document.getElementById('periode-message');
    if (!inputPeriode || !messageEl) return;

    const newValue = inputPeriode.value;
    messageEl.textContent = 'Menyimpan...';
    messageEl.className = 'tw-text-sm tw-text-gray-500 tw-mt-2 h-4'; // Reset style

    try {
        const res = await apiFetch('/settings/tahun', {
            method: 'PUT',
            body: JSON.stringify({ nilai: newValue })
        });
        
        if (!res || !res.ok) {
            let errorMsg = 'Gagal menyimpan perubahan.';
            try { // Coba parsing error dari server
                const errorData = await res.json();
                errorMsg = errorData.error || errorMsg;
            } catch (_) {} // Abaikan jika parsing gagal
            throw new Error(errorMsg);
        }

        messageEl.textContent = 'Periode berhasil diperbarui!';
        messageEl.className = 'tw-text-sm tw-text-green-600 tw-mt-2 h-4';
        
        // Render ulang sidebar untuk update periode yang ditampilkan
        renderSidebar('dashboard.html'); 
        
        // Hapus pesan sukses setelah beberapa detik
        setTimeout(() => { messageEl.textContent = ''; }, 3000);

    } catch (e) {
        messageEl.textContent = e.message;
        messageEl.className = 'tw-text-sm tw-text-red-600 tw-mt-2 h-4';
    }
}

/**
 * Memuat daftar program kerja.
 */
async function loadProkerPage() {
    const endpoint = isLoggedIn() ? '/proker' : '/public/proker';
    const res = await apiFetch(endpoint);
    if (!res || !res.ok) {
        // Handle error: tampilkan pesan di UI
        const prokerListEl = document.getElementById('prokerList');
        if (prokerListEl) prokerListEl.innerHTML = '<p class="tw-col-span-full tw-text-red-500 tw-text-center">Gagal memuat data program kerja.</p>';
        return;
    }
    
    const proker = await res.json();
    currentProkerData = proker; // Simpan data untuk modal edit
    
    const prokerListEl = document.getElementById('prokerList');
    if (prokerListEl) {
        prokerListEl.innerHTML = proker.map(p => createProkerCard(p, isLoggedIn())).join('') 
                       || `<p class="tw-col-span-full tw-text-gray-500 tw-text-center">Tidak ada program kerja.</p>`;
    }
    
    // Tampilkan tombol "Buat Baru" dan siapkan modal jika admin login
    if (isLoggedIn()) {
        const adminActionEl = document.getElementById('admin-action-container');
        if (adminActionEl) {
            adminActionEl.innerHTML = `<button onclick="openProkerModal()" class="tw-bg-[#1C768F] tw-text-white tw-px-4 tw-py-2 tw-rounded-md hover:tw-bg-[#124351] tw-transition-colors">+ Buat Proker Baru</button>`;
        }
        
        // Siapkan HTML modal (biasanya hanya perlu sekali saat load)
        const modalContainerEl = document.getElementById('modal-container');
        if (modalContainerEl && !document.getElementById('proker-modal')) { // Cek jika modal belum ada
            modalContainerEl.innerHTML += createModal('proker-modal', 'Form Program Kerja', prokerFormHTML, 'handleProkerForm');
        }
    }
}

/**
 * Memuat detail satu program kerja.
 */
async function loadProkerDetailPage() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
         console.error("ID Proker tidak ditemukan di URL.");
         // Bisa redirect atau tampilkan pesan error
         return;
    }

    const res = await apiFetch(`/public/proker/${id}`);
    if (!res || !res.ok) {
        // Handle error
        const detailContainer = document.getElementById('detail-content-container');
        if (detailContainer) detailContainer.innerHTML = '<p class="tw-text-red-500 tw-text-center">Gagal memuat detail program kerja.</p>';
        return;
    }

    const proker = await res.json();
    
    const detailContainer = document.getElementById('detail-content-container');
    if (detailContainer) {
        // Gunakan fungsi galeri baru
        detailContainer.innerHTML = `
            ${createPhotoGalleryHTML(proker.gambar)} 
            <h2 class="tw-text-2xl md:tw-text-3xl tw-font-bold tw-text-[#1C768F] tw-mt-6">${proker.nama}</h2>
            <p class="tw-text-sm tw-text-gray-500 tw-mt-1">
                Tanggal Mulai: ${new Date(proker.tanggal_mulai).toLocaleDateString('id-ID', { dateStyle: 'long' })} | Divisi: ${proker.divisi} | Status: ${proker.status}
            </p>
            <div class="tw-mt-6 tw-text-gray-700 tw-leading-relaxed prose max-w-none">
                ${proker.deskripsi.replace(/\n/g, '<br>')}
            </div>
        `;
    }
    
    // Siapkan bagian Tanya Jawab
    setupQnA(id, 'proker', proker.role); 
    
    // Suntikkan modal galeri jika belum ada
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer && !document.getElementById('gallery-modal')) {
        modalContainer.innerHTML += createGalleryModalHTML();
    }
}

/**
 * Memuat daftar berita.
 */
async function loadBeritaPage() {
    const endpoint = isLoggedIn() ? '/berita' : '/public/berita';
    const res = await apiFetch(endpoint);
     if (!res || !res.ok) {
        const beritaListEl = document.getElementById('berita-list');
        if (beritaListEl) beritaListEl.innerHTML = '<p class="tw-col-span-full tw-text-red-500 tw-text-center">Gagal memuat data berita.</p>';
        return;
    }
    
    const berita = await res.json();
    currentBeritaData = berita; // Simpan untuk modal edit
    
    const beritaListEl = document.getElementById('berita-list');
    if (beritaListEl) {
        // Urutkan berita berdasarkan tanggal publikasi (terbaru dulu)
        const sortedBerita = [...berita].sort((a, b) => new Date(b.tanggal_publikasi) - new Date(a.tanggal_publikasi));
        beritaListEl.innerHTML = sortedBerita.map(b => createBeritaCard(b, isLoggedIn())).join('') 
                      || `<p class="tw-col-span-full tw-text-gray-500 tw-text-center">Tidak ada berita.</p>`;
    }
    
    // Tampilkan tombol "Tulis Baru" dan siapkan modal jika admin login
    if (isLoggedIn()) {
        const adminActionEl = document.getElementById('admin-action-container');
        if (adminActionEl) {
            adminActionEl.innerHTML = `<button onclick="openBeritaModal()" class="tw-bg-[#1C768F] tw-text-white tw-px-4 tw-py-2 tw-rounded-md hover:tw-bg-[#124351] tw-transition-colors">+ Tulis Berita</button>`;
        }
        
        const modalContainerEl = document.getElementById('modal-container');
        if (modalContainerEl && !document.getElementById('berita-modal')) {
             modalContainerEl.innerHTML += createModal('berita-modal', 'Form Berita', beritaFormHTML, 'handleBeritaForm');
        }
    }
}

/**
 * Memuat detail satu berita.
 */
async function loadBeritaDetailPage() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
        console.error("ID Berita tidak ditemukan di URL.");
        return;
    }

    const res = await apiFetch(`/public/berita/${id}`);
    if (!res || !res.ok) {
        const detailContainer = document.getElementById('detail-content-container');
        if (detailContainer) detailContainer.innerHTML = '<p class="tw-text-red-500 tw-text-center">Gagal memuat detail berita.</p>';
        return;
    }

    const berita = await res.json();

    const detailContainer = document.getElementById('detail-content-container');
    if (detailContainer) {
        // Gunakan fungsi galeri baru
        detailContainer.innerHTML = `
            ${createPhotoGalleryHTML(berita.gambar)} 
            <h2 class="tw-text-2xl md:tw-text-3xl tw-font-bold tw-text-[#1C768F] tw-mt-6">${berita.judul}</h2>
            <p class="tw-text-sm tw-text-gray-500 tw-mt-1">
                Dipublikasikan: ${new Date(berita.tanggal_publikasi).toLocaleDateString('id-ID', { dateStyle: 'long', hour: '2-digit', minute: '2-digit' })}
            </p>
            <div class="tw-mt-6 tw-text-gray-700 tw-leading-relaxed prose max-w-none">
                ${berita.konten.replace(/\n/g, '<br>')}
            </div>
        `;
    }
    
    // Siapkan bagian Tanya Jawab
    setupQnA(id, 'berita', berita.role); 
    
    // Suntikkan modal galeri jika belum ada
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer && !document.getElementById('gallery-modal')) {
        modalContainer.innerHTML += createGalleryModalHTML();
    }
}

/**
 * Memuat daftar anggota OSIS/MPK untuk halaman profil.
 */
async function loadProfilPage() {
    updateDynamicText(); // Update judul sesuai role
    const endpoint = isLoggedIn() ? '/members' : '/public/members';
    const res = await apiFetch(endpoint);
    if (!res || !res.ok) {
        // Handle error
        const leadershipEl = document.getElementById('leadership');
        if (leadershipEl) leadershipEl.innerHTML = '<p class="tw-col-span-full tw-text-red-500 tw-text-center">Gagal memuat data pimpinan.</p>';
        const staffEl = document.getElementById('staff');
        if (staffEl) staffEl.innerHTML = '<p class="tw-col-span-full tw-text-red-500 tw-text-center">Gagal memuat data anggota.</p>';
        return;
    }

    let members = await res.json();
    currentMembersData = members; // Simpan untuk modal edit

    if (!isLoggedIn()) {
        // Tampilan Publik: Pisahkan OSIS dan MPK
        const osisMembers = members.filter(m => m.role === 'OSIS');
        const mpkMembers = members.filter(m => m.role === 'MPK');
        
        // Update judul section OSIS
        const leadershipTitleEl = document.getElementById('leadership-title');
        if (leadershipTitleEl) leadershipTitleEl.textContent = 'Ketua & Wakil Ketua OSIS';
        const staffTitleEl = document.getElementById('staff-title');
        if (staffTitleEl) staffTitleEl.textContent = 'Anggota OSIS';
        
        renderProfil(osisMembers, false); // Render OSIS (isMpk = false)
        
        // Buat section MPK secara dinamis jika belum ada
        const main = document.querySelector('main');
        if (main && !document.getElementById('leadership-mpk')) {
            const mpkLeadershipSection = document.createElement('section');
            mpkLeadershipSection.className = 'tw-bg-white tw-rounded-2xl tw-shadow tw-p-8 tw-mb-10 tw-mt-10';
            mpkLeadershipSection.innerHTML = `
                <h2 class="tw-text-2xl tw-font-semibold tw-text-center tw-mb-6">Ketua & Wakil Ketua MPK</h2>
                <div id="leadership-mpk" class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6 tw-justify-items-center">
                   <p class="tw-col-span-full tw-text-center tw-text-gray-500">Memuat data...</p> 
                </div>`;

            const mpkStaffSection = document.createElement('section');
            mpkStaffSection.className = 'tw-bg-white tw-rounded-2xl tw-shadow tw-p-8';
            mpkStaffSection.innerHTML = `
                <h2 class="tw-text-2xl tw-font-semibold tw-mb-6">Anggota MPK</h2>
                <div id="staff-mpk" class="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6 tw-justify-items-center">
                   <p class="tw-col-span-full tw-text-center tw-text-gray-500">Memuat data...</p> 
                </div>`;

            main.appendChild(mpkLeadershipSection);
            main.appendChild(mpkStaffSection);
        }
        
        renderProfil(mpkMembers, true); // Render MPK (isMpk = true)

    } else {
        // Tampilan Admin: Tampilkan semua anggota sesuai role admin
        renderProfil(members, false); // Render semua (isMpk = false, akan menampilkan sesuai role di data)
        
        // Tampilkan tombol "Tambah Anggota"
        const adminActionEl = document.getElementById('admin-action-container');
        if (adminActionEl) {
            adminActionEl.innerHTML = `<button onclick="openMemberModal()" class="tw-bg-[#1C768F] tw-text-white tw-px-4 tw-py-2 tw-rounded-lg hover:tw-bg-[#124351] tw-transition-colors">+ Tambah Anggota</button>`;
        }
        
        // Pasang event listener untuk form popup HANYA SEKALI
        const osisFormEl = document.getElementById('osisForm');
        if (osisFormEl && !osisFormEl.dataset.listenerAttached) {
            osisFormEl.onsubmit = handleMemberForm;
             osisFormEl.dataset.listenerAttached = 'true';
        }
        const cancelBtnEl = document.getElementById('cancel-btn');
        if (cancelBtnEl && !cancelBtnEl.dataset.listenerAttached) {
             cancelBtnEl.onclick = () => document.getElementById('formPopup').classList.add('tw-hidden');
             cancelBtnEl.dataset.listenerAttached = 'true';
        }
    }
}

/**
 * Merender daftar anggota (pimpinan dan staf) ke dalam elemen HTML yang sesuai.
 * @param {Array} members - Array objek anggota.
 * @param {boolean} isMpk - Flag untuk menentukan apakah ini render khusus MPK (untuk tampilan publik).
 */
function renderProfil(members, isMpk = false) {
    const leadershipId = isMpk ? 'leadership-mpk' : 'leadership';
    const staffId = isMpk ? 'staff-mpk' : 'staff';
    const leadershipEl = document.getElementById(leadershipId);
    const staffEl = document.getElementById(staffId);
    
    // Hentikan jika elemen target tidak ditemukan
    if(!leadershipEl || !staffEl) {
        console.warn(`Elemen ${leadershipId} atau ${staffId} tidak ditemukan.`);
        return;
    }

    leadershipEl.innerHTML = ''; // Kosongkan sebelum mengisi
    staffEl.innerHTML = '';

    // Logika sorting berdasarkan jabatan (prioritaskan ketua, wakil, lalu nama)
    members.sort((a, b) => {
        const getPeringkat = (jabatan) => {
            const jbtn = jabatan.toLowerCase();
            if (jbtn.includes('ketua osis umum')) return 1;
            if (jbtn.includes('ketua osis 1')) return 2;
            if (jbtn.includes('ketua osis 2')) return 3;
            if (jbtn.includes('ketua mpk')) return 4;
            if (jbtn.includes('wakil ketua')) return 5;
            // Tambahkan peringkat lain jika perlu
            return 99; // Anggota biasa
        };

        const peringkatA = getPeringkat(a.jabatan);
        const peringkatB = getPeringkat(b.jabatan);
        
        if (peringkatA !== peringkatB) {
            return peringkatA - peringkatB; // Urutkan berdasarkan peringkat
        }
        return a.nama.localeCompare(b.nama); // Jika peringkat sama, urutkan berdasarkan nama
    });
    
    // Pisahkan anggota ke pimpinan atau staf berdasarkan jabatan
    members.forEach(member => {
        const cardHTML = createMemberCard(member, isLoggedIn());
        const jabatanLower = member.jabatan.toLowerCase();

        // Kondisi untuk dikategorikan sebagai pimpinan
        const isPimpinan = jabatanLower.includes('ketua osis umum') || 
                           jabatanLower.includes('ketua osis 1') || 
                           jabatanLower.includes('ketua osis 2') || 
                           jabatanLower.includes('ketua mpk') || 
                           jabatanLower.includes('wakil');

        if (isPimpinan) {
            leadershipEl.innerHTML += cardHTML;
        } else {
            staffEl.innerHTML += cardHTML;
        }
    });

    // Tampilkan pesan jika tidak ada data
    if(leadershipEl.innerHTML === '') leadershipEl.innerHTML = `<p class="tw-col-span-full tw-text-center tw-text-gray-500">Data pimpinan tidak ditemukan.</p>`;
    if(staffEl.innerHTML === '') staffEl.innerHTML = `<p class="tw-col-span-full tw-text-center tw-text-gray-500">Data anggota tidak ditemukan.</p>`;
}


// ===================================
// CARD & COMPONENT CREATORS (Fungsi untuk membuat elemen HTML)
// ===================================

/**
 * Membuat HTML untuk satu kartu program kerja.
 * @param {object} p - Objek data program kerja.
 * @param {boolean} isAdmin - Menentukan apakah tombol admin ditampilkan.
 * @returns {string} - String HTML kartu.
 */
function createProkerCard(p, isAdmin) {
    const defaultImage = 'https://via.placeholder.com/800x300?text=Proker';
    const imageUrl = p.gambar && p.gambar.length > 0 ? p.gambar[0] : defaultImage;
    const formattedDate = new Date(p.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'});

    return `
    <article class="tw-bg-white tw-rounded-xl tw-shadow hover:tw-shadow-lg tw-transition-shadow tw-overflow-hidden" data-id="${p.id}">
        <div class="tw-cursor-pointer" onclick="navigateToDetail(event, 'proker-detail.html?id=${p.id}')">
            <img src="${imageUrl}" class="tw-w-full tw-h-56 tw-object-cover" alt="${p.nama}">
            <div class="tw-p-4">
                <h3 class="tw-font-semibold tw-text-lg tw-text-[#1C768F] tw-truncate">${p.nama}</h3>
            </div>
        </div>
        <div class="tw-p-4 tw-pt-0">
            <div class="tw-flex tw-items-center tw-justify-between">
                <div class="tw-text-xs tw-text-gray-500">${formattedDate} • ${p.divisi}</div>
                ${isAdmin ? `
                    <div class="tw-flex tw-gap-2">
                        <button onclick="event.stopPropagation(); openProkerModal(${p.id})" class="tw-text-xs tw-px-3 tw-py-1 tw-rounded-md tw-border hover:tw-bg-gray-50">Edit</button>
                        <button onclick="event.stopPropagation(); deleteItem('/proker', ${p.id}, loadProkerPage)" class="tw-text-xs tw-px-3 tw-py-1 tw-rounded-md tw-bg-red-50 tw-text-red-600 hover:tw-bg-red-100">Hapus</button>
                    </div>` : ''}
            </div>
        </div>
    </article>`;
}

/**
 * Membuat HTML untuk satu kartu berita.
 * @param {object} b - Objek data berita.
 * @param {boolean} isAdmin - Menentukan apakah tombol admin ditampilkan.
 * @returns {string} - String HTML kartu.
 */
function createBeritaCard(b, isAdmin) {
    const defaultImage = 'https://via.placeholder.com/900x400?text=Berita';
    const imageUrl = b.gambar && b.gambar.length > 0 ? b.gambar[0] : defaultImage;
    const formattedDate = new Date(b.tanggal_publikasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric'});

    return `
    <article class="tw-bg-white tw-rounded-xl tw-shadow hover:tw-shadow-lg tw-transition-shadow tw-overflow-hidden" data-id="${b.id}">
        <div class="tw-cursor-pointer" onclick="navigateToDetail(event, 'berita-detail.html?id=${b.id}')">
            <img src="${imageUrl}" class="tw-w-full tw-h-56 tw-object-cover" alt="${b.judul}">
            <div class="tw-p-4">
                 <h3 class="tw-text-lg tw-font-semibold tw-text-[#1C768F] tw-truncate">${b.judul}</h3>
             </div>
        </div>
        <div class="tw-p-4 tw-pt-0">
            <div class="tw-flex tw-items-center tw-justify-between">
                <small class="tw-text-xs tw-text-gray-500">Dipublikasikan ${formattedDate}</small>
                ${isAdmin ? `
                <div class="tw-flex tw-gap-2">
                    <button onclick="event.stopPropagation(); openBeritaModal(${b.id})" class="tw-text-xs tw-px-3 tw-py-1 tw-rounded-md tw-border hover:tw-bg-gray-50">Edit</button>
                    <button onclick="event.stopPropagation(); deleteItem('/berita', ${b.id}, loadBeritaPage)" class="tw-text-xs tw-px-3 tw-py-1 tw-rounded-md tw-bg-red-50 tw-text-red-600 hover:tw-bg-red-100">Hapus</button>
                </div>` : ''}
            </div>
        </div>
    </article>`;
}

/**
 * Membuat HTML untuk satu kartu anggota profil.
 * @param {object} m - Objek data anggota.
 * @param {boolean} isAdmin - Menentukan apakah tombol admin ditampilkan.
 * @returns {string} - String HTML kartu.
 */
function createMemberCard(m, isAdmin) {
     const defaultImage = 'https://via.placeholder.com/300x300?text=Foto';
     const imageUrl = m.url_foto || defaultImage;

    return `
    <div class="tw-w-full tw-text-center">
        <div class="tw-relative tw-mb-4 tw-w-64 tw-mx-auto">
            <div class="tw-absolute tw-top-2.5 tw-right-2.5 tw-w-full tw-h-64 tw-bg-[#1C768F] tw-rounded-lg"></div>
            <img src="${imageUrl}" 
                 alt="Foto ${m.nama}"
                 class="tw-relative tw-w-full tw-h-64 tw-object-cover tw-rounded-lg tw-shadow-lg tw-transition-all">
        </div>
        <div class="tw-px-1">
            <h4 class="tw-font-bold tw-text-lg tw-text-gray-900">${m.nama}</h4>
            <p class="tw-text-[#1C768F] tw-text-sm">${m.jabatan}</p>
            <div class="tw-mt-3 tw-pt-3 tw-border-t tw-border-gray-200">
                <p class="tw-text-xs tw-text-gray-500">NISN</p>
                <p class="tw-text-sm tw-text-gray-800">${m.nisn}</p>
            </div>
        </div>
        ${isAdmin ? `
        <div class="tw-flex tw-justify-center tw-gap-2 tw-mt-4">
            <button onclick="event.stopPropagation(); openMemberModal(${m.id})" 
                    class="tw-text-xs tw-bg-yellow-400 tw-text-white tw-px-3 tw-py-1 tw-rounded hover:tw-bg-yellow-500 tw-transition-colors">Edit</button>
            <button onclick="event.stopPropagation(); deleteItem('/members', ${m.id}, loadProfilPage)" 
                    class="tw-text-xs tw-bg-red-500 tw-text-white tw-px-3 tw-py-1 tw-rounded hover:tw-bg-red-600 tw-transition-colors">Hapus</button>
        </div>` : ''}
    </div>`;
}

/**
 * Fungsi navigasi ke halaman detail. Mencegah navigasi jika tombol di dalam kartu diklik.
 * @param {Event} event - Objek event klik.
 * @param {string} url - URL tujuan.
 */
function navigateToDetail(event, url) {
    // Cek apakah target klik atau parent-nya adalah button
    if (event.target.closest('button')) {
        return; // Jangan navigasi jika tombol diklik
    }
    window.location.href = url;
}


// ===================================
// PHOTO GALLERY LOGIC
// ===================================

/**
 * Membuat HTML untuk galeri foto grid yang responsif di halaman detail.
 * @param {Array<string>} images - Array URL gambar.
 * @returns {string} - String HTML galeri.
 */
function createPhotoGalleryHTML(images = []) {
    if (!images || images.length === 0) {
        return `<img src="https://via.placeholder.com/900x400?text=Tidak+Ada+Gambar" class="tw-w-full tw-rounded-lg tw-object-cover tw-h-72 md:tw-h-96">`;
    }

    const totalImages = images.length;
    // Escape single quotes in URLs if necessary before stringify
    const escapedImages = images.map(img => img.replace(/'/g, "\\'"));
    const imagesJson = JSON.stringify(escapedImages);


    // Kasus 1: Hanya 1 gambar
    if (totalImages === 1) {
        return `<img src="${images[0]}" alt="Gallery Image 1" class="tw-w-full tw-rounded-lg tw-object-cover tw-h-72 md:tw-h-96 tw-cursor-pointer" onclick='openGalleryModal(${imagesJson}, 0)'>`;
    }

    // Kasus 2: 2-4 gambar (Grid sederhana)
    if (totalImages < 5) {
        let gridColsClass = 'md:tw-grid-cols-3'; // Default 3
        if (totalImages === 2) gridColsClass = 'md:tw-grid-cols-2';
        if (totalImages === 4) gridColsClass = 'md:tw-grid-cols-2'; // 2x2 grid
        
        const imageElements = images.map((img, index) => `
            <div class="tw-rounded-lg tw-overflow-hidden">
                <img src="${img}" alt="Gallery Image ${index + 1}" class="tw-w-full tw-h-full md:tw-h-72 tw-object-cover tw-cursor-pointer hover:tw-opacity-90 tw-transition-opacity" onclick='openGalleryModal(${imagesJson}, ${index})'>
            </div>
        `).join('');
        
        // Mobile: 2 kolom | Desktop: Sesuai jumlah gambar
        return `<div class="tw-grid tw-grid-cols-2 ${gridColsClass} tw-gap-2 tw-h-72 md:tw-h-auto">${imageElements}</div>`;
    }

    // Kasus 3: 5+ gambar (Grid kompleks)
    const img1 = images[0];
    const img2 = images[1];
    const img3 = images[2];
    const img4 = images[3];
    const img5 = images[4]; // Gambar latar "Lihat Semua"

    return `
        <div class="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 md:tw-grid-rows-2 tw-gap-2 tw-h-72 md:tw-h-96">
            <div class="tw-col-span-2 md:tw-col-span-2 md:tw-row-span-2 tw-rounded-lg tw-overflow-hidden">
                <img src="${img1}" alt="Gallery Image 1" class="tw-w-full tw-h-full tw-object-cover tw-cursor-pointer hover:tw-opacity-90 tw-transition-opacity" onclick='openGalleryModal(${imagesJson}, 0)'>
            </div>
            
            <div class="tw-rounded-lg tw-overflow-hidden tw-hidden md:tw-block">
                <img src="${img2}" alt="Gallery Image 2" class="tw-w-full tw-h-full tw-object-cover tw-cursor-pointer hover:tw-opacity-90 tw-transition-opacity" onclick='openGalleryModal(${imagesJson}, 1)'>
            </div>
            
            <div class="tw-rounded-lg tw-overflow-hidden tw-hidden md:tw-block">
                <img src="${img3}" alt="Gallery Image 3" class="tw-w-full tw-h-full tw-object-cover tw-cursor-pointer hover:tw-opacity-90 tw-transition-opacity" onclick='openGalleryModal(${imagesJson}, 2)'>
            </div>
            
            <div class="tw-rounded-lg tw-overflow-hidden">
                <img src="${img4}" alt="Gallery Image 4" class="tw-w-full tw-h-full tw-object-cover tw-cursor-pointer hover:tw-opacity-90 tw-transition-opacity" onclick='openGalleryModal(${imagesJson}, 3)'>
            </div>
            
            <div class="tw-relative tw-rounded-lg tw-overflow-hidden">
                <img src="${img5}" alt="Gallery Image 5 Preview" class="tw-w-full tw-h-full tw-object-cover tw-filter tw-brightness-50">
                <button onclick='openGalleryModal(${imagesJson}, 4)' class="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-w-full tw-h-full tw-bg-black tw-bg-opacity-50 hover:tw-bg-opacity-30 tw-transition-all tw-cursor-pointer">
                    <span class="tw-text-white tw-font-semibold tw-text-base md:tw-text-lg">Lihat Semua (${totalImages})</span>
                </button>
            </div>
        </div>
    `;
}

/**
 * Membuat HTML dasar untuk modal (popup) galeri foto yang responsif.
 * @returns {string} - String HTML modal.
 */
function createGalleryModalHTML() {
    return `
    <div id="gallery-modal" class="tw-hidden tw-fixed tw-inset-0 tw-z-[100] tw-flex tw-items-center tw-justify-center tw-bg-black tw-bg-opacity-90">
        <button onclick="closeGalleryModal()" class="tw-absolute tw-top-4 tw-right-6 tw-text-white tw-text-5xl tw-z-[102] hover:tw-text-gray-300">&times;</button>
        
        <button id="gallery-prev-btn" class="tw-absolute tw-left-4 md:tw-left-8 tw-top-1/2 -tw-translate-y-1/2 tw-z-[101] tw-bg-white tw-bg-opacity-30 hover:tw-bg-opacity-50 tw-text-white tw-rounded-full tw-w-12 tw-h-12 tw-hidden md:tw-flex tw-items-center tw-justify-center tw-text-3xl tw-font-bold tw-transition-opacity disabled:tw-opacity-30 disabled:tw-cursor-not-allowed">
            &#8249;
        </button>

        <button id="gallery-next-btn" class="tw-absolute tw-right-4 md:tw-right-8 tw-top-1/2 -tw-translate-y-1/2 tw-z-[101] tw-bg-white tw-bg-opacity-30 hover:tw-bg-opacity-50 tw-text-white tw-rounded-full tw-w-12 tw-h-12 tw-hidden md:tw-flex tw-items-center tw-justify-center tw-text-3xl tw-font-bold tw-transition-opacity disabled:tw-opacity-30 disabled:tw-cursor-not-allowed">
             &#8250;
        </button>

        <div id="gallery-scroll-container" class="tw-w-full tw-h-screen"> 
            <div id="gallery-modal-content" class="tw-mx-auto"> 
            </div>
        </div>

        <div id="gallery-thumbnail-container" class="tw-absolute tw-bottom-0 tw-left-0 tw-w-full tw-p-2 tw-bg-black tw-bg-opacity-70 tw-overflow-x-auto tw-z-[101] tw-hidden">
             <div id="gallery-thumbnails" class="tw-flex tw-gap-2"></div>
        </div>
    </div>
    `;
}

/**
 * Membuka popup galeri, mengisinya dengan gambar, dan mengatur navigasi
 * secara responsif (horizontal + panah di desktop, vertikal di mobile).
 * @param {Array<string>} images - Array URL gambar.
 * @param {number} [startIndex=0] - Index gambar yang ingin ditampilkan pertama.
 */
window.openGalleryModal = (images, startIndex = 0) => {
    console.log('Tombol Galeri diklik! Data gambar:', images); // Log untuk debugging
    const modal = document.getElementById('gallery-modal');
    const content = document.getElementById('gallery-modal-content');
    const scrollContainer = document.getElementById('gallery-scroll-container');
    const prevBtn = document.getElementById('gallery-prev-btn');
    const nextBtn = document.getElementById('gallery-next-btn');
    
    // Pastikan semua elemen penting ada
    if (!modal || !content || !scrollContainer || !prevBtn || !nextBtn) {
        console.error("Elemen modal galeri tidak ditemukan.");
        return;
    }
    
    // Validasi data gambar
    if (!Array.isArray(images) || images.length === 0) {
        console.error("Data gambar tidak valid atau kosong.");
        return; // Jangan buka modal jika tidak ada gambar
    }

    content.innerHTML = ''; // Kosongkan konten sebelumnya
    
    const isMobile = window.innerWidth < 768; // Breakpoint mobile
    let currentIndex = startIndex;
    const totalImages = images.length;

    /** Fungsi internal untuk scroll ke gambar target */
    const scrollToImage = (index, behavior = 'smooth') => {
        const targetImage = content.querySelector(`#gallery-img-${index}`);
        if (targetImage) {
            targetImage.scrollIntoView({ 
                behavior: behavior, 
                block: 'center', 
                inline: 'center' 
            });
            currentIndex = index;
            if (!isMobile) updateDesktopButtons(); // Hanya update panah di desktop
        }
    };

    /** Fungsi internal untuk update status tombol panah desktop */
    const updateDesktopButtons = () => {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === totalImages - 1;
    };

    // Terapkan layout dan isi konten berdasarkan ukuran layar
    if (isMobile) {
        // --- Setup Mobile (Vertical Scroll) ---
        scrollContainer.className = 'tw-w-full tw-h-screen tw-overflow-y-auto tw-pt-16 tw-pb-8'; // Padding atas/bawah
        content.className = 'tw-max-w-3xl tw-mx-auto tw-space-y-4 tw-px-4'; // Konten vertikal, padding samping
        prevBtn.classList.add('tw-hidden'); 
        nextBtn.classList.add('tw-hidden');

        // Isi konten utama (gambar vertikal, lebar penuh)
        content.innerHTML = images.map((imgSrc, index) => 
            `<img src="${imgSrc}" 
                  alt="Gambar Galeri ${index + 1}"
                  id="gallery-img-${index}" 
                  class="tw-w-full tw-h-auto tw-rounded-lg tw-shadow-lg">`
        ).join('');
        
    } else {
        // --- Setup Desktop (Horizontal Scroll + Arrows) ---
        scrollContainer.className = 'tw-w-full tw-h-screen tw-flex tw-items-center tw-overflow-x-auto tw-snap-x tw-snap-mandatory'; 
        content.className = 'tw-flex tw-gap-4 tw-py-8 md:tw-py-16 tw-px-16 md:tw-px-20 tw-h-full tw-items-center tw-mx-auto'; // Konten horizontal, padding samping
        prevBtn.classList.remove('tw-hidden'); 
        nextBtn.classList.remove('tw-hidden');

        // Isi konten utama (gambar horizontal, tinggi 80vh)
        content.innerHTML = images.map((imgSrc, index) => 
            `<img src="${imgSrc}" 
                  alt="Gambar Galeri ${index + 1}"
                  id="gallery-img-${index}" 
                  class="tw-h-[80vh] tw-flex-shrink-0 tw-rounded-lg tw-shadow-lg tw-snap-center">`
        ).join('');

        // Pasang event listener tombol panah
        prevBtn.onclick = () => {
            if (currentIndex > 0) scrollToImage(currentIndex - 1);
        };
        nextBtn.onclick = () => {
            if (currentIndex < totalImages - 1) scrollToImage(currentIndex + 1);
        };
    }

    // Tampilkan modal
    modal.classList.remove('tw-hidden'); 
    
    // Lakukan scroll awal ke gambar yang dipilih (tanpa animasi)
    // Dijalankan setelah modal tampil agar kalkulasi posisi benar
    requestAnimationFrame(() => {
        scrollToImage(startIndex, 'auto');
    });
};

/**
 * Menutup popup galeri foto.
 */
window.closeGalleryModal = () => {
    const modal = document.getElementById('gallery-modal');
    if (modal) modal.classList.add('tw-hidden');
};


// ===================================
// QNA LOGIC (Tanya Jawab)
// ===================================

/** Helper untuk memformat tanggal Q&A */
function formatQnaDate(dateString) {
    if (!dateString) return ''; 
    try {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return ''; }
}

/**
 * Menyiapkan bagian Tanya Jawab di halaman detail.
 * Mengatur tampilan form (publik vs admin) dan memasang event listener.
 * @param {number|string} itemId - ID dari item (proker/berita) yang dikomentari.
 * @param {string} itemType - Tipe item ('proker' atau 'berita').
 * @param {string} itemRole - Role terkait item (misal 'OSIS').
 */
async function setupQnA(itemId, itemType, itemRole) {
    const qnaItemIdEl = document.getElementById('qna-item-id');
    const qnaRoleEl = document.getElementById('qna-role');
    const publicForm = document.getElementById('qna-form');
    const adminContainer = document.getElementById('qna-admin-container');
    const adminList = document.getElementById('qna-admin-list');

    // Hentikan jika elemen dasar QnA tidak ada
    if (!qnaItemIdEl || !qnaRoleEl || !publicForm || !adminContainer || !adminList) {
        console.warn("Elemen QnA tidak lengkap di halaman ini.");
        return; 
    }
    
    qnaItemIdEl.value = itemId;
    qnaRoleEl.value = itemRole;
    
    // Selalu muat daftar Q&A publik
    loadQnaList(itemId, itemType);
    
    if(isLoggedIn()){
        // --- Tampilan Admin ---
        publicForm.classList.add('tw-hidden'); // Sembunyikan form publik
        adminContainer.classList.remove('tw-hidden'); // Tampilkan kontainer admin
        
        loadAdminQnaToAnswer(itemId, itemType); // Muat pertanyaan untuk dijawab

        // Pasang event listener untuk tombol "Balas" HANYA SEKALI
        if (!adminList.dataset.listenerAttached) {
            adminList.addEventListener('click', (e) => {
                if (e.target.dataset.action === 'toggle-reply') {
                    // Cari form balasan yang tepat (sibling setelah tombol)
                    const form = e.target.nextElementSibling; 
                    if (form && form.tagName === 'FORM') {
                        form.classList.toggle('tw-hidden'); // Toggle tampilan form
                    }
                }
            });
            adminList.dataset.listenerAttached = 'true'; // Tandai sudah dipasang
        }

    } else {
        // --- Tampilan Pengguna Publik ---
        adminContainer.classList.add('tw-hidden'); // Pastikan kontainer admin tersembunyi
        publicForm.classList.remove('tw-hidden'); // Pastikan form publik terlihat

        // Pasang event listener submit form publik HANYA SEKALI
        if (!publicForm.dataset.listenerAttached) {
            publicForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const form = e.target;
                const namaInput = form.elements['nama_penanya'];
                const pertanyaanInput = form.elements['pertanyaan'];
                if (!namaInput || !pertanyaanInput) return;

                const nama = namaInput.value.trim();
                const pertanyaan = pertanyaanInput.value.trim();

                if (!nama || !pertanyaan) { 
                    Swal.fire('Input Kosong', 'Nama dan Pertanyaan tidak boleh kosong.', 'warning'); 
                    return; 
                }

                const result = await Swal.fire({
                    title: 'Konfirmasi Pertanyaan', 
                    text: "Apakah Anda yakin ingin mengirim pertanyaan ini?", 
                    icon: 'question',
                    showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33',
                    confirmButtonText: 'Ya, Kirim!', cancelButtonText: 'Batal'
                });

                if (result.isConfirmed) {
                    const data = { item_id: itemId, item_type: itemType, role: itemRole, nama_penanya: nama, pertanyaan: pertanyaan };
                    try {
                        showLoading('Mengirim pertanyaan...');
                        const res = await apiFetch('/public/qna', { method: 'POST', body: JSON.stringify(data) });
                        hideLoading();
                        if (res && res.ok) {
                            Swal.fire('Terkirim!', 'Pertanyaan Anda telah berhasil dikirim.', 'success');
                            form.reset(); 
                            loadQnaList(itemId, itemType); // Muat ulang daftar QnA
                        } else {
                            throw new Error('Gagal mengirim pertanyaan.');
                        }
                    } catch (error) {
                         hideLoading();
                         Swal.fire('Gagal', error.message || 'Terjadi kesalahan saat mengirim pertanyaan.', 'error');
                    }
                }
            });
            publicForm.dataset.listenerAttached = 'true'; // Tandai sudah dipasang
        }
    }
}

/**
 * Memuat dan menampilkan daftar pertanyaan dan jawaban publik.
 * @param {number|string} itemId - ID item terkait.
 * @param {string} itemType - Tipe item ('proker' atau 'berita').
 */
async function loadQnaList(itemId, itemType) {
    const qnaListEl = document.getElementById('qna-list');
    if (!qnaListEl) return;

    qnaListEl.innerHTML = '<p class="tw-text-gray-500">Memuat tanya jawab...</p>'; // Loading state

    try {
        const res = await apiFetch(`/public/qna/${itemType}/${itemId}`);
        if (!res || !res.ok) throw new Error('Gagal memuat data QnA.');
        
        const qnas = await res.json();
        const delimiter = '[REPLY_BREAK]'; // Pemisah balasan ganda
        
        qnaListEl.innerHTML = qnas.length === 0 ? '<p>Belum ada pertanyaan.</p>' : qnas.map(q => {
            
            const questionDate = formatQnaDate(q.created_at); // Format tanggal tanya
            
            // Render balasan ganda
            let repliesHTML = '';
            if (q.jawaban) {
                const replies = q.jawaban.split(delimiter); 
                repliesHTML = replies.map(replyText => `
                    <div class="tw-mt-3 tw-p-3 tw-bg-gray-50 tw-rounded-md tw-border tw-border-gray-200">
                        <p class="tw-font-semibold tw-text-sm tw-text-gray-800">OSIS:</p>
                        <p class="tw-text-gray-700 tw-text-sm tw-mt-1">${replyText}</p>
                    </div>
                `).join('');
            } else {
                repliesHTML = `<p class="tw-text-xs tw-text-gray-500 tw-mt-2"><i>Belum dijawab.</i></p>`;
            }

            // Render HTML untuk satu QnA item
            return `
            <div class="tw-flex tw-gap-3 tw-border-b tw-pb-4 last:tw-border-b-0">
                <div class="tw-flex-shrink-0">
                    <svg class="tw-w-10 tw-h-10 tw-rounded-full tw-bg-gray-200 tw-text-gray-500 tw-p-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
                </div>
                <div class="tw-flex-1">
                    <p class="tw-font-semibold tw-text-gray-900">${q.nama_penanya}</p>
                    <p class="tw-text-gray-700 tw-mt-1">${q.pertanyaan}</p>
                    ${questionDate ? `<p class="tw-text-xs tw-text-gray-400 tw-mt-2">${questionDate}</p>` : ''}
                    ${repliesHTML}
                </div>
            </div>`;
        }).join('');

    } catch (error) {
        console.error(error);
        qnaListEl.innerHTML = '<p class="tw-text-red-500">Gagal memuat tanya jawab.</p>';
    }
}

/**
 * Memuat dan menampilkan daftar pertanyaan untuk dijawab oleh admin.
 * @param {number|string} itemId - ID item terkait.
 * @param {string} itemType - Tipe item ('proker' atau 'berita').
 */
async function loadAdminQnaToAnswer(itemId, itemType) {
    const qnaAdminListEl = document.getElementById('qna-admin-list');
    if (!qnaAdminListEl) return;

    qnaAdminListEl.innerHTML = '<p class="tw-text-gray-500">Memuat pertanyaan...</p>'; // Loading state

    try {
        // Ambil SEMUA qna untuk item ini agar bisa dibalas ulang
        const res = await apiFetch(`/public/qna/${itemType}/${itemId}`); 
        if (!res || !res.ok) throw new Error('Gagal memuat pertanyaan untuk admin.');
        
        const allQnas = await res.json();
        const delimiter = '[REPLY_BREAK]'; // Pemisah balasan
        
        qnaAdminListEl.innerHTML = allQnas.length === 0 ? '<p>Belum ada pertanyaan pada item ini.</p>' : allQnas.map(q => {
            
            // Tampilkan riwayat balasan
            let existingRepliesHTML = '';
            if (q.jawaban) {
                const replies = q.jawaban.split(delimiter);
                existingRepliesHTML = replies.map(replyText => `
                    <div class="tw-p-3 tw-bg-gray-50 tw-rounded-md tw-border tw-border-gray-200">
                        <p class="tw-font-semibold tw-text-sm tw-text-gray-800">OSIS:</p>
                        <p class="tw-text-gray-700 tw-text-sm tw-mt-1">${replyText}</p>
                    </div>
                `).join('');
            }
            
            // Render HTML untuk satu item admin
            return `
            <div class="tw-border tw-p-3 tw-rounded-md">
                <p><strong>${q.nama_penanya}</strong>: ${q.pertanyaan}</p>
                
                ${existingRepliesHTML ? `<div class="tw-mt-3 tw-mb-3 tw-space-y-2">${existingRepliesHTML}</div>` : ''}
                
                <button data-action="toggle-reply" data-id="${q.id}" class="tw-text-sm tw-font-medium tw-text-blue-600 hover:tw-underline tw-mt-1">
                    Balas
                </button>
                
                <form class="tw-mt-2 tw-hidden" onsubmit="handleAnswerSubmit(event, ${q.id})">
                    <textarea required class="tw-w-full tw-border tw-p-2 tw-rounded" rows="2" placeholder="Tulis balasan baru..."></textarea>
                    <button type="submit" class="tw-bg-green-600 tw-text-white tw-px-3 tw-py-1 tw-rounded tw-mt-1 hover:tw-bg-green-700 tw-transition-colors">Kirim Balasan</button>
                </form>
            </div>`;
        }).join('');

    } catch (error) {
        console.error(error);
        qnaAdminListEl.innerHTML = '<p class="tw-text-red-500">Gagal memuat pertanyaan.</p>';
    }
}


// ===================================
// MODAL & FORM LOGIC (FOR ADMIN)
// ===================================

// Variabel global sementara untuk menyimpan data saat ini (untuk edit)
let currentProkerData = [];
let currentBeritaData = [];
let currentMembersData = [];

// Template HTML untuk form di dalam modal (bisa dipindah ke <template> di HTML jika diinginkan)
const prokerFormHTML = `
    <input type="hidden" name="prokerId">
    <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
        <input name="nama" required class="tw-border tw-rounded-md tw-px-3 tw-py-2" placeholder="Judul Proker">
        <select name="divisi" class="tw-border tw-rounded-md tw-px-3 tw-py-2">
            <option>Keagamaan</option><option>Upacara</option><option>MPLS</option><option>Kebersihan</option>
            <option>Open Recruitment OSIS</option><option>Kewirausahaan</option><option>Olahraga</option>
            <option>Seni</option><option>Poster Hari Besar, dan TIK</option><option>Berbahasa</option>
        </select>
        <textarea name="deskripsi" required class="tw-border tw-rounded-md tw-px-3 tw-py-2 md:tw-col-span-2" rows="4" placeholder="Deskripsi..."></textarea>
        <input name="tanggal_mulai" type="date" required class="tw-border tw-rounded-md tw-px-3 tw-py-2">
        <select name="status" class="tw-border tw-rounded-md tw-px-3 tw-py-2">
            <option>Direncanakan</option><option>Berlangsung</option><option>Selesai</option>
        </select>
        <div class="md:tw-col-span-2">
            <label class="tw-block tw-text-sm tw-mb-1">Gambar (bisa lebih dari satu, maks. 10mb total)</label>
            <input name="gambar" type="file" multiple accept="image/*" class="tw-w-full tw-border tw-p-2 tw-text-sm">
             <p class="tw-text-xs tw-text-gray-500 tw-mt-1">Kosongkan jika tidak ingin mengubah gambar.</p>
        </div>
    </div>
    <div class="tw-flex tw-gap-2 tw-mt-6 tw-justify-end">
        <button type="button" onclick="closeModal('proker-modal')" class="tw-border tw-rounded-md tw-px-4 tw-py-2 hover:tw-bg-gray-50">Batal</button>
        <button type="submit" class="tw-bg-[#1C768F] tw-text-white tw-px-4 tw-py-2 tw-rounded-md hover:tw-bg-[#124351] tw-transition-colors">Simpan</button>
    </div>`;

const beritaFormHTML = `
    <input type="hidden" name="beritaId">
    <div class="tw-space-y-4">
        <input name="judul" required class="tw-w-full tw-border tw-rounded-md tw-px-3 tw-py-2" placeholder="Judul Berita">
        <textarea name="konten" required class="tw-w-full tw-h-40 tw-border tw-rounded-md tw-px-3 tw-py-2" placeholder="Isi berita..."></textarea>
        <div>
            <label class="tw-block tw-text-sm tw-mb-1">Gambar (bisa lebih dari satu, maks. 10mb total)</label>
            <input name="gambar" type="file" multiple accept="image/*" class="tw-w-full tw-border tw-p-2 tw-text-sm">
            <p class="tw-text-xs tw-text-gray-500 tw-mt-1">Kosongkan jika tidak ingin mengubah gambar.</p>
        </div>
    </div>
    <div class="tw-flex tw-gap-2 tw-mt-6 tw-justify-end">
         <button type="button" onclick="closeModal('berita-modal')" class="tw-border tw-rounded-md tw-px-4 tw-py-2 hover:tw-bg-gray-50">Batal</button>
        <button type="submit" class="tw-bg-[#1C768F] tw-text-white tw-px-4 tw-py-2 tw-rounded-md hover:tw-bg-[#124351] tw-transition-colors">Simpan</button>
    </div>`;

/**
 * Membuat HTML dasar untuk modal popup.
 * @param {string} id - ID unik untuk elemen modal.
 * @param {string} title - Judul yang ditampilkan di header modal.
 * @param {string} formHTML - String HTML untuk konten form di dalam modal.
 * @param {string} handlerName - Nama fungsi JavaScript yang akan menangani submit form.
 * @returns {string} - String HTML modal.
 */
window.createModal = (id, title, formHTML, handlerName) => `
    <div id="${id}" class="tw-hidden tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-z-50 tw-p-4">
        <div class="tw-bg-white tw-rounded-lg tw-w-full md:tw-w-2/3 lg:tw-w-1/2 tw-max-h-[90vh] tw-overflow-y-auto tw-shadow-xl">
            <div class="tw-flex tw-items-center tw-justify-between tw-p-4 tw-border-b">
                <h4 class="tw-font-semibold tw-text-lg">${title}</h4>
                <button onclick="closeModal('${id}')" class="tw-text-gray-400 hover:tw-text-gray-600 tw-text-2xl">&times;</button>
            </div>
            <form onsubmit="${handlerName}(event); return false;" class="tw-p-6">
                ${formHTML}
            </form>
        </div>
    </div>`;

/** Menutup modal dengan ID tertentu */
window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('tw-hidden');
};

/**
 * Membuka modal form proker, mengisi data jika mode edit.
 * @param {number|null} [id=null] - ID proker untuk mode edit, atau null untuk mode tambah.
 */
window.openProkerModal = (id = null) => {
    const modal = document.getElementById('proker-modal'); 
    if(!modal) return;
    const form = modal.querySelector('form');
    form.reset(); // Reset form setiap kali dibuka

    if (id !== null) {
        // Mode Edit: Cari data proker dan isi form
        const data = currentProkerData.find(p => p.id === id);
        if (!data) {
            Swal.fire('Error', 'Data program kerja tidak ditemukan.', 'error');
            return;
        }
        form.prokerId.value = data.id;
        form.nama.value = data.nama; 
        form.deskripsi.value = data.deskripsi;
        // Format tanggal YYYY-MM-DD untuk input type date
        form.tanggal_mulai.value = data.tanggal_mulai ? new Date(data.tanggal_mulai).toISOString().split('T')[0] : ''; 
        form.divisi.value = data.divisi; 
        form.status.value = data.status;
        modal.querySelector('h4').textContent = 'Edit Program Kerja'; // Update judul modal
    } else {
        // Mode Tambah: Pastikan ID kosong
        form.prokerId.value = '';
        modal.querySelector('h4').textContent = 'Form Program Kerja'; // Judul default
    }
    modal.classList.remove('tw-hidden'); // Tampilkan modal
};

/**
 * Membuka modal form berita, mengisi data jika mode edit.
 * @param {number|null} [id=null] - ID berita untuk mode edit, atau null untuk mode tambah.
 */
window.openBeritaModal = (id = null) => {
    const modal = document.getElementById('berita-modal'); 
    if(!modal) return;
    const form = modal.querySelector('form');
    form.reset();

    if (id !== null) {
        // Mode Edit
        const data = currentBeritaData.find(b => b.id === id);
        if (!data) {
             Swal.fire('Error', 'Data berita tidak ditemukan.', 'error');
             return;
        }
        form.beritaId.value = data.id; 
        form.judul.value = data.judul; 
        form.konten.value = data.konten;
        modal.querySelector('h4').textContent = 'Edit Berita';
    } else {
        // Mode Tambah
        form.beritaId.value = '';
        modal.querySelector('h4').textContent = 'Form Berita';
    }
    modal.classList.remove('tw-hidden');
};

/**
 * Membuka popup form anggota, mengisi data jika mode edit.
 * @param {number|null} [id=null] - ID anggota untuk mode edit, atau null untuk mode tambah.
 */
window.openMemberModal = (id = null) => {
    const popup = document.getElementById('formPopup'); 
    if(!popup) return;
    const form = document.getElementById('osisForm'); 
    if (!form) return;
    form.reset();

    const formTitle = document.getElementById('formTitle');
    const memberIdInput = document.getElementById('memberId');
    if (!formTitle || !memberIdInput) return;

    if (id !== null) {
        // Mode Edit
        const data = currentMembersData.find(m => m.id === id);
        if (!data) {
             Swal.fire('Error', 'Data anggota tidak ditemukan.', 'error');
             return;
        }
        formTitle.textContent = 'Edit Anggota';
        memberIdInput.value = data.id;
        document.getElementById('nama').value = data.nama; 
        document.getElementById('nisn').value = data.nisn;
        document.getElementById('jabatan').value = data.jabatan;
        // Input file foto dikosongkan secara default saat edit
        document.getElementById('url_foto_baru').value = ''; 
    } else {
        // Mode Tambah
        formTitle.textContent = 'Tambah Anggota';
        memberIdInput.value = '';
    }
    popup.classList.remove('tw-hidden');
};

/**
 * Menangani submit form Proker (Tambah/Edit).
 */
window.handleProkerForm = async (e) => {
    e.preventDefault();
    showLoading('Menyimpan data proker...');
    try {
        const form = e.target; 
        const id = form.prokerId.value;
        const formData = new FormData();
        
        // Ambil data dari form dan append ke FormData
        formData.append('nama', form.nama.value); 
        formData.append('deskripsi', form.deskripsi.value);
        formData.append('tanggal_mulai', form.tanggal_mulai.value); 
        formData.append('divisi', form.divisi.value);
        formData.append('status', form.status.value);
        
        // Append file gambar jika ada
        const files = form.gambar.files;
        for (let i = 0; i < files.length; i++) {
            formData.append('gambar', files[i]);
        }

        // Tentukan method dan endpoint
        const method = id ? 'PUT' : 'POST';
        const endpoint = id ? `/proker/${id}` : '/proker';

        const res = await apiFetch(endpoint, { method, body: formData });

        if (res && res.ok) { 
            closeModal('proker-modal'); 
            loadProkerPage(); // Muat ulang data
            Swal.fire('Sukses', 'Data program kerja berhasil disimpan.', 'success');
        } else { 
            let errorMsg = 'Gagal menyimpan program kerja!';
             try { const err = await res.json(); errorMsg = err.error || errorMsg; } catch (_) {}
            Swal.fire({ icon: 'error', title: 'Oops...', text: errorMsg }); 
        }
    } catch (error) { 
        Swal.fire({ icon: 'error', title: 'Terjadi Kesalahan', text: error.message || 'Tidak dapat terhubung ke server.' });
    } finally { 
        hideLoading(); 
    }
};

/**
 * Menangani submit form Berita (Tambah/Edit).
 */
window.handleBeritaForm = async (e) => {
    e.preventDefault();
    showLoading('Menyimpan data berita...');
    try {
        const form = e.target; 
        const id = form.beritaId.value;
        const formData = new FormData();
        
        formData.append('judul', form.judul.value); 
        formData.append('konten', form.konten.value);
        
        const files = form.gambar.files;
        for (let i = 0; i < files.length; i++) {
            formData.append('gambar', files[i]);
        }

        const method = id ? 'PUT' : 'POST';
        const endpoint = id ? `/berita/${id}` : '/berita';

        const res = await apiFetch(endpoint, { method, body: formData });

        if (res && res.ok) { 
            closeModal('berita-modal'); 
            loadBeritaPage(); 
            Swal.fire('Sukses', 'Data berita berhasil disimpan.', 'success');
        } else { 
             let errorMsg = 'Gagal menyimpan berita!';
             try { const err = await res.json(); errorMsg = err.error || errorMsg; } catch (_) {}
            Swal.fire({ icon: 'error', title: 'Oops...', text: errorMsg }); 
        }
    } catch (error) { 
        Swal.fire({ icon: 'error', title: 'Terjadi Kesalahan', text: error.message || 'Tidak dapat terhubung ke server.' });
    } finally { 
        hideLoading(); 
    }
};

/**
 * Menangani submit form Anggota (Tambah/Edit).
 */
window.handleMemberForm = async (e) => {
    e.preventDefault();
    showLoading('Menyimpan data anggota...');
    try {
        const id = document.getElementById('memberId').value;
        const formData = new FormData();
        
        formData.append('nama', document.getElementById('nama').value);
        formData.append('nisn', document.getElementById('nisn').value);
        formData.append('jabatan', document.getElementById('jabatan').value);
        
        const newPhoto = document.getElementById('url_foto_baru').files[0];
        if (newPhoto) { // Hanya append jika ada file baru dipilih
            formData.append('url_foto', newPhoto);
        }

        const method = id ? 'PUT' : 'POST';
        const endpoint = id ? `/members/${id}` : '/members';

        const res = await apiFetch(endpoint, { method, body: formData });

        const formPopup = document.getElementById('formPopup');
        if (res && res.ok) { 
            if (formPopup) formPopup.classList.add('tw-hidden'); 
            loadProfilPage(); 
             Swal.fire('Sukses', 'Data anggota berhasil disimpan.', 'success');
        } else { 
            let errorMsg = 'Gagal menyimpan anggota!';
             try { const err = await res.json(); errorMsg = err.error || errorMsg; } catch (_) {}
            Swal.fire({ icon: 'error', title: 'Oops...', text: errorMsg }); 
        }
    } catch (error) { 
        Swal.fire({ icon: 'error', title: 'Terjadi Kesalahan', text: error.message || 'Tidak dapat terhubung ke server.' });
    } finally { 
        hideLoading(); 
    }
};

/**
 * Menangani submit form balasan QnA oleh admin.
 * Mendukung balasan ganda dengan menggabungkan string.
 * @param {Event} e - Objek event submit.
 * @param {number} qnaId - ID pertanyaan yang dijawab.
 */
window.handleAnswerSubmit = async (e, qnaId) => {
    e.preventDefault();
    const textArea = e.target.querySelector('textarea');
    if (!textArea) return;
    
    const newReplyText = textArea.value.trim();
    const delimiter = '[REPLY_BREAK]'; // Pemisah antar balasan

    if (!newReplyText) { 
        Swal.fire('Input Kosong', 'Balasan tidak boleh kosong.', 'warning'); 
        return; 
    }

    try {
        showLoading('Mengirim balasan...');
        // Dapatkan item ID dan Tipe dari elemen tersembunyi di halaman
        const itemId = document.getElementById('qna-item-id')?.value;
        const itemType = document.getElementById('qna-item-type')?.value;

        if (!itemId || !itemType) throw new Error('Informasi item tidak ditemukan.');

        // Ambil data QnA saat ini untuk mendapatkan string jawaban yang lama
        const res = await apiFetch(`/public/qna/${itemType}/${itemId}`);
        if (!res || !res.ok) throw new Error('Gagal mengambil data QnA yang ada.');
        
        const allQnas = await res.json();
        const currentQna = allQnas.find(q => q.id === qnaId);
        if (!currentQna) throw new Error('Pertanyaan tidak ditemukan.');

        const currentJawaban = currentQna.jawaban || '';

        // Buat string jawaban baru: gabungkan yang lama dengan yang baru pakai delimiter
        const newJawabanString = currentJawaban 
                                 ? `${currentJawaban}${delimiter}${newReplyText}` 
                                 : newReplyText;

        // Kirim (PUT) string gabungan yang baru
        const putRes = await apiFetch(`/qna/${qnaId}`, { 
            method: 'PUT', 
            body: JSON.stringify({ jawaban: newJawabanString }) 
        });
        hideLoading();

        if (putRes && putRes.ok) {
            Swal.fire('Berhasil!', 'Balasan telah berhasil dikirim.', 'success');
            // Muat ulang kedua daftar QnA (publik dan admin)
            loadQnaList(itemId, itemType);
            loadAdminQnaToAnswer(itemId, itemType);
        } else {
             let errorMsg = 'Gagal mengirim balasan ke server.';
             try { const err = await putRes.json(); errorMsg = err.error || errorMsg; } catch (_) {}
             throw new Error(errorMsg);
        }

    } catch (error) {
        hideLoading();
        Swal.fire('Oops...', error.message || 'Terjadi kesalahan koneksi.', 'error');
    }
};

/**
 * Menampilkan konfirmasi dan menghapus item (Proker/Berita/Anggota).
 * @param {string} endpoint - Path API (misal, '/proker').
 * @param {number} id - ID item yang akan dihapus.
 * @param {function} refreshCallback - Fungsi yang dipanggil untuk memuat ulang daftar setelah hapus.
 */
window.deleteItem = async (endpoint, id, refreshCallback) => {
    // Hentikan propagasi event agar kartu di belakangnya tidak ikut ter-klik
    event?.stopPropagation(); 

    const result = await Swal.fire({
        title: 'Anda yakin?', 
        text: "Data yang dihapus tidak dapat dikembalikan!", 
        icon: 'warning',
        showCancelButton: true, 
        confirmButtonColor: '#d33', 
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, hapus!', 
        cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
        try {
            showLoading('Menghapus data...');
            const res = await apiFetch(`${endpoint}/${id}`, { method: 'DELETE' });
            hideLoading();
            
            if (res && res.ok) {
                Swal.fire('Dihapus!', 'Data telah berhasil dihapus.', 'success');
                if (typeof refreshCallback === 'function') {
                    refreshCallback(); // Panggil fungsi refresh
                }
            } else {
                 let errorMsg = 'Gagal menghapus data.';
                 try { const err = await res.json(); errorMsg = err.error || errorMsg; } catch (_) {}
                 throw new Error(errorMsg);
            }
        } catch (error) {
            hideLoading();
             Swal.fire('Gagal', error.message || 'Terjadi kesalahan.', 'error');
        }
    }
};

/**
 * Menampilkan popup loading SweetAlert dengan animasi Lottie.
 * @param {string} title - Judul popup loading.
 */
function showLoading(title = 'Memproses...') {
    Swal.fire({
        title: title,
        // Pastikan path ke /asset/loading.json benar
        html: `<lottie-player src="/asset/loading.json" background="transparent" speed="1" style="width: 150px; height: 150px; margin: auto;" loop autoplay></lottie-player>`,
        allowOutsideClick: false,
        showConfirmButton: false,
        // Tambahkan sedikit padding jika perlu
        padding: '2em' 
    });
}

/** Menutup popup loading SweetAlert */
function hideLoading() {
    Swal.close();
}