/**
 * Admin Dashboard - Lógica completa del panel de control
 */

let currentEditingProductId = null;
let currentOrderProducts = [];

/**
 * Inicializa el dashboard
 */
function initAdmin() {
  loadProductsTable();
  loadOrdersTable();
  updateKPIs();
  setupEventListeners();
  populateFilters();
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
  // Navegación del sidebar
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const section = btn.dataset.section;
      switchSection(section);
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Modal de productos
  document.getElementById('addProductBtn').addEventListener('click', openProductModal);
  document.getElementById('modalClose').addEventListener('click', closeProductModal);
  document.getElementById('modalCancel').addEventListener('click', closeProductModal);
  document.getElementById('productForm').addEventListener('submit', handleProductFormSubmit);

  // Modal de órdenes
  document.getElementById('newOrderBtn').addEventListener('click', openOrderModal);
  document.getElementById('orderModalClose').addEventListener('click', closeOrderModal);
  document.getElementById('orderModalCancel').addEventListener('click', closeOrderModal);
  document.getElementById('createOrderBtn').addEventListener('click', handleCreateOrder);

  // Búsqueda y filtros
  document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));
  document.getElementById('categoryFilter').addEventListener('change', handleFilterChange);
  document.getElementById('stockFilter').addEventListener('change', handleFilterChange);

  // Exportar
  document.getElementById('exportBtn').addEventListener('click', handleExportCSV);
  document.getElementById('exportDataBtn').addEventListener('click', handleExportAllData);
  document.getElementById('resetDataBtn').addEventListener('click', handleResetData);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Cerrar modal con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProductModal();
      closeOrderModal();
    }
  });

  // Cerrar modal al hacer click fuera
  document.getElementById('productModal').addEventListener('click', (e) => {
    if (e.target.id === 'productModal') closeProductModal();
  });

  document.getElementById('orderModal').addEventListener('click', (e) => {
    if (e.target.id === 'orderModal') closeOrderModal();
  });
}

/**
 * Cambia de sección
 */
function switchSection(sectionId) {
  document.querySelectorAll('.section-content').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(sectionId);
  if (section) section.classList.add('active');

  // Actualizar título
  const titles = {
    inventario: 'Gestión de Inventario',
    ordenes: 'Órdenes de Salida',
    reportes: 'Reportes y Análisis',
    configuracion: 'Configuración'
  };
  document.getElementById('pageTitle').textContent = titles[sectionId] || 'Gestión de Inventario';
}

/**
 * Carga la tabla de productos
 */
function loadProductsTable() {
  const products = dataManager.getProducts();
  renderProductsTable(products);
}

/**
 * Renderiza la tabla de productos
 */
