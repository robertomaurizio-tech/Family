
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Expense, Category } from '../types';
import ExpenseForm from './ExpenseForm';
import CsvImporter from './CsvImporter';

const ITEMS_PER_PAGE = 15;

const ExpenseList: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [expData, catData] = await Promise.all([
        api.getExpenses(),
        api.getCategories()
      ]);
      const sorted = Array.isArray(expData) 
        ? expData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [];
      setExpenses(sorted);
      setCategories(catData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCategoryInfo = (id: string) => {
    return categories.find(c => c.id === id) || { name: 'Altro', color: '#64748b' };
  };

  const filteredExpenses = useMemo(() => {
    if (!searchTerm.trim()) return expenses;
    const term = searchTerm.toLowerCase();
    return expenses.filter(expense => {
      const category = getCategoryInfo(expense.categoryId);
      return (
        expense.description.toLowerCase().includes(term) ||
        category.name.toLowerCase().includes(term) ||
        (expense.vacationName && expense.vacationName.toLowerCase().includes(term))
      );
    });
  }, [expenses, searchTerm, categories]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredExpenses, currentPage]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Eliminare questa registrazione?')) {
      await api.deleteExpense(id);
      await loadData();
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Archivio Database</h2>
          <p className="text-slate-500 text-sm font-medium">Cronologia completa di tutte le transazioni.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setShowImport(true)} className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 text-xs">
            📥 Importa CSV
          </button>
          <button onClick={() => { setEditingExpense(null); setShowForm(!showForm); }} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 text-xs uppercase tracking-widest">
            {showForm ? 'Chiudi' : '➕ Aggiungi'}
          </button>
        </div>
      </div>

      {showForm && <div className="max-w-3xl mx-auto"><ExpenseForm onSave={() => { loadData(); setShowForm(false); }} editExpense={editingExpense} /></div>}
      {showImport && <CsvImporter onComplete={() => { setShowImport(false); loadData(); }} onClose={() => setShowImport(false)} />}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <input
            type="text"
            className="w-full max-w-md px-6 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
            placeholder="Cerca in descrizione, categorie o vacanze..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dettagli</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Importo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedExpenses.map((expense) => {
                const cat = getCategoryInfo(expense.categoryId);
                return (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase mb-1">{new Date(expense.date).toLocaleDateString('it-IT')}</span>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                          <span className="font-bold text-slate-800">{expense.description || 'Senza descrizione'}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-black text-white uppercase" style={{ backgroundColor: cat.color }}>{cat.name}</span>
                          {expense.isExtra && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-lg text-[9px] font-black uppercase">Extra</span>}
                          {expense.vacationName && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase">🌴 {expense.vacationName}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className={`text-lg font-black ${expense.vacationName ? 'text-emerald-600' : expense.isExtra ? 'text-red-500' : 'text-slate-800'}`}>
                        € {expense.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex justify-center gap-2">
                          <button onClick={() => handleEdit(expense)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                          </button>
                          <button onClick={() => handleDelete(expense.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center gap-4">
             <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs disabled:opacity-30">Precedente</button>
             <span className="flex items-center text-xs font-bold text-slate-500">{currentPage} / {totalPages}</span>
             <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs disabled:opacity-30">Successiva</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;
