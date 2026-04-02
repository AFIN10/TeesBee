// Data Models
const defaultProducts = [
  { id: 1, name: "The Prime Bee Essential (Black)", price: 499, image: "/tshirt-1.png", sizes: ['S','M','L','XL','XXL'], sleeves: ['Half','Full'] },
  { id: 2, name: "Geometric Honeycomb Aura", price: 599, image: "/tshirt-2.png", sizes: ['S','M','L','XL','XXL'], sleeves: ['Half','Full'] }
];

// State Initialization
let products = JSON.parse(localStorage.getItem('teesbee_products')) || defaultProducts;
let currentUser = JSON.parse(localStorage.getItem('teesbee_user')) || null;
let settings = JSON.parse(localStorage.getItem('teesbee_settings')) || {
  whatsapp: '919876543210',
  youtube: 'https://youtube.com',
  instagram: 'https://instagram.com',
  contact: '#contact'
};
let cart = JSON.parse(localStorage.getItem('teesbee_cart')) || [];

// UI Elements
const productsGrid = document.getElementById('products-grid');
const adminPanel = document.getElementById('admin-panel');
const loginModal = document.getElementById('login-modal');
const profileIcon = document.getElementById('profile-icon');
const closeModal = document.querySelector('.close-modal');
const logoutBtn = document.getElementById('logout-btn');

// Init application
function init() {
  saveProducts(); // ensure localstorage has data originally 
  applySettings();
  renderProducts();
  updateAuthUI();
  setupEventListeners();
}

function saveSettings() {
  localStorage.setItem('teesbee_settings', JSON.stringify(settings));
}

function applySettings() {
  const ytTop = document.getElementById('link-yt-top');
  const igTop = document.getElementById('link-ig-top');
  const contactNav = document.getElementById('link-contact-nav');
  const ytGiveaway = document.getElementById('link-yt-giveaway');
  const igGiveaway = document.getElementById('link-ig-giveaway');
  const contactFooter = document.getElementById('link-contact-footer');
  
  if(ytTop) ytTop.href = settings.youtube;
  if(igTop) igTop.href = settings.instagram;
  if(contactNav) contactNav.href = settings.contact;
  if(ytGiveaway) ytGiveaway.href = settings.youtube;
  if(igGiveaway) igGiveaway.href = settings.instagram;
  if(contactFooter) contactFooter.href = settings.contact;

  // populate form if admin
  const waSet = document.getElementById('setting-whatsapp');
  const ytSet = document.getElementById('setting-yt');
  const igSet = document.getElementById('setting-ig');
  const contactSet = document.getElementById('setting-contact');
  if(waSet) waSet.value = settings.whatsapp || '919876543210';
  if(ytSet) ytSet.value = settings.youtube;
  if(igSet) igSet.value = settings.instagram;
  if(contactSet) contactSet.value = settings.contact;
}

function saveProducts() {
  localStorage.setItem('teesbee_products', JSON.stringify(products));
}

function saveUser() {
  if (currentUser) {
    localStorage.setItem('teesbee_user', JSON.stringify(currentUser));
  } else {
    localStorage.removeItem('teesbee_user');
  }
}

