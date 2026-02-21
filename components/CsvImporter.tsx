
import React, { useState } from 'react';
import { api } from '../services/api';
import { Expense } from '../types';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

const CsvImporter: React.FC<Props> = ({ onComplete, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const parseCsvLine = (text: string) => {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setLogs(['Inizio elaborazione file...']);
    
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      
      if (lines.length < 2) throw new Error("File CSV vuoto o non valido");

      const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
      const getIndex = (names: string[]) => {
        for (const name of names) {
          const idx = headers.indexOf(name);
          if (idx !== -1) return idx;
        }
        return -1;
      };
      
      const idx = {
        id: getIndex(['id', 'uuid']),
        date: getIndex(['data', 'date']),
        category: getIndex(['categoria', 'category']),
        amount: getIndex(['importo', 'amount']),
        note: getIndex(['note', 'descrizione', 'description']),
        extra: getIndex(['extra', 'is_extra']),
        vacation: getIndex(['vacanza', 'vacation', 'id_vacanza'])
      };

      let successCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (values.length < 3) continue;

        try {
          const categoryName = values[idx.category] || 'Altro';
          const category = await api.getOrCreateCategoryByName(categoryName);
          
          const amountStr = values[idx.amount]?.replace(',', '.') || '0';
          const amount = parseFloat(amountStr);
          const dateVal = values[idx.date];
          
          let formattedDate = dateVal;
          if (dateVal.includes('/')) {
            const parts = dateVal.split('/');
            if (parts[0].length === 4) formattedDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
            else formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }

          const expense: Expense = {
            id: values[idx.id] || (Math.random().toString(36).substring(2, 15)),
            amount,
            categoryId: category.id,
            description: values[idx.note] || '',
            date: formattedDate,
            isExtra: values[idx.extra] === '1' || values[idx.extra]?.toLowerCase() === 'true' || values[idx.extra]?.toLowerCase() === 'extra',
            vacationName: values[idx.vacation] || undefined
          };

          await api.saveExpense(expense);
          successCount++;
          setProgress(Math.round((i / (lines.length - 1)) * 100));
        } catch (err) {
          console.error(`Errore riga ${i}:`, err);
        }
      }

      setLogs(prev => [...prev, `Importazione completata: ${successCount} record inseriti.`]);
      setTimeout(() => onComplete(), 1500);
    } catch (err: any) {
      setLogs(prev => [...prev, `❌ Errore: ${err.message}`]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Importa Database CSV</h3>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-6 text-center">
          <div className="border-4 border-dashed border-slate-100 rounded-3xl p-10 hover:border-indigo-200 transition-all cursor-pointer relative bg-slate-50/50 group">
            <input 
              type="file" 
              accept=".csv" 
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="space-y-4">
              <div className="text-6xl group-hover:scale-110 transition-transform duration-300">📄</div>
              <p className="font-black text-slate-700 uppercase tracking-tighter">
                {file ? file.name : "Carica il file .CSV"}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Mappe riconosciute: data, categoria, importo, vacanza, extra.
              </p>
            </div>
          </div>

          {importing && (
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Elaborazione Database</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          <div className="bg-slate-900 rounded-2xl p-4 h-32 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1 text-left">
            {logs.map((log, i) => <div key={i}><span className="text-slate-500 mr-2">[{i}]</span>{log}</div>)}
            {logs.length === 0 && <div className="text-slate-500 italic">Pronto per l'importazione...</div>}
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Annulla
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1 px-4 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              Importa Ora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CsvImporter;
