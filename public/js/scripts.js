// /public/js/scripts.js

/**
 * Event listener utama yang berjalan setelah seluruh halaman HTML dimuat.
 * Bertindak sebagai "router" frontend untuk menjalankan fungsi yang sesuai dengan halaman yang dibuka.
 */
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split('/').pop() || 'dashboard.html';
    
    // Render sidebar dinamis di semua halaman kecuali login
    if (path !== 'login.html') {
        renderSidebar(path);
    }

    // Menjalankan fungsi spesifik berdasarkan halaman
    switch (path) {
        case 'dashboard.html': loadDashboardPage(); break;
        case 'proker.html': loadProkerPage(); break;
        case 'proker-detail.html': loadProkerDetailPage(); break;
        case 'berita.html': loadBeritaPage(); break;
        case 'berita-detail.html': loadBeritaDetailPage(); break;
        case 'profil.html': loadProfilPage(); break;
        case 'login.html': setupLoginForm(); break;
    }
});

// ===================================
// UTILITIES & AUTHENTICATION
// ===================================

const API_URL = '';
const getToken = () => localStorage.getItem('authToken');
const getRole = () => localStorage.getItem('userRole');
const isLoggedIn = () => !!getToken();

async function apiFetch(endpoint, options = {}) {
    const headers = { ...options.headers };
    if (getToken()) {
        headers['Authorization'] = `Bearer ${getToken()}`;
    }
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    try {
        const response = await fetch(`${API_URL}/api${endpoint}`, {
            ...options,
            headers,
            cache: 'no-store' // Mencegah masalah cache token
        });
        if (response.status === 401) {
            logout(); 
            return;
        }
        return response;
    } catch (error) {
        if (error.name !== 'AbortError') {
             console.error('API Fetch Error:', error);
        }
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
}

// ===================================
// DYNAMIC UI RENDERERS
// ===================================

async function renderSidebar(currentPage) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    const role = getRole();
    const roleText = role || 'OSIS'; // Default ke OSIS jika tidak login

    const navLinks = [
        { href: 'dashboard.html', icon: '🏠', text: 'Dashboard' },
        { href: 'proker.html', icon: '📅', text: 'Program Kerja' },
        { href: 'berita.html', icon: '📰', text: 'Berita' },
        { href: 'profil.html', icon: '👥', text: `Profil ${roleText}` },
    ];

    const generateNavLinks = () => navLinks.map(link => {
        const isActive = currentPage === link.href;
        return `<a href="${link.href}" class="tw-flex tw-items-center tw-gap-3 tw-py-2 tw-px-3 tw-rounded-md tw-mb-1 ${isActive ? 'tw-bg-blue-700' : 'hover:tw-bg-blue-700'}">${link.icon} ${link.text}</a>`;
    }).join('');

    const authButtonHTML = isLoggedIn()
        ? `<button onclick="logout()" class="tw-w-full tw-bg-red-600 tw-py-2 tw-rounded-md hover:tw-bg-red-500">Logout</button>`
        : `<a href="login.html" class="tw-w-full tw-block tw-text-center tw-bg-blue-600 tw-py-2 tw-rounded-md hover:tw-bg-blue-500">Login</a>`;

    let periode = '...';
    try {
        const endpoint = isLoggedIn() ? `/settings/tahun` : `/public/settings`;
        const res = await apiFetch(endpoint);
        if(!res) return;
        const data = await res.json();
        let setting = isLoggedIn() ? data : (Array.isArray(data) ? data.find(s => s.role === roleText) : data);
        if(setting) periode = setting.nilai;
    } catch(e) { console.error("Gagal memuat periode"); }

    container.innerHTML = `
      <div class="tw-py-6 tw-px-5 tw-border-b tw-border-blue-700">
        <div><h1 class="tw-text-xl tw-font-bold">${roleText} Panel</h1><p class="tw-text-xs tw-opacity-80">SMAN 10 Bandung</p></div>
      </div>
      <nav class="tw-px-3 tw-pt-4 tw-flex-1">${generateNavLinks()}</nav>
      <div class="tw-px-4 tw-py-4 tw-border-t tw-border-blue-700">
        <div class="tw-mb-4"><p class="tw-text-xs tw-opacity-80">Periode aktif</p><p class="tw-text-sm tw-font-semibold">${periode}</p></div>
        ${authButtonHTML}
      </div>`;
}

