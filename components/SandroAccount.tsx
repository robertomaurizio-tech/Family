
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { SandroExpense, SandroSettlement } from '../types';

const SandroAccount: React.FC = () => {
  const [expenses, setExpenses] = useState<SandroExpense[]>([]);
  const [settlements, setSettlements] = useState<SandroSettlement[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expData, settData] = await Promise.all([
        api.getSandroExpenses(),
        api.getSandroSettlements()
      ]);
      setExpenses(expData);
      setSettlements(settData);
    } catch (err) {
      console.error("Errore caricamento conto Sandro:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalDebt = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || saving) return;

    setSaving(true);
    try {
      const newExp: SandroExpense = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
        amount: parseFloat(amount),
        description: description.trim() || 'Spesa per Sandro',
        date,
        isSettled: false
      };
      await api.saveSandroExpense(newExp);
      setAmount('');
      setDescription('');
      await loadData();
    } catch (err) {
      alert("Errore salvataggio spesa Sandro");
    } finally {
      setSaving(false);
    }
  };

  const handleSettle = async () => {
    if (expenses.length === 0) return;
    if (window.confirm(`Confermi di voler saldare il conto di € ${totalDebt.toLocaleString('it-IT')}? Il saldo tornerà a zero.`)) {
      setLoading(true);
      try {
        await api.settleSandroAccount();
        await loadData();
      } catch (err) {
        alert("Errore durante il saldo del conto.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Eliminare questa voce dal conto di Sandro?')) {
      await api.deleteSandroExpense(id);
      await loadData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-amber-800 tracking-tight">👤 Conto Sandro</h2>
          <p className="text-amber-600/70 font-medium">Gestione separata delle anticipazioni per Sandro.</p>
        </div>
      </div>

      {/* Saldo Prominente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-3xl shadow-xl shadow-orange-100 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 text-white/10 text-9xl font-bold transition-transform group-hover:scale-110">👤</div>
          <h4 className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">Debito Attuale</h4>
          <p className="text-5xl font-black text-white">€ {totalDebt.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          <p className="mt-4 text-orange-50 text-sm font-medium opacity-80 italic">Somma totale che Sandro deve restituire.</p>
        </div>

        <button 
          onClick={handleSettle}
          disabled={expenses.length === 0 || loading}
          className="bg-white border-4 border-amber-500 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-amber-500 hover:text-white transition-all group disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
        >
          <span className="text-4xl group-hover:scale-125 transition-transform">💰</span>
          <span className="font-black uppercase tracking-tighter text-sm">Salda Tutto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form Inserimento */}
        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">➕</span> Nuova Anticipazione
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Importo (€)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-lg"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Descrizione</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Cosa hai pagato per lui?"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-amber-100 active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Registrazione...' : 'Segna nel Conto'}
            </button>
          </form>
        </div>

        {/* Lista Spese Correnti */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Pendenze Aperte</h3>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-tighter">
              {expenses.length} Voci
            </span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto flex-1">
            {loading && expenses.length === 0 ? (
              <div className="p-8 text-center animate-pulse text-slate-400 font-medium">Caricamento dati...</div>
            ) : expenses.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-4xl mb-3 opacity-30">✨</p>
                <p className="text-slate-400 italic text-sm font-medium">Tutto pagato!</p>
              </div>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-bold">{new Date(exp.date).toLocaleDateString('it-IT')}</span>
                    <span className="font-bold text-slate-700">{exp.description}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-amber-600">€ {Number(exp.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                    <button 
                      onClick={() => handleDelete(exp.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Storico Saldi - Nuova Tabella */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-amber-50/50 flex justify-between items-center">
          <h3 className="font-bold text-amber-900 text-sm">Ultimi 5 Saldi Ricevuti</h3>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Cronologia Storica</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data del Saldo</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Totale Ricevuto</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic text-sm">
                    Nessun saldo ancora registrato.
                  </td>
                </tr>
              ) : (
                settlements.map((sett) => (
                  <tr key={sett.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {new Date(sett.date).toLocaleString('it-IT', { 
                        day: '2-digit', month: '2-digit', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-black text-amber-600">
                      € {Number(sett.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                        ✅ Saldato
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
         <span className="text-2xl">💡</span>
         <div>
           <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">Gestione Saldi</p>
           <p className="text-sm text-amber-700 leading-relaxed">
             Quando clicchi su "Salda Tutto", il sistema calcola la somma di tutte le pendenze aperte, crea un record nello storico qui sopra e marca le spese come pagate. 
           </p>
         </div>
      </div>
    </div>
  );
};

export default SandroAccount;
