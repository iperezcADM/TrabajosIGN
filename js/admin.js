/**
 * Admin Dashboard - Lógica completa del panel de control
 */

let currentEditingProductId = null;
let currentOrderProducts = [];
let currentInventoryProducts = [];
let currentProductPage = 1;
let currentUser = null;
const PRODUCTS_PER_PAGE = 15;

/**
 * Inicializa el dashboard
 */
function initAdmin() {
  currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }

  applyPermissions();
  loadProductsTable();
  loadOrdersTable();
  updateKPIs();
  setupEventListeners();
  populateFilters();
}

function getCurrentUser() {
  const stored = localStorage.getItem('ferreteria_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function applyPermissions() {
  const userMenu = document.getElementById('userMenu');
  if (userMenu) {
    userMenu.innerHTML = `<i class="fas fa-user-circle"></i><span>${sanitize(currentUser.displayName)}</span>`;
  }

  const isInventoryOnly = currentUser.role === 'inventory';
  if (!isInventoryOnly) return;

  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.section !== 'inventario') {
      item.style.display = 'none';
    }
  });
  document.querySelectorAll('#menuDropdown [data-section]').forEach(item => {
    if (item.dataset.section !== 'inventario') {
      item.style.display = 'none';
    }
  });

  document.getElementById('addProductBtn').style.display = 'none';
  document.getElementById('exportBtn').style.display = 'none';
  document.getElementById('importBtn').style.display = 'none';
  document.getElementById('exportDataBtn').style.display = 'none';
  document.getElementById('resetDataBtn').style.display = 'none';

  const tiendaLink = document.querySelector('.header-link');
  if (tiendaLink) {
    tiendaLink.style.display = 'none';
  }

  const ordenSection = document.getElementById('ordenes');
  const reportesSection = document.getElementById('reportes');
  const configuracionSection = document.getElementById('configuracion');
  if (ordenSection) ordenSection.style.display = 'none';
  if (reportesSection) reportesSection.style.display = 'none';
  if (configuracionSection) configuracionSection.style.display = 'none';
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
  document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
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
  document.getElementById('inventoryPagination').addEventListener('click', handleInventoryPageClick);

  // Exportar / importar Excel
  document.getElementById('exportBtn').addEventListener('click', handleExportExcel);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('excelFileInput').click();
  });
  document.getElementById('excelFileInput').addEventListener('change', handleExcelFileChange);
  document.getElementById('exportDataBtn').addEventListener('click', handleExportAllData);
  document.getElementById('resetDataBtn').addEventListener('click', handleResetData);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('ferreteria_user');
    window.location.href = 'index.html';
  });

  // Dropdown del menú principal
  const menuDropdownBtn = document.getElementById('menuDropdownBtn');
  const menuDropdown = document.getElementById('menuDropdown');
  if (menuDropdownBtn && menuDropdown) {
    menuDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle('active');
    });

    menuDropdown.querySelectorAll('[data-section]').forEach(item => {
      item.addEventListener('click', () => {
        const section = item.dataset.section;
        switchSection(section);
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        const matchingButton = document.querySelector(`.nav-item[data-section="${section}"]`);
        if (matchingButton) matchingButton.classList.add('active');
        menuDropdown.classList.remove('active');
      });
    });

    window.addEventListener('click', () => {
      menuDropdown.classList.remove('active');
    });

    menuDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');

  if (sidebarToggle && sidebar && mainContent) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('visible');
      mainContent.classList.toggle('sidebar-visible');
      const icon = sidebarToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
      }
    });
  }

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
function loadProductsTable(page = 1) {
  const products = dataManager.getProducts();
  currentInventoryProducts = products;
  currentProductPage = page;
  renderProductsTable(products, page);
}

/**
 * Renderiza la tabla de productos
 */
