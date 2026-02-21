
import React, { useState, useEffect } from 'react';
import { Expense, Category } from '../types';
import { api } from '../services/api';

interface Props {
  onSave: () => void;
  editExpense?: Expense | null;
}

const ExpenseForm: React.FC<Props> = ({ onSave, editExpense }) => {
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isExtra, setIsExtra] = useState<boolean>(false);
  const [vacationName, setVacationName] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const activeVacation = localStorage.getItem('ffh_active_vacation');

  useEffect(() => {
    const fetchCats = async () => {
      const data = await api.getCategories();
      setCategories(data);
    };
    fetchCats();

    if (editExpense) {
      setAmount(editExpense.amount.toString());
      setCategoryId(editExpense.categoryId);
      setDescription(editExpense.description);
      setDate(editExpense.date);
      setIsExtra(editExpense.isExtra);
      setVacationName(editExpense.vacationName || '');
    } else if (activeVacation) {
      setVacationName(activeVacation);
    }
  }, [editExpense, activeVacation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || isSaving) return;

    setIsSaving(true);
    try {
      const expense: Expense = {
        id: editExpense?.id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)),
        amount: parseFloat(amount),
        categoryId,
        description,
        date,
        isExtra,
        vacationName: vacationName.trim() || undefined
      };

      await api.saveExpense(expense);
      onSave();
      
      if (!editExpense) {
        setAmount('');
        setDescription('');
        setIsExtra(false);
      }
    } catch (err: any) {
      alert("Errore salvataggio: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">
          {editExpense ? '✏️ Modifica Spesa' : '💸 Nuova Registrazione'}
        </h3>
        {vacationName && (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-tighter">
            🌴 Vacanza: {vacationName}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Importo (€)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-xl"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Categoria</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
            required
          >
            <option value="">Seleziona...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
           <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Opzioni</label>
           <div className="flex items-center h-full gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isExtra}
                  onChange={(e) => setIsExtra(e.target.checked)}
                  className="w-6 h-6 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600">Extra</span>
              </label>
              
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xl">🌴</span>
                <input 
                  type="text"
                  placeholder="Nome vacanza..."
                  value={vacationName}
                  onChange={e => setVacationName(e.target.value)}
                  className="bg-transparent border-b border-slate-200 text-sm focus:border-emerald-500 outline-none w-full py-1"
                />
              </div>
           </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Note / Descrizione</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Cosa hai acquistato?"
        />
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-3xl transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
      >
        {isSaving ? 'Sincronizzazione...' : editExpense ? 'Aggiorna Database' : 'Registra Spesa'}
      </button>
    </form>
  );
};

export default ExpenseForm;
