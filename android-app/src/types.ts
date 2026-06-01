export type Role = "OWNER" | "ADMIN" | "KASIR" | "GUDANG";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "QRIS" | "EWALLET" | "RECEIVABLE";
export type TransactionStatus = "SUCCESS" | "CANCELLED" | "REFUNDED" | "PENDING";

export type User = {
  id: string;
  username: string;
  name: string;
  role: Role;
  active: boolean;
};

export type Settings = {
  id: string;
  storeName: string;
  address: string;
  phone: string;
  receiptFooter: string;
  taxRate: number;
  invoicePrefix: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  unit: string;
  imageUrl: string | null;
  active: boolean;
  categoryId: string;
  category: Category;
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  points: number;
};

export type TransactionItem = {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  subtotal: number;
};

export type Transaction = {
  id: string;
  invoiceNumber: string;
  cashierName: string;
  customerName: string;
  customerId: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  createdAt: string;
  items: TransactionItem[];
};

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  source: string;
  note: string | null;
  createdAt: string;
};

export type Bootstrap = {
  user: User;
  settings: Settings;
  categories: Category[];
  products: Product[];
  customers: Customer[];
  users: User[];
  transactions: Transaction[];
  stockMovements: StockMovement[];
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};
