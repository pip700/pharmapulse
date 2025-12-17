
export interface Medicine {
  id: string;
  name: string;
  category: string;
  stock: number;
  threshold: number; // Low stock alert level
  costPrice: number;
  sellingPrice: number;
  expiryDate: string;
  manufacturer: string;
  vendorId: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  email: string;
  rating: number; // 1-5 reliability score
  deliveryDays: number; // Avg time to deliver
}

export interface CartItem extends Medicine {
  quantity: number;
}

export interface Sale {
  id: string;
  date: string; // ISO string
  items: {
    medicineId: string;
    medicineName: string;
    quantity: number;
    priceAtSale: number;
    costAtSale: number;
  }[];
  totalAmount: number;
  totalProfit: number;
  customerName?: string;
}

export interface OrderSuggestion {
  medicineId: string;
  medicineName: string;
  currentStock: number;
  suggestedQty: number;
  vendorId: string;
  vendorName: string;
  estimatedCost: number;
  reason: string; // e.g., "Below Threshold"
}

export interface AppSettings {
  currency: string;
  locale: string;
  countryName: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
  type: 'info' | 'warning' | 'success';
}

export type Page = 'dashboard' | 'inventory' | 'billing' | 'analytics' | 'orders';
