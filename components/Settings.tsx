
import React, { useState } from 'react';
import { DbConfig } from '../types';
import { getDbConfig, saveDbConfig } from '../config';
import { api } from '../services/api';

const Settings: React.FC = () => {
  const [config, setConfig] = useState<DbConfig>(getDbConfig());
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveDbConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await api.testConnection(config);
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: "Errore durante il test della connessione." });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Configurazione Sistema</h2>
        <p className="text-slate-500 mb-8">Personalizza il comportamento dell'app e la sorgente dei dati.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Toggle Modalità */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setConfig({...config, mode: 'localstorage'});
                setTestResult(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                config.mode === 'localstorage' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              📦 Local Storage
            </button>
            <button
              type="button"
              onClick={() => {
                setConfig({...config, mode: 'mysql'});
                setTestResult(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                config.mode === 'mysql' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🗄️ MySQL Remoto
            </button>
          </div>

          <div className="space-y-6">
             <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span>🌐</span> Indirizzo Backend (API)
                </h3>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Endpoint API Principale</label>
                <input
                  type="text"
                  value={config.apiUrl || ''}
                  onChange={e => setConfig({...config, apiUrl: e.target.value})}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                  placeholder="http://192.168.0.9:3003/api"
                />
                <p className="text-[10px] text-slate-400 mt-2 italic">
                  * Questo URL deve puntare al server Node.js che gestisce le richieste MySQL.
                </p>
             </div>

            {config.mode === 'mysql' && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Parametri Database</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Host DB</label>
                    <input
                      type="text"
                      value={config.host}
                      onChange={e => setConfig({...config, host: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Porta DB</label>
                    <input
                      type="text"
                      value={config.port}
                      onChange={e => setConfig({...config, port: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Database Name</label>
                    <input
                      type="text"
                      value={config.database}
                      onChange={e => setConfig({...config, database: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Username</label>
                    <input
                      type="text"
                      value={config.user}
                      onChange={e => setConfig({...config, user: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Password</label>
                    <input
                      type="password"
                      value={config.password || ''}
                      onChange={e => setConfig({...config, password: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isTesting ? 'Verifica...' : '🔍 Testa API'}
              </button>
              <button
                type="submit"
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                Applica Modifiche
              </button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-xl border text-sm font-medium animate-in slide-in-from-top-2 duration-300 ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                  : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{testResult.success ? '✅' : '❌'}</span>
                  <p>{testResult.message}</p>
                </div>
              </div>
            )}

            {saved && (
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold text-center border border-indigo-100 animate-in fade-in zoom-in-95">
                Configurazione salvata con successo!
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
