
import { Category, Expense, DbConfig, ShoppingItem, ShoppingFrequency, SandroExpense, SandroSettlement, Vacation } from '../types';
import { getDbConfig } from '../config';
import { DEFAULT_CATEGORIES } from '../constants';

const getApiUrl = (endpoint: string) => {
  const config = getDbConfig();
  
  // Se l'utente ha configurato un apiUrl specifico, usa quello.
  // Altrimenti costruisce l'URL dinamico standard.
  if (config.apiUrl) {
    const base = config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
    return `${base}${endpoint}`;
  }

  const protocol = window.location.protocol;
  const host = window.location.hostname || 'localhost';
  return `${protocol}//${host}:3003/api${endpoint}`;
};

const getMysqlHeaders = (customConfig?: DbConfig) => {
  const config = customConfig || getDbConfig();
  return {
    'Content-Type': 'application/json',
    'X-Db-Host': config.host,
    'X-Db-User': config.user,
    'X-Db-Name': config.database,
    'X-Db-Port': config.port,
    'X-Db-Pass': config.password || '',
  };
};

export const api = {
  // Vacations
  getVacations: async (): Promise<Vacation[]> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_vacations');
      return data ? JSON.parse(data) : [];
    }
    const res = await fetch(getApiUrl('/vacations'), { headers: getMysqlHeaders() });
    if (!res.ok) throw new Error("Errore nel recupero delle vacanze");
    return res.json();
  },

  getOrCreateVacationByName: async (name: string): Promise<Vacation> => {
    const config = getDbConfig();
    const cleanName = name.trim();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_vacations');
      const vacs: Vacation[] = data ? JSON.parse(data) : [];
      let vac = vacs.find(v => v.name.toLowerCase() === cleanName.toLowerCase());
      if (!vac) {
        vac = { id: Math.random().toString(36).substring(2, 11), name: cleanName };
        vacs.push(vac);
        localStorage.setItem('ffh_ls_vacations', JSON.stringify(vacs));
      }
      return vac;
    }
    const res = await fetch(getApiUrl('/vacations/get-or-create'), {
      method: 'POST', 
      headers: getMysqlHeaders(), 
      body: JSON.stringify({ name: cleanName })
    });
    if (!res.ok) throw new Error("Errore creazione vacanza");
    return res.json();
  },

  // Expenses
  getExpenses: async (): Promise<Expense[]> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_expenses');
      const exps: Expense[] = data ? JSON.parse(data) : [];
      const vacsData = localStorage.getItem('ffh_ls_vacations');
      const vacs: Vacation[] = vacsData ? JSON.parse(vacsData) : [];
      
      return exps.map(e => ({
        ...e,
        vacationName: vacs.find(v => v.id === e.vacationId)?.name
      }));
    }
    const res = await fetch(getApiUrl('/expenses'), { headers: getMysqlHeaders() });
    if (!res.ok) throw new Error("Impossibile connettersi al database");
    return res.json();
  },

  saveExpense: async (expense: Expense): Promise<void> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_expenses');
      const exps: Expense[] = data ? JSON.parse(data) : [];
      const idx = exps.findIndex(e => e.id === expense.id);
      if (idx >= 0) exps[idx] = expense; else exps.push(expense);
      localStorage.setItem('ffh_ls_expenses', JSON.stringify(exps));
      return;
    }
    const res = await fetch(getApiUrl('/expenses'), {
      method: 'POST', 
      headers: getMysqlHeaders(), 
      body: JSON.stringify(expense)
    });
    if (!res.ok) throw new Error("Errore nel salvataggio della spesa");
  },

  deleteExpense: async (id: string): Promise<void> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_expenses');
      const exps: Expense[] = data ? JSON.parse(data) : [];
      localStorage.setItem('ffh_ls_expenses', JSON.stringify(exps.filter(e => e.id !== id)));
      return;
    }
    await fetch(getApiUrl(`/expenses/${id}`), { method: 'DELETE', headers: getMysqlHeaders() });
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_categories');
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    }
    const res = await fetch(getApiUrl('/categories'), { headers: getMysqlHeaders() });
    if (!res.ok) return DEFAULT_CATEGORIES;
    return res.json();
  },

  saveCategory: async (category: Category): Promise<void> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_categories');
      const cats: Category[] = data ? JSON.parse(data) : DEFAULT_CATEGORIES;
      const idx = cats.findIndex(c => c.id === category.id);
      if (idx >= 0) cats[idx] = category; else cats.push(category);
      localStorage.setItem('ffh_ls_categories', JSON.stringify(cats));
      return;
    }
    await fetch(getApiUrl('/categories'), {
      method: 'POST', 
      headers: getMysqlHeaders(), 
      body: JSON.stringify(category)
    });
  },

  deleteCategory: async (id: string): Promise<void> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_categories');
      const cats: Category[] = data ? JSON.parse(data) : DEFAULT_CATEGORIES;
      localStorage.setItem('ffh_ls_categories', JSON.stringify(cats.filter(c => c.id !== id)));
      return;
    }
    await fetch(getApiUrl(`/categories/${id}`), { method: 'DELETE', headers: getMysqlHeaders() });
  },

  getOrCreateCategoryByName: async (name: string): Promise<Category> => {
    const config = getDbConfig();
    const cleanName = name.trim();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_categories');
      const cats: Category[] = data ? JSON.parse(data) : DEFAULT_CATEGORIES;
      let cat = cats.find(c => c.name.toLowerCase() === cleanName.toLowerCase());
      if (!cat) {
        cat = { id: Math.random().toString(36).substring(2, 15), name: cleanName, color: '#6366f1' };
        cats.push(cat);
        localStorage.setItem('ffh_ls_categories', JSON.stringify(cats));
      }
      return cat;
    }
    const res = await fetch(getApiUrl('/categories/get-or-create'), {
      method: 'POST', 
      headers: getMysqlHeaders(), 
      body: JSON.stringify({ name: cleanName })
    });
    if (!res.ok) throw new Error("Errore creazione categoria");
    return res.json();
  },

  // Shopping List
  getShoppingList: async (): Promise<ShoppingItem[]> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_shopping');
      return data ? JSON.parse(data) : [];
    }
    const res = await fetch(getApiUrl('/shopping-list'), { headers: getMysqlHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  saveShoppingItem: async (item: ShoppingItem): Promise<void> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_shopping');
      const items: ShoppingItem[] = data ? JSON.parse(data) : [];
      const idx = items.findIndex(i => i.id === item.id);
      if (idx >= 0) items[idx] = item; else items.push(item);
      localStorage.setItem('ffh_ls_shopping', JSON.stringify(items));
      return;
    }
    await fetch(getApiUrl('/shopping-list'), {
      method: 'POST', 
      headers: getMysqlHeaders(), 
      body: JSON.stringify(item)
    });
  },

  deleteShoppingItem: async (id: string): Promise<void> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_shopping');
      const items: ShoppingItem[] = data ? JSON.parse(data) : [];
      localStorage.setItem('ffh_ls_shopping', JSON.stringify(items.filter(i => i.id !== id)));
      return;
    }
    await fetch(getApiUrl(`/shopping-list/${id}`), { method: 'DELETE', headers: getMysqlHeaders() });
  },

  getShoppingFrequency: async (): Promise<ShoppingFrequency[]> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_shopping_freq');
      return data ? JSON.parse(data) : [];
    }
    const res = await fetch(getApiUrl('/shopping-list/frequency'), { headers: getMysqlHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  incrementShoppingFrequency: async (name: string): Promise<void> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_shopping_freq');
      const freqs: ShoppingFrequency[] = data ? JSON.parse(data) : [];
      const idx = freqs.findIndex(f => f.name.toLowerCase() === name.toLowerCase());
      if (idx >= 0) freqs[idx].count++; else freqs.push({ name, count: 1 });
      localStorage.setItem('ffh_ls_shopping_freq', JSON.stringify(freqs));
      return;
    }
    await fetch(getApiUrl('/shopping-list/frequency'), {
      method: 'POST', 
      headers: getMysqlHeaders(), 
      body: JSON.stringify({ name })
    });
  },

  // Sandro Account
  getSandroExpenses: async (): Promise<SandroExpense[]> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_sandro_expenses');
      return data ? JSON.parse(data) : [];
    }
    const res = await fetch(getApiUrl('/sandro-expenses'), { headers: getMysqlHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  getSandroSettlements: async (): Promise<SandroSettlement[]> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_sandro_settlements');
      return data ? JSON.parse(data) : [];
    }
    const res = await fetch(getApiUrl('/sandro-settlements'), { headers: getMysqlHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  saveSandroExpense: async (expense: SandroExpense): Promise<void> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_sandro_expenses');
      const exps: SandroExpense[] = data ? JSON.parse(data) : [];
      const idx = exps.findIndex(e => e.id === expense.id);
      if (idx >= 0) exps[idx] = expense; else exps.push(expense);
      localStorage.setItem('ffh_ls_sandro_expenses', JSON.stringify(exps));
      return;
    }
    await fetch(getApiUrl('/sandro-expenses'), {
      method: 'POST', 
      headers: getMysqlHeaders(), 
      body: JSON.stringify(expense)
    });
  },

  deleteSandroExpense: async (id: string): Promise<void> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const data = localStorage.getItem('ffh_ls_sandro_expenses');
      const exps: SandroExpense[] = data ? JSON.parse(data) : [];
      localStorage.setItem('ffh_ls_sandro_expenses', JSON.stringify(exps.filter(e => e.id !== id)));
      return;
    }
    await fetch(getApiUrl(`/sandro-expenses/${id}`), { method: 'DELETE', headers: getMysqlHeaders() });
  },

  settleSandroAccount: async (): Promise<void> => {
    const config = getDbConfig();
    if (config.mode === 'localstorage') {
      const expsData = localStorage.getItem('ffh_ls_sandro_expenses');
      const exps: SandroExpense[] = expsData ? JSON.parse(expsData) : [];
      if (exps.length === 0) return;

      const total = exps.reduce((sum, e) => sum + e.amount, 0);
      const settlement: SandroSettlement = {
        id: Math.random().toString(36).substring(2, 11),
        amount: total,
        date: new Date().toISOString()
      };

      const settsData = localStorage.getItem('ffh_ls_sandro_settlements');
      const setts: SandroSettlement[] = settsData ? JSON.parse(settsData) : [];
      setts.unshift(settlement);
      if (setts.length > 5) setts.pop();

      localStorage.setItem('ffh_ls_sandro_settlements', JSON.stringify(setts));
      localStorage.setItem('ffh_ls_sandro_expenses', JSON.stringify([]));
      return;
    }
    await fetch(getApiUrl('/sandro-expenses/settle'), { method: 'POST', headers: getMysqlHeaders() });
  },

  // Connection Test
  testConnection: async (customConfig: DbConfig): Promise<{ success: boolean; message: string }> => {
    try {
      // In fase di test usiamo l'apiUrl fornito nel customConfig se presente
      let url = "";
      if (customConfig.apiUrl) {
          const base = customConfig.apiUrl.endsWith('/') ? customConfig.apiUrl.slice(0, -1) : customConfig.apiUrl;
          url = `${base}/test-connection`;
      } else {
          url = getApiUrl('/test-connection');
      }

      const res = await fetch(url, { 
        method: 'GET', 
        headers: getMysqlHeaders(customConfig),
        signal: AbortSignal.timeout(5000) 
      });
      const data = await res.json();
      return { success: data.success ?? true, message: data.message || "Connessione riuscita!" };
    } catch (err: any) {
      console.error("Connection Test Error:", err);
      return { success: false, message: "Impossibile contattare il server API all'indirizzo configurato." };
    }
  }
};