function renderProducts(searchQuery = "") {
  productsGrid.innerHTML = '';
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = '<p style="color: #888; padding: 20px;">No matching products found.</p>';
    return;
  }
  
  filteredProducts.forEach(product => {
    const isAdmin = currentUser && currentUser.role === 'admin';
    const delBtn = isAdmin ? `<button class="delete-btn" title="Delete from Stock" data-id="${product.id}"><i class="fa-solid fa-trash"></i></button>` : '';

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      ${delBtn}
      <div style="cursor: pointer" class="clickable-product" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}" class="product-img" />
        <div class="product-info">
          <h3>${product.name}</h3>
          <p class="product-price">Rs. ${product.price.toFixed(2)}</p>
        </div>
      </div>
      <div style="padding: 0 20px 20px 20px;">
        <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
      </div>
    `;
    productsGrid.appendChild(card);
  });

  // Attach delete events
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.getAttribute('data-id'));
      deleteProduct(id);
    });
  });

  // Attach card Add to Cart events
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(e.currentTarget.getAttribute('data-id'));
      addToCart(id, 'S', 'Black', 'Half', 1);
    });
  });

  // Attach card click events for PDP
  document.querySelectorAll('.clickable-product').forEach(card => {
    card.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.getAttribute('data-id'));
      showProductDetails(id);
    });
  });
}

const homeView = document.getElementById('home-view');
const productView = document.getElementById('product-view');
let currentQuantity = 1;

function showHome() {
  productView.classList.add('hidden');
  homeView.classList.remove('hidden');
  window.scrollTo(0,0);
}

function showProductDetails(id) {
  const product = products.find(p => p.id === id);
  if(!product) return;

  // populate UI
  document.getElementById('pdp-img').src = product.image;
  document.getElementById('pdp-name').textContent = product.name;
  document.getElementById('pdp-price').textContent = `Rs. ${product.price.toFixed(2)}`;
  
  // reset qty
  currentQuantity = 1;
  document.getElementById('qty-input').value = currentQuantity;

  // switch view
  homeView.classList.add('hidden');
  productView.classList.remove('hidden');
  window.scrollTo(0,0);

  // Manage available options
  const availableSizes = product.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
  const availableSleeves = product.sleeves || ['Half', 'Full'];

  const sizePills = document.querySelectorAll('.size-pill');
  sizePills.forEach(pill => {
    pill.classList.remove('active', 'disabled-pill');
    if (!availableSizes.includes(pill.textContent)) {
      pill.classList.add('disabled-pill');
    }
  });

  const sleevePills = document.querySelectorAll('.sleeve-pill');
  sleevePills.forEach(pill => {
    pill.classList.remove('active', 'disabled-pill');
    if (!availableSleeves.includes(pill.textContent)) {
      pill.classList.add('disabled-pill');
    }
  });

  // Ensure an active pill is set, naturally the first available
  const firstAvailSize = document.querySelector('.size-pill:not(.disabled-pill)');
  if (firstAvailSize) firstAvailSize.classList.add('active');

  const firstAvailSleeve = document.querySelector('.sleeve-pill:not(.disabled-pill)');
  if (firstAvailSleeve) firstAvailSleeve.classList.add('active');

  // set up add to cart for this specific product
  document.getElementById('btn-add-cart').onclick = () => {
     addCurrentPDPToCart(product);
  };
  document.getElementById('btn-buy-now').onclick = () => {
     addCurrentPDPToCart(product);
     // In a real app we'd redirect to checkout. For now, open cart.
     openCart();
  };
}

function addCurrentPDPToCart(product) {
  // get active variants
  const activeSize = document.querySelector('.size-pill.active').textContent;
  const activeColor = document.querySelector('.color-pill.active').textContent;
  const activeSleeve = document.querySelector('.sleeve-pill.active').textContent;
  addToCart(product.id, activeSize, activeColor, activeSleeve, currentQuantity);
}

function addToCart(productId, size, color, sleeve, qty) {
  const product = products.find(p => p.id === productId);
  if(!product) return;

  // check if variant exists in cart
  const existing = cart.find(c => c.productId === productId && c.size === size && c.color === color && c.sleeve === sleeve);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      cartId: Date.now().toString(),
      productId,
      name: product.name,
      price: product.price,
      image: product.image,
      size,
      color,
      sleeve,
      quantity: qty
    });
  }
  saveCart();
  renderCart();
  openCart();
}

function saveCart() {
  localStorage.setItem('teesbee_cart', JSON.stringify(cart));
}

function renderCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalPriceNode = document.getElementById('cart-total-price');
  
  cartItemsContainer.innerHTML = '';
  let subtotal = 0;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="color:#888; text-align:center; padding-top:40px;">Your cart is empty.</p>';
    cartTotalPriceNode.textContent = 'Rs. 0.00';
    return;
  }

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
      <div class="cart-item-details">
        <div class="cart-item-header">
          <span class="cart-item-title">${item.name}</span>
          <span class="cart-item-price">Rs. ${itemTotal.toFixed(2)}</span>
        </div>
        <div class="cart-item-variant">Size: ${item.size}, Color: ${item.color}, Sleeve: ${item.sleeve}</div>
        <div class="cart-item-actions">
          <div class="cart-qty-selector">
            <button class="cart-qty-btn cart-minus" data-id="${item.cartId}"><i class="fa-solid fa-minus"></i></button>
            <input type="text" value="${item.quantity}" class="cart-qty-input" readonly />
            <button class="cart-qty-btn cart-plus" data-id="${item.cartId}"><i class="fa-solid fa-plus"></i></button>
          </div>
          <i class="fa-solid fa-trash cart-item-trash" data-id="${item.cartId}" title="Remove item"></i>
        </div>
      </div>
    `;
    cartItemsContainer.appendChild(div);
  });

  cartTotalPriceNode.textContent = `Rs. ${subtotal.toFixed(2)}`;

  // Attach Cart events
  document.querySelectorAll('.cart-minus').forEach(btn => {
    btn.onclick = (e) => updateCartQty(e.currentTarget.getAttribute('data-id'), -1);
  });
  document.querySelectorAll('.cart-plus').forEach(btn => {
    btn.onclick = (e) => updateCartQty(e.currentTarget.getAttribute('data-id'), 1);
  });
  document.querySelectorAll('.cart-item-trash').forEach(btn => {
    btn.onclick = (e) => removeCartItem(e.currentTarget.getAttribute('data-id'));
  });
}