function updateDynamicText() {
    const role = getRole() || 'OSIS';
    
    const pageTitleDashboard = document.getElementById('page-title-dashboard');
    if (pageTitleDashboard) pageTitleDashboard.textContent = `${role} Panel — Dashboard`;
    const pageTitleProfil = document.getElementById('page-title-profil');
    if (pageTitleProfil) pageTitleProfil.textContent = `Profil Pengurus ${role}`;
    
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
// PAGE LOADERS
// ===================================

function setupLoginForm() {
    if(isLoggedIn()){ window.location.href = 'dashboard.html'; return; }
    
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('error-message');
        errorMsg.textContent = '';
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.role);
            window.location.href = 'dashboard.html';
        } catch (error) {
            errorMsg.textContent = error.message || 'Login gagal!';
        }
    });
}

async function loadDashboardPage() {
    updateDynamicText();
    try {
        const memberEndpoint = isLoggedIn() ? '/members' : '/public/members';
        const prokerEndpoint = isLoggedIn() ? '/proker' : '/public/proker';
        const beritaEndpoint = isLoggedIn() ? '/berita' : '/public/berita';

        const [membersRes, prokerRes, beritaRes] = await Promise.all([
            apiFetch(memberEndpoint), apiFetch(prokerEndpoint), apiFetch(beritaEndpoint)
        ]);

        if (!membersRes || !prokerRes || !beritaRes) throw new Error("Gagal mengambil data.");

        let members = await membersRes.json();
        const allProker = await prokerRes.json();
        const allBerita = await beritaRes.json();

        if (!isLoggedIn()) {
            members = members.filter(m => m.role === 'OSIS');
        }
        
        document.getElementById('total-anggota').textContent = members.length;
        document.getElementById('proker-aktif').textContent = allProker.filter(p => p.status === 'Berlangsung').length;
        
        const agendaBodyEl = document.getElementById('agenda-tbody');
        if (agendaBodyEl) {
            const sortedAgenda = allProker.sort((a, b) => new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai));
            agendaBodyEl.innerHTML = sortedAgenda.slice(0, 3).map(p => {
                let statusClass = 'tw-text-gray-700 tw-bg-gray-100';
                if (p.status === 'Berlangsung') statusClass = 'tw-text-green-700 tw-bg-green-100';
                if (p.status === 'Direncanakan') statusClass = 'tw-text-yellow-800 tw-bg-yellow-100';
                return `
                <tr class="tw-border-t">
                    <td class="tw-p-3">${new Date(p.tanggal_mulai).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</td>
                    <td class="tw-p-3">${p.nama}</td>
                    <td class="tw-p-3">${p.divisi}</td>
                    <td class="tw-p-3"><span class="tw-inline-block tw-px-3 tw-py-1 tw-rounded-full tw-text-xs tw-font-semibold ${statusClass}">${p.status}</span></td>
                </tr>`;
            }).join('') || `<tr><td colspan="4" class="tw-p-3 tw-text-center tw-text-gray-400">Tidak ada agenda.</td></tr>`;
        }

        const beritaContainerEl = document.getElementById('berita-list-dashboard');
        if (beritaContainerEl) {
            beritaContainerEl.innerHTML = allBerita.slice(0, 3).map(b => `
                <article class="tw-bg-white tw-rounded-lg tw-shadow tw-p-4">
                    <img src="${b.gambar[0] || 'https://via.placeholder.com/600x300'}" alt="${b.judul}" class="tw-w-full tw-h-40 tw-object-cover tw-rounded-md">
                    <h4 class="tw-font-semibold tw-text-blue-800 tw-mt-3">${b.judul}</h4>
                    <p class="tw-text-sm tw-text-gray-600 tw-mt-1">${b.konten.substring(0, 80)}...</p>
                </article>
            `).join('') || `<p class="tw-col-span-full tw-text-gray-500 tw-text-center">Tidak ada berita.</p>`;
        }

        if (isLoggedIn()) {
            const adminSection = document.getElementById('admin-periode-section');
            const userInfoContainer = document.getElementById('user-info-container');
            if (adminSection) adminSection.classList.remove('tw-hidden');
            if (userInfoContainer) {
                userInfoContainer.classList.remove('tw-hidden');
                userInfoContainer.innerHTML = `<div class="tw-text-right"><p class="tw-text-xs tw-text-gray-500">Pengguna</p><p class="tw-font-semibold">${getRole()}</p></div>`;
            }
            loadPeriodeSetting();
        }
    } catch (error) { console.error("Gagal memuat data dashboard:", error); }
}

