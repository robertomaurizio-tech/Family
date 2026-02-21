
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { ShoppingItem, ShoppingFrequency } from '../types';

const ShoppingList: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [frequencies, setFrequencies] = useState<ShoppingFrequency[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shoppingData, freqData] = await Promise.all([
        api.getShoppingList(),
        api.getShoppingFrequency()
      ]);
      setItems(Array.isArray(shoppingData) ? shoppingData.sort((a, b) => a.orderIndex - b.orderIndex) : []);
      setFrequencies(Array.isArray(freqData) ? freqData : []);
    } catch (err) {
      console.error("Errore caricamento lista:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const suggestions = useMemo(() => {
    const currentItemNames = new Set(items.map(i => i.name.toLowerCase()));
    return frequencies
      .filter(f => !currentItemNames.has(f.name.toLowerCase()))
      .slice(0, 10)
      .map(f => f.name.charAt(0).toUpperCase() + f.name.slice(1));
  }, [frequencies, items]);

  const handleAdd = async (name: string) => {
    if (!name.trim()) return;
    const cleanName = name.trim();
    const newItem: ShoppingItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      name: cleanName,
      checked: false,
      orderIndex: items.length > 0 ? Math.max(...items.map(i => i.orderIndex)) + 1 : 0
    };
    
    setItems([...items, newItem]);
    setNewItemName('');
    
    try {
      await Promise.all([
        api.saveShoppingItem(newItem),
        api.incrementShoppingFrequency(cleanName)
      ]);
      const freshFreq = await api.getShoppingFrequency();
      setFrequencies(freshFreq);
    } catch (e) {
      console.error("Errore salvataggio articolo:", e);
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    const updated = { ...item, checked: !item.checked };
    setItems(items.map(i => i.id === item.id ? updated : i));
    await api.saveShoppingItem(updated);
  };

  const handleDelete = async (id: string) => {
    setItems(items.filter(i => i.id !== id));
    await api.deleteShoppingItem(id);
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    const updatedItems = newItems.map((item, i) => ({ ...item, orderIndex: i }));
    setItems(updatedItems);

    try {
      await Promise.all(updatedItems.map(item => api.saveShoppingItem(item)));
    } catch (e) {
      console.error("Errore riordinamento:", e);
    }
  };

  const clearChecked = async () => {
    const toDelete = items.filter(i => i.checked);
    if (toDelete.length === 0) return;

    // Aggiorna UI immediatamente
    setItems(items.filter(i => !i.checked));

    try {
      // Esegue le eliminazioni in parallelo per velocità
      await Promise.all(toDelete.map(item => api.deleteShoppingItem(item.id)));
    } catch (e) {
      console.error("Errore durante la pulizia degli articoli:", e);
      // Ricarica la lista in caso di errore per evitare disallineamento UI
      loadData();
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 animate-pulse font-medium">Sincronizzazione lista...</div>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">🛒 Lista della Spesa</h2>
          <p className="text-slate-500 text-sm">Gestisci i tuoi acquisti quotidiani.</p>
        </div>
        <button 
          onClick={clearChecked}
          className="text-xs font-black text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors py-2 px-3 hover:bg-red-50 rounded-lg"
        >
          Svuota Carrello
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
          <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span>✨</span> Suggeriti (Acquistati spesso)
          </h4>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((name, i) => (
              <button
                key={i}
                onClick={() => handleAdd(name)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full text-xs font-semibold transition-all border border-indigo-100/50 active:scale-90"
              >
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form 
        onSubmit={(e) => { e.preventDefault(); handleAdd(newItemName); }}
        className="relative"
      >
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Cosa manca in frigo?"
          className="w-full pl-6 pr-20 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
        >
          Aggiungi
        </button>
      </form>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-400 italic bg-white rounded-2xl border border-dashed border-slate-200">
            La lista è vuota.
          </div>
        ) : (
          items.map((item, index) => (
            <div 
              key={item.id}
              className={`flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl transition-all group hover:border-indigo-200 ${item.checked ? 'bg-slate-50/50 opacity-60' : ''}`}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleToggle(item)}
                className="w-6 h-6 rounded-lg text-indigo-600 border-slate-200 focus:ring-indigo-500 cursor-pointer"
              />
              
              <span className={`flex-1 font-semibold text-slate-700 ${item.checked ? 'line-through text-slate-400' : ''}`}>
                {item.name}
              </span>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/></svg>
                </button>
                <button 
                  onClick={() => moveItem(index, 'down')}
                  disabled={index === items.length - 1}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 bg-indigo-50/50 rounded-3xl text-center border border-indigo-100/50">
         <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">💡 Memoria di Sistema</p>
         <p className="text-xs text-indigo-700/70 font-medium">
           Più utilizzi la lista, più i suggerimenti diventeranno accurati in base alle tue necessità reali.
         </p>
      </div>
    </div>
  );
};

export default ShoppingList;
