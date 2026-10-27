/* PhoneStore - bản chạy thẳng trên trình duyệt (không cần server).
   Dữ liệu (người dùng, sản phẩm, giỏ hàng, đơn hàng) lưu trong localStorage. */
(function () {
  'use strict';
  const KEY = 'phonestore_db_v1', SKEY = 'phonestore_session_v1';
  const OCT = (d) => new Date(2026, 9, d, 9, 0, 0).toISOString(); // tháng 10/2026
  const STATUS = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy' };
  const SPEC = { screen: 'Màn hình', cpu: 'CPU', ram: 'RAM', storage: 'Bộ nhớ', camera: 'Camera', battery: 'Pin', os: 'Hệ điều hành' };
  const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'Realme'];

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
  const dt = (d) => new Date(d).toLocaleString('vi-VN');
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const hash = (s) => btoa(unescape(encodeURIComponent('ps:' + s)));
  const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  // Sản phẩm có ảnh thật (images/<tên>.jpg); còn lại dùng ảnh minh họa (.svg)
  const PHOTOS = ['iphone-18-pro-max-256gb', 'iphone-18-pro-256gb', 'iphone-17-pro-max-256gb', 'iphone-17-pro-256gb', 'iphone-air-256gb', 'iphone-17-256gb',
    'iphone-16-pro-max-256gb', 'iphone-16-pro-128gb', 'iphone-16-plus-128gb', 'iphone-15-pro-max-256gb', 'iphone-15-128gb', 'iphone-14-128gb',
    'vivo-v30-5g', 'vivo-y36', 'oppo-find-x7-ultra', 'oppo-reno11-f-5g', 'xiaomi-14-256gb', 'xiaomi-redmi-note-13-pro', 'realme-c67',
    'iphone-16-128gb', 'samsung-galaxy-s24-ultra-512gb', 'samsung-galaxy-s24-256gb', 'samsung-galaxy-a55-5g', 'realme-12-pro-5g'];
  const img = (t) => 'images/' + slug(t) + (PHOTOS.includes(slug(t)) ? '.jpg' : '.svg');
  const FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#1e293b"/><text x="300" y="320" font-size="120" text-anchor="middle">📱</text></svg>');

  function toast(msg, type) {
    const el = document.createElement('div');
    el.className = 'toast ' + (type || ''); el.textContent = msg;
    $('#toasts').appendChild(el); setTimeout(() => el.remove(), 2600);
  }

  /* ---------- dữ liệu ---------- */
  function seed() {
    const mk = (name, brand, price, orig, color, specs, rating, featured, day) => ({
      id: uid(), name, brand, price, originalPrice: orig, discount: orig > price ? Math.round((1 - price / orig) * 100) : 0,
      image: img(name), description: `${name} chính hãng, bảo hành 12 tháng, hiệu năng mạnh mẽ và thiết kế hiện đại.`,
      specs, stock: 25, rating, featured, createdAt: OCT(day),
    });
    const products = [
      mk('iPhone 15 Pro Max 256GB', 'Apple', 29990000, 34990000, '1e293b', { screen: '6.7" OLED 120Hz', cpu: 'Apple A17 Pro', ram: '8GB', storage: '256GB', camera: '48MP + 12MP + 12MP', battery: '4441 mAh', os: 'iOS 17' }, 4.9, true, 1),
      mk('iPhone 15 128GB', 'Apple', 19990000, 22990000, '334155', { screen: '6.1" OLED 60Hz', cpu: 'Apple A16 Bionic', ram: '6GB', storage: '128GB', camera: '48MP + 12MP', battery: '3349 mAh', os: 'iOS 17' }, 4.7, true, 2),
      mk('iPhone 14 128GB', 'Apple', 15990000, 19990000, '475569', { screen: '6.1" OLED 60Hz', cpu: 'Apple A15 Bionic', ram: '6GB', storage: '128GB', camera: '12MP + 12MP', battery: '3279 mAh', os: 'iOS 16' }, 4.6, false, 3),
      mk('iPhone 18 Pro Max 256GB', 'Apple', 39099000, 41999000, '', { screen: '6.9" LTPO OLED 120Hz', cpu: 'Apple A20 Pro (2nm)', ram: '12GB', storage: '256GB', camera: '48MP x3 + 18MP trước', battery: '5391 mAh', os: 'iOS 27' }, 4.9, true, 20),
      mk('iPhone 18 Pro 256GB', 'Apple', 36399000, 38999000, '', { screen: '6.3" LTPO OLED 120Hz', cpu: 'Apple A20 Pro (2nm)', ram: '12GB', storage: '256GB', camera: '48MP x3 + 18MP trước', battery: '4056 mAh', os: 'iOS 27' }, 4.9, true, 19),
      mk('iPhone 17 Pro Max 256GB', 'Apple', 33990000, 37990000, '', { screen: '6.9" LTPO OLED 120Hz', cpu: 'Apple A19 Pro', ram: '12GB', storage: '256GB', camera: '48MP x3 + 18MP trước', battery: '5088 mAh', os: 'iOS 26' }, 4.8, true, 18),
      mk('iPhone 17 Pro 256GB', 'Apple', 30990000, 34990000, '', { screen: '6.3" LTPO OLED 120Hz', cpu: 'Apple A19 Pro', ram: '12GB', storage: '256GB', camera: '48MP x3 + 18MP trước', battery: '4252 mAh', os: 'iOS 26' }, 4.8, true, 17),
      mk('iPhone Air 256GB', 'Apple', 27990000, 31990000, '', { screen: '6.5" LTPO OLED 120Hz', cpu: 'Apple A19 Pro', ram: '12GB', storage: '256GB', camera: '48MP + 18MP trước', battery: '3149 mAh', os: 'iOS 26' }, 4.5, false, 16),
      mk('iPhone 17 256GB', 'Apple', 21990000, 24990000, '', { screen: '6.3" OLED 120Hz', cpu: 'Apple A19', ram: '8GB', storage: '256GB', camera: '48MP + 48MP + 18MP trước', battery: '3692 mAh', os: 'iOS 26' }, 4.7, false, 15),
      mk('iPhone 16 Pro Max 256GB', 'Apple', 28990000, 34990000, '', { screen: '6.9" LTPO OLED 120Hz', cpu: 'Apple A18 Pro', ram: '8GB', storage: '256GB', camera: '48MP + 48MP + 12MP', battery: '4685 mAh', os: 'iOS 18' }, 4.8, true, 14),
      mk('iPhone 16 Pro 128GB', 'Apple', 24990000, 28990000, '', { screen: '6.3" LTPO OLED 120Hz', cpu: 'Apple A18 Pro', ram: '8GB', storage: '128GB', camera: '48MP + 48MP + 12MP', battery: '3582 mAh', os: 'iOS 18' }, 4.8, false, 13),
      mk('iPhone 16 Plus 128GB', 'Apple', 21490000, 25990000, '', { screen: '6.7" OLED 60Hz', cpu: 'Apple A18', ram: '8GB', storage: '128GB', camera: '48MP + 12MP', battery: '4674 mAh', os: 'iOS 18' }, 4.6, false, 12),
      mk('iPhone 16 128GB', 'Apple', 18490000, 22990000, '', { screen: '6.1" OLED 60Hz', cpu: 'Apple A18', ram: '8GB', storage: '128GB', camera: '48MP + 12MP', battery: '3561 mAh', os: 'iOS 18' }, 4.6, false, 11),
      mk('Samsung Galaxy S24 Ultra 512GB', 'Samsung', 31990000, 36990000, '0f766e', { screen: '6.8" AMOLED 120Hz', cpu: 'Snapdragon 8 Gen 3', ram: '12GB', storage: '512GB', camera: '200MP + 50MP + 12MP + 10MP', battery: '5000 mAh', os: 'Android 14' }, 4.8, true, 4),
      mk('Samsung Galaxy S24 256GB', 'Samsung', 20990000, 24990000, '115e59', { screen: '6.2" AMOLED 120Hz', cpu: 'Exynos 2400', ram: '8GB', storage: '256GB', camera: '50MP + 12MP + 10MP', battery: '4000 mAh', os: 'Android 14' }, 4.6, true, 5),
      mk('Samsung Galaxy A55 5G', 'Samsung', 9990000, 10990000, '14532d', { screen: '6.6" Super AMOLED 120Hz', cpu: 'Exynos 1480', ram: '8GB', storage: '128GB', camera: '50MP + 12MP + 5MP', battery: '5000 mAh', os: 'Android 14' }, 4.4, false, 6),
      mk('Xiaomi 14 256GB', 'Xiaomi', 18990000, 21990000, 'c2410c', { screen: '6.36" AMOLED 120Hz', cpu: 'Snapdragon 8 Gen 3', ram: '12GB', storage: '256GB', camera: '50MP Leica x3', battery: '4610 mAh', os: 'HyperOS' }, 4.7, true, 7),
      mk('Xiaomi Redmi Note 13 Pro', 'Xiaomi', 7490000, 8490000, '9a3412', { screen: '6.67" AMOLED 120Hz', cpu: 'Snapdragon 7s Gen 2', ram: '8GB', storage: '256GB', camera: '200MP + 8MP + 2MP', battery: '5100 mAh', os: 'MIUI 14' }, 4.5, false, 8),
      mk('OPPO Find X7 Ultra', 'OPPO', 25990000, 28990000, '1d4ed8', { screen: '6.82" AMOLED 120Hz', cpu: 'Snapdragon 8 Gen 3', ram: '16GB', storage: '512GB', camera: '50MP x4 Hasselblad', battery: '5000 mAh', os: 'ColorOS 14' }, 4.6, true, 9),
      mk('OPPO Reno11 F 5G', 'OPPO', 8490000, 9490000, '1e40af', { screen: '6.7" AMOLED 120Hz', cpu: 'Dimensity 7050', ram: '8GB', storage: '256GB', camera: '64MP + 8MP + 2MP', battery: '5000 mAh', os: 'ColorOS 14' }, 4.3, false, 10),
      mk('Vivo V30 5G', 'Vivo', 12990000, 14990000, '7e22ce', { screen: '6.78" AMOLED 120Hz', cpu: 'Snapdragon 7 Gen 3', ram: '12GB', storage: '256GB', camera: '50MP x2 + 50MP selfie', battery: '5000 mAh', os: 'Funtouch OS 14' }, 4.5, false, 11),
      mk('Vivo Y36', 'Vivo', 5490000, 5990000, '6b21a8', { screen: '6.64" IPS 90Hz', cpu: 'Snapdragon 680', ram: '8GB', storage: '128GB', camera: '50MP + 2MP', battery: '5000 mAh', os: 'Funtouch OS 13' }, 4.1, false, 12),
      mk('Realme 12 Pro+ 5G', 'Realme', 11990000, 13990000, 'b45309', { screen: '6.7" AMOLED 120Hz', cpu: 'Snapdragon 7s Gen 2', ram: '12GB', storage: '256GB', camera: '50MP + 64MP periscope + 8MP', battery: '5000 mAh', os: 'Realme UI 5' }, 4.5, true, 13),
      mk('Realme C67', 'Realme', 4990000, 5490000, '92400e', { screen: '6.72" IPS 90Hz', cpu: 'Snapdragon 685', ram: '8GB', storage: '128GB', camera: '108MP + 2MP', battery: '5000 mAh', os: 'Realme UI 5' }, 4.0, false, 14),
    ];
    const users = [
      { id: uid(), name: 'Quản trị viên', email: 'admin@phonestore.com', pass: hash('admin123'), phone: '0900000001', address: '', role: 'admin', createdAt: OCT(1) },
      { id: uid(), name: 'Nguyễn Văn A', email: 'user@phonestore.com', pass: hash('user123'), phone: '0900000002', address: '123 Nguyễn Huệ, Q.1, TP.HCM', role: 'user', createdAt: OCT(2) },
    ];
    return { users, products, carts: {}, orders: [] };
  }
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
  if (!db || !db.products) db = seed();
  else { // nâng cấp dữ liệu cũ: thêm sản phẩm mới + ảnh minh họa, giữ nguyên tài khoản/đơn hàng
    const fresh = seed().products;
    fresh.forEach((np) => {
      const old = db.products.find((p) => p.name === np.name);
      if (!old) db.products.push(np);
      else if (/placehold\.co|^images\//.test(old.image || '')) old.image = np.image;
    });
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
  save();

  let me = null;
  try { const id = localStorage.getItem(SKEY); me = db.users.find((u) => u.id === id) || null; } catch (e) {}
  const setMe = (u) => { me = u; try { u ? localStorage.setItem(SKEY, u.id) : localStorage.removeItem(SKEY); } catch (e) {} };
  const prod = (id) => db.products.find((p) => p.id === id);
  const cart = () => (me ? (db.carts[me.id] = db.carts[me.id] || []) : []);
  const cartItems = () => cart().map((i) => ({ ...i, p: prod(i.pid) })).filter((i) => i.p);
  const cartCount = () => cartItems().reduce((n, i) => n + i.qty, 0);
  const cartTotal = () => cartItems().reduce((t, i) => t + i.p.price * i.qty, 0);
  const shipFee = (s) => (s >= 5000000 || s === 0 ? 0 : 30000);

  /* ---------- router ---------- */
  const nav = (h) => { location.hash = h; };
  function route() {
    const [path, qs] = (location.hash.slice(1) || '/').split('?');
    const q = Object.fromEntries(new URLSearchParams(qs || ''));
    const parts = path.split('/').filter(Boolean);
    const guard = (admin) => { if (!me) { nav('#/login'); return false; } if (admin && me.role !== 'admin') { nav('#/'); return false; } return true; };
    renderNav();
    let html = '';
    switch (parts[0]) {
      case undefined: html = pHome(); break;
      case 'products': html = pProducts(q); break;
      case 'product': html = pDetail(parts[1]); break;
      case 'login': html = pLogin(); break;
      case 'register': html = pRegister(); break;
      case 'cart': if (!guard()) return; html = pCart(); break;
      case 'checkout': if (!guard()) return; html = pCheckout(); break;
      case 'orders': if (!guard()) return; html = pOrders(); break;
      case 'profile': if (!guard()) return; html = pProfile(); break;
      case 'admin': if (!guard(true)) return; html = pAdmin(); break;
      default: html = '<div class="container empty"><h2>404 - Không tìm thấy trang</h2></div>';
    }
    $('#app').innerHTML = html;
    window.scrollTo(0, 0);
    bind(parts[0], q, parts[1]);
  }
  window.addEventListener('hashchange', route);

  function renderNav() {
    $('#nav').innerHTML = `
      <a href="#/" class="logo">📱 Phone<span>Store</span></a>
      <form class="nav-search" id="navsearch"><input name="kw" placeholder="🔍 Tìm điện thoại..." /></form>
      <button class="hamburger" id="burger" aria-label="Menu">☰</button>
      <nav class="nav-links" id="links">
        <a href="#/">Trang chủ</a><a href="#/products">Sản phẩm</a>
        ${me ? '<a href="#/orders">Đơn hàng</a>' : ''}
        ${me && me.role === 'admin' ? '<a href="#/admin">Quản trị</a>' : ''}
        <a href="#/cart" class="cart-link">🛒${cartCount() ? `<span class="badge">${cartCount()}</span>` : ''}</a>
        ${me ? `<a href="#/profile" class="user-link">👤 ${esc(me.name)}</a><button class="btn btn-outline btn-sm" id="logout">Đăng xuất</button>`
             : '<a href="#/login" class="btn btn-outline btn-sm">Đăng nhập</a><a href="#/register" class="btn btn-primary btn-sm">Đăng ký</a>'}
      </nav>`;
    $('#burger').onclick = () => $('#links').classList.toggle('open');
    $('#links').onclick = (e) => { if (e.target.closest('a')) $('#links').classList.remove('open'); };
    $('#navsearch').onsubmit = (e) => { e.preventDefault(); nav('#/products?keyword=' + encodeURIComponent(e.target.kw.value)); };
    const lo = $('#logout'); if (lo) lo.onclick = () => { setMe(null); toast('Đã đăng xuất'); nav('#/'); route(); };
  }

  /* ---------- trang ---------- */
  const card = (p) => `
    <a class="card product-card" href="#/product/${p.id}">
      ${p.discount > 0 ? `<span class="discount-badge">-${p.discount}%</span>` : ''}
      <div class="img-wrap"><img src="${esc(p.image || FALLBACK)}" alt="${esc(p.name)}" loading="lazy" data-fb></div>
      <div class="card-body"><span class="brand">${esc(p.brand)}</span><h3>${esc(p.name)}</h3>
        <div class="price-row"><strong class="price">${money(p.price)}</strong>${p.originalPrice > p.price ? `<del class="old-price">${money(p.originalPrice)}</del>` : ''}</div>
        <div class="rating">⭐ ${Number(p.rating).toFixed(1)}</div></div>
    </a>`;

  function pHome() {
    const feat = db.products.filter((p) => p.featured).slice(0, 4);
    const latest = [...db.products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
    const F = [['🛡️', 'Chính hãng 100%', 'Cam kết hàng chính hãng'], ['🚚', 'Giao hàng miễn phí', 'Đơn từ 5 triệu'], ['🔄', 'Đổi trả 30 ngày', 'Lỗi là đổi mới'], ['🎧', 'Hỗ trợ 24/7', 'Tư vấn tận tâm']];
    return `
    <section class="hero"><div class="container hero-inner"><div>
      <span class="pill">Siêu phẩm 2026</span>
      <h1>Điện thoại chính hãng <br><span class="grad">giá tốt mỗi ngày</span></h1>
      <p>Khám phá nhiều mẫu điện thoại từ các thương hiệu hàng đầu. Thanh toán khi nhận hàng, đổi trả 30 ngày.</p>
      <a href="#/products" class="btn btn-primary btn-lg">Mua ngay</a></div><div class="hero-art float">📱</div></div></section>
    <section class="container features">${F.map((f) => `<div class="glass feature"><span style="font-size:1.8rem">${f[0]}</span><div><h4>${f[1]}</h4><p>${f[2]}</p></div></div>`).join('')}</section>
    <section class="container section"><h2>Thương hiệu nổi bật</h2><div class="brand-grid">${BRANDS.map((b) => `<a class="glass brand-card" href="#/products?brand=${b}">${b}</a>`).join('')}</div></section>
    <section class="container section"><h2>Sản phẩm nổi bật</h2><div class="grid grid-4">${feat.map(card).join('')}</div></section>
    <section class="container section"><h2>Mới nhất</h2><div class="grid grid-4">${latest.map(card).join('')}</div></section>
    ${me ? '' : '<section class="container section"><div class="promo glass"><h2>Đăng ký tài khoản ngay</h2><p>Theo dõi đơn hàng, lưu giỏ hàng của bạn.</p><a href="#/register" class="btn btn-primary">Đăng ký miễn phí</a></div></section>'}`;
  }

  const RANGES = [['', 'Tất cả mức giá', 0, Infinity], ['1', 'Dưới 5 triệu', 0, 5e6], ['2', '5 - 10 triệu', 5e6, 1e7], ['3', '10 - 20 triệu', 1e7, 2e7], ['4', 'Trên 20 triệu', 2e7, Infinity]];
  function pProducts(q) {
    const kw = (q.keyword || '').toLowerCase(), brand = q.brand || '', sort = q.sort || 'newest', range = q.range || '', page = parseInt(q.page) || 1;
    const r = RANGES.find((x) => x[0] === range) || RANGES[0];
    let list = db.products.filter((p) => (!kw || p.name.toLowerCase().includes(kw)) && (!brand || p.brand === brand) && p.price >= r[2] && p.price <= r[3]);
    const S = { newest: (a, b) => b.createdAt.localeCompare(a.createdAt), 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating };
    list.sort(S[sort] || S.newest);
    const per = 9, pages = Math.max(1, Math.ceil(list.length / per));
    const shown = list.slice((page - 1) * per, page * per);
    const brands = [...new Set(db.products.map((p) => p.brand))];
    return `<div class="container products-layout">
      <aside class="glass sidebar"><h3>Bộ lọc</h3>
        <form id="fsearch"><input class="input" name="keyword" placeholder="Tìm theo tên..." value="${esc(q.keyword || '')}"></form>
        <h4>Thương hiệu</h4><div class="chips"><button class="chip ${!brand ? 'active' : ''}" data-set="brand=">Tất cả</button>${brands.map((b) => `<button class="chip ${brand === b ? 'active' : ''}" data-set="brand=${esc(b)}">${esc(b)}</button>`).join('')}</div>
        <h4>Khoảng giá</h4><select class="input" data-sel="range">${RANGES.map((x) => `<option value="${x[0]}" ${x[0] === range ? 'selected' : ''}>${x[1]}</option>`).join('')}</select>
        <h4>Sắp xếp</h4><select class="input" data-sel="sort">${[['newest', 'Mới nhất'], ['price-asc', 'Giá tăng dần'], ['price-desc', 'Giá giảm dần'], ['rating', 'Đánh giá cao']].map((x) => `<option value="${x[0]}" ${x[0] === sort ? 'selected' : ''}>${x[1]}</option>`).join('')}</select>
      </aside>
      <section><p class="muted">${list.length} sản phẩm</p>
        ${shown.length ? `<div class="grid grid-3">${shown.map(card).join('')}</div>` : '<div class="empty">Không tìm thấy sản phẩm phù hợp.</div>'}
        ${pages > 1 ? `<div class="pagination">${Array.from({ length: pages }, (_, i) => `<button class="chip ${i + 1 === page ? 'active' : ''}" data-set="page=${i + 1}">${i + 1}</button>`).join('')}</div>` : ''}
      </section></div>`;
  }

  function pDetail(id) {
    const p = prod(id);
    if (!p) return '<div class="container empty">Không tìm thấy sản phẩm.</div>';
    const rel = db.products.filter((x) => x.brand === p.brand && x.id !== p.id).slice(0, 4);
    return `<div class="container section"><div class="detail">
      <div class="glass detail-img"><img src="${esc(p.image || FALLBACK)}" alt="${esc(p.name)}" data-fb></div>
      <div><span class="brand">${esc(p.brand)}</span><h1>${esc(p.name)}</h1><div class="rating">⭐ ${Number(p.rating).toFixed(1)}</div>
        <div class="price-row big"><strong class="price">${money(p.price)}</strong>${p.originalPrice > p.price ? `<del class="old-price">${money(p.originalPrice)}</del><span class="discount-badge static">-${p.discount}%</span>` : ''}</div>
        <p>${esc(p.description)}</p>
        <p class="${p.stock > 0 ? 'ok' : 'danger'}">${p.stock > 0 ? `Còn hàng (${p.stock})` : 'Hết hàng'}</p>
        <div class="qty-row"><div class="qty"><button id="qm">−</button><span id="qv">1</span><button id="qp">+</button></div>
          <button class="btn btn-primary" id="addcart" ${p.stock < 1 ? 'disabled' : ''}>🛒 Thêm vào giỏ hàng</button></div>
        <h3>Thông số kỹ thuật</h3><table class="table"><tbody>${Object.entries(SPEC).filter(([k]) => p.specs && p.specs[k]).map(([k, l]) => `<tr><th>${l}</th><td>${esc(p.specs[k])}</td></tr>`).join('')}</tbody></table>
      </div></div>
      ${rel.length ? `<h2 style="margin-top:48px">Sản phẩm liên quan</h2><div class="grid grid-4">${rel.map(card).join('')}</div>` : ''}</div>`;
  }

  function pLogin() {
    return `<div class="auth-wrap"><form class="glass auth-card" id="flogin"><h1>Đăng nhập</h1>
      <label>Email<input class="input" name="email" type="email" required></label>
      <label>Mật khẩu<input class="input" name="password" type="password" required></label>
      <button class="btn btn-primary btn-block">Đăng nhập</button>
      <p class="muted center">Chưa có tài khoản? <a href="#/register" style="color:var(--primary2)">Đăng ký</a></p>
      <div class="demo"><strong>Tài khoản demo (bấm để điền)</strong>
        <div><button type="button" class="link" data-demo="admin@phonestore.com|admin123">Admin: admin@phonestore.com / admin123</button></div>
        <div><button type="button" class="link" data-demo="user@phonestore.com|user123">User: user@phonestore.com / user123</button></div></div></form></div>`;
  }
  function pRegister() {
    return `<div class="auth-wrap"><form class="glass auth-card" id="freg"><h1>Đăng ký</h1>
      <label>Họ tên<input class="input" name="name" required></label><label>Email<input class="input" name="email" type="email" required></label>
      <label>Số điện thoại<input class="input" name="phone"></label><label>Mật khẩu<input class="input" name="password" type="password" required></label>
      <label>Xác nhận mật khẩu<input class="input" name="confirm" type="password" required></label>
      <button class="btn btn-primary btn-block">Đăng ký</button>
      <p class="muted center">Đã có tài khoản? <a href="#/login" style="color:var(--primary2)">Đăng nhập</a></p></form></div>`;
  }
  function pProfile() {
    return `<div class="auth-wrap"><form class="glass auth-card" id="fprof"><h1>Hồ sơ cá nhân</h1>
      <label>Email<input class="input" value="${esc(me.email)}" disabled></label>
      <label>Họ tên<input class="input" name="name" required value="${esc(me.name)}"></label>
      <label>Số điện thoại<input class="input" name="phone" value="${esc(me.phone)}"></label>
      <label>Địa chỉ<input class="input" name="address" value="${esc(me.address)}"></label>
      <label>Mật khẩu mới (bỏ trống nếu không đổi)<input class="input" name="password" type="password"></label>
      <button class="btn btn-primary btn-block">Lưu thay đổi</button></form></div>`;
  }

  function pCart() {
    const items = cartItems();
    if (!items.length) return '<div class="container empty"><h2>Giỏ hàng trống</h2><a href="#/products" class="btn btn-primary">Tiếp tục mua sắm</a></div>';
    const t = cartTotal(), s = shipFee(t);
    return `<div class="container section cart-layout"><div><h1>Giỏ hàng</h1>
      ${items.map((i) => `<div class="glass cart-item"><img src="${esc(i.p.image || FALLBACK)}" data-fb alt="">
        <div class="grow"><a href="#/product/${i.p.id}"><h4>${esc(i.p.name)}</h4></a><span class="muted">${money(i.p.price)}</span></div>
        <div class="qty"><button data-q="${i.pid}|-1">−</button><span>${i.qty}</span><button data-q="${i.pid}|1">+</button></div>
        <strong class="price">${money(i.p.price * i.qty)}</strong><button class="icon-btn danger" data-rm="${i.pid}">🗑️</button></div>`).join('')}</div>
      <aside class="glass summary"><h3>Tóm tắt đơn hàng</h3>
        <div class="row"><span>Tạm tính</span><span>${money(t)}</span></div><div class="row"><span>Phí vận chuyển</span><span>${s ? money(s) : 'Miễn phí'}</span></div>
        <div class="row total"><span>Tổng cộng</span><span>${money(t + s)}</span></div>
        <a href="#/checkout" class="btn btn-primary btn-block">Tiến hành thanh toán</a></aside></div>`;
  }

  function pCheckout() {
    const items = cartItems();
    if (!items.length) return '<div class="container empty"><h2>Giỏ hàng trống</h2><a href="#/products" class="btn btn-primary">Mua sắm</a></div>';
    const t = cartTotal(), s = shipFee(t);
    return `<form class="container section cart-layout" id="fco"><div class="glass pad"><h1>Thông tin giao hàng</h1><div class="form-grid">
      <label>Họ tên *<input class="input" name="fullName" value="${esc(me.name)}"></label><label>Số điện thoại *<input class="input" name="phone" value="${esc(me.phone)}"></label>
      <label class="span2">Địa chỉ *<input class="input" name="address" value="${esc(me.address)}"></label>
      <label>Tỉnh/Thành phố *<input class="input" name="city"></label><label>Quận/Huyện *<input class="input" name="district"></label>
      <label>Phường/Xã<input class="input" name="ward"></label><label class="span2">Ghi chú<textarea class="input" name="note" rows="3"></textarea></label></div>
      <h3>Phương thức thanh toán</h3><label class="radio"><input type="radio" checked> COD - Thanh toán khi nhận hàng</label></div>
      <aside class="glass summary"><h3>Đơn hàng của bạn</h3>
        ${items.map((i) => `<div class="row small"><span>${esc(i.p.name)} × ${i.qty}</span><span>${money(i.p.price * i.qty)}</span></div>`).join('')}<hr>
        <div class="row"><span>Tạm tính</span><span>${money(t)}</span></div><div class="row"><span>Phí ship</span><span>${s ? money(s) : 'Miễn phí'}</span></div>
        <div class="row total"><span>Tổng cộng</span><span>${money(t + s)}</span></div><button class="btn btn-primary btn-block">Đặt hàng</button></aside></form>`;
  }

  function pOrders() {
    const list = db.orders.filter((o) => o.userId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (!list.length) return '<div class="container empty"><h2>Bạn chưa có đơn hàng nào</h2><a href="#/products" class="btn btn-primary">Mua sắm ngay</a></div>';
    return `<div class="container section"><h1>Lịch sử đơn hàng</h1>${list.map((o) => `<div class="glass order"><div class="order-head">
      <strong>#${o.id.slice(-8).toUpperCase()}</strong><span class="status ${o.status}">${STATUS[o.status]}</span><span class="muted">${dt(o.createdAt)}</span></div>
      ${o.items.map((i) => `<div class="row small"><span>${esc(i.name)} × ${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`).join('')}
      <div class="row total"><span>Tổng tiền</span><span>${money(o.total)}</span></div></div>`).join('')}</div>`;
  }

  let adminTab = 'overview';
  function pAdmin() {
    const T = [['overview', 'Tổng quan'], ['orders', 'Đơn hàng'], ['products', 'Sản phẩm'], ['users', 'Người dùng']];
    let body = '';
    if (adminTab === 'overview') {
      const o = db.orders;
      const st = [['Tổng đơn hàng', o.length], ['Doanh thu', money(o.filter((x) => x.status === 'delivered').reduce((s, x) => s + x.total, 0))], ['Chờ xử lý', o.filter((x) => x.status === 'pending').length], ['Đã giao', o.filter((x) => x.status === 'delivered').length]];
      body = `<div class="grid grid-4">${st.map((s) => `<div class="glass stat"><span class="muted">${s[0]}</span><strong>${s[1]}</strong></div>`).join('')}</div>`;
    } else if (adminTab === 'orders') {
      body = `<div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Khách hàng</th><th>Ngày</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead><tbody>
        ${[...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((o) => `<tr><td>#${o.id.slice(-8).toUpperCase()}</td><td>${esc(o.userName)}</td><td>${dt(o.createdAt)}</td><td>${money(o.total)}</td>
        <td><select class="input" data-st="${o.id}">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === o.status ? 'selected' : ''}>${v}</option>`).join('')}</select></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Chưa có đơn hàng</td></tr>'}</tbody></table></div>`;
    } else if (adminTab === 'products') {
      body = `<button class="btn btn-primary" data-edit="">➕ Thêm sản phẩm</button><div class="table-wrap"><table class="table"><thead><tr><th>Tên</th><th>Hãng</th><th>Giá</th><th>Kho</th><th></th></tr></thead><tbody>
        ${db.products.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.brand)}</td><td>${money(p.price)}</td><td>${p.stock}</td><td class="actions"><button class="icon-btn" data-edit="${p.id}">✏️</button><button class="icon-btn danger" data-delp="${p.id}">🗑️</button></td></tr>`).join('')}</tbody></table></div>`;
    } else {
      body = `<div class="table-wrap"><table class="table"><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Ngày tạo</th><th></th></tr></thead><tbody>
        ${db.users.map((u) => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.role}</td><td>${dt(u.createdAt)}</td><td class="actions">${u.role !== 'admin' ? `<button class="icon-btn danger" data-delu="${u.id}">🗑️</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
    }
    return `<div class="container section"><h1>Trang quản trị</h1><div class="tabs">${T.map((t) => `<button class="chip ${adminTab === t[0] ? 'active' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>${body}</div>`;
  }

  function productModal(id) {
    const p = id ? prod(id) : { name: '', brand: '', price: '', originalPrice: '', image: '', description: '', stock: 10, rating: 4.5, featured: false, specs: {} };
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<form class="glass modal"><h2>${id ? 'Sửa' : 'Thêm'} sản phẩm</h2><div class="form-grid">
      <label class="span2">Tên *<input class="input" name="name" required value="${esc(p.name)}"></label>
      <label>Thương hiệu *<input class="input" name="brand" required value="${esc(p.brand)}"></label><label>URL ảnh<input class="input" name="image" value="${esc(p.image)}"></label>
      <label>Giá bán *<input class="input" name="price" type="number" min="0" required value="${p.price}"></label><label>Giá gốc<input class="input" name="originalPrice" type="number" min="0" value="${p.originalPrice}"></label>
      <label>Tồn kho<input class="input" name="stock" type="number" min="0" value="${p.stock}"></label><label>Đánh giá (0-5)<input class="input" name="rating" type="number" step="0.1" min="0" max="5" value="${p.rating}"></label>
      <label class="span2">Mô tả<textarea class="input" name="description" rows="2">${esc(p.description)}</textarea></label>
      ${Object.entries(SPEC).map(([k, l]) => `<label>${l}<input class="input" name="spec_${k}" value="${esc((p.specs || {})[k] || '')}"></label>`).join('')}
      <label class="radio span2"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}> Sản phẩm nổi bật</label></div>
      <div class="modal-actions"><button type="button" class="btn btn-outline" id="mcancel">Hủy</button><button class="btn btn-primary">Lưu</button></div></form>`;
    document.body.appendChild(bg);
    bg.onclick = (e) => { if (e.target === bg) bg.remove(); };
    bg.querySelector('#mcancel').onclick = () => bg.remove();
    bg.querySelector('form').onsubmit = (e) => {
      e.preventDefault(); const f = e.target, v = (n) => f.elements[n].value;
      const price = Number(v('price')), orig = Number(v('originalPrice')) || price;
      const data = { name: v('name').trim(), brand: v('brand').trim(), image: v('image').trim(), description: v('description'), price, originalPrice: orig,
        discount: orig > price ? Math.round((1 - price / orig) * 100) : 0, stock: Number(v('stock')), rating: Number(v('rating')), featured: f.elements.featured.checked,
        specs: Object.fromEntries(Object.keys(SPEC).map((k) => [k, v('spec_' + k)])) };
      if (id) Object.assign(prod(id), data); else db.products.unshift({ id: uid(), createdAt: new Date().toISOString(), ...data });
      save(); bg.remove(); toast('Đã lưu sản phẩm', 'ok'); route();
    };
  }

  /* ---------- gắn sự kiện sau mỗi lần render ---------- */
  function bind(page, q, arg) {
    document.querySelectorAll('img[data-fb]').forEach((im) => (im.onerror = () => { im.onerror = null; im.src = FALLBACK; }));
    const setQ = (patch) => {
      const n = new URLSearchParams(q); Object.entries({ page: '', ...patch }).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
      nav('#/products?' + n.toString());
    };
    if (page === 'products') {
      document.querySelectorAll('[data-set]').forEach((b) => (b.onclick = () => { const [k, v] = b.dataset.set.split('='); setQ({ [k]: v }); }));
      document.querySelectorAll('[data-sel]').forEach((s) => (s.onchange = () => setQ({ [s.dataset.sel]: s.value })));
      $('#fsearch').onsubmit = (e) => { e.preventDefault(); setQ({ keyword: e.target.keyword.value }); };
    }
    if (page === 'product') {
      let qty = 1; const p = prod(arg); if (!p) return;
      $('#qm').onclick = () => { qty = Math.max(1, qty - 1); $('#qv').textContent = qty; };
      $('#qp').onclick = () => { qty = Math.min(p.stock || 1, qty + 1); $('#qv').textContent = qty; };
      $('#addcart').onclick = () => {
        if (!me) { toast('Vui lòng đăng nhập'); return nav('#/login'); }
        const c = cart(), ex = c.find((i) => i.pid === p.id), n = (ex ? ex.qty : 0) + qty;
        if (n > p.stock) return toast('Vượt quá số lượng tồn kho', 'err');
        if (ex) ex.qty = n; else c.push({ pid: p.id, qty }); save(); renderNav(); toast('Đã thêm vào giỏ hàng', 'ok');
      };
    }
    if (page === 'login') {
      document.querySelectorAll('[data-demo]').forEach((b) => (b.onclick = () => { const [e, p] = b.dataset.demo.split('|'); const f = $('#flogin'); f.email.value = e; f.password.value = p; }));
      $('#flogin').onsubmit = (e) => {
        e.preventDefault(); const f = e.target;
        const u = db.users.find((x) => x.email === f.email.value.trim().toLowerCase() && x.pass === hash(f.password.value));
        if (!u) return toast('Email hoặc mật khẩu không đúng', 'err');
        setMe(u); toast('Đăng nhập thành công', 'ok'); nav('#/');
      };
    }
    if (page === 'register') {
      $('#freg').onsubmit = (e) => {
        e.preventDefault(); const f = e.target, email = f.email.value.trim().toLowerCase();
        if (f.password.value.length < 6) return toast('Mật khẩu phải có ít nhất 6 ký tự', 'err');
        if (f.password.value !== f.confirm.value) return toast('Mật khẩu xác nhận không khớp', 'err');
        if (db.users.some((u) => u.email === email)) return toast('Email đã được sử dụng', 'err');
        const u = { id: uid(), name: f.name.value.trim(), email, pass: hash(f.password.value), phone: f.phone.value, address: '', role: 'user', createdAt: new Date().toISOString() };
        db.users.push(u); save(); setMe(u); toast('Đăng ký thành công', 'ok'); nav('#/');
      };
    }
    if (page === 'profile') {
      $('#fprof').onsubmit = (e) => {
        e.preventDefault(); const f = e.target;
        if (f.password.value && f.password.value.length < 6) return toast('Mật khẩu phải có ít nhất 6 ký tự', 'err');
        Object.assign(me, { name: f.name.value, phone: f.phone.value, address: f.address.value }); if (f.password.value) me.pass = hash(f.password.value);
        save(); renderNav(); toast('Đã cập nhật hồ sơ', 'ok'); f.password.value = '';
      };
    }
    if (page === 'cart') {
      document.querySelectorAll('[data-q]').forEach((b) => (b.onclick = () => {
        const [pid, d] = b.dataset.q.split('|'), it = cart().find((i) => i.pid === pid), p = prod(pid), n = it.qty + Number(d);
        if (n < 1) return; if (n > p.stock) return toast('Vượt quá số lượng tồn kho', 'err'); it.qty = n; save(); route();
      }));
      document.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => { db.carts[me.id] = cart().filter((i) => i.pid !== b.dataset.rm); save(); route(); }));
    }
    if (page === 'checkout' && $('#fco')) {
      $('#fco').onsubmit = (e) => {
        e.preventDefault(); const f = e.target, v = (n) => f.elements[n].value.trim();
        if (!v('fullName') || !v('phone') || !v('address') || !v('city') || !v('district')) return toast('Vui lòng nhập đầy đủ thông tin bắt buộc', 'err');
        if (!/^0\d{9}$/.test(v('phone'))) return toast('Số điện thoại không hợp lệ', 'err');
        const items = cartItems();
        for (const i of items) if (i.qty > i.p.stock) return toast(`${i.p.name} không đủ hàng`, 'err');
        const sub = cartTotal(), ship = shipFee(sub);
        db.orders.push({ id: uid(), userId: me.id, userName: me.name, items: items.map((i) => ({ pid: i.pid, name: i.p.name, price: i.p.price, qty: i.qty })),
          shipping: { fullName: v('fullName'), phone: v('phone'), address: v('address'), city: v('city'), district: v('district'), ward: v('ward'), note: v('note') },
          payment: 'COD', subtotal: sub, shippingFee: ship, total: sub + ship, status: 'pending', createdAt: new Date().toISOString() });
        items.forEach((i) => (i.p.stock -= i.qty)); db.carts[me.id] = []; save(); toast('Đặt hàng thành công!', 'ok'); nav('#/orders');
      };
    }
    if (page === 'admin') {
      document.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { adminTab = b.dataset.tab; route(); }));
      document.querySelectorAll('[data-st]').forEach((s) => (s.onchange = () => {
        const o = db.orders.find((x) => x.id === s.dataset.st);
        if (s.value === 'cancelled' && o.status !== 'cancelled') o.items.forEach((i) => { const p = prod(i.pid); if (p) p.stock += i.qty; });
        o.status = s.value; save(); toast('Đã cập nhật trạng thái', 'ok');
      }));
      document.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => productModal(b.dataset.edit)));
      document.querySelectorAll('[data-delp]').forEach((b) => (b.onclick = () => { if (confirm('Xóa sản phẩm này?')) { db.products = db.products.filter((p) => p.id !== b.dataset.delp); save(); route(); } }));
      document.querySelectorAll('[data-delu]').forEach((b) => (b.onclick = () => { if (confirm('Xóa người dùng này?')) { db.users = db.users.filter((u) => u.id !== b.dataset.delu); save(); route(); } }));
    }
  }

  route();
})();