async function loadPeriodeSetting() {
    try {
        const res = await apiFetch('/settings/tahun'); 
        if (!res || !res.ok) throw new Error('Gagal memuat periode');
        const setting = await res.json();
        const inputPeriode = document.getElementById('tahun-periode');
        if (inputPeriode) inputPeriode.value = setting.nilai;
        const periodeForm = document.getElementById('periode-form');
        if (periodeForm && !periodeForm.dataset.listenerAttached) {
            periodeForm.addEventListener('submit', handlePeriodeUpdate);
            periodeForm.dataset.listenerAttached = 'true';
        }
    } catch(e) {
        console.error(e.message);
        const messageEl = document.getElementById('periode-message');
        if (messageEl) messageEl.textContent = 'Gagal memuat data periode.';
    }
}

async function handlePeriodeUpdate(event) {
    event.preventDefault();
    const newValue = document.getElementById('tahun-periode').value;
    const messageEl = document.getElementById('periode-message');
    messageEl.textContent = 'Menyimpan...';
    try {
        const res = await apiFetch('/settings/tahun', {
            method: 'PUT',
            body: JSON.stringify({ nilai: newValue })
        });
        if (!res || !res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Gagal menyimpan perubahan.');
        }
        messageEl.textContent = 'Periode berhasil diperbarui!';
        messageEl.className = 'tw-text-sm tw-text-green-600 tw-mt-2 h-4';
        renderSidebar('dashboard.html');
        setTimeout(() => { messageEl.textContent = ''; }, 3000);
    } catch (e) {
        messageEl.textContent = e.message;
        messageEl.className = 'tw-text-sm tw-text-red-600 tw-mt-2 h-4';
    }
}

async function loadProkerPage() {
    const endpoint = isLoggedIn() ? '/proker' : '/public/proker';
    const res = await apiFetch(endpoint);
    if (!res) return;
    const proker = await res.json();
    currentProkerData = proker;
    document.getElementById('prokerList').innerHTML = proker.map(p => createProkerCard(p, isLoggedIn())).join('') || `<p class="tw-col-span-full tw-text-gray-500 tw-text-center">Tidak ada program kerja.</p>`;
    if (isLoggedIn()) {
        document.getElementById('admin-action-container').innerHTML = `<button onclick="openProkerModal()" class="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-md hover:tw-bg-blue-500">+ Buat Proker Baru</button>`;
        document.getElementById('modal-container').innerHTML = createModal('proker-modal', 'Form Program Kerja', prokerFormHTML, 'handleProkerForm');
    }
}

async function loadProkerDetailPage() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;
    const res = await apiFetch(`/public/proker/${id}`);
    if (!res) return;
    const proker = await res.json();
    document.getElementById('detail-content-container').innerHTML = `
        ${createCarouselHTML(proker.gambar, 'prokerCarousel')}
        <h2 class="tw-text-2xl tw-font-bold tw-text-blue-800 tw-mt-4">${proker.nama}</h2>
        <p class="tw-text-sm tw-text-gray-500 tw-mt-1">Tanggal: ${new Date(proker.tanggal_mulai).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
        <div class="tw-mt-4 tw-text-gray-700 tw-leading-relaxed">${proker.deskripsi.replace(/\n/g, '<br>')}</div>`;
    setupCarousel('prokerCarousel', proker.gambar);
    setupQnA(id, 'proker', proker.role);
}

async function loadBeritaPage() {
    const endpoint = isLoggedIn() ? '/berita' : '/public/berita';
    const res = await apiFetch(endpoint);
    if (!res) return;
    const berita = await res.json();
    currentBeritaData = berita;
    document.getElementById('berita-list').innerHTML = berita.map(b => createBeritaCard(b, isLoggedIn())).join('') || `<p class="tw-col-span-full tw-text-gray-500 tw-text-center">Tidak ada berita.</p>`;
    if (isLoggedIn()) {
        document.getElementById('admin-action-container').innerHTML = `<button onclick="openBeritaModal()" class="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-md hover:tw-bg-blue-500">+ Tulis Berita</button>`;
        document.getElementById('modal-container').innerHTML = createModal('berita-modal', 'Form Berita', beritaFormHTML, 'handleBeritaForm');
    }
}

