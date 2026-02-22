import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Expense, Category } from '../types';
import { MONTHS } from '../constants';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const MonthlyReport: React.FC = () => {
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

  const filteredExpenses = useMemo(() => {
    if (!year || !month) return [];
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month) && !e.vacationName;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, year, month]);

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const byCategory = filteredExpenses.reduce((acc, e) => {
      acc[e.categoryId] = (acc[e.categoryId] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(byCategory).map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat?.name || 'Sconosciuta',
        value: amount,
        color: cat?.color || '#cbd5e1'
      };
    }).sort((a, b) => b.value - a.value);

    return { total, chartData };
  }, [filteredExpenses, categories]);

  if (loading) return <div className="text-center py-20 animate-pulse font-medium text-slate-500">Caricamento Report...</div>;

  if (!year || !month) return <div className="text-center py-20 text-red-500">Parametri mancanti</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600">
          ← Torna alla Dashboard
        </Link>
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Report Mensile</h2>
          <p className="text-slate-500 font-medium text-lg capitalize">{MONTHS[parseInt(month) - 1]} {year}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Summary Card */}
        <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-xl shadow-indigo-100 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-white/10 text-9xl font-bold">€</div>
          <div>
            <h4 className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">Totale Spese</h4>
            <p className="text-5xl font-black">€ {stats.total.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-8">
            <p className="text-xs font-medium text-indigo-200">Media giornaliera</p>
            <p className="text-xl font-bold">€ {(stats.total / new Date(parseInt(year), parseInt(month), 0).getDate()).toLocaleString('it-IT', { maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Chart Card */}
        <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/2 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  formatter={(value: number) => `€ ${value.toLocaleString('it-IT')}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 space-y-3">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Top Categorie</h4>
            {stats.chartData.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="font-bold text-slate-700 text-sm">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-slate-400">{(item.value / stats.total * 100).toFixed(1)}%</span>
                  <span className="font-black text-slate-800 text-sm">€ {item.value.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed List */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Dettaglio Movimenti</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredExpenses.map(expense => {
            const category = categories.find(c => c.id === expense.categoryId);
            return (
              <div key={expense.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm" style={{ backgroundColor: category?.color + '20', color: category?.color }}>
                    {category?.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-sm">{expense.description || 'Spesa senza descrizione'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{category?.name}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(expense.date).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>
                </div>
                <span className="font-black text-slate-800">€ {Number(expense.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
              </div>
            );
          })}
          {filteredExpenses.length === 0 && (
            <div className="text-center py-12 text-slate-400 italic">Nessuna spesa registrata in questo mese.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;