function updateCartQty(cartId, delta) {
  const item = cart.find(c => c.cartId === cartId);
  if(item) {
    item.quantity += delta;
    if(item.quantity < 1) item.quantity = 1; // don't delete via deduction, use trash
    saveCart();
    renderCart();
  }
}

function removeCartItem(cartId) {
  cart = cart.filter(c => c.cartId !== cartId);
  saveCart();
  renderCart();
}

const cartOverlay = document.getElementById('cart-overlay');
const searchOverlay = document.getElementById('search-overlay');

function openCart() {
  renderCart();
  cartOverlay.classList.remove('hidden');
}
function closeCart() {
  cartOverlay.classList.add('hidden');
}

function openSearch() {
  searchOverlay.classList.remove('hidden');
  document.getElementById('search-input').focus();
}
function closeSearch() {
  searchOverlay.classList.add('hidden');
  document.getElementById('search-input').value = '';
  renderProducts(); // reset grid
}

function updateAuthUI() {
  if (currentUser && currentUser.role === 'admin') {
    adminPanel.classList.remove('hidden');
    profileIcon.classList.remove('fa-regular');
    profileIcon.classList.add('fa-solid'); // filled user icon when logged in
    profileIcon.style.color = 'var(--accent-color)';
  } else if (currentUser && currentUser.role === 'user') {
    adminPanel.classList.add('hidden');
    profileIcon.classList.remove('fa-regular');
    profileIcon.classList.add('fa-solid'); 
    profileIcon.style.color = 'var(--text-color)';
  } else {
    adminPanel.classList.add('hidden');
    profileIcon.classList.remove('fa-solid');
    profileIcon.classList.add('fa-regular');
    profileIcon.style.color = '';
  }
}

function deleteProduct(id) {
  if(confirm('Are you sure you want to remove this T-Shirt from stock?')) {
    products = products.filter(p => p.id !== id);
    saveProducts();
    renderProducts();
  }
}

function logout() {
  if(confirm('Are you sure you want to logout?')) {
    currentUser = null;
    saveUser();
    updateAuthUI();
    renderProducts();
  }
}

