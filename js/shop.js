/**
 * Shop - Lógica completa de la tienda cliente
 */

// Coordenadas de la bodega principal (ejemplo: Santiago, Chile)
const WAREHOUSE_LAT = -33.8688;
const WAREHOUSE_LON = -51.2093;

// Comunas predefinidas (para fallback sin geoloc)
const COMMUNES = [
  { name: 'Estación Central', distance: 2, cost: 0 },
  { name: 'Quinta Normal', distance: 3, cost: 0 },
  { name: 'Macul', distance: 8, cost: 3000 },
  { name: 'Puente Alto', distance: 25, cost: 20000 },
  { name: 'San Bernardino', distance: 35, cost: 30000 },
  { name: 'Los Ángeles', distance: 450, cost: 250000 },
  { name: 'Valparaíso', distance: 115, cost: 50000 },
  { name: 'Viña del Mar', distance: 130, cost: 55000 }
];

let currentShippingCost = 0;
let lastGeoLocation = null;

/**
 * Inicializa la tienda
 */
function initShop() {
  loadProductsGrid();
  populateCategoryFilter();
  updateCartUI();
  setupEventListeners();
}

/**
 * Configura los event listeners
 */
function setupEventListeners() {
  // Carrito
  document.getElementById('cartToggle').addEventListener('click', toggleCart);
  document.getElementById('cartClose').addEventListener('click', toggleCart);

  // Búsqueda
  document.getElementById('searchProducts').addEventListener('input', debounce(handleSearch, 300));

  // Filtros
  document.getElementById('categorySelect').addEventListener('change', handleFilterChange);
  document.getElementById('priceRange').addEventListener('input', handlePriceChange);
  document.getElementById('resetFilters').addEventListener('click', resetFilters);

  // Filtros responsive
  document.getElementById('filtersToggle').addEventListener('click', () => {
    document.querySelector('.filters-sidebar').classList.add('active');
  });
  document.getElementById('filtersClose').addEventListener('click', () => {
    document.querySelector('.filters-sidebar').classList.remove('active');
  });

  // Envío
  document.getElementById('calcShippingBtn').addEventListener('click', openShippingModal);
  document.getElementById('shippingModalClose').addEventListener('click', closeShippingModal);
  document.getElementById('useGeolocBtn').addEventListener('click', handleGeolocation);
  document.getElementById('useCommuneBtn').addEventListener('click', handleCommuneSelection);
  document.getElementById('confirmShippingBtn').addEventListener('click', confirmShipping);

  // Checkout
  document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
  document.getElementById('checkoutModalClose').addEventListener('click', closeCheckoutModal);
  document.getElementById('continueShoppingBtn').addEventListener('click', closeCheckoutModal);
  document.getElementById('downloadReceiptBtn').addEventListener('click', downloadReceipt);

  // Cerrar modales con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeShippingModal();
      closeCheckoutModal();
    }
  });

  // Cerrar modal al hacer click fuera
  document.getElementById('shippingModal').addEventListener('click', (e) => {
    if (e.target.id === 'shippingModal') closeShippingModal();
  });

  document.getElementById('checkoutModal').addEventListener('click', (e) => {
    if (e.target.id === 'checkoutModal') closeCheckoutModal();
  });
}

/**
 * Carga y renderiza la grilla de productos
 */
function loadProductsGrid() {
  const products = dataManager.getProducts();
  renderProductsGrid(products);
}

/**
 * Renderiza la grilla de productos
 */
function renderProductsGrid(products) {
  const grid = document.getElementById('productsGrid');
  const noProducts = document.getElementById('noProducts');

  if (products.length === 0) {
    grid.innerHTML = '';
    noProducts.style.display = 'block';
    return;
  }

  noProducts.style.display = 'none';
  grid.innerHTML = '';

  products.forEach(product => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });
}

