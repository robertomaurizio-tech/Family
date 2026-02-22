import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Vehicle, VehicleMaintenance } from '../types';

const CarManager: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [maintenanceList, setMaintenanceList] = useState<VehicleMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);

  // Vehicle Form State
  const [vName, setVName] = useState('');
  const [vPlate, setVPlate] = useState('');
  const [vBrand, setVBrand] = useState('');
  const [vModel, setVModel] = useState('');
  const [vYear, setVYear] = useState<number | ''>('');
  const [vNotes, setVNotes] = useState('');

  // Maintenance Form State
  const [mType, setMType] = useState<'maintenance' | 'repair' | 'tax' | 'insurance' | 'other'>('maintenance');
  const [mDate, setMDate] = useState(new Date().toISOString().split('T')[0]);
  const [mCost, setMCost] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mKm, setMKm] = useState('');
  const [mNextDue, setMNextDue] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      loadMaintenance(selectedVehicle.id);
    } else {
      setMaintenanceList([]);
    }
  }, [selectedVehicle]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await api.getVehicles();
      setVehicles(data);
      if (data.length > 0 && !selectedVehicle) {
        setSelectedVehicle(data[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMaintenance = async (vehicleId: string) => {
    const data = await api.getVehicleMaintenance(vehicleId);
    setMaintenanceList(data);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const newVehicle: Vehicle = {
      id,
      name: vName,
      plate: vPlate,
      brand: vBrand,
      model: vModel,
      year: Number(vYear),
      notes: vNotes
    };
    await api.saveVehicle(newVehicle);
    setShowForm(false);
    resetVehicleForm();
    loadVehicles();
  };

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const newMaint: VehicleMaintenance = {
      id,
      vehicleId: selectedVehicle.id,
      type: mType,
      date: mDate,
      cost: Number(mCost),
      description: mDesc,
      km: mKm ? Number(mKm) : undefined,
      next_due_date: mNextDue || undefined
    };
    await api.saveVehicleMaintenance(newMaint);
    setShowMaintenanceForm(false);
    resetMaintenanceForm();
    loadMaintenance(selectedVehicle.id);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo veicolo e tutti i suoi dati?')) {
      await api.deleteVehicle(id);
      setSelectedVehicle(null);
      loadVehicles();
    }
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (confirm('Eliminare questo record?')) {
      await api.deleteVehicleMaintenance(id);
      if (selectedVehicle) loadMaintenance(selectedVehicle.id);
    }
  };

  const resetVehicleForm = () => {
    setVName(''); setVPlate(''); setVBrand(''); setVModel(''); setVYear(''); setVNotes('');
  };

  const resetMaintenanceForm = () => {
    setMType('maintenance'); setMDate(new Date().toISOString().split('T')[0]); setMCost(''); setMDesc(''); setMKm(''); setMNextDue('');
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'maintenance': return '🔧 Manutenzione';
      case 'repair': return '🛠️ Riparazione';
      case 'tax': return '📄 Bollo';
      case 'insurance': return '🛡️ Assicurazione';
      default: return '📝 Altro';
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'repair': return 'bg-red-100 text-red-800';
      case 'tax': return 'bg-yellow-100 text-yellow-800';
      case 'insurance': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Garage</h2>
          <p className="text-slate-500 font-medium">Gestione parco auto e manutenzioni.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95"
        >
          {showForm ? 'Chiudi' : '+ Nuovo Veicolo'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Aggiungi Veicolo</h3>
          <form onSubmit={handleSaveVehicle} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Nome (es. Auto Papà)" value={vName} onChange={e => setVName(e.target.value)} className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" required />
            <input placeholder="Targa" value={vPlate} onChange={e => setVPlate(e.target.value)} className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
            <input placeholder="Marca" value={vBrand} onChange={e => setVBrand(e.target.value)} className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
            <input placeholder="Modello" value={vModel} onChange={e => setVModel(e.target.value)} className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="number" placeholder="Anno" value={vYear} onChange={e => setVYear(Number(e.target.value))} className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
            <input placeholder="Note" value={vNotes} onChange={e => setVNotes(e.target.value)} className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
            <button type="submit" className="md:col-span-2 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">Salva Veicolo</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Vehicle List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {vehicles.map(v => (
            <div 
              key={v.id} 
              onClick={() => setSelectedVehicle(v)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedVehicle?.id === v.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-600'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{v.name}</h3>
                  <p className={`text-xs font-mono mt-1 ${selectedVehicle?.id === v.id ? 'text-indigo-200' : 'text-slate-400'}`}>{v.plate}</p>
                </div>
                {selectedVehicle?.id === v.id && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteVehicle(v.id); }} className="text-white/50 hover:text-white">🗑️</button>
                )}
              </div>
            </div>
          ))}
          {vehicles.length === 0 && !loading && (
            <div className="text-center py-10 text-slate-400 text-sm">Nessun veicolo registrato.</div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {selectedVehicle ? (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">{selectedVehicle.brand} {selectedVehicle.model}</h2>
                  <div className="flex gap-4 mt-2 text-sm text-slate-500">
                    <span>📅 {selectedVehicle.year}</span>
                    <span>📝 {selectedVehicle.notes || 'Nessuna nota'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
                >
                  + Aggiungi Intervento
                </button>
              </div>

              {showMaintenanceForm && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-in fade-in">
                  <h4 className="font-bold text-slate-700 mb-4">Nuova Registrazione</h4>
                  <form onSubmit={handleSaveMaintenance} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={mType} onChange={(e: any) => setMType(e.target.value)} className="p-3 bg-white rounded-xl border border-slate-200 outline-none">
                      <option value="maintenance">Manutenzione Ordinaria</option>
                      <option value="repair">Riparazione</option>
                      <option value="tax">Bollo</option>
                      <option value="insurance">Assicurazione</option>
                      <option value="other">Altro</option>
                    </select>
                    <input type="date" value={mDate} onChange={e => setMDate(e.target.value)} className="p-3 bg-white rounded-xl border border-slate-200 outline-none" required />
                    <input type="number" placeholder="Costo €" value={mCost} onChange={e => setMCost(e.target.value)} className="p-3 bg-white rounded-xl border border-slate-200 outline-none" required />
                    <input type="number" placeholder="Km attuali" value={mKm} onChange={e => setMKm(e.target.value)} className="p-3 bg-white rounded-xl border border-slate-200 outline-none" />
                    <input placeholder="Descrizione intervento" value={mDesc} onChange={e => setMDesc(e.target.value)} className="p-3 bg-white rounded-xl border border-slate-200 outline-none md:col-span-2" />
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Prossima Scadenza (Opzionale)</label>
                      <input type="date" value={mNextDue} onChange={e => setMNextDue(e.target.value)} className="w-full mt-1 p-3 bg-white rounded-xl border border-slate-200 outline-none" />
                    </div>
                    <button type="submit" className="md:col-span-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all">Salva Registrazione</button>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                {maintenanceList.map(m => (
                  <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-300 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${getTypeColor(m.type)}`}>
                        {m.type === 'maintenance' ? '🔧' : m.type === 'repair' ? '🛠️' : m.type === 'tax' ? '📄' : m.type === 'insurance' ? '🛡️' : '📝'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getTypeColor(m.type)}`}>{getTypeLabel(m.type)}</span>
                          <span className="text-xs text-slate-400 font-bold">{new Date(m.date).toLocaleDateString('it-IT')}</span>
                        </div>
                        <p className="font-bold text-slate-700 mt-1">{m.description || 'Nessuna descrizione'}</p>
                        {m.km && <p className="text-xs text-slate-400 font-mono mt-0.5">Km: {m.km.toLocaleString()}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                      {m.next_due_date && (
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Scadenza</p>
                          <p className="text-xs font-bold text-indigo-600">{new Date(m.next_due_date).toLocaleDateString('it-IT')}</p>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-xl font-black text-slate-800">€ {m.cost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <button onClick={() => handleDeleteMaintenance(m.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
                    </div>
                  </div>
                ))}
                {maintenanceList.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <span className="text-4xl block mb-2">✨</span>
                    <p className="text-slate-400 font-medium">Nessuna manutenzione registrata per questo veicolo.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 font-medium">
              Seleziona un veicolo per vedere i dettagli
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarManager;
