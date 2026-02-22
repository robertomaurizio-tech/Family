import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Expense, Category } from '../types';
import { MONTHS } from '../constants';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MonthDetail: React.FC = () => {
  const { year, month } = useParams<{ year: string; month: string }>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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

  const monthExpenses = useMemo(() => {
    if (!year || !month) return [];
    const targetYear = parseInt(year);
    const targetMonth = parseInt(month);
    
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === targetYear && (d.getMonth() + 1) === targetMonth;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, year, month]);

  const stats = useMemo(() => {
    let total = 0;
    let regular = 0;
    let extra = 0;
    let vacation = 0;
    const catMap = new Map<string, number>();

    monthExpenses.forEach(e => {
      const amt = Number(e.amount);
      total += amt;
      
      if (e.vacationName) vacation += amt;
      else if (e.isExtra) extra += amt;
      else regular += amt;

      if (!e.vacationName) {
        catMap.set(e.categoryId, (catMap.get(e.categoryId) || 0) + amt);
      }
    });

    const categoryData = categories.map(cat => ({
      name: cat.name,
      value: catMap.get(cat.id) || 0,
      color: cat.color
    })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

    return { total, regular, extra, vacation, categoryData };
  }, [monthExpenses, categories]);

  if (loading) return <div className="text-center py-20 animate-pulse font-medium text-slate-500">Caricamento dettagli...</div>;

  if (!year || !month) return <div>Parametri mancanti</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all">
          ←
        </Link>
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
            {MONTHS[parseInt(month) - 1]} {year}
          </h2>
          <p className="text-slate-500 font-medium">Dettaglio spese mensili</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Totale Speso</p>
          <p className="text-3xl font-black">€ {stats.total.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Ordinario</p>
          <p className="text-2xl font-black text-slate-800">€ {stats.regular.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Extra</p>
          <p className="text-2xl font-black text-red-500">€ {stats.extra.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Vacanze</p>
          <p className="text-2xl font-black text-emerald-500">€ {stats.vacation.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6">Ripartizione Categorie (Ordinario)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `€ ${value.toLocaleString('it-IT')}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense List */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6">Lista Movimenti</h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {monthExpenses.length === 0 ? (
              <p className="text-center text-slate-400 py-10">Nessuna spesa registrata.</p>
            ) : (
              monthExpenses.map(expense => {
                const cat = categories.find(c => c.id === expense.categoryId);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm" style={{ backgroundColor: `${cat?.color}20` }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat?.color }}></div>
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-sm">{expense.description || cat?.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          {new Date(expense.date).toLocaleDateString('it-IT')} • {cat?.name}
                          {expense.isExtra && <span className="ml-2 text-red-500 font-bold">EXTRA</span>}
                          {expense.vacationName && <span className="ml-2 text-emerald-500 font-bold">VACANZA</span>}
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-slate-800">€ {Number(expense.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthDetail;