async function loadBeritaDetailPage() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;
    const res = await apiFetch(`/public/berita/${id}`);
    if (!res) return;
    const berita = await res.json();
    document.getElementById('detail-content-container').innerHTML = `
        ${createCarouselHTML(berita.gambar, 'beritaCarousel')}
        <h2 class="tw-text-2xl tw-font-bold tw-text-blue-800 tw-mt-4">${berita.judul}</h2>
        <p class="tw-text-sm tw-text-gray-500 tw-mt-1">Dipublikasikan: ${new Date(berita.tanggal_publikasi).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
        <div class="tw-mt-6 tw-text-gray-700 tw-leading-relaxed">${berita.konten.replace(/\n/g, '<br>')}</div>`;
    setupCarousel('beritaCarousel', berita.gambar);
    setupQnA(id, 'berita', berita.role);
}

async function loadProfilPage() {
    updateDynamicText();
    const endpoint = isLoggedIn() ? '/members' : '/public/members';
    const res = await apiFetch(endpoint);
    if (!res) return;
    let members = await res.json();
    currentMembersData = members;
    if (!isLoggedIn()) {
        const osisMembers = members.filter(m => m.role === 'OSIS');
        const mpkMembers = members.filter(m => m.role === 'MPK');
        document.getElementById('leadership-title').textContent = 'Ketua & Wakil Ketua OSIS';
        document.getElementById('staff-title').textContent = 'Anggota OSIS';
        renderProfil(osisMembers);
        const main = document.querySelector('main');
        if (!document.getElementById('leadership-mpk')) {
            main.innerHTML += `
                <section class="tw-bg-white tw-rounded-2xl tw-shadow tw-p-8 tw-mb-10 tw-mt-10">
                    <h2 class="tw-text-2xl tw-font-semibold tw-text-center tw-mb-6">Ketua & Wakil Ketua MPK</h2>
                    <div id="leadership-mpk" class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6 tw-justify-items-center"></div>
                </section>
                <section class="tw-bg-white tw-rounded-2xl tw-shadow tw-p-8">
                    <h2 class="tw-text-2xl tw-font-semibold tw-mb-6">Anggota MPK</h2>
                    <div id="staff-mpk" class="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6 tw-justify-items-center"></div>
                </section>
            `;
        }
        renderProfil(mpkMembers, true);

    } else {
        renderProfil(members);
        document.getElementById('admin-action-container').innerHTML = `<button onclick="openMemberModal()" class="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg hover:tw-bg-blue-700">+ Tambah Anggota</button>`;
        document.getElementById('osisForm').onsubmit = handleMemberForm;
        document.getElementById('cancel-btn').onclick = () => document.getElementById('formPopup').classList.add('tw-hidden');
    }
}

function renderProfil(members, isMpk = false) {
    const leadershipId = isMpk ? 'leadership-mpk' : 'leadership';
    const staffId = isMpk ? 'staff-mpk' : 'staff';
    const leadershipEl = document.getElementById(leadershipId);
    const staffEl = document.getElementById(staffId);
    if(!leadershipEl || !staffEl) return;
    leadershipEl.innerHTML = '';
    staffEl.innerHTML = '';
    members.sort((a, b) => {
        const getPeringkat = (jabatan) => (jabatan.toLowerCase().includes('ketua') ? 1 : (jabatan.toLowerCase().includes('wakil') ? 2 : 3));
        return getPeringkat(a.jabatan) - getPeringkat(b.jabatan) || a.jabatan.localeCompare(b.jabatan);
    });
    members.forEach(member => {
        const card = createMemberCard(member, isLoggedIn());
        if (member.jabatan.toLowerCase().includes('ketua')) {
            leadershipEl.innerHTML += card;
        } else {
            staffEl.innerHTML += card;
        }
    });
}

// ===================================
// CARD & COMPONENT CREATORS
// ===================================

function createProkerCard(p, isAdmin) {
    return `
    <article class="tw-bg-white tw-rounded-xl tw-shadow tw-overflow-hidden" data-id="${p.id}">
        <div class="tw-cursor-pointer" onclick="navigateToDetail(event, 'proker-detail.html?id=${p.id}')">
            <img src="${p.gambar[0] || 'https://via.placeholder.com/800x300'}" class="tw-w-full tw-h-40 tw-object-cover" alt="${p.nama}">
            <div class="tw-p-4"><h3 class="tw-font-semibold tw-text-lg tw-text-blue-800">${p.nama}</h3></div>
        </div>
        <div class="tw-p-4 tw-pt-0">
            <div class="tw-flex tw-items-center tw-justify-between">
                <div class="tw-text-xs tw-text-gray-500">${new Date(p.tanggal_mulai).toLocaleDateString('id-ID')} • ${p.divisi}</div>
                ${isAdmin ? `
                    <div class="tw-flex tw-gap-2">
                        <button onclick="event.stopPropagation(); openProkerModal(${p.id})" class="tw-text-sm tw-px-3 tw-py-1 tw-rounded-md tw-border">Edit</button>
                        <button onclick="event.stopPropagation(); deleteItem('/proker', ${p.id}, loadProkerPage)" class="tw-text-sm tw-px-3 tw-py-1 tw-rounded-md tw-bg-red-50 tw-text-red-600">Hapus</button>
                    </div>` : ''}
            </div>
        </div>
    </article>`;
}

