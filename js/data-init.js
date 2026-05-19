/**
 * Datos de ejemplo - Inventario de Ferretería
 */
const EXAMPLE_PRODUCTS = [
  {
    sku: 'CLV-001',
    name: 'Clavo Recocido 2"',
    category: 'Herraje',
    price: 150,
    stock_current: 500,
    stock_min: 100,
    location: 'A-01-01'
  },
  {
    sku: 'CLV-002',
    name: 'Clavo Recocido 3"',
    category: 'Herraje',
    price: 200,
    stock_current: 45,
    stock_min: 100,
    location: 'A-01-02'
  },
  {
    sku: 'TUE-001',
    name: 'Tuerca M8 Acero',
    category: 'Tornillos y Tuercas',
    price: 75,
    stock_current: 1200,
    stock_min: 200,
    location: 'B-02-01'
  },
  {
    sku: 'TUE-002',
    name: 'Tuerca M10 Acero',
    category: 'Tornillos y Tuercas',
    price: 100,
    stock_current: 800,
    stock_min: 200,
    location: 'B-02-02'
  },
  {
    sku: 'TOR-001',
    name: 'Tornillo Cabeza Plana M6x25',
    category: 'Tornillos y Tuercas',
    price: 60,
    stock_current: 2000,
    stock_min: 500,
    location: 'B-03-01'
  },
  {
    sku: 'HER-001',
    name: 'Martillo Cabeza Acero 500g',
    category: 'Herramientas Manuales',
    price: 8500,
    stock_current: 15,
    stock_min: 5,
    location: 'C-01-01'
  },
  {
    sku: 'HER-002',
    name: 'Destornillador Punta Plana',
    category: 'Herramientas Manuales',
    price: 2500,
    stock_current: 28,
    stock_min: 10,
    location: 'C-01-02'
  },
  {
    sku: 'HER-003',
    name: 'Destornillador Punta Phillips',
    category: 'Herramientas Manuales',
    price: 2500,
    stock_current: 32,
    stock_min: 10,
    location: 'C-01-03'
  },
  {
    sku: 'HER-004',
    name: 'Llave Ajustable 8"',
    category: 'Herramientas Manuales',
    price: 6000,
    stock_current: 12,
    stock_min: 5,
    location: 'C-02-01'
  },
  {
    sku: 'HER-005',
    name: 'Taladro Inalámbrico 18V',
    category: 'Herramientas Eléctricas',
    price: 45000,
    stock_current: 8,
    stock_min: 3,
    location: 'D-01-01'
  },
  {
    sku: 'HER-006',
    name: 'Sierra Circular 1400W',
    category: 'Herramientas Eléctricas',
    price: 62000,
    stock_current: 5,
    stock_min: 2,
    location: 'D-01-02'
  },
  {
    sku: 'MAT-001',
    name: 'Cemento Bolsa 42.5kg',
    category: 'Materiales Construcción',
    price: 4200,
    stock_current: 120,
    stock_min: 50,
    location: 'E-01-01'
  },
  {
    sku: 'MAT-002',
    name: 'Arena Bolsa 25kg',
    category: 'Materiales Construcción',
    price: 2800,
    stock_current: 85,
    stock_min: 40,
    location: 'E-01-02'
  },
  {
    sku: 'MAT-003',
    name: 'Ladrillo Común Unidad',
    category: 'Materiales Construcción',
    price: 850,
    stock_current: 3500,
    stock_min: 1000,
    location: 'E-02-01'
  },
  {
    sku: 'MAT-004',
    name: 'Ladrillo Fiscal Unidad',
    category: 'Materiales Construcción',
    price: 1200,
    stock_current: 2800,
    stock_min: 800,
    location: 'E-02-02'
  },
  {
    sku: 'PIN-001',
    name: 'Pintura Acrílica Blanco 20L',
    category: 'Pinturas y Barnices',
    price: 18000,
    stock_current: 22,
    stock_min: 10,
    location: 'F-01-01'
  },
  {
    sku: 'PIN-002',
    name: 'Pintura Latex Interior 10L',
    category: 'Pinturas y Barnices',
    price: 12500,
    stock_current: 35,
    stock_min: 15,
    location: 'F-01-02'
  },
  {
    sku: 'PIN-003',
    name: 'Barniz Brillante 5L',
    category: 'Pinturas y Barnices',
    price: 22000,
    stock_current: 8,
    stock_min: 5,
    location: 'F-01-03'
  },
  {
    sku: 'CAN-001',
    name: 'Caño PVC 1/2" metro',
    category: 'Cañería',
    price: 800,
    stock_current: 450,
    stock_min: 100,
    location: 'G-01-01'
  },
  {
    sku: 'CAN-002',
    name: 'Caño PVC 3/4" metro',
    category: 'Cañería',
    price: 1100,
    stock_current: 320,
    stock_min: 100,
    location: 'G-01-02'
  },
  {
    sku: 'CAN-003',
    name: 'Codo PVC 1/2"',
    category: 'Cañería',
    price: 450,
    stock_current: 680,
    stock_min: 150,
    location: 'G-02-01'
  },
  {
    sku: 'ELE-001',
    name: 'Cable Eléctrico AWG 10 metro',
    category: 'Eléctrico',
    price: 1200,
    stock_current: 280,
    stock_min: 80,
    location: 'H-01-01'
  },
  {
    sku: 'ELE-002',
    name: 'Enchufe Doble 10A',
    category: 'Eléctrico',
    price: 3500,
    stock_current: 95,
    stock_min: 30,
    location: 'H-01-02'
  },
  {
    sku: 'ELE-003',
    name: 'Interruptor Simple 10A',
    category: 'Eléctrico',
    price: 4200,
    stock_current: 120,
    stock_min: 40,
    location: 'H-01-03'
  },
  {
    sku: 'GRA-001',
    name: 'Grapa para Caño 1/2"',
    category: 'Accesorios',
    price: 180,
    stock_current: 1500,
    stock_min: 300,
    location: 'I-01-01'
  },
  {
    sku: 'GRA-002',
    name: 'Grapa para Caño 3/4"',
    category: 'Accesorios',
    price: 250,
    stock_current: 1100,
    stock_min: 300,
    location: 'I-01-02'
  },
  {
    sku: 'PER-001',
    name: 'Pernos 5/8" x 4" Juego',
    category: 'Herraje',
    price: 5500,
    stock_current: 35,
    stock_min: 15,
    location: 'A-02-01'
  },
  {
    sku: 'ANC-001',
    name: 'Anclajes de Expansion 8mm',
    category: 'Accesorios',
    price: 800,
    stock_current: 25,
    stock_min: 20,
    location: 'I-02-01'
  }
];

/**
 * Inicializa los datos de ejemplo en el DataManager
 */
function initializeExampleData() {
  // Asignar IDs a los productos
  const productsWithIds = EXAMPLE_PRODUCTS.map((product, index) => ({
    id: `PRD-${String(index + 1).padStart(5, '0')}`,
    ...product,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));

  dataManager.initializeWithExampleData(productsWithIds);
}

// Ejecutar al cargar el script
if (typeof dataManager !== 'undefined') {
  initializeExampleData();
}
