/**
 * Utilidades y funciones helper para la aplicación
 */

/**
 * Formatea un número como moneda CLP
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formatea una fecha en formato local
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formatea una fecha y hora
 */
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calcula la distancia entre dos puntos en km usando la fórmula de Haversine
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Redondear a 2 decimales
}

/**
 * Calcula el costo de envío basado en la distancia
 * <5km: gratis
 * >=5km: $1000 por km adicional
 */
function calculateShippingCost(distanceKm) {
  if (distanceKm < 5) return 0;
  return Math.round((distanceKm - 5) * 1000);
}

/**
 * Valida un SKU
 */
function validateSKU(sku, excludeId = null) {
  if (!sku || sku.trim().length === 0) {
    return { valid: false, error: 'RANDOM no puede estar vacío' };
  }
  if (sku.trim().length < 3) {
    return { valid: false, error: 'RANDOM debe tener al menos 3 caracteres' };
  }
  if (!/^[A-Za-z0-9]+$/.test(sku.trim())) {
    return { valid: false, error: 'RANDOM solo puede contener letras y números' };
  }
  if (!dataManager.isSkuUnique(sku.trim(), excludeId)) {
    return { valid: false, error: 'Este RANDOM ya existe en el inventario' };
  }
  return { valid: true };
}

function validateCategory(category) {
  if (!category || category.trim().length === 0) {
    return { valid: false, error: 'SKU no puede estar vacío' };
  }
  if (category.trim().length < 3) {
    return { valid: false, error: 'SKU debe tener al menos 3 caracteres' };
  }
  if (!/^[A-Za-z0-9]+$/.test(category.trim())) {
    return { valid: false, error: 'SKU solo puede contener letras y números' };
  }
  return { valid: true };
}

/**
 * Valida un nombre de producto
 */
function validateName(name) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Nombre no puede estar vacío' };
  }
  if (name.trim().length < 3) {
    return { valid: false, error: 'Nombre debe tener al menos 3 caracteres' };
  }
  return { valid: true };
}

/**
 * Valida un precio
 */
function validatePrice(price) {
  const num = parseFloat(price);
  if (isNaN(num) || num < 0) {
    return { valid: false, error: 'Precio debe ser un número positivo' };
  }
  if (num === 0) {
    return { valid: false, error: 'Precio no puede ser 0' };
  }
  return { valid: true };
}

/**
 * Valida una cantidad de stock
 */
function validateStock(quantity) {
  const num = parseInt(quantity, 10);
  if (isNaN(num) || num < 0) {
    return { valid: false, error: 'Stock debe ser un número entero positivo' };
  }
  return { valid: true };
}

/**
 * Valida una categoría
 */
function validateCategory(category) {
  if (!category || category.trim().length === 0) {
    return { valid: false, error: 'Categoría no puede estar vacía' };
  }
  return { valid: true };
}

/**
 * Valida una ubicación de bodega
 */
function validateLocation(location) {
  if (!location || location.trim().length === 0) {
    return { valid: false, error: 'Ubicación no puede estar vacía' };
  }
  return { valid: true };
}

/**
 * Exporta datos a CSV
 */
function exportToCSV(data, filename = 'export.csv') {
  // Si es un array de objetos, crear CSV
  let csv = '';
  if (Array.isArray(data) && data.length > 0) {
    // Headers
    const headers = Object.keys(data[0]);
    csv = headers.join(',') + '\n';

    // Rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escapar comillas y comas en valores
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += values.join(',') + '\n';
    });
  }

  // Crear blob y descargar
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta datos a JSON
 */
function exportToJSON(data, filename = 'export.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToExcel(data, filename = 'inventario.xlsx') {
  if (!window.XLSX) {
    console.error('XLSX library no disponible');
    showNotification('No se pudo generar el archivo Excel', 'danger');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
  XLSX.writeFile(workbook, filename);
}

function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo el archivo'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Muestra una notificación temporal
 */
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  // Auto-remover después del tiempo especificado
  setTimeout(() => {
    notification.remove();
  }, duration);
}

/**
 * Debounce para búsqueda
 */
function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Copia texto al portapapeles
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('¡Copiado al portapapeles!', 'success', 2000);
  } catch (error) {
    showNotification('No se pudo copiar al portapapeles', 'danger');
    console.error('Error al copiar:', error);
  }
}

/**
 * Obtiene la ubicación del usuario
 */
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada en este navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}

/**
 * Sanitiza un string para evitar XSS
 */
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Obtiene el color de estado de stock
 */
function getStockStatusColor(stock, minStock) {
  if (stock <= minStock) return 'danger';
  if (stock <= minStock * 1.5) return 'warning';
  return 'success';
}

/**
 * Obtiene el badge de estado de stock
 */
function getStockStatusBadge(stock, minStock) {
  if (stock <= minStock) return 'Bajo Stock';
  if (stock <= minStock * 1.5) return 'Precaución';
  return 'Normal';
}

/**
 * Formatea un número con separadores de miles
 */
function formatNumber(num) {
  return new Intl.NumberFormat('es-CL').format(num);
}

/**
 * Valida un email básico
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Genera un color hexadecimal aleatorio
 */
function getRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Trunca un string a una longitud máxima
 */
function truncate(str, maxLength = 50) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Compara dos objetos (comparación superficial)
 */
function shallowEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
}