/**
 * Crea una tarjeta de producto
 */
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';

  const isLowStock = product.stock_current < 5;
  const isOutOfStock = product.stock_current === 0;
  const iconClass = getProductIcon(product.category);

  let stockBadge = '';
  if (isOutOfStock) {
    stockBadge = '<span class="badge badge-danger">Sin Stock</span>';
  } else if (isLowStock) {
    stockBadge = '<span class="badge badge-warning">Poco Stock</span>';
  }

  card.innerHTML = `
    <div class="product-image">
      <i class="${iconClass}"></i>
    </div>
    <div class="product-info">
      <div class="product-sku">${sanitize(product.sku)}</div>
      <div class="product-name">${sanitize(product.name)}</div>
      <div class="product-category">${sanitize(product.category)}</div>
      <div class="product-price">${formatCurrency(product.price)}</div>
      <div class="product-stock">
        ${stockBadge}
      </div>
      <div class="product-actions">
        <button class="btn-add-cart" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
          <i class="fas fa-shopping-cart"></i>
          ${isOutOfStock ? 'Sin Stock' : 'Agregar'}
        </button>
      </div>
    </div>
  `;

  if (!isOutOfStock) {
    card.querySelector('.btn-add-cart').addEventListener('click', () => {
      handleAddToCart(product.id);
    });
  }

  return card;
}

/**
 * Obtiene el icono para una categoría
 */
function getProductIcon(category) {
  const icons = {
    'Herraje': 'fas fa-hammer',
    'Tornillos y Tuercas': 'fas fa-screw',
    'Herramientas Manuales': 'fas fa-wrench',
    'Herramientas Eléctricas': 'fas fa-plug',
    'Materiales Construcción': 'fas fa-brick',
    'Pinturas y Barnices': 'fas fa-paint-brush',
    'Cañería': 'fas fa-pipe',
    'Eléctrico': 'fas fa-lightbulb',
    'Accesorios': 'fas fa-boxes'
  };
  return icons[category] || 'fas fa-box';
}

/**
 * Llena el selector de categorías
 */
function populateCategoryFilter() {
  const categories = dataManager.getCategories();
  const select = document.getElementById('categorySelect');

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  // Llenar communes también
  const communeSelect = document.getElementById('communeSelect');
  COMMUNES.forEach(commune => {
    const option = document.createElement('option');
    option.value = commune.distance;
    option.dataset.cost = commune.cost;
    option.textContent = `${commune.name} (${commune.distance} km)`;
    communeSelect.appendChild(option);
  });
}

/**
 * Maneja la búsqueda
 */
function handleSearch(e) {
  const query = e.target.value;
  const category = document.getElementById('categorySelect').value;
  const maxPrice = parseFloat(document.getElementById('priceRange').value);

  let products = dataManager.searchProducts(query);

  if (category) {
    products = products.filter(p => p.category === category);
  }

  products = products.filter(p => p.price <= maxPrice);

  renderProductsGrid(products);
}

/**
 * Maneja el cambio de filtros
 */
function handleFilterChange() {
  const searchInput = document.getElementById('searchProducts');
  const event = new Event('input', { bubbles: true });
  searchInput.dispatchEvent(event);
}

/**
 * Maneja el cambio de precio
 */
function handlePriceChange(e) {
  const value = parseInt(e.target.value);
  document.getElementById('priceValue').textContent = formatCurrency(value);
  handleFilterChange();
}

/**
 * Reinicia los filtros
 */
function resetFilters() {
  document.getElementById('searchProducts').value = '';
  document.getElementById('categorySelect').value = '';
  document.getElementById('priceRange').value = '100000';
  document.getElementById('priceValue').textContent = '$100.000';
  loadProductsGrid();
}

/**
 * Maneja agregar al carrito
 */
function handleAddToCart(productId) {
  try {
    const product = dataManager.getProductById(productId);
    if (!product) {
      showNotification('Producto no encontrado', 'danger');
      return;
    }

    if (product.stock_current <= 0) {
      showNotification('Producto sin stock disponible', 'danger');
      return;
    }

    dataManager.addToCart(productId, 1);
    updateCartUI();
    showNotification(`${product.name} agregado al carrito`, 'success');
  } catch (error) {
    showNotification(error.message, 'danger');
  }
}

/**
 * Abre/cierra el sidebar del carrito
 */
function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  sidebar.classList.toggle('active');
}

/**
 * Actualiza la UI del carrito
 */
