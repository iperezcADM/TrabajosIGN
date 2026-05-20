/**
 * DataManager - Gestor central de datos para inventario y carrito
 * Maneja persistencia en localStorage y operaciones CRUD
 */
class DataManager {
  constructor() {
    this.storageKey = 'ferreteria_data';
    this.data = {
      products: [],
      cart: [],
      orders: []
    };
    this.loadFromLocalStorage();
  }

  /**
   * Inicializa datos de ejemplo si localStorage está vacío
   */
  initializeWithExampleData(exampleData) {
    if (this.data.products.length === 0) {
      this.data.products = exampleData;
      this.saveToLocalStorage();
    }
  }

  /**
   * Carga datos desde localStorage
   */
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = {
          products: parsed.products || [],
          cart: parsed.cart || [],
          orders: parsed.orders || []
        };
      }
    } catch (error) {
      console.error('Error al cargar datos de localStorage:', error);
    }
  }

  /**
   * Guarda datos a localStorage
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error al guardar datos en localStorage:', error);
    }
  }

  /**
   * Obtiene todos los productos
   */
  getProducts() {
    return [...this.data.products];
  }

  /**
   * Obtiene un producto por ID
   */
  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  /**
   * Busca productos por texto (SKU o nombre)
   */
  searchProducts(query) {
    const q = query.toLowerCase();
    return this.data.products.filter(p =>
      p.sku.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q)
    );
  }

  /**
   * Filtra productos por categoría
   */
  filterByCategory(category) {
    if (!category) return this.data.products;
    return this.data.products.filter(p => p.category === category);
  }

  /**
   * Obtiene productos con stock bajo (stock_current <= stock_min)
   */
  getLowStockProducts() {
    return this.data.products.filter(p => p.stock_current <= p.stock_min);
  }

  /**
   * Obtiene todas las categorías únicas
   */
  getCategories() {
    const cats = new Set(this.data.products.map(p => p.category));
    return Array.from(cats).sort();
  }

  /**
   * Agrega un nuevo producto
   */
  addProduct(productData) {
    const newProduct = {
      id: Date.now().toString(),
      ...productData,
      created_at: new Date().toISOString()
    };
    this.data.products.push(newProduct);
    this.saveToLocalStorage();
    return newProduct;
  }

  /**
   * Actualiza un producto existente
   */
  updateProduct(id, updates) {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Producto no encontrado');

    this.data.products[index] = {
      ...this.data.products[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveToLocalStorage();
    return this.data.products[index];
  }

  /**
   * Elimina un producto
   */
  deleteProduct(id) {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Producto no encontrado');

    this.data.products.splice(index, 1);
    this.saveToLocalStorage();
  }

  /**
   * Obtiene el carrito actual
   */
  getCart() {
    return [...this.data.cart];
  }

  /**
   * Calcula totales del carrito
   */
  getCartTotals() {
    let subtotal = 0;
    const items = [];

    for (const cartItem of this.data.cart) {
      const product = this.getProductById(cartItem.product_id);
      if (product) {
        const itemTotal = product.price * cartItem.quantity;
        subtotal += itemTotal;
        items.push({ ...cartItem, product, itemTotal });
      }
    }

    const iva = subtotal * 0.19;
    return {
      items,
      subtotal,
      iva,
      total: subtotal + iva,
      itemCount: this.data.cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  }

  /**
   * Agrega un producto al carrito
   */
  addToCart(productId, quantity = 1) {
    const product = this.getProductById(productId);
    if (!product) throw new Error('Producto no encontrado');

    // Validar stock disponible
    const cartItem = this.data.cart.find(item => item.product_id === productId);
    const currentQty = cartItem ? cartItem.quantity : 0;
    if (currentQty + quantity > product.stock_current) {
      throw new Error('No hay suficiente stock disponible');
    }

    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      this.data.cart.push({
        product_id: productId,
        quantity,
        added_at: new Date().toISOString()
      });
    }

    this.saveToLocalStorage();
  }

  /**
   * Actualiza cantidad de un producto en el carrito
   */
  updateCartItem(productId, quantity) {
    const item = this.data.cart.find(c => c.product_id === productId);
    if (!item) throw new Error('Producto no en carrito');

    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const product = this.getProductById(productId);
    if (quantity > product.stock_current) {
      throw new Error('Cantidad excede stock disponible');
    }

    item.quantity = quantity;
    this.saveToLocalStorage();
  }

  /**
   * Elimina un producto del carrito
   */
  removeFromCart(productId) {
    const index = this.data.cart.findIndex(c => c.product_id === productId);
    if (index !== -1) {
      this.data.cart.splice(index, 1);
      this.saveToLocalStorage();
    }
  }

  /**
   * Vacía el carrito
   */
  clearCart() {
    this.data.cart = [];
    this.saveToLocalStorage();
  }

  /**
   * Crea una orden desde el carrito actual
   */
  createOrder(orderData = {}) {
    if (this.data.cart.length === 0) {
      throw new Error('El carrito está vacío');
    }

    const totals = this.getCartTotals();
    const newOrder = {
      id: `ORD-${Date.now()}`,
      products: this.data.cart.map(item => {
        const product = this.getProductById(item.product_id);
        return {
          product_id: item.product_id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          subtotal: product.price * item.quantity
        };
      }),
      subtotal: totals.subtotal,
      iva: totals.iva,
      shipping_cost: orderData.shipping_cost || 0,
      total: totals.total + (orderData.shipping_cost || 0),
      status: orderData.status || 'Devengado',
      created_at: new Date().toISOString(),
      ...orderData
    };

    // Restar stock de cada producto
    for (const cartItem of this.data.cart) {
      const product = this.getProductById(cartItem.product_id);
      if (product) {
        product.stock_current -= cartItem.quantity;
        if (product.stock_current < 0) product.stock_current = 0;
      }
    }

    this.data.orders.push(newOrder);
    this.clearCart();
    this.saveToLocalStorage();
    return newOrder;
  }

  /**
   * Obtiene todas las órdenes
   */
  getOrders() {
    return [...this.data.orders];
  }

  /**
   * Obtiene una orden por ID
   */
  getOrderById(id) {
    return this.data.orders.find(o => o.id === id);
  }

  /**
   * Actualiza estado de una orden
   */
  updateOrderStatus(orderId, status) {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Orden no encontrada');

    order.status = status;
    order.updated_at = new Date().toISOString();
    this.saveToLocalStorage();
    return order;
  }

  /**
   * Calcula métricas de inventario
   */
  getInventoryMetrics() {
    const products = this.data.products;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_current), 0);
    const lowStockCount = this.getLowStockProducts().length;
    const devengadosOrdersCount = this.data.orders.filter(o => o.status === 'Devengado' || o.status === 'Pendiente').length;
    const pendingOrders = devengadosOrdersCount;

    return {
      totalProducts: products.length,
      totalValue,
      lowStockCount,
      devengadosOrdersCount,
      pendingOrders,
      totalOrders: this.data.orders.length
    };
  }

  /**
   * Exporta datos para descarga
   */
  exportProducts() {
    return JSON.stringify(this.data.products, null, 2);
  }

  /**
   * Valida SKU único
   */
  isSkuUnique(sku, excludeId = null) {
    return !this.data.products.some(p =>
      p.sku.toUpperCase() === sku.toUpperCase() && p.id !== excludeId
    );
  }
}

// Crear instancia global
const dataManager = new DataManager();
