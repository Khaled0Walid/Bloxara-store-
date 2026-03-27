// --- API CONNECTION (Frontend to Backend) ---
// Fetch and render actual marketplace inventory to the homepage!
const API_URL = 'https://bloxara-store.onrender.com';

async function loadProducts() {
  const trendingSlider = document.getElementById('trending-slider');
  if (!trendingSlider) return; // Only run on index.html

  try {
    const response = await fetch(`${API_URL}/api/products`);
    const products = await response.json();

    trendingSlider.innerHTML = ''; // Clear default/spinners

    if (products.length === 0) {
      trendingSlider.innerHTML = '<p style="color:#a0a0b0; padding:2rem;">No products listed yet.</p>';
      return;
    }

    products.forEach((p, index) => {
      // Calculate a slight stagger delay for the CSS entrance animation
      const delay = (index % 5) * 0.1 + 's';

      // Use a generic logic to decide rarity tag purely for visual appeal based on price
      let badge = 'Common';
      let badgeColor = '#94a3b8'; // gray
      let badgeDisplay = 'display: none;'; // hide by default if common
      if (p.price > 100000) { badge = 'Mythical'; badgeColor = '#c084fc'; badgeDisplay = 'display: block;'; } // purple
      else if (p.price > 50000) { badge = 'Legendary'; badgeColor = '#facc15'; badgeDisplay = 'display: block;'; } // yellow
      else if (p.price > 10000) { badge = 'Epic'; badgeColor = '#fb7185'; badgeDisplay = 'display: block;'; } // pink

      // Calculate Sale Badge if old_price exists
      let saleBadgeHTML = '';
      if (p.old_price && p.old_price > p.price) {
        const savings = Math.round(((p.old_price - p.price) / p.old_price) * 100);
        saleBadgeHTML = `<div class="sale-badge">SALE -${savings}%</div>`;
      }

      // Create the card
      const cardHTML = `
          <div class="item-card glass-panel" style="transition-delay: ${delay}" onclick="window.location.href='item.html?id=${p.id}'">
            ${saleBadgeHTML}
            <div class="item-badge" style="background: ${badgeColor}; color: #000; ${badgeDisplay}">${badge}</div>
            <div class="item-image-wrapper">
              <img src="${p.image_url}" alt="${p.name}" class="item-image" loading="lazy" style="object-fit: cover; width: 100%; height: 100%; border-radius: 10px;">
            </div>
            <div class="item-info">
              
              <h3 class="item-name">${p.name}</h3>
              <div class="item-footer">
                <div class="item-price">
                  <span class="price-current" style="color: #4ade80; font-weight: bold;">$${Number(p.price).toLocaleString()}</span>
                  ${p.old_price ? `<span class="price-old" style="text-decoration: line-through; color: #ff4d4f; opacity: 0.6; font-size: 0.9rem; margin-left: 8px;">$${Number(p.old_price).toLocaleString()}</span>` : ''}
                </div>
                <a href="item.html?id=${p.id}" class="buy-btn">Buy Now</a>
              </div>
            </div>
          </div>
        `;
      trendingSlider.insertAdjacentHTML('beforeend', cardHTML);
    });

  } catch (error) {
    console.error("❌ Failed to fetch products:", error);
    trendingSlider.innerHTML = '<p style="color:#ff4d4d; padding:2rem;">Failed to connect to the marketplace database.</p>';
  }
}