function updateCartUI() {
  const totals = dataManager.getCartTotals();
  const cart = dataManager.getCart();

  // Actualizar badge
  document.getElementById('cartBadge').textContent = totals.itemCount;

  // Actualizar totales
  document.getElementById('cartSubtotal').textContent = formatCurrency(totals.subtotal);
  document.getElementById('cartIVA').textContent = formatCurrency(totals.iva);
  document.getElementById('cartTotal').textContent = formatCurrency(totals.total + currentShippingCost);

  // Mostrar/ocultar fila de envío
  const shippingRow = document.getElementById('shippingRow');
  if (currentShippingCost > 0) {
    shippingRow.style.display = 'flex';
    document.getElementById('cartShipping').textContent = formatCurrency(currentShippingCost);
  } else {
    shippingRow.style.display = 'none';
  }

  // Renderizar items
  renderCartItems(totals.items);

  // Mostrar/ocultar botones
  const checkoutBtn = document.getElementById('checkoutBtn');
  const calcShippingBtn = document.getElementById('calcShippingBtn');
  if (cart.length === 0) {
    document.getElementById('cartItems').style.display = 'none';
    document.getElementById('emptyCart').style.display = 'flex';
    checkoutBtn.style.display = 'none';
    calcShippingBtn.style.display = 'block';
  } else {
    document.getElementById('cartItems').style.display = 'flex';
    document.getElementById('emptyCart').style.display = 'none';
    checkoutBtn.style.display = 'block';
    calcShippingBtn.style.display = 'block';
  }
}

/**
 * Renderiza los items del carrito
 */
function renderCartItems(items) {
  const container = document.getElementById('cartItems');
  container.innerHTML = '';

  items.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${sanitize(item.product.name)}</div>
        <div class="cart-item-sku">${sanitize(item.product.sku)}</div>
        <div class="cart-item-price">${formatCurrency(item.product.price)}</div>
      </div>
      <div class="cart-item-qty">
        <button onclick="updateCartQty('${item.product.id}', ${item.quantity - 1})">-</button>
        <input type="number" value="${item.quantity}" min="1" max="${item.product.stock_current}" readonly>
        <button onclick="updateCartQty('${item.product.id}', ${item.quantity + 1})">+</button>
      </div>
      <div class="cart-item-remove">
        <button onclick="removeFromCart('${item.product.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    container.appendChild(itemEl);
  });
}

/**
 * Actualiza la cantidad de un item en el carrito
 */
function updateCartQty(productId, newQty) {
  try {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    dataManager.updateCartItem(productId, newQty);
    updateCartUI();
  } catch (error) {
    showNotification(error.message, 'danger');
  }
}

/**
 * Elimina un item del carrito
 */
function removeFromCart(productId) {
  dataManager.removeFromCart(productId);
  updateCartUI();
  showNotification('Producto eliminado del carrito', 'info');
}

/**
 * Abre el modal de envío
 */
function openShippingModal() {
  const modal = document.getElementById('shippingModal');
  document.getElementById('geolocLoading').style.display = 'none';
  document.getElementById('shippingResult').style.display = 'none';
  document.querySelector('.shipping-options').style.display = 'grid';
  modal.classList.add('active');
}

/**
 * Cierra el modal de envío
 */
function closeShippingModal() {
  const modal = document.getElementById('shippingModal');
  modal.classList.remove('active');
}

/**
 * Maneja la geolocalización
 */
function handleGeolocation() {
  const loading = document.getElementById('geolocLoading');
  const options = document.querySelector('.shipping-options');
  const result = document.getElementById('shippingResult');

  loading.style.display = 'block';
  options.style.display = 'none';
  result.style.display = 'none';

  getUserLocation()
    .then(location => {
      lastGeoLocation = location;
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        WAREHOUSE_LAT,
        WAREHOUSE_LON
      );

      const shippingCost = calculateShippingCost(distance);

      document.getElementById('resultDistance').textContent = `${distance} km`;
      document.getElementById('resultShippingCost').textContent = formatCurrency(shippingCost);

      loading.style.display = 'none';
      result.style.display = 'block';
    })
    .catch(error => {
      console.error('Error en geolocalización:', error);
      loading.style.display = 'none';
      options.style.display = 'grid';
      showNotification('No se pudo obtener tu ubicación. Intenta seleccionar una comuna.', 'warning');
    });
}

