
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { Expense, Category } from '../types';
import { MONTHS } from '../constants';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVacation, setActiveVacation] = useState<string | null>(localStorage.getItem('ffh_active_vacation'));
  const [vacationNameInput, setVacationNameInput] = useState('');

  // Stato per il mese visualizzato nella sezione Performance Categorie
  const now = new Date();
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expData, catData] = await Promise.all([
          api.getExpenses(),
          api.getCategories()
        ]);
        setExpenses(Array.isArray(expData) ? expData : []);
        setCategories(Array.isArray(catData) ? catData : []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleVacation = () => {
    if (activeVacation) {
      localStorage.removeItem('ffh_active_vacation');
      setActiveVacation(null);
    } else if (vacationNameInput.trim()) {
      const name = vacationNameInput.trim();
      localStorage.setItem('ffh_active_vacation', name);
      setActiveVacation(name);
      setVacationNameInput('');
    }
  };

  const temporalInfo = useMemo(() => {
    const now = new Date();
    return {
      dayOfMonth: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      currentMonthKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    };
  }, []);

  const stats = useMemo(() => {
    const monthsMap = new Map<string, { regular: number, extra: number, vacation: number }>();
    let currentMonthOrdinary = 0;
    let currentMonthMTD = 0;
    let lastYearMonthMTD = 0;

    expenses.forEach(e => {
      const d = new Date(e.date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const amt = Number(e.amount);

      if (!monthsMap.has(key)) {
        monthsMap.set(key, { regular: 0, extra: 0, vacation: 0 });
      }
      
      const mStats = monthsMap.get(key)!;
      if (e.vacationName) {
        mStats.vacation += amt;
      } else if (e.isExtra) {
        mStats.extra += amt;
      } else {
        mStats.regular += amt;
      }

      if (!e.vacationName) {
        if (year === temporalInfo.year && month === temporalInfo.month) {
          currentMonthOrdinary += amt;
          if (day <= temporalInfo.dayOfMonth) {
            currentMonthMTD += amt;
          }
        }
        if (year === (temporalInfo.year - 1) && month === temporalInfo.month && day <= temporalInfo.dayOfMonth) {
          lastYearMonthMTD += amt;
        }
      }
    });

    const chartData = Array.from(monthsMap.entries())
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        return { 
          key,
          month: `${MONTHS[parseInt(month) - 1].substring(0, 3)} ${year}`, 
          ...data
        };
      })
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12);

    const mtdDiff = lastYearMonthMTD > 0 
      ? ((currentMonthMTD - lastYearMonthMTD) / lastYearMonthMTD) * 100 
      : 0;

    return { chartData, currentMonthOrdinary, currentMonthMTD, lastYearMonthMTD, mtdDiff };
  }, [expenses, temporalInfo]);

  // Performance Categorie basata sul mese selezionato (viewDate)
  const categoryPerformance = useMemo(() => {
    const targetYear = viewDate.getFullYear();
    const targetMonth = viewDate.getMonth() + 1;
    const currentMonthMap = new Map<string, number>();
    let monthTotal = 0;

    expenses.forEach(e => {
      const d = new Date(e.date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      
      if (year === targetYear && month === targetMonth && !e.vacationName) {
        const amt = Number(e.amount);
        currentMonthMap.set(e.categoryId, (currentMonthMap.get(e.categoryId) || 0) + amt);
        monthTotal += amt;
      }
    });

    return {
      total: monthTotal,
      data: categories.map(cat => {
        const current = currentMonthMap.get(cat.id) || 0;
        const percentage = monthTotal > 0 ? (current / monthTotal) * 100 : 0;
        return { ...cat, current, percentage };
      })
      .filter(c => c.current > 0)
      .sort((a, b) => b.current - a.current)
    };
  }, [expenses, categories, viewDate]);

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  if (loading) return <div className="text-center py-20 animate-pulse font-medium text-slate-500 text-lg">Inizializzazione Dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header & Vacation Mode Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Statistiche</h2>
          <p className="text-slate-500 font-medium">Andamento finanziario della famiglia.</p>
        </div>

        <div className={`p-4 rounded-3xl border transition-all flex items-center gap-4 ${activeVacation ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100 shadow-lg' : 'bg-white border-slate-200'}`}>
          {activeVacation ? (
            <>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">In Vacanza dal {temporalInfo.dayOfMonth}/{temporalInfo.month}</span>
                <span className="font-bold text-emerald-800 text-lg">🌴 {activeVacation}</span>
              </div>
              <button 
                onClick={toggleVacation}
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-xs"
              >
                Termina
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                placeholder="Destinazione (es. Mare 2024)" 
                value={vacationNameInput}
                onChange={e => setVacationNameInput(e.target.value)}
                className="p-2.5 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <button 
                onClick={toggleVacation}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all text-xs shadow-md active:scale-95"
              >
                Vai in Vacanza!
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-indigo-600 p-8 rounded-[2rem] shadow-xl shadow-indigo-100 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-white/10 text-9xl font-bold transition-transform group-hover:scale-110">€</div>
          <h4 className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Totale Ordinario Mese</h4>
          <p className="text-5xl font-black text-white">€ {stats.currentMonthOrdinary.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          <div className="mt-6 flex items-center gap-3 text-indigo-100 text-xs font-bold bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-md">
            <span>📅 {MONTHS[temporalInfo.month - 1]} {temporalInfo.year}</span>
            <span className="opacity-40">|</span>
            <span>{temporalInfo.dayOfMonth} Giorni</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
           <div>
              <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Confronto Anno Scorso (MTD)</h4>
              <p className="text-2xl font-black text-slate-800">€ {stats.currentMonthMTD.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-slate-400 font-medium">vs € {stats.lastYearMonthMTD.toLocaleString('it-IT', { maximumFractionDigits: 0 })} nel {temporalInfo.year - 1}</p>
           </div>
           
           <div className="mt-4">
              <div className={`inline-flex items-center px-3 py-1.5 rounded-xl font-bold text-sm ${stats.mtdDiff <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {stats.mtdDiff <= 0 ? '↓' : '↑'} {Math.abs(stats.mtdDiff).toFixed(1)}%
                <span className="text-[10px] ml-2 opacity-70">rispetto al {temporalInfo.year - 1}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Stesso intervallo: 1 - {temporalInfo.dayOfMonth} {MONTHS[temporalInfo.month - 1].substring(0,3)}</p>
           </div>
        </div>
      </div>

      {/* Charts & Categorical Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8 px-2">
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Andamento Mensile</h3>
              <p className="text-xs text-slate-400 font-bold">Analisi scomposizione costi ultimi 12 mesi</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span><span className="text-[10px] font-bold text-slate-400">REG</span></div>
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-[10px] font-bold text-slate-400">EXTRA</span></div>
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-[10px] font-bold text-slate-400">VAC</span></div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                />
                <Bar dataKey="regular" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} barSize={35} />
                <Bar dataKey="extra" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="vacation" stackId="a" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Categorie Card con Navigazione Mensile */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-6 px-2">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Performance Categorie</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => changeMonth(-1)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                  title="Mese Precedente"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <button 
                  onClick={() => changeMonth(1)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                  title="Mese Successivo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </p>
            {categoryPerformance.total > 0 && (
               <p className="text-[10px] text-slate-400 font-bold mt-1">Totale ordinario: € {categoryPerformance.total.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</p>
            )}
          </div>
          
          <div className="flex-1 space-y-6 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            {categoryPerformance.data.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-40">
                <span className="text-4xl mb-2">🏷️</span>
                <p className="text-xs font-bold uppercase">Nessuna spesa nel periodo</p>
                <button 
                  onClick={() => setViewDate(new Date(now.getFullYear(), now.getMonth(), 1))}
                  className="mt-4 text-[9px] font-black text-indigo-600 underline uppercase"
                >
                  Torna ad oggi
                </button>
              </div>
            ) : (
              categoryPerformance.data.map((cat, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-end mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">{cat.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">€ {cat.current.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000 ease-out rounded-full shadow-inner" 
                      style={{ 
                        backgroundColor: cat.color, 
                        width: `${cat.percentage}%`,
                        opacity: 0.8
                      }} 
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cat.percentage.toFixed(1)}% del mese</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <Link to="/categorie" className="mt-6 text-center text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors py-3 border-t border-slate-100">
            Gestisci Etichette →
          </Link>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
