let selectedSize = null;
const CONFIG = {
  API_BASE: 'https://shoestore-api-sx28.onrender.com/api',
  CART_KEY: 'shoestore_cart',
  USER_KEY: 'shoestore_user',
};

// ============================================
// CART MANAGER
// ============================================

const Cart = {
  /** Get current cart from localStorage */
  get() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.CART_KEY)) || [];
    } catch {
      return [];
    }
  },

  /** Save cart to localStorage */
  save(items) {
    localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(items));
    Cart.updateBadge();
    Cart.dispatchEvent();
  },

  /** Add item to cart */
  add(product, qty = 1, size = 'M') {
    const cart = Cart.get();
    const key = `${product.id}_${size}`;
    const existing = cart.find(i => i.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        key,
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.image,
        category: product.category,
        size,
        qty,
      });
    }
    Cart.save(cart);
    Toast.show(`${product.name} added to cart! 🛒`, 'success');
  },

  /** Remove item from cart */
  remove(key) {
    const cart = Cart.get().filter(i => i.key !== key);
    Cart.save(cart);
  },

  /** Update item quantity */
  updateQty(key, qty) {
    const cart = Cart.get();
    const item = cart.find(i => i.key === key);
    if (item) {
      if (qty <= 0) {
        return Cart.remove(key);
      }
      item.qty = qty;
      Cart.save(cart);
    }
  },

  /** Get cart totals */
  totals() {
    const cart = Cart.get();
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shipping = subtotal > 0 ? (subtotal >= 100 ? 0 : 8.99) : 0;
    const tax      = subtotal * 0.08;
    const total    = subtotal + shipping + tax;
    const count    = cart.reduce((sum, i) => sum + i.qty, 0);
    return { subtotal, shipping, tax, total, count };
  },

  /** Update cart badge in navbar */
  updateBadge() {
    const { count } = Cart.totals();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  /** Dispatch a custom event so pages can react */
  dispatchEvent() {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: Cart.get() }));
  },

  /** Clear cart */
  clear() {
    localStorage.removeItem(CONFIG.CART_KEY);
    Cart.updateBadge();
    Cart.dispatchEvent();
  },
};

// ============================================
// TOAST NOTIFICATIONS
// ============================================

const Toast = {
  show(msg, type = 'success', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },
};

// ============================================
// AUTH HELPERS
// ============================================

const Auth = {
  getUser() {
    try { return JSON.parse(localStorage.getItem(CONFIG.USER_KEY)); }
    catch { return null; }
  },
  setUser(user) {
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem(CONFIG.USER_KEY);
    window.location.href = 'login.html';
  },
  isLoggedIn() { return !!Auth.getUser(); },
  isAdmin() {
    const u = Auth.getUser();
    return u && u.role === 'admin';
  },
};

// ============================================
// API HELPER
// ============================================