function createBeritaCard(b, isAdmin) {
    return `
    <article class="tw-bg-white tw-rounded-xl tw-shadow tw-overflow-hidden" data-id="${b.id}">
        <div class="tw-cursor-pointer" onclick="navigateToDetail(event, 'berita-detail.html?id=${b.id}')">
            <img src="${b.gambar[0] || 'https://via.placeholder.com/900x400'}" class="tw-w-full tw-h-40 tw-object-cover" alt="${b.judul}">
            <div class="tw-p-4"><h3 class="tw-text-lg tw-font-semibold tw-text-blue-800">${b.judul}</h3></div>
        </div>
        <div class="tw-p-4 tw-pt-0">
            <div class="tw-flex tw-items-center tw-justify-between">
                <small class="tw-text-xs tw-text-gray-500">Dipublikasikan ${new Date(b.tanggal_publikasi).toLocaleDateString('id-ID')}</small>
                ${isAdmin ? `
                <div class="tw-flex tw-gap-2">
                    <button onclick="event.stopPropagation(); openBeritaModal(${b.id})" class="tw-text-sm">Edit</button>
                    <button onclick="event.stopPropagation(); deleteItem('/berita', ${b.id}, loadBeritaPage)" class="tw-text-sm tw-text-red-600">Hapus</button>
                </div>` : ''}
            </div>
        </div>
    </article>`;
}

function createMemberCard(m, isAdmin) {
    return `
    <div class="tw-bg-gray-100 tw-rounded-xl tw-shadow tw-p-4 tw-text-center tw-w-full">
        <img src="${m.url_foto}" class="tw-w-44 tw-h-44 tw-object-cover tw-rounded-full tw-mx-auto tw-mb-3 tw-shadow">
        <h4 class="tw-font-semibold tw-text-lg">${m.nama}</h4>
        <p class="tw-text-sm tw-text-gray-600">${m.nisn}</p>
        <p class="tw-text-blue-600 tw-font-medium tw-mb-3">${m.jabatan}</p>
        ${isAdmin ? `
        <div class="tw-flex tw-justify-center tw-gap-2">
            <button onclick="event.stopPropagation(); openMemberModal(${m.id})" class="tw-bg-yellow-400 tw-text-white tw-px-3 tw-py-1 tw-rounded hover:tw-bg-yellow-500">Edit</button>
            <button onclick="event.stopPropagation(); deleteItem('/members', ${m.id}, loadProfilPage)" class="tw-bg-red-500 tw-text-white tw-px-3 tw-py-1 tw-rounded hover:tw-bg-red-600">Hapus</button>
        </div>` : ''}
    </div>`;
}

function navigateToDetail(event, url) {
    if (event.target.tagName === 'BUTTON' || event.target.parentElement.tagName === 'BUTTON') return;
    window.location.href = url;
}


function createCarouselHTML(images, id) {
    if (!images || images.length === 0) return `<img src="https://via.placeholder.com/900x400?text=No+Image" class="tw-w-full tw-rounded-md tw-object-cover tw-h-[400px]">`;
    return `
    <div id="${id}" class="tw-relative tw-w-full">
      <img data-main-image src="${images[0]}" class="tw-w-full tw-rounded-md tw-object-cover tw-h-[400px]" alt="Gambar Detail">
      ${images.length > 1 ? `<button data-prev-btn class="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-bg-black/40 tw-text-white tw-rounded-full tw-w-10 tw-h-10">‹</button><button data-next-btn class="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-bg-black/40 tw-text-white tw-rounded-full tw-w-10 tw-h-10">›</button>` : ''}
    </div>`;
}

