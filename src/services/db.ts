import { Medicine, Sale, Vendor, AppSettings } from '../types';

// Initial Seed Data
const INITIAL_VENDORS: Vendor[] = [
  { id: 'v1', name: 'MediCorp Global', contact: '555-0101', email: 'orders@medicorp.com', rating: 4.8, deliveryDays: 2 },
  { id: 'v2', name: 'HealthPlus Distrib', contact: '555-0102', email: 'supply@healthplus.com', rating: 4.2, deliveryDays: 1 },
  { id: 'v3', name: 'BioChem Supplies', contact: '555-0103', email: 'sales@biochem.com', rating: 3.9, deliveryDays: 4 },
];

const INITIAL_MEDICINES: Medicine[] = [
  { id: 'm1', name: 'Paracetamol 500mg', category: 'Analgesic', stock: 150, threshold: 50, costPrice: 0.5, sellingPrice: 2.0, expiryDate: '2025-12-31', manufacturer: 'GSK', vendorId: 'v1' },
  { id: 'm2', name: 'Amoxicillin 250mg', category: 'Antibiotic', stock: 20, threshold: 30, costPrice: 3.0, sellingPrice: 8.5, expiryDate: '2024-06-15', manufacturer: 'Pfizer', vendorId: 'v2' },
  { id: 'm3', name: 'Ibuprofen 400mg', category: 'Pain Relief', stock: 85, threshold: 40, costPrice: 1.2, sellingPrice: 4.0, expiryDate: '2025-08-20', manufacturer: 'Abbott', vendorId: 'v1' },
  { id: 'm4', name: 'Cetirizine 10mg', category: 'Antihistamine', stock: 10, threshold: 25, costPrice: 0.8, sellingPrice: 3.5, expiryDate: '2024-11-01', manufacturer: 'Cipla', vendorId: 'v3' },
  { id: 'm5', name: 'Metformin 500mg', category: 'Diabetes', stock: 200, threshold: 60, costPrice: 1.5, sellingPrice: 5.0, expiryDate: '2026-01-10', manufacturer: 'Sun Pharma', vendorId: 'v2' },
];

const STORAGE_KEYS = {
  MEDICINES: 'pharmacy_medicines',
  SALES: 'pharmacy_sales',
  VENDORS: 'pharmacy_vendors',
  SETTINGS: 'pharmacy_settings',
};

// Helper to load data
const loadData = <T,>(key: string, defaultData: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(stored);
};

const saveData = <T,>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// API
export const db = {
  getMedicines: (): Medicine[] => loadData(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES),
  
  saveMedicines: (medicines: Medicine[]) => saveData(STORAGE_KEYS.MEDICINES, medicines),
  
  updateMedicineStock: (id: string, qtySold: number) => {
    const meds = db.getMedicines();
    const idx = meds.findIndex(m => m.id === id);
    if (idx !== -1) {
      meds[idx].stock = Math.max(0, meds[idx].stock - qtySold);
      saveData(STORAGE_KEYS.MEDICINES, meds);
    }
  },

  getVendors: (): Vendor[] => loadData(STORAGE_KEYS.VENDORS, INITIAL_VENDORS),

  getSales: (): Sale[] => loadData(STORAGE_KEYS.SALES, []),
  
  addSale: (sale: Sale) => {
    const sales = db.getSales();
    sales.push(sale);
    saveData(STORAGE_KEYS.SALES, sales);
    
    // Update stock
    sale.items.forEach(item => {
      db.updateMedicineStock(item.medicineId, item.quantity);
    });
  },

  getSettings: (): AppSettings => loadData(STORAGE_KEYS.SETTINGS, { currency: 'USD', locale: 'en-US', countryName: 'United States' }),
  saveSettings: (settings: AppSettings) => saveData(STORAGE_KEYS.SETTINGS, settings),

  // Helper for generating CSV
  exportSalesToCSV: (): string => {
    const sales = db.getSales();
    const headers = ['Sale ID', 'Date', 'Customer', 'Items Count', 'Total Amount', 'Total Profit'];
    const rows = sales.map(s => [
      s.id,
      new Date(s.date).toLocaleDateString(),
      s.customerName || 'Walk-in',
      s.items.length,
      s.totalAmount.toFixed(2),
      s.totalProfit.toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    return csvContent;
  }
};