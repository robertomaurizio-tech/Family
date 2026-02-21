
export type StorageMode = 'localstorage' | 'mysql';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  description: string;
  date: string;
  isExtra: boolean;
  vacationId?: string;
  vacationName?: string;
}

export interface Vacation {
  id: string;
  name: string;
}

export interface SandroExpense {
  id: string;
  amount: number;
  description: string;
  date: string;
  isSettled: boolean;
}

export interface SandroSettlement {
  id: string;
  amount: number;
  date: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  orderIndex: number;
}

export interface ShoppingFrequency {
  name: string;
  count: number;
}

export interface DbConfig {
  mode: StorageMode;
  host: string;
  user: string;
  password?: string;
  database: string;
  port: string;
  apiUrl?: string; // Nuovo campo per l'URL personalizzato
}

export interface MonthlyStats {
  month: string;
  total: number;
  extra: number;
  regular: number;
}

export interface CategoryStats {
  name: string;
  value: number;
  color: string;
}