function setupCarousel(id, images) {
    const carousel = document.getElementById(id);
    if (!carousel || !images || images.length <= 1) return;
    const img = carousel.querySelector('[data-main-image]');
    const prevBtn = carousel.querySelector('[data-prev-btn]');
    const nextBtn = carousel.querySelector('[data-next-btn]');
    let index = 0;
    prevBtn.onclick = () => { index = (index - 1 + images.length) % images.length; img.src = images[index]; };
    nextBtn.onclick = () => { index = (index + 1) % images.length; img.src = images[index]; };
}


// ===================================
// QNA LOGIC
// ===================================

async function setupQnA(itemId, itemType, itemRole) {
    document.getElementById('qna-item-id').value = itemId;
    document.getElementById('qna-role').value = itemRole;
    loadQnaList(itemId, itemType);
    document.getElementById('qna-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const nama = form.nama_penanya.value;
        const pertanyaan = form.pertanyaan.value;
        if (!nama || !pertanyaan) { Swal.fire('Input Kosong', 'Nama dan Pertanyaan tidak boleh kosong.', 'warning'); return; }
        Swal.fire({
            title: 'Konfirmasi Pertanyaan', text: "Apakah Anda yakin ingin mengirim pertanyaan ini?", icon: 'question',
            showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Kirim!', cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const data = { item_id: itemId, item_type: itemType, role: itemRole, nama_penanya: nama, pertanyaan: pertanyaan };
                const res = await apiFetch('/public/qna', { method: 'POST', body: JSON.stringify(data) });
                if (res && res.ok) {
                    Swal.fire('Terkirim!', 'Pertanyaan Anda telah berhasil dikirim.', 'success');
                    form.reset(); loadQnaList(itemId, itemType);
                } else {
                    Swal.fire('Gagal', 'Terjadi kesalahan saat mengirim pertanyaan.', 'error');
                }
            }
        });
    });
    if(isLoggedIn()){
        document.getElementById('qna-admin-container').classList.remove('tw-hidden');
        loadAdminQnaToAnswer(itemId, itemType);
    }
}

async function loadQnaList(itemId, itemType) {
    const res = await apiFetch(`/public/qna/${itemType}/${itemId}`);
    if (!res) return;
    const qnas = await res.json();
    document.getElementById('qna-list').innerHTML = qnas.length === 0 ? '<p>Belum ada pertanyaan.</p>' : qnas.map(q => `
        <div class="tw-border-b tw-pb-4">
            <p class="tw-font-semibold">${q.nama_penanya}: <span class="tw-font-normal">${q.pertanyaan}</span></p>
            ${q.jawaban ? `<p class="tw-mt-2 tw-pl-4 tw-border-l-2 tw-border-blue-500 tw-text-gray-700"><b>Jawaban:</b> ${q.jawaban}</p>` : '<p class="tw-text-sm tw-text-gray-500 tw-mt-2"><i>Belum dijawab.</i></p>'}
        </div>`).join('');
}

async function loadAdminQnaToAnswer(itemId, itemType) {
    const res = await apiFetch(`/qna/unanswered`);
    if (!res) return;
    const allUnanswered = await res.json();
    const relevantUnanswered = allUnanswered.filter(q => q.item_id == itemId && q.item_type === itemType);
    document.getElementById('qna-admin-list').innerHTML = relevantUnanswered.length === 0 ? '<p>Tidak ada pertanyaan baru untuk dijawab pada item ini.</p>' : relevantUnanswered.map(q => `
        <div class="tw-border tw-p-3 tw-rounded-md">
            <p><strong>${q.nama_penanya}</strong>: ${q.pertanyaan}</p>
            <form class="tw-mt-2" onsubmit="handleAnswerSubmit(event, ${q.id})">
                <textarea required class="tw-w-full tw-border tw-p-2 tw-rounded" rows="2" placeholder="Tulis jawaban..."></textarea>
                <button type="submit" class="tw-bg-green-600 tw-text-white tw-px-3 tw-py-1 tw-rounded tw-mt-1">Jawab</button>
            </form>
        </div>`).join('');
}


// ===================================
// MODAL & FORM LOGIC (FOR ADMIN)
// ===================================

let currentProkerData = [];
let currentBeritaData = [];
let currentMembersData = [];