async function loadSingleProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  try {
    const res = await fetch(`${API_URL}/api/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    const p = await res.json();

    document.getElementById('product-id-display').innerText = `ID: #${p.id}`;
    document.getElementById('product-title-display').innerText = p.name;
    document.getElementById('product-description-display').innerText = p.description || 'No description available.';
    document.getElementById('display-price').innerText = Number(p.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Handle Old Price display
    const priceContainer = document.querySelector('.product-price');
    if (p.old_price) {
      const savings = Math.round(((p.old_price - p.price) / p.old_price) * 100);
      // Check if it already exists to avoid duplication
      if (!document.getElementById('display-old-price')) {
        const oldPriceSpan = document.createElement('span');
        oldPriceSpan.id = 'display-old-price';
        oldPriceSpan.style.cssText = 'text-decoration: line-through; color: rgba(255,255,255,0.3); font-size: 1.5rem; margin-left: 1rem; font-weight: normal;';
        oldPriceSpan.innerText = `$ ${Number(p.old_price).toLocaleString()} (-${savings}%)`;
        priceContainer.appendChild(oldPriceSpan);
      } else {
        document.getElementById('display-old-price').innerText = `$ ${Number(p.old_price).toLocaleString()} (-${savings}%)`;
      }
    } else {
      const existingOld = document.getElementById('display-old-price');
      if (existingOld) existingOld.remove();
    }
    document.getElementById('product-image').src = p.image_url;
    document.getElementById('product-image').alt = p.name;
    document.getElementById('product-stock-display').innerText = `${p.stock} available`;
    document.getElementById('product-instruction-text').innerText = `Get ${p.name} cheaper than on Roblox with a discounted price and quick delivery. Once you purchase, just create a ticket in our Discord server and our team will deliver your item.`;

    const badgeEl = document.getElementById('product-badge');
    let badge = 'Common';
    let badgeColor = '#94a3b8'; // gray
    let badgeDisplay = 'display: none;';
    if (p.price > 100000) { badge = 'Mythical'; badgeColor = '#c084fc'; badgeDisplay = 'display: inline-block;'; }
    else if (p.price > 50000) { badge = 'Legendary'; badgeColor = '#facc15'; badgeDisplay = 'display: inline-block;'; }
    else if (p.price > 10000) { badge = 'Epic'; badgeColor = '#fb7185'; badgeDisplay = 'display: inline-block;'; }

    badgeEl.innerText = badge;
    badgeEl.style.background = badgeColor;
    badgeEl.style.cssText += badgeDisplay;

    // Hook up the Buy Now button to pass the ID and QTY to checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    const qtyInput = document.getElementById('item-qty');

    if (checkoutBtn && qtyInput) {
      checkoutBtn.addEventListener('click', () => {
        const qty = qtyInput.value;
        window.location.href = `checkout.html?id=${id}&qty=${qty}`;
      });
    }

  } catch (err) {
    console.error("❌ Failed to fetch single product:", err);
    document.getElementById('product-title-display').innerText = 'Product Not Found';
  }
}

async function loadCheckout() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const qty = params.get('qty') || 1;

  if (!id) {
    document.getElementById('checkout-title').innerText = "No item selected.";
    document.getElementById('checkout-badge').innerText = "Error";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    const p = await res.json();

    const price = Number(p.price);
    const total = price * Number(qty);

    document.getElementById('checkout-img').src = p.image_url;
    document.getElementById('checkout-title').innerText = p.name;
    document.getElementById('checkout-badge').innerText = `ID: #${p.id}`;
    document.getElementById('checkout-qty').innerText = qty;

    document.getElementById('checkout-base-price').innerText = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('checkout-total').innerText = total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  } catch (err) {
    console.error("❌ Failed to load checkout data:", err);
    document.getElementById('checkout-title').innerText = "Error loading cart.";
  }
}

