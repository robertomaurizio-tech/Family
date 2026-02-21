
import { Category, Expense } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

const DB_KEYS = {
  EXPENSES: 'ffh_expenses',
  CATEGORIES: 'ffh_categories'
};

export const db = {
  getCategories: (): Category[] => {
    const data = localStorage.getItem(DB_KEYS.CATEGORIES);
    if (!data) {
      localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(data);
  },

  saveCategory: (category: Category) => {
    const categories = db.getCategories();
    const index = categories.findIndex(c => c.id === category.id);
    if (index >= 0) {
      categories[index] = category;
    } else {
      categories.push(category);
    }
    localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  deleteCategory: (id: string) => {
    const categories = db.getCategories().filter(c => c.id !== id);
    localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getExpenses: (): Expense[] => {
    const data = localStorage.getItem(DB_KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  },

  saveExpense: (expense: Expense) => {
    const expenses = db.getExpenses();
    const index = expenses.findIndex(e => e.id === expense.id);
    if (index >= 0) {
      expenses[index] = expense;
    } else {
      expenses.push(expense);
    }
    localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify(expenses));
  },

  deleteExpense: (id: string) => {
    const expenses = db.getExpenses().filter(e => e.id !== id);
    localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify(expenses));
  }
};