const prokerFormHTML = `
    <input type="hidden" name="prokerId">
    <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
        <input name="nama" required class="tw-border tw-rounded-md tw-px-3 tw-py-2" placeholder="Judul Proker">
        <select name="divisi" class="tw-border tw-rounded-md tw-px-3 tw-py-2"><option>Olahraga</option><option>Seni</option><option>Pengurus</option></select>
        <textarea name="deskripsi" required class="tw-border tw-rounded-md tw-px-3 tw-py-2 md:tw-col-span-2" rows="4" placeholder="Deskripsi..."></textarea>
        <input name="tanggal_mulai" type="date" required class="tw-border tw-rounded-md tw-px-3 tw-py-2">
        <select name="status" class="tw-border tw-rounded-md tw-px-3 tw-py-2"><option>Direncanakan</option><option>Berlangsung</option><option>Selesai</option></select>
        <div class="md:tw-col-span-2"><label class="tw-text-sm">Gambar (bisa lebih dari satu & maks. 10mb)</label><input name="gambar" type="file" multiple class="tw-w-full tw-border tw-p-2"></div>
    </div>
    <div class="tw-flex tw-gap-2 tw-mt-4"><button type="submit" class="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-md">Simpan</button><button type="button" onclick="closeModal('proker-modal')" class="tw-border tw-rounded-md tw-px-4 tw-py-2">Batal</button></div>`;
const beritaFormHTML = `
    <input type="hidden" name="beritaId">
    <div class="tw-space-y-4">
        <input name="judul" required class="tw-w-full tw-border tw-rounded-md tw-px-3 tw-py-2" placeholder="Judul Berita">
        <textarea name="konten" required class="tw-w-full tw-h-40 tw-border tw-rounded-md tw-px-3 tw-py-2" placeholder="Isi berita..."></textarea>
        <div><label class="tw-text-sm">Gambar (bisa lebih dari satu & maks. 10mb)</label><input name="gambar" type="file" multiple class="tw-w-full tw-border tw-p-2"></div>
    </div>
    <div class="tw-flex tw-gap-2 tw-mt-4"><button type="submit" class="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-md">Simpan</button><button type="button" onclick="closeModal('berita-modal')" class="tw-border tw-rounded-md tw-px-4 tw-py-2">Batal</button></div>`;

window.createModal = (id, title, formHTML, handlerName) => `
    <div id="${id}" class="tw-hidden tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center z-50">
        <div class="tw-bg-white tw-rounded-lg tw-w-11/12 md:tw-w-2/3 lg:tw-w-1/2 tw-p-6"><div class="tw-flex tw-items-center tw-justify-between"><h4 class="tw-font-semibold tw-text-lg">${title}</h4><button onclick="closeModal('${id}')" class="tw-text-gray-500">✕</button></div><form onsubmit="${handlerName}(event)" class="tw-mt-4">${formHTML}</form></div></div>`;
window.closeModal = (id) => document.getElementById(id).classList.add('tw-hidden');

window.openProkerModal = (id = null) => {
    const modal = document.getElementById('proker-modal'); if(!modal) return;
    const form = modal.querySelector('form'); form.reset();
    if (id) {
        const data = currentProkerData.find(p => p.id === id);
        form.prokerId.value = data.id;
        form.nama.value = data.nama; form.deskripsi.value = data.deskripsi;
        form.tanggal_mulai.value = new Date(data.tanggal_mulai).toISOString().split('T')[0];
        form.divisi.value = data.divisi; form.status.value = data.status;
    } else {
        form.prokerId.value = '';
    }
    modal.classList.remove('tw-hidden');
};
window.openBeritaModal = (id = null) => {
    const modal = document.getElementById('berita-modal'); if(!modal) return;
    const form = modal.querySelector('form'); form.reset();
    if (id) {
        const data = currentBeritaData.find(b => b.id === id);
        form.beritaId.value = data.id; form.judul.value = data.judul; form.konten.value = data.konten;
    } else {
        form.beritaId.value = '';
    }
    modal.classList.remove('tw-hidden');
};
window.openMemberModal = (id = null) => {
    const popup = document.getElementById('formPopup'); if(!popup) return;
    const form = document.getElementById('osisForm'); form.reset();
    if (id) {
        const data = currentMembersData.find(m => m.id === id);
        document.getElementById('formTitle').textContent = 'Edit Anggota';
        document.getElementById('memberId').value = data.id;
        document.getElementById('nama').value = data.nama; document.getElementById('nisn').value = data.nisn;
        document.getElementById('jabatan').value = data.jabatan;
    } else {
        document.getElementById('formTitle').textContent = 'Tambah Anggota';
        document.getElementById('memberId').value = '';
    }
    popup.classList.remove('tw-hidden');
};

