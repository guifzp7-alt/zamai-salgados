export type Product = {
  id: string;
  name: string;
  category: "SALGADOS" | "BEBIDAS" | "DOCES" | "OUTROS";
  price: string | number;
  stockQuantity: number;
  minimumStock: number;
  internalCode: string;
  active: boolean;
  favorite: boolean;
};

export type Customer = {
  id: string;
  name: string;
  sector: string;
  phone?: string;
  notes?: string;
  totalOpen?: number;
  totalPaid?: number;
  purchases?: number;
  lastPurchase?: string;
};

export type SaleItemInput = {
  productId: string;
  quantity: number;
};

export type Dashboard = {
  revenue: number;
  salesCount: number;
  received: number;
  creditTotal: number;
  debtors: number;
  soldToday: { name: string; quantity: number }[];
  lowStock: Product[];
  averageTicket: number;
  chart: { label: string; vendas: number; faturamento: number }[];
};