// App logic
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  if (window.location.pathname.includes('item.html')) {
    loadSingleProduct();
  }
  if (window.location.pathname.includes('checkout.html')) {
    loadCheckout();
  }

  // Mobile Menu Toggle
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Sticky Navbar on Scroll
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Intersection Observer for scroll animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  animatedElements.forEach(el => observer.observe(el));

  // 3D Card Tilt Effect
  const cards = document.querySelectorAll('.item-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg rotation
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  });

  // Smooth Scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      if (this.getAttribute('href') !== '#') {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth'
          });
          // Close mobile menu if open
          if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
          }
        }
      }
    });
  });

  // Slider Logic
  const slider = document.getElementById('trending-slider');
  const scrollLeftBtn = document.getElementById('scroll-left');
  const scrollRightBtn = document.getElementById('scroll-right');

  if (slider && scrollLeftBtn && scrollRightBtn) {
    const scrollAmount = 350; // Approximated card width + gap

    scrollLeftBtn.addEventListener('click', () => {
      slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    scrollRightBtn.addEventListener('click', () => {
      slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  // Quantity Selector Logic
  const qtyInput = document.getElementById('item-qty');
  const decreaseBtn = document.getElementById('decrease-qty');
  const increaseBtn = document.getElementById('increase-qty');
  const priceDisplay = document.getElementById('display-price');

  if (qtyInput && decreaseBtn && increaseBtn && priceDisplay) {
    // Dynamically get the base price if on product page, otherwise default
    let basePrice = 0;
    const priceEl = document.getElementById('display-price');
    if (priceEl) {
      basePrice = parseFloat(priceEl.innerText.replace(/,/g, ''));
    }

    const updatePrice = () => {
      let qty = parseInt(qtyInput.value);
      if (isNaN(qty) || qty < 1) {
        qty = 1;
        qtyInput.value = 1;
      }

      const maxQty = parseInt(qtyInput.getAttribute('max')) || 10;
      if (qty > maxQty) {
        qty = maxQty;
        qtyInput.value = maxQty;
      }

      const totalPrice = basePrice * qty;
      priceDisplay.textContent = totalPrice.toLocaleString();

      // Update button states
      decreaseBtn.disabled = qty <= 1;
      increaseBtn.disabled = qty >= maxQty;
    };

    decreaseBtn.addEventListener('click', () => {
      let qty = parseInt(qtyInput.value);
      if (qty > 1) {
        qtyInput.value = qty - 1;
        updatePrice();
      }
    });

    increaseBtn.addEventListener('click', () => {
      let qty = parseInt(qtyInput.value);
      const maxQty = parseInt(qtyInput.getAttribute('max')) || 10;
      if (qty < maxQty) {
        qtyInput.value = qty + 1;
        updatePrice();
      }
    });

    qtyInput.addEventListener('change', updatePrice);

    // Initialize states
    updatePrice();
  }

  // --- Auth State Management ---
  function checkAuthStatus() {
    const token = localStorage.getItem('bloxara_token');
    const userStr = localStorage.getItem('bloxara_user');
    const navActions = document.querySelector('.nav-actions');

    if (token && userStr && navActions) {
      try {
        const user = JSON.parse(userStr);
        // Replace Login/Signup with Profile Button
        const redirectUrl = user.role === 'admin' ? 'admin.html' : 'profile.html';
        navActions.innerHTML = `
                  <a href="${redirectUrl}" class="btn btn-secondary profile-btn" style="padding: 0.4rem 1rem; border-radius: 20px; display: flex; align-items: center; gap: 0.4rem;">
                      <span style="font-weight: 600;">${user.username}</span>
                  </a>
              `;
      } catch (e) {
        console.error("Error parsing user data");
        localStorage.removeItem('bloxara_token');
        localStorage.removeItem('bloxara_user');
      }
    } else if (navActions && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html') && !window.location.pathname.includes('profile.html')) {
      // Show default Login/Signup if not on auth pages or profile
      navActions.innerHTML = `
              <a href="login.html" class="btn btn-secondary">Login</a>
              <a href="signup.html" class="btn btn-primary">Sign Up</a>
          `;
    }
  }

  // Run on load
  checkAuthStatus();
  // --- Auth Forms Validation & Simulation ---
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const identifier = document.getElementById('identifier').value;
      const password = document.getElementById('password').value;
      const btn = loginForm.querySelector('.auth-submit');

      const msgDiv = document.getElementById('login-message');
      msgDiv.style.display = 'none';

      const originalText = btn.innerHTML;
      btn.innerHTML = 'Signing in...';
      btn.disabled = true;

      try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();

        if (response.ok) {
          // Save token and user info globally!
          localStorage.setItem('bloxara_token', data.token);
          localStorage.setItem('bloxara_user', JSON.stringify(data.user));

          msgDiv.textContent = 'Login successful! Redirecting...';
          msgDiv.style.display = 'block';
          msgDiv.style.backgroundColor = 'rgba(0, 177, 106, 0.1)';
          msgDiv.style.color = '#00B16A';
          msgDiv.style.border = '1px solid #00B16A';

          btn.innerHTML = 'Success!';
          btn.style.background = '#00B16A';
          setTimeout(() => {
            if (data.user.role === 'admin') {
              window.location.href = 'admin.html';
            } else {
              window.location.href = 'index.html';
            }
          }, 1000);
        } else {
          msgDiv.textContent = "Login Failed: " + (data.error || "Please check credentials.");
          msgDiv.style.display = 'block';
          msgDiv.style.backgroundColor = 'rgba(255, 77, 77, 0.1)';
          msgDiv.style.color = '#ff4d4d';
          msgDiv.style.border = '1px solid #ff4d4d';
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      } catch (err) {
        console.error(err);
        msgDiv.textContent = "Could not connect to the server. Is it running?";
        msgDiv.style.display = 'block';
        msgDiv.style.backgroundColor = 'rgba(255, 77, 77, 0.1)';
        msgDiv.style.color = '#ff4d4d';
        msgDiv.style.border = '1px solid #ff4d4d';
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      const msgDiv = document.getElementById('signup-message');
      msgDiv.style.display = 'none';

      if (password !== confirmPassword) {
        msgDiv.textContent = "Passwords do not match!";
        msgDiv.style.display = 'block';
        msgDiv.style.backgroundColor = 'rgba(255, 77, 77, 0.1)';
        msgDiv.style.color = '#ff4d4d';
        msgDiv.style.border = '1px solid #ff4d4d';
        return;
      }

      const btn = signupForm.querySelector('.auth-submit');
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Creating Account...';
      btn.disabled = true;

      try {
        const response = await fetch(`${API_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
          msgDiv.textContent = 'Account Created! Redirecting to login...';
          msgDiv.style.display = 'block';
          msgDiv.style.backgroundColor = 'rgba(0, 177, 106, 0.1)';
          msgDiv.style.color = '#00B16A';
          msgDiv.style.border = '1px solid #00B16A';
          btn.innerHTML = 'Success!';
          btn.style.background = '#00B16A';
          setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        } else {
          msgDiv.textContent = "Signup Failed: " + (data.error || "Please try again.");
          msgDiv.style.display = 'block';
          msgDiv.style.backgroundColor = 'rgba(255, 77, 77, 0.1)';
          msgDiv.style.color = '#ff4d4d';
          msgDiv.style.border = '1px solid #ff4d4d';
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      } catch (err) {
        console.error(err);
        msgDiv.textContent = "Could not connect to the server.";
        msgDiv.style.display = 'block';
        msgDiv.style.backgroundColor = 'rgba(255, 77, 77, 0.1)';
        msgDiv.style.color = '#ff4d4d';
        msgDiv.style.border = '1px solid #ff4d4d';
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }

  // --- Logout Logic ---
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('bloxara_token');
      localStorage.removeItem('bloxara_user');
      window.location.href = 'index.html';
    });
  }
});