function renderProductsTable(products) {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = '';

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px;">
          <p style="color: var(--text-muted);">No hay productos. Haz click en "Nuevo Producto" para agregar uno.</p>
        </td>
      </tr>
    `;
    return;
  }

  products.forEach(product => {
    const isLowStock = product.stock_current <= product.stock_min;
    const stockStatus = getStockStatusBadge(product.stock_current, product.stock_min);
    const statusColor = getStockStatusColor(product.stock_current, product.stock_min);
    const rowClass = isLowStock ? 'alert-low-stock' : '';

    const row = document.createElement('tr');
    row.className = rowClass;
    row.innerHTML = `
      <td><strong>${sanitize(product.sku)}</strong></td>
      <td>${sanitize(product.name)}</td>
      <td>${sanitize(product.category)}</td>
      <td>${formatCurrency(product.price)}</td>
      <td><strong>${product.stock_current}</strong></td>
      <td>${product.stock_min}</td>
      <td>${sanitize(product.location)}</td>
      <td>
        <span class="badge badge-${statusColor}">${stockStatus}</span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-secondary btn-small" data-id="${product.id}" onclick="handleEditProduct('${product.id}')">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-danger btn-small" data-id="${product.id}" onclick="handleDeleteProduct('${product.id}')">
            <i class="fas fa-trash"></i> Eliminar
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * Maneja la búsqueda en tiempo real
 */
function handleSearch(e) {
  const query = e.target.value;
  const category = document.getElementById('categoryFilter').value;
  const stockFilter = document.getElementById('stockFilter').value;

  let products = dataManager.searchProducts(query);

  if (category) {
    products = products.filter(p => p.category === category);
  }

  if (stockFilter === 'low') {
    products = products.filter(p => p.stock_current <= p.stock_min);
  } else if (stockFilter === 'normal') {
    products = products.filter(p => p.stock_current > p.stock_min);
  }

  renderProductsTable(products);
}

/**
 * Maneja el cambio de filtros
 */
function handleFilterChange() {
  const searchInput = document.getElementById('searchInput');
  const event = new Event('input', { bubbles: true });
  searchInput.dispatchEvent(event);
}

/**
 * Llena los filtros de categoría
 */
function populateFilters() {
  const categories = dataManager.getCategories();
  const select = document.getElementById('categoryFilter');

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

/**
 * Abre el modal de producto (para nuevo o editar)
 */
function openProductModal(productId = null) {
  currentEditingProductId = productId;
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');

  if (productId) {
    const product = dataManager.getProductById(productId);
    if (!product) return;

    document.getElementById('modalTitle').textContent = 'Editar Producto';
    document.getElementById('productSku').value = product.sku;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStockCurrent').value = product.stock_current;
    document.getElementById('productStockMin').value = product.stock_min;
    document.getElementById('productLocation').value = product.location;
  } else {
    document.getElementById('modalTitle').textContent = 'Nuevo Producto';
    form.reset();
  }

  modal.classList.add('active');
}

/**
 * Cierra el modal de producto
 */
function closeProductModal() {
  const modal = document.getElementById('productModal');
  modal.classList.remove('active');
  currentEditingProductId = null;
  document.getElementById('productForm').reset();
}

/**
 * Maneja el envío del formulario de productos
 */
function handleProductFormSubmit(e) {
  e.preventDefault();

  const sku = document.getElementById('productSku').value.trim();
  const name = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  const stock_current = parseInt(document.getElementById('productStockCurrent').value);
  const stock_min = parseInt(document.getElementById('productStockMin').value);
  const location = document.getElementById('productLocation').value.trim();

  // Validar
  const skuValidation = validateSKU(sku, currentEditingProductId);
  if (!skuValidation.valid) {
    showNotification(skuValidation.error, 'danger');
    return;
  }

  const nameValidation = validateName(name);
  if (!nameValidation.valid) {
    showNotification(nameValidation.error, 'danger');
    return;
  }

  const categoryValidation = validateCategory(category);
  if (!categoryValidation.valid) {
    showNotification(categoryValidation.error, 'danger');
    return;
  }

  const priceValidation = validatePrice(price);
  if (!priceValidation.valid) {
    showNotification(priceValidation.error, 'danger');
    return;
  }

  const stockCurrentValidation = validateStock(stock_current);
  if (!stockCurrentValidation.valid) {
    showNotification(stockCurrentValidation.error, 'danger');
    return;
  }

  const stockMinValidation = validateStock(stock_min);
  if (!stockMinValidation.valid) {
    showNotification(stockMinValidation.error, 'danger');
    return;
  }

  const locationValidation = validateLocation(location);
  if (!locationValidation.valid) {
    showNotification(locationValidation.error, 'danger');
    return;
  }

  try {
    if (currentEditingProductId) {
      dataManager.updateProduct(currentEditingProductId, {
        sku,
        name,
        category,
        price,
        stock_current,
        stock_min,
        location
      });
      showNotification('Producto actualizado correctamente', 'success');
    } else {
      dataManager.addProduct({
        sku,
        name,
        category,
        price,
        stock_current,
        stock_min,
        location
      });
      showNotification('Producto creado correctamente', 'success');
    }

    closeProductModal();
    loadProductsTable();
    populateFilters();
    updateKPIs();
  } catch (error) {
    showNotification(error.message, 'danger');
  }
}

/**
 * Maneja la edición de un producto
 */
function handleEditProduct(productId) {
  openProductModal(productId);
}

/**
 * Maneja la eliminación de un producto
 */
function handleDeleteProduct(productId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
    return;
  }

  try {
    dataManager.deleteProduct(productId);
    showNotification('Producto eliminado correctamente', 'success');
    loadProductsTable();
    updateKPIs();
  } catch (error) {
    showNotification(error.message, 'danger');
  }
}

/**
 * Actualiza los KPIs
 */
function updateKPIs() {
  const metrics = dataManager.getInventoryMetrics();

  document.getElementById('lowStockCount').textContent = metrics.lowStockCount;
  document.getElementById('totalProducts').textContent = metrics.totalProducts;
  document.getElementById('totalValue').textContent = formatCurrency(metrics.totalValue);
  document.getElementById('pendingOrders').textContent = metrics.pendingOrders;
}

/**
 * Carga la tabla de órdenes
 */
function loadOrdersTable() {
  const orders = dataManager.getOrders();
  renderOrdersTable(orders);
}

/**
 * Renderiza la tabla de órdenes
 */
function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = '';

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px;">
          <p style="color: var(--text-muted);">No hay órdenes. Crea una nueva orden haciendo click en "Nueva Orden".</p>
        </td>
      </tr>
    `;
    return;
  }

  orders.forEach(order => {
    const productCount = order.products.length;
    const totalQty = order.products.reduce((sum, p) => sum + p.quantity, 0);
    const statusClass = order.status === 'Pendiente' ? 'warning' :
                        order.status === 'Despachado' ? 'info' : 'success';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${order.id}</strong></td>
      <td>${productCount} artículo(s)</td>
      <td>${totalQty}</td>
      <td>${formatCurrency(order.total)}</td>
      <td>
        <span class="badge badge-${statusClass}">${order.status}</span>
      </td>
      <td>${formatDate(order.created_at)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-secondary btn-small" onclick="handleViewOrder('${order.id}')">
            <i class="fas fa-eye"></i> Ver
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * Maneja la visualización de una orden
 */
function handleViewOrder(orderId) {
  const order = dataManager.getOrderById(orderId);
  if (!order) return;

  const details = order.products.map(p => `${p.quantity}x ${p.name}`).join(', ');
  showNotification(`Orden ${order.id}: ${details}`, 'info', 5000);
}

/**
 * Abre el modal de nueva orden
 */
function openOrderModal() {
  const modal = document.getElementById('orderModal');
  const products = dataManager.getProducts();
  currentOrderProducts = [];

  const list = document.getElementById('orderProductsList');
  list.innerHTML = '';

  products.forEach(product => {
    if (product.stock_current > 0) {
      const item = document.createElement('div');
      item.className = 'order-product-item';
      item.innerHTML = `
        <div class="order-product-info">
          <div class="order-product-name">${sanitize(product.name)}</div>
          <div class="order-product-sku">${sanitize(product.sku)}</div>
        </div>
        <div class="order-product-qty">
          <input type="number" class="product-qty-input" data-id="${product.id}" min="0" max="${product.stock_current}" value="0" placeholder="Qty">
          <span style="color: var(--text-muted);">/ ${product.stock_current}</span>
        </div>
      `;
      list.appendChild(item);
    }
  });

  // Agregar listeners a los inputs
  document.querySelectorAll('.product-qty-input').forEach(input => {
    input.addEventListener('change', updateOrderSummary);
  });

  modal.classList.add('active');
  updateOrderSummary();
}

/**
 * Cierra el modal de orden
 */
function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  modal.classList.remove('active');
  currentOrderProducts = [];
}

/**
 * Actualiza el resumen de la orden
 */
function updateOrderSummary() {
  const inputs = document.querySelectorAll('.product-qty-input');
  currentOrderProducts = [];
  let totalQty = 0;
  let totalValue = 0;

  inputs.forEach(input => {
    const qty = parseInt(input.value) || 0;
    if (qty > 0) {
      const productId = input.dataset.id;
      const product = dataManager.getProductById(productId);
      if (product) {
        currentOrderProducts.push({ productId, quantity: qty });
        totalQty += qty;
        totalValue += product.price * qty;
      }
    }
  });

  document.getElementById('orderItemCount').textContent = totalQty;
  document.getElementById('orderTotal').textContent = formatCurrency(totalValue);
}

/**
 * Maneja la creación de una orden
 */
function handleCreateOrder() {
  if (currentOrderProducts.length === 0) {
    showNotification('Debes seleccionar al menos un producto', 'warning');
    return;
  }

  try {
    // Llenar carrito del dataManager
    dataManager.clearCart();
    currentOrderProducts.forEach(item => {
      dataManager.addToCart(item.productId, item.quantity);
    });

    // Crear orden
    const order = dataManager.createOrder();
    showNotification(`Orden ${order.id} creada correctamente`, 'success');

    closeOrderModal();
    loadOrdersTable();
    loadProductsTable();
    updateKPIs();
  } catch (error) {
    showNotification(error.message, 'danger');
  }
}

/**
 * Exporta el inventario a CSV
 */
function handleExportCSV() {
  const products = dataManager.getProducts();
  if (products.length === 0) {
    showNotification('No hay productos para exportar', 'warning');
    return;
  }

  const data = products.map(p => ({
    'SKU': p.sku,
    'Nombre': p.name,
    'Categoría': p.category,
    'Precio': p.price,
    'Stock Actual': p.stock_current,
    'Stock Mínimo': p.stock_min,
    'Ubicación': p.location,
    'Fecha Creación': formatDate(p.created_at)
  }));

  const filename = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
  exportToCSV(data, filename);
  showNotification('Inventario descargado correctamente', 'success');
}

/**
 * Exporta todos los datos
 */
function handleExportAllData() {
  const data = {
    products: dataManager.data.products,
    orders: dataManager.data.orders,
    timestamp: new Date().toISOString()
  };

  const filename = `ferreteria_backup_${new Date().toISOString().split('T')[0]}.json`;
  exportToJSON(data, filename);
  showNotification('Copia de seguridad creada correctamente', 'success');
}

/**
 * Reinicia los datos de ejemplo
 */
function handleResetData() {
  if (!confirm('¿Estás seguro? Esto borrará todos los datos y los reemplazará con los datos de ejemplo.')) {
    return;
  }

  localStorage.removeItem('ferreteria_data');
  location.reload();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initAdmin);