window.handleProkerForm = async (e) => {
    e.preventDefault();
    showLoading('Menyimpan data proker...');
    try {
        const form = e.target; const id = form.prokerId.value;
        const formData = new FormData();
        formData.append('nama', form.nama.value); formData.append('deskripsi', form.deskripsi.value);
        formData.append('tanggal_mulai', form.tanggal_mulai.value); formData.append('divisi', form.divisi.value);
        formData.append('status', form.status.value);
        for (const file of form.gambar.files) formData.append('gambar', file);
        const res = await apiFetch(id ? `/proker/${id}` : '/proker', { method: id ? 'PUT' : 'POST', body: formData });
        if (res && res.ok) { closeModal('proker-modal'); loadProkerPage(); } 
        else { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Gagal menyimpan program kerja!' }); }
    } catch (error) { Swal.fire({ icon: 'error', title: 'Terjadi Kesalahan', text: 'Tidak dapat terhubung ke server.' });
    } finally { hideLoading(); }
};
window.handleBeritaForm = async (e) => {
    e.preventDefault();
    showLoading('Menyimpan data berita...');
    try {
        const form = e.target; const id = form.beritaId.value;
        const formData = new FormData();
        formData.append('judul', form.judul.value); formData.append('konten', form.konten.value);
        for (const file of form.gambar.files) formData.append('gambar', file);
        const res = await apiFetch(id ? `/berita/${id}` : '/berita', { method: id ? 'PUT' : 'POST', body: formData });
        if (res && res.ok) { closeModal('berita-modal'); loadBeritaPage(); } 
        else { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Gagal menyimpan berita!' }); }
    } catch (error) { Swal.fire({ icon: 'error', title: 'Terjadi Kesalahan', text: 'Tidak dapat terhubung ke server.' });
    } finally { hideLoading(); }
};
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
        if (newPhoto) formData.append('url_foto', newPhoto);
        const res = await apiFetch(id ? `/members/${id}` : '/members', { method: id ? 'PUT' : 'POST', body: formData });
        if (res && res.ok) { document.getElementById('formPopup').classList.add('tw-hidden'); loadProfilPage(); } 
        else { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Gagal menyimpan anggota!' }); }
    } catch (error) { Swal.fire({ icon: 'error', title: 'Terjadi Kesalahan', text: 'Tidak dapat terhubung ke server.' });
    } finally { hideLoading(); }
};

window.handleAnswerSubmit = async (e, qnaId) => {
    e.preventDefault();
    const textArea = e.target.querySelector('textarea'); const jawaban = textArea.value;
    if (!jawaban.trim()) { Swal.fire('Input Kosong', 'Balasan tidak boleh kosong.', 'warning'); return; }
    Swal.fire({
        title: 'Kirim Balasan?', text: "Apakah Anda yakin ingin mengirim balasan ini?", icon: 'question',
        showCancelButton: true, confirmButtonColor: '#16a34a', cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Kirim!', cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await apiFetch(`/qna/${qnaId}`, { method: 'PUT', body: JSON.stringify({ jawaban }) });
                if (res && res.ok) {
                    Swal.fire('Berhasil!', 'Balasan telah berhasil dikirim.', 'success');
                    const itemId = new URLSearchParams(window.location.search).get('id');
                    const itemType = document.getElementById('qna-item-type').value;
                    loadQnaList(itemId, itemType);
                    loadAdminQnaToAnswer(itemId, itemType);
                } else { throw new Error('Gagal mengirim balasan dari server.'); }
            } catch (error) { Swal.fire('Oops...', error.message || 'Terjadi kesalahan koneksi.', 'error'); }
        }
    });
};

window.deleteItem = async (endpoint, id, refreshCallback) => {
    event.stopPropagation();
    Swal.fire({
        title: 'Anda yakin?', text: "Anda tidak akan bisa mengembalikan data ini!", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, hapus!', cancelButtonText: 'Batal'
    }).then(async (result) => {
        if(result.isConfirmed) {
            const res = await apiFetch(`${endpoint}/${id}`, { method: 'DELETE' });
            if (res && res.ok) {
                Swal.fire('Dihapus!', 'Data telah berhasil dihapus.', 'success');
                refreshCallback();
            } else { Swal.fire('Gagal', 'Gagal menghapus data.', 'error'); }
        }
    });
};

function showLoading(title) {
    Swal.fire({
        title: title,
        html: `<lottie-player src="/asset/loading.json" background="transparent" speed="1" style="width: 150px; height: 150px; margin: auto;" loop autoplay></lottie-player>`,
        allowOutsideClick: false,
        showConfirmButton: false,
    });
}
function hideLoading() {
    Swal.close();
}   