function renderProductsTable(products, page = currentProductPage) {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = '';

  if (!Array.isArray(products) || products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px;">
          <p style="color: var(--text-muted);">No hay productos. Haz click en "Nuevo Producto" para agregar uno.</p>
        </td>
      </tr>
    `;
    renderInventoryPagination(1, 1, 0);
    return;
  }

  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  if (page < 1) page = 1;
  if (page > totalPages) page = totalPages;
  currentProductPage = page;
  currentInventoryProducts = products;

  const start = (page - 1) * PRODUCTS_PER_PAGE;
  const pagedProducts = products.slice(start, start + PRODUCTS_PER_PAGE);

  pagedProducts.forEach(product => {
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

  renderInventoryPagination(totalPages, page, products.length);
}

function renderInventoryPagination(totalPages, currentPage, totalItems) {
  const paginationContainer = document.getElementById('inventoryPagination');
  const paginationInfo = document.getElementById('paginationInfo');
  if (!paginationContainer || !paginationInfo) return;

  const pageCount = Math.min(PRODUCTS_PER_PAGE, totalItems - (currentPage - 1) * PRODUCTS_PER_PAGE);
  paginationInfo.textContent = `Mostrando ${pageCount} de ${totalItems} productos — Página ${currentPage} de ${totalPages}`;
  paginationContainer.innerHTML = '';

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  const addPageButton = (page, label, isActive = false, disabled = false) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `page-btn${isActive ? ' active' : ''}`;
    button.textContent = label;
    button.disabled = disabled;
    button.dataset.page = page;
    return button;
  };

  paginationContainer.appendChild(addPageButton(currentPage - 1, 'Anterior', false, currentPage === 1));

  for (let i = 1; i <= totalPages; i += 1) {
    paginationContainer.appendChild(addPageButton(i, i, i === currentPage));
  }

  paginationContainer.appendChild(addPageButton(currentPage + 1, 'Siguiente', false, currentPage === totalPages));
}

function handleInventoryPageClick(event) {
  const button = event.target.closest('.page-btn');
  if (!button) return;
  const page = parseInt(button.dataset.page, 10);
  if (Number.isNaN(page)) return;
  renderProductsTable(currentInventoryProducts, page);
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

  currentInventoryProducts = products;
  currentProductPage = 1;
  renderProductsTable(products, 1);
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
  if (currentUser.role === 'inventory' && !productId) {
    showNotification('No tienes permiso para crear productos.', 'warning');
    return;
  }

  currentEditingProductId = productId;
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const randomField = document.getElementById('productSku');
  const nameField = document.getElementById('productName');
  const skuField = document.getElementById('productCategory');
  const priceField = document.getElementById('productPrice');
  const stockCurrentField = document.getElementById('productStockCurrent');
  const stockMinField = document.getElementById('productStockMin');
  const locationField = document.getElementById('productLocation');

  [randomField, nameField, skuField, priceField, stockCurrentField, stockMinField, locationField].forEach(field => {
    field.disabled = false;
  });

  if (productId) {
    const product = dataManager.getProductById(productId);
    if (!product) return;

    document.getElementById('modalTitle').textContent = 'Editar Producto';
    randomField.value = product.sku;
    nameField.value = product.name;
    skuField.value = product.category;
    priceField.value = product.price;
    stockCurrentField.value = product.stock_current;
    stockMinField.value = product.stock_min;
    locationField.value = product.location;

    if (currentUser.role === 'inventory') {
      randomField.disabled = true;
      nameField.disabled = true;
      priceField.disabled = true;
      stockMinField.disabled = true;
      locationField.disabled = true;
    }
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
        if (currentUser.role === 'inventory') {
          dataManager.updateProduct(currentEditingProductId, {
            category,
            stock_current
          });
        } else {
          dataManager.updateProduct(currentEditingProductId, {
            sku,
            name,
            category,
            price,
            stock_current,
            stock_min,
            location
          });
        }
        showNotification('Producto actualizado correctamente', 'success');
      } else {
        if (currentUser.role === 'inventory') {
          showNotification('No tienes permiso para crear productos.', 'danger');
          return;
        }
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
  const devengadosOrders = document.getElementById('devengadosOrdersCount');
  if (devengadosOrders) {
    devengadosOrders.textContent = metrics.devengadosOrdersCount;
  }
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
    const statusClass = order.status === 'Pendiente' || order.status === 'Devengado' ? 'warning' :
                        order.status === 'Despachado' ? 'success' :
                        'secondary';

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
function handleExportExcel() {
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

  const filename = `inventario_${new Date().toISOString().split('T')[0]}.xlsx`;
  exportToExcel(data, filename);
  showNotification('Inventario descargado en Excel', 'success');
}

function handleExcelFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!window.XLSX) {
    showNotification('No se encontró la biblioteca de Excel. Verifica que SheetJS esté cargado.', 'danger');
    event.target.value = '';
    return;
  }

  parseExcelFile(file)
    .then(importInventoryFromExcel)
    .catch(error => {
      console.error(error);
      showNotification('Error al leer el archivo Excel', 'danger');
    })
    .finally(() => {
      event.target.value = '';
    });
}

function importInventoryFromExcel(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    showNotification('El archivo no contiene datos válidos', 'warning');
    return;
  }

  const normalizeField = value => String(value).trim().toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const headerKeys = Object.keys(rows[0]);
  const headerMap = {};

  headerKeys.forEach(key => {
    const normalized = normalizeField(key);
    if (['sku', 'codigo', 'code'].includes(normalized)) headerMap[key] = 'sku';
    if (['nombre', 'name', 'producto'].includes(normalized)) headerMap[key] = 'name';
    if (['categoria', 'category'].includes(normalized)) headerMap[key] = 'category';
    if (['precio', 'price', 'valor'].includes(normalized)) headerMap[key] = 'price';
    if (['stock actual', 'stock_actual', 'stockactual'].includes(normalized)) headerMap[key] = 'stock_current';
    if (['stock minimo', 'stock_minimo', 'stockminimo', 'stock_min'].includes(normalized)) headerMap[key] = 'stock_min';
    if (['ubicacion', 'ubicación', 'location', 'lugar'].includes(normalized)) headerMap[key] = 'location';
  });

  let added = 0;
  let updated = 0;
  let skipped = 0;

  rows.forEach(row => {
    const mapped = {};
    Object.entries(row).forEach(([key, value]) => {
      const target = headerMap[key];
      if (target) mapped[target] = value;
    });

    const sku = String(mapped.sku || '').trim();
    const name = String(mapped.name || '').trim();
    const category = String(mapped.category || '').trim();
    const location = String(mapped.location || '').trim();
    const price = parseFloat(mapped.price);
    const stock_current = parseInt(mapped.stock_current, 10);
    const stock_min = parseInt(mapped.stock_min, 10);

    if (!sku || !name || !category || isNaN(price) || isNaN(stock_current) || isNaN(stock_min)) {
      skipped++;
      return;
    }

    const existing = dataManager.getProducts().find(p => p.sku.toLowerCase() === sku.toLowerCase());
    try {
      if (existing) {
        dataManager.updateProduct(existing.id, {
          name,
          category,
          price,
          stock_current,
          stock_min,
          location
        });
        updated++;
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
        added++;
      }
    } catch (error) {
      skipped++;
    }
  });

  if (added + updated === 0) {
    showNotification('No se importaron filas válidas', 'warning');
    return;
  }

  loadProductsTable();
  populateFilters();
  updateKPIs();

  showNotification(`Importación completada: ${added} nuevos, ${updated} actualizados, ${skipped} ignorados`, 'success', 7000);
}

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