/**
 * Maneja la selección de comuna
 */
function handleCommuneSelection() {
  const select = document.getElementById('communeSelect');
  const value = select.value;

  if (!value) {
    showNotification('Selecciona una comuna', 'warning');
    return;
  }

  const option = select.options[select.selectedIndex];
  const distance = parseFloat(value);
  const cost = parseFloat(option.dataset.cost);

  document.getElementById('resultDistance').textContent = `${distance} km`;
  document.getElementById('resultShippingCost').textContent = formatCurrency(cost);

  document.querySelector('.shipping-options').style.display = 'none';
  document.getElementById('geolocLoading').style.display = 'none';
  document.getElementById('shippingResult').style.display = 'block';
}

/**
 * Confirma el costo de envío
 */
function confirmShipping() {
  const shippingCostEl = document.getElementById('resultShippingCost');
  const costText = shippingCostEl.textContent.replace(/[^0-9]/g, '');
  currentShippingCost = parseInt(costText);

  updateCartUI();
  closeShippingModal();
  showNotification('Costo de envío calculado', 'success');
}

/**
 * Maneja el checkout
 */
function handleCheckout() {
  const cart = dataManager.getCart();
  if (cart.length === 0) {
    showNotification('El carrito está vacío', 'warning');
    return;
  }

  try {
    const order = dataManager.createOrder({
      shipping_cost: currentShippingCost,
      shipping_location: lastGeoLocation ? 'Geolocalizado' : 'Comuna'
    });

    showCheckoutConfirmation(order);
    currentShippingCost = 0;
    updateCartUI();
    toggleCart();
  } catch (error) {
    showNotification(error.message, 'danger');
  }
}

/**
 * Muestra la confirmación de compra
 */
function showCheckoutConfirmation(order) {
  document.getElementById('confirmOrderId').textContent = `Orden ${order.id}`;
  document.getElementById('confirmTotal').textContent = formatCurrency(order.total);
  document.getElementById('confirmItemCount').textContent = order.products.length;

  const modal = document.getElementById('checkoutModal');
  modal.classList.add('active');

  // Guardar orden para descarga
  window.lastOrder = order;
}

/**
 * Cierra el modal de confirmación
 */
function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  modal.classList.remove('active');
}

/**
 * Descarga el recibo
 */
function downloadReceipt() {
  const order = window.lastOrder;
  if (!order) return;

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Recibo Orden ${order.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { border-bottom: 2px solid #56ccf2; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; color: #56ccf2; }
    .order-info { margin-bottom: 30px; }
    .order-info p { margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f0f0f0; padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    .totals { text-align: right; margin-bottom: 30px; }
    .totals div { margin: 5px 0; }
    .total { font-size: 18px; font-weight: bold; color: #56ccf2; }
    .footer { border-top: 2px solid #eee; padding-top: 20px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FERRETERÍA SHOP</h1>
    <p>Recibo de Compra</p>
  </div>

  <div class="order-info">
    <p><strong>Orden:</strong> ${order.id}</p>
    <p><strong>Fecha:</strong> ${formatDateTime(order.created_at)}</p>
    <p><strong>Estado:</strong> ${order.status}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Producto</th>
        <th>Cantidad</th>
        <th>Precio Unit.</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${order.products.map(p => `
        <tr>
          <td>${p.sku}</td>
          <td>${p.name}</td>
          <td>${p.quantity}</td>
          <td>${formatCurrency(p.price)}</td>
          <td>${formatCurrency(p.subtotal)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div>Subtotal: ${formatCurrency(order.subtotal)}</div>
    <div>IVA (19%): ${formatCurrency(order.iva)}</div>
    <div>Envío: ${formatCurrency(order.shipping_cost)}</div>
    <div class="total">Total: ${formatCurrency(order.total)}</div>
  </div>

  <div class="footer">
    <p>Gracias por tu compra. Este documento es tu comprobante de compra.</p>
  </div>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `recibo_${order.id}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showNotification('Recibo descargado', 'success');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initShop);
