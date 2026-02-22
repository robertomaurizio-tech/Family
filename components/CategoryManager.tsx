
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Category } from '../types';

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError("Errore connessione storage. Controlla le impostazioni DB.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    
    setSaving(true);
    setError(null);
    try {
      const catId = editingId || generateId();
      const newCat: Category = {
        id: catId,
        name: name.trim(),
        color
      };
      await api.saveCategory(newCat);
      resetForm();
      await loadCategories();
    } catch (err: any) {
      console.error("Save category error:", err);
      setError(err.message || "Impossibile salvare la categoria.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setName(cat.name);
    setColor(cat.color);
    setEditingId(cat.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setName('');
    setColor('#6366f1');
    setEditingId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering edit
    if (id === '7') {
      alert("La categoria predefinita 'Altro' è necessaria per il sistema.");
      return;
    }

    const message = "Se elimini questa categoria, tutte le spese associate verranno spostate automaticamente in 'Altro'. Confermi?";
    
    if (window.confirm(message)) {
      setLoading(true);
      setError(null);
      try {
        await api.deleteCategory(id);
        if (editingId === id) resetForm();
        const updated = await api.getCategories();
        setCategories(updated);
      } catch (err: any) {
        setError("Errore durante la cancellazione.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestione Categorie</h2>
          <p className="text-slate-500 text-sm">Organizza le voci di spesa del tuo database familiare.</p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold border border-red-100 animate-pulse">
            ⚠️ {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-fit sticky top-4">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="text-indigo-600">{editingId ? '✏️' : '✨'}</span> {editingId ? 'Modifica Categoria' : 'Crea Nuova Etichetta'}
          </h3>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome Categoria</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                placeholder="Es. Palestra, Animali..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Colore Identificativo</label>
              <div className="flex gap-4 items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 p-0 border-0 cursor-pointer bg-transparent rounded-lg overflow-hidden"
                />
                <span className="text-sm font-mono text-slate-600 font-bold uppercase">{color}</span>
              </div>
            </div>
            <div className="flex gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-xl transition-all"
                >
                  Annulla
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Salvataggio...' : (editingId ? 'Aggiorna' : 'Aggiungi al Database')}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="text-indigo-600">📋</span> Categorie Attive
          </h3>
          {loading && categories.length === 0 ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-xl"></div>)}
            </div>
          ) : (
            <div className="grid gap-3">
              {categories.length === 0 && !loading && (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-2">📦</span>
                  <p className="text-slate-400 text-sm italic">Nessuna categoria configurata.</p>
                </div>
              )}
              {categories.map((cat) => (
                <div 
                  key={cat.id} 
                  onClick={() => handleEdit(cat)}
                  className={`flex items-center justify-between p-4 border rounded-xl group hover:bg-slate-50 transition-all cursor-pointer ${editingId === cat.id ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-4 h-4 rounded-full shadow-inner ring-2 ring-white" 
                      style={{ backgroundColor: cat.color }} 
                    />
                    <span className="font-bold text-slate-700">{cat.name}</span>
                  </div>
                  {cat.id !== '7' && (
                    <button 
                      onClick={(e) => handleDelete(cat.id, e)} 
                      className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                      title="Elimina categoria"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
