// types/index.ts
export interface Product {
  id: string;
  code: string;
  description: string;
  unit: string;
  unitPrice: number;
  tax: number;
  taxAmount: number;
  salePrice: number;
  supplier: string;
  stock: number;
  minStock?: number;
  category?: string;
}

export interface Purchase {
  id: string;
  date: Date;
  supplier: string;
  products: PurchaseItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface PurchaseItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  date: Date;
  customer?: string;
  products: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  total: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone?: string;
  email?: string;
}