const API = {
  async request(endpoint, options = {}) {
    const user = Auth.getUser();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;
    try {
      const res = await fetch(`${CONFIG.API_BASE}${endpoint}`, { ...options, headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      return data;
    } catch (err) {
      // Fallback to mock data when backend isn't running
      console.warn('API unavailable, using mock data:', err.message);
      return null;
    }
  },
  get:    (endpoint)           => API.request(endpoint),
  post:   (endpoint, body)     => API.request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put:    (endpoint, body)     => API.request(endpoint, { method: 'PUT',  body: JSON.stringify(body) }),
  delete: (endpoint)           => API.request(endpoint, { method: 'DELETE' }),
};

// ============================================
// MOCK PRODUCT DATA (used when API is offline)
// ============================================

const MOCK_PRODUCTS = [
  { id: 1,  name: 'AeroStride Pro',      category: 'Running',    price: 129.99, original_price: 159.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', rating: 4.8, review_count: 124, badge: 'Best Seller', stock: 15, description: 'Premium running shoes engineered for maximum performance. Featuring advanced foam cushioning and breathable mesh upper.' },
  { id: 2,  name: 'UrbanWalker Classic', category: 'Casual',     price: 89.99,  original_price: null,   image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600', rating: 4.5, review_count: 89,  badge: 'New',         stock: 22, description: 'Timeless casual sneakers for everyday wear. Crafted with premium leather and cushioned insoles for all-day comfort.' },
  { id: 3,  name: 'SportFlex Elite',     category: 'Training',   price: 109.99, original_price: 139.99, image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', rating: 4.6, review_count: 67,  badge: 'Sale',        stock: 8,  description: 'Built for high-intensity training sessions. Flexible sole and supportive ankle structure for optimal performance.' },
  { id: 4,  name: 'CloudStep Loafer',    category: 'Formal',     price: 149.99, original_price: null,   image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600', rating: 4.9, review_count: 45,  badge: null,          stock: 12, description: 'Sophisticated loafers for the modern professional. Premium suede finish with memory foam cushioning.' },
  { id: 5,  name: 'TrailBlazer X',       category: 'Hiking',     price: 169.99, original_price: 199.99, image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', rating: 4.7, review_count: 203, badge: 'Sale',        stock: 5,  description: 'Conquer any terrain with TrailBlazer X. Waterproof, grippy and built to last through any adventure.' },
  { id: 6,  name: 'SlimFit Canvas',      category: 'Casual',     price: 59.99,  original_price: null,   image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600', rating: 4.3, review_count: 156, badge: 'New',         stock: 30, description: 'Lightweight canvas sneakers with a slim profile. Perfect for casual outings and weekend adventures.' },
  { id: 7,  name: 'MaxCush Runner',      category: 'Running',    price: 139.99, original_price: 169.99, image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', rating: 4.6, review_count: 88,  badge: 'Sale',        stock: 18, description: 'Maximum cushioning for long-distance runners. Engineered heel support and energy-return foam.' },
  { id: 8,  name: 'Street Court Hi',     category: 'Basketball', price: 119.99, original_price: null,   image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600', rating: 4.4, review_count: 72,  badge: null,          stock: 14, description: 'High-top basketball shoes with ankle support and court grip. Dominate the court with style.' },
  { id: 9,  name: 'VelvetStep Oxford',   category: 'Formal',     price: 179.99, original_price: 219.99, image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600', rating: 4.7, review_count: 38,  badge: 'Sale',        stock: 9,  description: 'Classic Oxford crafted from full-grain leather. A timeless silhouette with modern comfort technology built in.' },
  { id: 10, name: 'DriftRun Lite',       category: 'Running',    price: 99.99,  original_price: null,   image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600', rating: 4.4, review_count: 61,  badge: 'New',         stock: 25, description: 'Feather-light everyday runner with a responsive midsole. Ideal for beginners and casual joggers alike.' },
  { id: 11, name: 'Alpine Trekker Pro',  category: 'Hiking',     price: 189.99, original_price: null,   image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600', rating: 4.8, review_count: 117, badge: 'Best Seller', stock: 7,  description: 'Full-grain leather hiking boot with Gore-Tex lining and Vibram outsole. Ready for multi-day backcountry routes.' },
  { id: 12, name: 'FlexFlow Trainer',    category: 'Training',   price: 94.99,  original_price: 119.99, image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600', rating: 4.5, review_count: 93,  badge: 'Sale',        stock: 20, description: 'Versatile cross-trainer built for HIIT, weights and studio classes. Wide toe box and non-slip outsole.' },
];

// ============================================
// PRODUCT CARD RENDERER
// ============================================

function renderProductCard(p) {
  const discount = p.original_price
    ? Math.round((1 - p.price / p.original_price) * 100)
    : null;

  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-card-img">
        ${p.badge ? `<span class="product-badge ${p.badge.toLowerCase().replace(' ','-')}">${p.badge}</span>` : ''}
        <button class="wishlist-btn" aria-label="Add to wishlist" onclick="toggleWishlist(this)">♡</button>
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300/D2C1B6/1B3C53?text=ShoeStore'">
      </div>
      <div class="product-card-body">
        <div class="product-category">${p.category}</div>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-rating">
          <div class="stars">${renderStars(p.rating)}</div>
          <span class="rating-count">(${p.review_count})</span>
        </div>
        <div class="product-price">
          <span class="price-current">₹${p.price.toFixed(2)}</span>
          ${p.original_price ? `<span class="price-original">₹${p.original_price.toFixed(2)}</span>` : ''}
          ${discount ? `<span class="price-discount">-${discount}%</span>` : ''}
        </div>
      </div>
      <div class="product-card-footer">
        <button class="add-to-cart-btn" onclick="quickAddToCart(${p.id})">
          🛒 Add to Cart
        </button>
        <button class="view-btn" onclick="viewProduct(${p.id})" title="View Details">👁</button>
      </div>
    </div>`;
}

function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function toggleWishlist(btn) {
  btn.classList.toggle('active');
  btn.textContent = btn.classList.contains('active') ? '♥' : '♡';
  Toast.show(btn.classList.contains('active') ? 'Added to wishlist ♥' : 'Removed from wishlist', 'info');
}

function quickAddToCart(productId) {

  if (document.body.dataset.page === "product" && !selectedSize) {
    Toast.show("Please select shoe size", "error");
    return;
  }

  const products = MOCK_PRODUCTS;
  const product = products.find(p => p.id === productId);

  if (product) {
    Cart.add({
      ...product,
      size: selectedSize || "M"
    });
  }
}

function viewProduct(productId) {
  window.location.href = `product.html?id=${productId}`;
}

// ============================================
// NAVBAR COMPONENT
// ============================================

function initNavbar() {
  Cart.updateBadge();

  // Hamburger toggle
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
  }

  // Auth-aware nav
  const user = Auth.getUser();
  const authLinks = document.querySelectorAll('.auth-nav');
  authLinks.forEach(el => {
    if (user) {
      el.innerHTML = `
        <a href="admin.html" style="display:${user.role === 'admin' ? 'block' : 'none'}">Admin</a>
        <a href="#" onclick="Auth.logout()">Logout</a>`;
    }
  });

  // Active page highlight
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

// ============================================
// HOME PAGE
// ============================================

function initHomePage() {
  initNavbar();
  const grid = document.getElementById('featured-products');
  if (!grid) return;

  // Show 4 featured products
  const featured = MOCK_PRODUCTS.slice(0, 4);
  grid.innerHTML = featured.map(renderProductCard).join('');
}

// ============================================
// PRODUCTS PAGE
// ============================================

let currentFilters = { sort: 'default' };

async function initProductsPage() {
  initNavbar();
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  let products = MOCK_PRODUCTS;

  try {
    const apiData = await API.get('/products');

    if (apiData && Array.isArray(apiData) && apiData.length > 0) {
      products = apiData;
    }

  } catch (err) {
    console.log("Using mock products");
  }

  window._allProducts = products;

  renderProducts(products);

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      currentFilters.sort = e.target.value;
      applySort();
    });
  }
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  const count = document.getElementById('results-count');
  if (!grid) return;
  grid.innerHTML = products.length
    ? products.map(renderProductCard).join('')
    : `<div class="empty-cart text-center" style="grid-column:1/-1">
         <div class="empty-icon">👟</div>
         <h3>No products found</h3>
         <p>Try adjusting your filters</p>
       </div>`;
  if (count) count.innerHTML = `<span>${products.length}</span> products found`;
}

function applySort() {
  let products = [...(window._allProducts || MOCK_PRODUCTS)];

  switch (currentFilters.sort) {
    case 'price-asc':
      products.sort((a, b) => a.price - b.price);
      break;

    case 'price-desc':
      products.sort((a, b) => b.price - a.price);
      break;

    case 'rating':
      products.sort((a, b) => b.rating - a.rating);
      break;

    case 'name':
      products.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  renderProducts(products);
}

// ============================================
// PRODUCT DETAIL PAGE
// ============================================

async function initProductPage() {
  initNavbar();
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  if (!id) return window.location.href = 'products.html';

  let product = MOCK_PRODUCTS.find(p => p.id === id);

  // Try API
  const apiProduct = await API.get(`/products/${id}`);
  if (apiProduct) product = apiProduct;

  if (!product) return window.location.href = 'products.html';

  document.title = `${product.name} — ShoeStore`;
  renderProductDetail(product);
}

function renderProductDetail(p) {
  // Image
  document.getElementById('main-img').src = p.image;
  document.querySelectorAll('.thumb img').forEach(img => img.src = p.image);

  // Text
  document.getElementById('product-category-label').textContent = p.category;
  document.getElementById('product-name').textContent = p.name;
  document.getElementById('product-price').textContent = `₹${p.price.toFixed(2)}`;
  document.getElementById('product-desc').textContent = p.description;
  document.getElementById('product-stars').innerHTML = renderStars(p.rating);
  document.getElementById('product-reviews').textContent = `(${p.review_count} reviews)`;

  if (p.original_price) {
    document.getElementById('product-original-price').textContent = `₹${p.original_price.toFixed(2)}`;
    document.getElementById('product-original-price').style.display = 'inline';
  }

  // Add to cart handler
  document.getElementById('add-to-cart-detail').onclick = () => {
    const size = document.querySelector('.size-btn.active')?.textContent || '42';
    const qty  = parseInt(document.getElementById('qty-input').value) || 1;
    for (let i = 0; i < qty; i++) Cart.add(p, 1, size);
  };

  // Quantity controls
  document.getElementById('qty-minus').onclick = () => {
    const inp = document.getElementById('qty-input');
    if (parseInt(inp.value) > 1) inp.value = parseInt(inp.value) - 1;
  };
  document.getElementById('qty-plus').onclick = () => {
    const inp = document.getElementById('qty-input');
    inp.value = parseInt(inp.value) + 1;
  };

  // Size selection
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  // Related products
  const related = MOCK_PRODUCTS.filter(p2 => p2.id !== p.id && p2.category === p.category).slice(0, 4);
  const relatedGrid = document.getElementById('related-products');
  if (relatedGrid) relatedGrid.innerHTML = related.map(renderProductCard).join('');
}

// ============================================
// CART PAGE
// ============================================

function initCartPage() {
  initNavbar();
  renderCart();

  // Update on cart changes
  window.addEventListener('cartUpdated', renderCart);
}

function renderCart() {
  const cart = Cart.get();
  const { subtotal, shipping, tax, total } = Cart.totals();

  const container = document.getElementById('cart-items');
  const summary   = document.getElementById('cart-summary-block');
  const empty     = document.getElementById('empty-cart');

  if (!container) return;

  if (cart.length === 0) {
    if (container) container.innerHTML = '';
    if (summary)   summary.style.display   = 'none';
    if (empty)     empty.style.display     = 'block';
    return;
  }

  if (empty)   empty.style.display   = 'none';
  if (summary) summary.style.display = 'block';

  container.innerHTML = cart.map(item => `
    <div class="cart-item" data-key="${item.key}">
      <div class="cart-item-info">
        <div class="cart-item-img">
          <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/80x80/D2C1B6/1B3C53?text=Shoe'">
        </div>
        <div>
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-meta">Size: ${item.size} · ${item.category}</div>
        </div>
      </div>
      <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
      <div class="qty-control" style="border:2px solid var(--bg-dark);border-radius:8px;overflow:hidden;display:flex;align-items:center">
        <button class="qty-btn" onclick="Cart.updateQty('${item.key}', ${item.qty - 1})">−</button>
        <input type="number" class="qty-input" value="${item.qty}" min="1"
          onchange="Cart.updateQty('${item.key}', parseInt(this.value))"
          style="width:44px;text-align:center;border:none;font-weight:700;height:36px;background:white;">
        <button class="qty-btn" onclick="Cart.updateQty('${item.key}', ${item.qty + 1})">+</button>
      </div>
      <div class="cart-item-total">₹${(item.price * item.qty).toFixed(2)}</div>
      <button class="remove-btn" onclick="Cart.remove('${item.key}')" title="Remove">🗑</button>
    </div>`).join('');

  // Summary totals
  document.getElementById('cart-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('cart-shipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`;
  document.getElementById('cart-tax').textContent      = `₹${tax.toFixed(2)}`;
  document.getElementById('cart-total').textContent    = `₹${total.toFixed(2)}`;
}

// ============================================
// CHECKOUT PAGE
// ============================================

function initCheckoutPage() {
  initNavbar();
  renderOrderSummary();
  setupCheckoutForm();
}

function renderOrderSummary() {
  const cart = Cart.get();
  const { subtotal, shipping, tax, total } = Cart.totals();
  const list = document.getElementById('order-items-list');
  if (!list) return;

  list.innerHTML = cart.map(item => `
    <div class="order-item">
      <div class="order-item-img">
        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60x60/D2C1B6/1B3C53?text=S'">
        <span class="item-badge">${item.qty}</span>
      </div>
      <div class="order-item-info">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-meta">Size: ${item.size}</div>
      </div>
      <div class="order-item-price">₹${(item.price * item.qty).toFixed(2)}</div>
    </div>`).join('');

  document.getElementById('order-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('order-shipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`;
  document.getElementById('order-tax').textContent      = `₹${tax.toFixed(2)}`;
  document.getElementById('order-total').textContent    = `₹${total.toFixed(2)}`;
}

function setupCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateCheckoutForm()) return;

    const cart  = Cart.get();
    const { total } = Cart.totals();
    const user  = Auth.getUser();

const orderData = {
  items: cart.map(item => ({
    product_id: item.id,
    quantity: item.qty,
    price: item.price
  })),
  total: total
};

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Processing...';
const result = await API.post('/orders', orderData);

if (result && result.success) {
  Cart.clear();
  showOrderSuccess();
} else {
  Toast.show('Order failed. Please try again.', 'error');
  btn.disabled = false;
  btn.textContent = 'Place Order';
}
  });
}

function getFormData(prefix) {
  const fields = {};
  document.querySelectorAll(`[name^="${prefix}_"]`).forEach(input => {
    fields[input.name.replace(`${prefix}_`, '')] = input.value;
  });
  return fields;
}

function validateCheckoutForm() {
  let valid = true;
  const required = document.querySelectorAll('#checkout-form [required]');
  required.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('error');
      valid = false;
    } else {
      input.classList.remove('error');
    }
  });
  if (!valid) Toast.show('Please fill in all required fields', 'error');
  return valid;
}

function showOrderSuccess() {
  const form = document.getElementById('checkout-content');
  if (form) {
    form.innerHTML = `
      <div style="text-align:center;padding:4rem 2rem;background:white;border-radius:12px;box-shadow:var(--shadow-md)">
        <div style="font-size:4rem;margin-bottom:1.5rem">🎉</div>
        <h2 style="font-family:var(--font-head);font-size:2rem;color:var(--primary);margin-bottom:1rem">Order Placed!</h2>
        <p style="color:var(--text-light);margin-bottom:2rem;max-width:400px;margin-left:auto;margin-right:auto">
          Thank you for your order! You'll receive a confirmation email shortly.
        </p>
        <a href="products.html" class="btn btn-dark">Continue Shopping</a>
      </div>`;
  }
}

// ============================================
// LOGIN PAGE
// ============================================

function initLoginPage() {
  initNavbar();

  const form = document.getElementById('login-form');
  if (!form) return;

  // Password toggle
  setupPasswordToggle('password', 'togglePassword');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    let valid = true;

    if (!email || !isValidEmail(email)) {
      showError('email', 'Please enter a valid email address');
      valid = false;
    }
    if (!password || password.length < 6) {
      showError('password', 'Password must be at least 6 characters');
      valid = false;
    }
    if (!valid) return;

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    const result = await API.post('/users/login', { email, password });

    if (result?.token) {
      Auth.setUser(result.user || { email, role: 'customer', token: result.token });
      Toast.show('Welcome back! 👋', 'success');
      setTimeout(() => window.location.href = result.user?.role === 'admin' ? 'admin.html' : 'index.html', 800);
    } else {
      // Demo: accept any login
      Auth.setUser({ id: 1, email, name: email.split('@')[0], role: 'customer', token: 'demo-token' });
      Toast.show('Welcome back! 👋 (Demo Mode)', 'success');
      setTimeout(() => window.location.href = 'index.html', 800);
    }

    btn.disabled = false;
    btn.textContent = 'Sign In';
  });
}

// ============================================
// SIGNUP PAGE
// ============================================

function initSignupPage() {
  initNavbar();

  const form = document.getElementById('signup-form');
  if (!form) return;

  setupPasswordToggle('password', 'togglePassword');
  setupPasswordToggle('confirm-password', 'toggleConfirm');

  // Password strength
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      updatePasswordStrength(passwordInput.value);
    });
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors();

    const name     = document.getElementById('name').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm  = document.getElementById('confirm-password').value;
    let valid = true;

    if (!name || name.length < 2) { showError('name', 'Name must be at least 2 characters'); valid = false; }
    if (!email || !isValidEmail(email)) { showError('email', 'Please enter a valid email'); valid = false; }
    if (!password || password.length < 6) { showError('password', 'Password must be at least 6 characters'); valid = false; }
    if (password !== confirm) { showError('confirm-password', 'Passwords do not match'); valid = false; }
    if (!valid) return;

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    const result = await API.post('/users/register', { name, email, password });

    if (result || true) { // Demo: always succeed
      const successMsg = document.getElementById('success-msg');
      if (successMsg) { successMsg.style.display = 'block'; successMsg.textContent = '🎉 Account created! Redirecting...'; }
      setTimeout(() => window.location.href = 'login.html', 1500);
    } else {
      Toast.show('Registration failed. Email may already be in use.', 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Create Account';
  });
}

function updatePasswordStrength(value) {
  const bar   = document.getElementById('strength-bar');
  const label = document.getElementById('strength-label');
  if (!bar || !label) return;

  let strength = 0;
  if (value.length >= 8)         strength++;
  if (/[A-Z]/.test(value))       strength++;
  if (/[0-9]/.test(value))       strength++;
  if (/[^A-Za-z0-9]/.test(value))strength++;

  const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#e74c3c', '#e67e22', '#f39c12', '#27ae60'];
  bar.style.width  = `${strength * 25}%`;
  bar.style.background = colors[strength] || '#ddd';
  label.textContent = levels[strength] || '';
  label.style.color = colors[strength] || '';
}

// ============================================
// ADMIN DASHBOARD
// ============================================

function initAdminPage() {
  initNavbar();

  // Demo stats
  renderStats();
  renderAdminProducts();
  renderAdminOrders();

  // Tab switching
  document.querySelectorAll('.admin-nav a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.section;
      document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
      document.querySelectorAll('.admin-nav a').forEach(l => l.classList.remove('active'));
      const section = document.getElementById(`section-${target}`);
      if (section) section.classList.remove('hidden');
      link.classList.add('active');
    });
  });
}

function renderStats() {
  const stats = [
    { label: 'Total Revenue', value: '$24,890', icon: '💰', bg: 'rgba(27,60,83,0.1)',  change: '↑ 12.5%', dir: 'up'   },
    { label: 'Orders',        value: '184',      icon: '📦', bg: 'rgba(69,104,130,0.1)', change: '↑ 8.3%',  dir: 'up'   },
    { label: 'Products',      value: `${MOCK_PRODUCTS.length}`, icon: '👟', bg: 'rgba(39,174,96,0.1)', change: '↑ 2 new', dir: 'up' },
    { label: 'Customers',     value: '1,240',    icon: '👥', bg: 'rgba(243,156,18,0.1)', change: '↑ 5.1%',  dir: 'up'   },
  ];

  const grid = document.getElementById('stats-grid');
  if (!grid) return;
  grid.innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-icon" style="background:${s.bg}">${s.icon}</div>
      <div class="stat-info">
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
        <div class="stat-change ${s.dir}">${s.change}</div>
      </div>
    </div>`).join('');
}

function renderAdminProducts() {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;
  tbody.innerHTML = MOCK_PRODUCTS.map(p => `
    <tr>
      <td><img src="${p.image}" class="table-img" alt="${p.name}" onerror="this.src='https://via.placeholder.com/44x44/D2C1B6/1B3C53?text=S'"></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.category}</td>
      <td>₹${p.price.toFixed(2)}</td>
      <td>${p.stock}</td>
      <td><span class="status-badge active">Active</span></td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit" onclick="editProduct(${p.id})" title="Edit">✏️</button>
          <button class="action-btn delete" onclick="deleteProductAdmin(${p.id})" title="Delete">🗑</button>
        </div>
      </td>
    </tr>`).join('');
}

const DEMO_ORDERS = [
  { id: '#SS-1001', customer: 'Alice Johnson', items: 2, total: '$219.98', status: 'delivered', date: '2024-12-01' },
  { id: '#SS-1002', customer: 'Bob Smith',     items: 1, total: '$129.99', status: 'shipped',   date: '2024-12-03' },
  { id: '#SS-1003', customer: 'Carol White',   items: 3, total: '$359.97', status: 'pending',   date: '2024-12-05' },
  { id: '#SS-1004', customer: 'David Lee',     items: 1, total: '$89.99',  status: 'delivered', date: '2024-12-06' },
  { id: '#SS-1005', customer: 'Eva Martinez',  items: 2, total: '$279.98', status: 'shipped',   date: '2024-12-07' },
];

function renderAdminOrders() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;
  tbody.innerHTML = DEMO_ORDERS.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.customer}</td>
      <td>${o.items} item${o.items > 1 ? 's' : ''}</td>
      <td><strong>${o.total}</strong></td>
      <td><span class="status-badge ${o.status}">${o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span></td>
      <td>${o.date}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn view" onclick="viewOrder('${o.id}')" title="View">👁</button>
        </div>
      </td>
    </tr>`).join('');
}

function editProduct(id) {
  const p = MOCK_PRODUCTS.find(p => p.id === id);
  if (!p) return;
  openProductModal(p);
}

function openProductModal(product = null) {
  const modal  = document.getElementById('product-modal');
  const title  = document.getElementById('modal-title');
  const form   = document.getElementById('product-form');
  if (!modal) return;

  title.textContent = product ? 'Edit Product' : 'Add New Product';

  if (product) {
    form.querySelector('[name="name"]').value     = product.name;
    form.querySelector('[name="category"]').value = product.category;
    form.querySelector('[name="price"]').value    = product.price;
    form.querySelector('[name="stock"]').value    = product.stock;
    form.querySelector('[name="description"]').value = product.description || '';
    form.dataset.productId = product.id;
  } else {
    form.reset();
    delete form.dataset.productId;
  }

  modal.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

function deleteProductAdmin(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    Toast.show('Product deleted (demo — not saved)', 'warning');
  }
}

function viewOrder(id) {
  Toast.show(`Viewing order ${id} (demo mode)`, 'info');
}

function handleProductFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const isEdit = form.dataset.productId;
  Toast.show(
    isEdit ? `Product #${isEdit} updated (demo)` : 'New product added (demo)',
    'success'
  );
  closeModal('product-modal');
}

// ============================================
// FORM HELPERS
// ============================================

function showError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('error');
  const err = field.parentElement.querySelector('.form-error') || (() => {
    const el = document.createElement('span');
    el.className = 'form-error';
    field.parentElement.appendChild(el);
    return el;
  })();
  err.textContent = msg;
}

function clearErrors() {
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setupPasswordToggle(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  if (input && btn) {
    btn.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? '👁' : '🙈';
    });
  }
}

// ============================================
// AUTO-INIT ON DOM READY
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  switch (page) {
    case 'home':     initHomePage();     break;
    case 'products': initProductsPage(); break;
    case 'product':  initProductPage();  break;
    case 'cart':     initCartPage();     break;
    case 'checkout': initCheckoutPage(); break;
    case 'login':    initLoginPage();    break;
    case 'signup':   initSignupPage();   break;
    case 'admin':    initAdminPage();    break;
    default:         initNavbar();       break;
  }
});
document.querySelectorAll('.size-btn').forEach(btn => {

  btn.addEventListener('click', () => {

    document.querySelectorAll('.size-btn').forEach(b => {
      b.classList.remove('active');
    });

    btn.classList.add('active');
    selectedSize = btn.innerText;

  });

});

document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => {

    document.querySelectorAll('.size-btn').forEach(b => {
      b.classList.remove('active');
    });

    btn.classList.add('active');
    selectedSize = btn.innerText;
  });
});