function setupEventListeners() {
  // Login flow
  profileIcon.addEventListener('click', () => {
    if (currentUser) {
      logout();
    } else {
      loginModal.classList.remove('hidden');
    }
  });

  logoutBtn.addEventListener('click', logout);

  closeModal.addEventListener('click', () => {
    loginModal.classList.add('hidden');
  });

  // Modal tabs logic
  const tabUserBtn = document.getElementById('tab-user-btn');
  const tabAdminBtn = document.getElementById('tab-admin-btn');
  const formUser = document.getElementById('user-login-form');
  const formAdmin = document.getElementById('admin-login-form');

  tabUserBtn.addEventListener('click', () => {
    tabAdminBtn.classList.remove('active');
    tabUserBtn.classList.add('active');
    formAdmin.classList.add('hidden');
    formUser.classList.remove('hidden');
  });

  tabAdminBtn.addEventListener('click', () => {
    tabUserBtn.classList.remove('active');
    tabAdminBtn.classList.add('active');
    formUser.classList.add('hidden');
    formAdmin.classList.remove('hidden');
  });

  // User Authentication
  formUser.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('user-name').value;
    const phone = document.getElementById('user-phone').value;
    const email = document.getElementById('user-email').value;

    currentUser = { role: 'user', name, phone, email, username: name };
    saveUser();
    formUser.reset();
    loginModal.classList.add('hidden');
    updateAuthUI();
    renderProducts();
    alert(`Welcome, ${name}!`);
  });

  // Admin Authentication
  formAdmin.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('admin-username').value;
    const p = document.getElementById('admin-password').value;

    if (u === 'afin' && p === 'afin123') {
      currentUser = { username: 'afin', role: 'admin' };
      saveUser();
      formAdmin.reset();
      loginModal.classList.add('hidden');
      updateAuthUI();
      renderProducts();
      alert(`Welcome back, admin!`);
    } else {
      alert('Invalid admin credentials.');
    }
  });

  // Admin Add Product
  document.getElementById('add-product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('prod-name').value;
    const price = document.getElementById('prod-price').value;
    const fileInput = document.getElementById('prod-image-file');
    
    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const imageBase64 = e.target.result;
        
        const sizes = Array.from(document.querySelectorAll('.size-cb:checked')).map(cb => cb.value);
        const sleeves = Array.from(document.querySelectorAll('.sleeve-cb:checked')).map(cb => cb.value);

        if (sizes.length === 0 || sleeves.length === 0) {
          alert("Please select at least one size and one sleeve type.");
          return;
        }

        const newPrd = {
          id: Date.now(),
          name,
          price: parseFloat(price),
          image: imageBase64,
          sizes,
          sleeves
        };

        products.push(newPrd);
        saveProducts();
        renderProducts();
        document.getElementById('add-product-form').reset();
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      alert("Please select an image file.");
    }
  });

  // Admin Update Settings
  const updateSettingsForm = document.getElementById('update-settings-form');
  if(updateSettingsForm) {
    updateSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      settings.youtube = document.getElementById('setting-yt').value;
      settings.instagram = document.getElementById('setting-ig').value;
      settings.contact = document.getElementById('setting-contact').value;
      
      const waInput = document.getElementById('setting-whatsapp');
      if(waInput) settings.whatsapp = waInput.value.replace(/[^0-9]/g, ''); // keep only numbers

      saveSettings();
      applySettings();
      alert("Store settings updated successfully!");
    });
  }

  // Handle Checkout WhatsApp logic
  const btnCheckout = document.getElementById('btn-checkout');
  if(btnCheckout) {
    btnCheckout.addEventListener('click', () => {
      if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
      }

      let message = "Hello TeesBee! I would like to place an order for:\n\n";
      let total = 0;
      cart.forEach(item => {
        message += `- *${item.name}*\n`;
        message += `  Variant: Size ${item.size}, Color ${item.color}, Sleeve ${item.sleeve}\n`;
        message += `  Qty: ${item.quantity} x Rs. ${item.price.toFixed(2)}\n`;
        
        // Include product image URL for the admin
        if (item.image && item.image.startsWith('data:')) {
          message += `  Image: [Custom Uploaded Image]\n\n`;
        } else {
          // Construct absolute URL so WhatsApp can potentially generate a preview
          const imageUrl = new URL(item.image, window.location.origin).href;
          message += `  Image: ${imageUrl}\n\n`;
        }

        total += (item.price * item.quantity);
      });
      message += `*Total Estimated Amount: Rs. ${total.toFixed(2)}*\n\n`;
      message += "Please let me know the payment and delivery details. Thanks!";

      const encodedMsg = encodeURIComponent(message);
      const waNumber = settings.whatsapp || '919876543210';
      window.open(`https://wa.me/${waNumber}?text=${encodedMsg}`, '_blank');
    });
  }

  // Navigation Routing
  document.getElementById('link-home').addEventListener('click', (e) => { e.preventDefault(); showHome(); });
  document.getElementById('link-catalog').addEventListener('click', (e) => { e.preventDefault(); showHome(); });
  document.getElementById('link-brand').addEventListener('click', (e) => { e.preventDefault(); showHome(); });

  // PDP Quantity Interaction
  document.getElementById('qty-plus').addEventListener('click', () => {
    currentQuantity++;
    document.getElementById('qty-input').value = currentQuantity;
  });
  document.getElementById('qty-minus').addEventListener('click', () => {
    if(currentQuantity > 1) {
      currentQuantity--;
      document.getElementById('qty-input').value = currentQuantity;
    }
  });

  // PDP Pill Group Logic
  const setupPills = (selector) => {
    const pills = document.querySelectorAll(selector);
    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        pills.forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
  };
  setupPills('.size-pill');
  setupPills('.sleeve-pill');

  // Search Logic
  document.getElementById('search-icon').addEventListener('click', openSearch);
  document.getElementById('search-close').addEventListener('click', closeSearch);
  document.getElementById('search-backdrop').addEventListener('click', closeSearch);
  document.getElementById('search-input').addEventListener('input', (e) => {
    renderProducts(e.target.value);
  });

  // Cart Logic
  document.getElementById('cart-icon').addEventListener('click', openCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-backdrop').addEventListener('click', closeCart);
}

// Boot up
document.addEventListener('DOMContentLoaded', init);
