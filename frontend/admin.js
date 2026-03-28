document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://bloxara-store.onrender.com/api';


    // UI ELEMENTS
    const navItems = document.querySelectorAll('.nav-item:not(#adminLogoutBtn)');
    const sections = document.querySelectorAll('.tab-section');
    const headerTitle = document.getElementById('headerTitle');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('bloxara_token');
            localStorage.removeItem('bloxara_user');
            window.location.href = 'index.html';
        });
    }

    // TAB LOGIC
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            item.classList.add('active');
            const target = item.getAttribute('data-tab');
            document.getElementById(target).classList.add('active');

            if (target === 'dashboard') headerTitle.textContent = 'System Overview';
            if (target === 'orders') headerTitle.textContent = 'Orders Management';
            if (target === 'products') headerTitle.textContent = 'Products Inventory';
        });
    });

    // ==========================================
    // DASHBOARD STATS
    // ==========================================
    async function loadStats() {
        try {
            const res = await fetch(`${API_URL}/stats`);
            const stats = await res.json();
            document.getElementById('statRevenue').textContent = `$${stats.revenue.toFixed(2)}`;
            document.getElementById('statOrders').textContent = stats.orders;
            document.getElementById('statProducts').textContent = stats.products;
            document.getElementById('statUsers').textContent = stats.users;
        } catch (e) {
            console.error("Error loading stats", e);
            document.getElementById('statRevenue').textContent = 'Error';
        }
    }

    // ==========================================
    // ORDERS
    // ==========================================
    const pendingOrdersBody = document.getElementById('pendingOrdersBody');
    const fulfilledOrdersBody = document.getElementById('fulfilledOrdersBody');
    const searchInput = document.getElementById('searchInput');
    let allOrders = [];

    const FULFILLED_STATUSES = ['Fulfilled', 'Completed'];

    function getBadgeClass(status) {
        switch (status) {
            case 'Pending': return 'badge yellow';
            case 'Awaiting Trade': return 'badge blue';
            case 'Trade Sent': return 'badge purple';
            case 'Fulfilled':
            case 'Completed': return 'badge green';
            default: return 'badge yellow';
        }
    }

    async function loadOrders() {
        try {
            const res = await fetch(`${API_URL}/orders`);
            allOrders = await res.json();
            renderOrders(allOrders);
        } catch (e) {
            pendingOrdersBody.innerHTML = `<tr><td colspan="9" style="color:#ff4d4d;text-align:center;">Error connecting to API.</td></tr>`;
            fulfilledOrdersBody.innerHTML = `<tr><td colspan="8" style="color:#ff4d4d;text-align:center;">Error connecting to API.</td></tr>`;
        }
    }

    function buildOrderRow(o, showAction) {
        const date = new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const imgSrc = o.item_image || 'https://via.placeholder.com/36';
        const actionCell = showAction ? `
            <td>
                <button class="btn-fulfil" data-id="${o.id}"
                    style="background:rgba(74,222,128,0.15);color:#4ade80;border:1px solid rgba(74,222,128,0.4);
                           border-radius:8px;padding:0.35rem 0.9rem;cursor:pointer;font-weight:700;font-size:0.82rem;
                           transition:all 0.2s;"
                    onmouseover="this.style.background='rgba(74,222,128,0.3)'"
                    onmouseout="this.style.background='rgba(74,222,128,0.15)'">
                    ✓ Fulfil Order
                </button>
            </td>` : '';
        return `
            <td style="color:var(--accent-cyan);font-family:monospace;font-size:0.78rem;">${o.order_ref || `#${o.id}`}</td>
            <td>
                <div style="display:flex;align-items:center;gap:0.75rem;">
                    <img src="${imgSrc}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0;">
                    <span style="color:#fff;font-weight:600;font-size:0.9rem;">${o.item_name || o.item_id || '–'}</span>
                </div>
            </td>
            <td style="color:#c084fc;">${o.discord_handle || '–'}</td>
            <td style="color:#a0a0b0;font-size:0.85rem;">${o.customer_email || 'Guest'}</td>
            <td style="color:#a0a0b0;font-size:0.85rem;">${date}</td>
            <td style="text-align:center;">${o.quantity || 1}</td>
            <td><span class="${getBadgeClass(o.status)}">${o.status}</span></td>
            <td style="text-align:right;color:#4ade80;font-weight:700;">$${Number(o.price || 0).toFixed(2)}</td>
            ${actionCell}
        `;
    }

    function renderOrders(orders) {
        const pending = orders.filter(o => !FULFILLED_STATUSES.includes(o.status));
        const fulfilled = orders.filter(o => FULFILLED_STATUSES.includes(o.status));

        // Update count badges
        document.getElementById('pending-count').textContent = pending.length;
        document.getElementById('fulfilled-count').textContent = fulfilled.length;

        // Render Pending
        pendingOrdersBody.innerHTML = '';
        if (pending.length === 0) {
            pendingOrdersBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#888;padding:1.5rem;">🎉 No pending orders right now.</td></tr>';
        } else {
            pending.forEach(o => {
                const tr = document.createElement('tr');
                tr.innerHTML = buildOrderRow(o, true);
                pendingOrdersBody.appendChild(tr);
            });
        }

        // Render Fulfilled
        fulfilledOrdersBody.innerHTML = '';
        if (fulfilled.length === 0) {
            fulfilledOrdersBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#888;padding:1.5rem;">No fulfilled orders yet.</td></tr>';
        } else {
            fulfilled.forEach(o => {
                const tr = document.createElement('tr');
                tr.innerHTML = buildOrderRow(o, false);
                fulfilledOrdersBody.appendChild(tr);
            });
        }

        // Attach Fulfil Order listeners
        document.querySelectorAll('.btn-fulfil').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                btn.textContent = 'Processing...';
                btn.disabled = true;
                try {
                    const res = await fetch(`${API_URL}/orders/${id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Fulfilled' })
                    });
                    if (res.ok) {
                        loadOrders(); // re-render both tables
                    } else {
                        btn.textContent = '✓ Fulfil Order';
                        btn.disabled = false;
                    }
                } catch (e) {
                    alert('Failed to update order');
                    btn.textContent = '✓ Fulfil Order';
                    btn.disabled = false;
                }
            });
        });
    }

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        renderOrders(allOrders.filter(o =>
            (o.order_ref && o.order_ref.toLowerCase().includes(term)) ||
            (o.item_name && o.item_name.toLowerCase().includes(term)) ||
            (o.discord_handle && o.discord_handle.toLowerCase().includes(term)) ||
            (o.customer_email && o.customer_email.toLowerCase().includes(term))
        ));
    });

    // Filter pending table by ref code only
    window.filterPendingByRef = function (term) {
        const t = term.trim().toLowerCase();
        const pending = allOrders.filter(o => !FULFILLED_STATUSES.includes(o.status));
        const filtered = t
            ? pending.filter(o => o.order_ref && o.order_ref.toLowerCase().includes(t))
            : pending;

        pendingOrdersBody.innerHTML = '';
        if (filtered.length === 0) {
            pendingOrdersBody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#888;padding:1.2rem;">No orders matching "<span style="color:var(--accent-cyan)">${term}</span>"</td></tr>`;
        } else {
            filtered.forEach(o => {
                const tr = document.createElement('tr');
                tr.innerHTML = buildOrderRow(o, true);
                pendingOrdersBody.appendChild(tr);
            });
            // Re-attach fulfil buttons
            document.querySelectorAll('.btn-fulfil').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    btn.textContent = 'Processing...';
                    btn.disabled = true;
                    try {
                        const res = await fetch(`${API_URL}/orders/${id}/status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'Fulfilled' })
                        });
                        if (res.ok) { loadOrders(); document.getElementById('pendingRefSearch').value = ''; }
                        else { btn.textContent = '✓ Fulfil Order'; btn.disabled = false; }
                    } catch (e) { btn.textContent = '✓ Fulfil Order'; btn.disabled = false; }
                });
            });
        }
    };

    // Filter fulfilled table by ref code
    window.filterFulfilledByRef = function (term) {
        const t = term.trim().toLowerCase();
        const fulfilled = allOrders.filter(o => FULFILLED_STATUSES.includes(o.status));
        const filtered = t
            ? fulfilled.filter(o => o.order_ref && o.order_ref.toLowerCase().includes(t))
            : fulfilled;

        fulfilledOrdersBody.innerHTML = '';
        if (filtered.length === 0) {
            fulfilledOrdersBody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#888;padding:1.2rem;">No orders matching "<span style="color:#4ade80">${term}</span>"</td></tr>`;
        } else {
            filtered.forEach(o => {
                const tr = document.createElement('tr');
                tr.innerHTML = buildOrderRow(o, false);
                fulfilledOrdersBody.appendChild(tr);
            });
        }
    };

    // ==========================================
    // PRODUCTS
    // ==========================================
    const productsTableBody = document.getElementById('productsTableBody');
    const addProductFormPanel = document.getElementById('addProductFormPanel');
    const toggleAddProductBtn = document.getElementById('toggleAddProductForm');
    const cancelAddProductBtn = document.getElementById('cancelAddProduct');
    const addProductForm = document.getElementById('addProductForm');

    toggleAddProductBtn.addEventListener('click', () => {
        addProductFormPanel.style.display = 'block';
    });

    cancelAddProductBtn.addEventListener('click', () => {
        addProductFormPanel.style.display = 'none';
        addProductForm.reset();
    });

    async function loadProducts() {
        try {
            const res = await fetch(`${API_URL}/products`);
            const products = await res.json();
            renderProducts(products);
        } catch (e) {
            productsTableBody.innerHTML = `<tr><td colspan="5" style="color:#ff4d4d;text-align:center;">Error loading products.</td></tr>`;
        }
    }

    function renderProducts(products) {
        productsTableBody.innerHTML = '';
        if (products.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">No products found.</td></tr>';
            return;
        }
        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${p.image_url}" alt="item" style="width:40px;height:40px;border-radius:8px;object-fit:cover;"></td>
                <td style="font-weight:bold; color:#fff;">${p.name}<div style="font-size:0.75rem;color:#a0a0b0;font-weight:normal;">${p.description || ''}</div></td>
                <td style="color:#4ade80;">
                    $${Number(p.price).toFixed(2)}
                    ${p.old_price ? `<span style="text-decoration:line-through; color:#888; font-size:0.8rem; margin-left:0.5rem;">$${Number(p.old_price).toFixed(2)}</span>` : ''}
                </td>
                <td>${p.stock}</td>
                <td><button class="btn-delete" data-id="${p.id}">Delete</button></td>
            `;
            productsTableBody.appendChild(tr);
        });

        // Attach delete listeners
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to delete this product?')) {
                    const id = e.target.getAttribute('data-id');
                    await deleteProduct(id);
                }
            });
        });
    }

    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('prodImage');
        if (fileInput.files.length === 0) {
            alert("Please select an image file.");
            return;
        }

        const formData = new FormData();
        formData.append('name', document.getElementById('prodName').value);
        formData.append('description', document.getElementById('prodDesc').value);
        formData.append('price', document.getElementById('prodPrice').value);
        formData.append('old_price', document.getElementById('prodOldPrice').value);
        formData.append('stock', document.getElementById('prodStock').value);
        formData.append('image', fileInput.files[0]);

        try {
            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                body: formData // Note: Content-Type is set automatically for FormData
            });
            if (res.ok) {
                addProductForm.reset();
                addProductFormPanel.style.display = 'none';
                loadProducts(); // refresh table
                loadStats(); // refresh counts
            } else {
                alert('Error inserting product');
            }
        } catch (err) {
            alert('Failed to save product to database');
        }
    });

    async function deleteProduct(id) {
        try {
            const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadProducts();
                loadStats();
            } else {
                alert('Failed to delete');
            }
        } catch (e) {
            alert('Error deleting');
        }
    }

    // ==========================================
    // USERS
    // ==========================================
    const usersTableBody = document.getElementById('usersTableBody');

    async function loadUsers() {
        try {
            const token = localStorage.getItem('bloxara_token');
            const res = await fetch(`${API_URL}/users`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const users = await res.json();
            usersTableBody.innerHTML = '';
            if (!Array.isArray(users) || users.length === 0) {
                usersTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">No users found.</td></tr>';
                return;
            }
            users.forEach(u => {
                const tr = document.createElement('tr');
                const joined = new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const roleColor = u.role === 'admin' ? 'var(--accent-cyan)' : '#a0a0b0';
                tr.innerHTML = `
                    <td style="color:#888;font-size:0.85rem;">${u.id}</td>
                    <td style="font-weight:700;color:#fff;">${u.username}</td>
                    <td style="color:#a0a0b0;font-size:0.85rem;">${u.email || '—'}</td>
                    <td><span style="color:${roleColor};font-weight:700;text-transform:uppercase;font-size:0.8rem;">${u.role}</span></td>
                    <td style="color:#a0a0b0;font-size:0.85rem;">${joined}</td>
                `;
                usersTableBody.appendChild(tr);
            });
        } catch (e) {
            usersTableBody.innerHTML = '<tr><td colspan="5" style="color:#ff4d4d;text-align:center;">Error loading users.</td></tr>';
        }
    }

    // Update header title and load users when tab is clicked
    const origTabClick = Array.from(document.querySelectorAll('.nav-item:not(#adminLogoutBtn)'));
    origTabClick.forEach(item => {
        item.addEventListener('click', () => {
            if (item.getAttribute('data-tab') === 'users') {
                headerTitle.textContent = 'Registered Users';
                loadUsers();
            }
        });
    });

    // INITIALIZE APP
    loadStats();
    loadOrders();
    loadProducts();
});

