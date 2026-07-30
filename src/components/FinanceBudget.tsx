import React, { useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { formatCurrency } from '../utils/formatters';
import { Plus, Trash2, Edit3, TrendingUp, Save } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { FixedBill } from '../types';

export const FinanceBudget: React.FC = () => {
  const { data, setData } = useAppData();
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [tempSalary, setTempSalary] = useState(data.salary?.toString() || '0');

  const [showNewBillForm, setShowNewBillForm] = useState(false);
  const [newBill, setNewBill] = useState<Partial<FixedBill>>({
    name: '',
    amount: 0,
    category: 'Moradia'
  });

  const handleSaveSalary = () => {
    const val = parseFloat(tempSalary);
    if (!isNaN(val)) {
      setData((prev) => ({ ...prev, salary: val }));
    }
    setIsEditingSalary(false);
  };

  const handleAddBill = () => {
    if (newBill.name && newBill.amount && newBill.amount > 0) {
      const bill: FixedBill = {
        id: `fb-${Date.now()}`,
        name: newBill.name,
        amount: Number(newBill.amount),
        category: newBill.category || 'Outros'
      };
      setData((prev) => ({
        ...prev,
        fixedBills: [...(prev.fixedBills || []), bill]
      }));
      setNewBill({ name: '', amount: 0, category: 'Moradia' });
      setShowNewBillForm(false);
    }
  };

  const handleDeleteBill = (id: string) => {
    setData((prev) => ({
      ...prev,
      fixedBills: (prev.fixedBills || []).filter((b) => b.id !== id)
    }));
  };

  // Calcula projeção para os próximos 6 meses
  const generateProjection = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonthIndex = new Date().getMonth();
    const salary = data.salary || 0;
    const totalFixedBills = (data.fixedBills || []).reduce((acc, bill) => acc + bill.amount, 0);
    const monthlyBalance = salary - totalFixedBills;

    const projection = [];
    for (let i = 0; i < 6; i++) {
      const targetMonthIndex = (currentMonthIndex + i) % 12;
      projection.push({
        name: months[targetMonthIndex],
        Receitas: salary,
        Despesas: totalFixedBills,
        Saldo: monthlyBalance
      });
    }
    return projection;
  };

  const projectionData = generateProjection();
  const totalFixedBills = (data.fixedBills || []).reduce((acc, bill) => acc + bill.amount, 0);
  const salary = data.salary || 0;
  const saldoPrevisto = salary - totalFixedBills;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Resumo Rápido */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 shadow-lg shadow-indigo-200/50 dark:shadow-none text-white flex flex-col gap-4">
        <div>
          <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">
            Meu Salário Mensal (Fixo)
          </p>
          {isEditingSalary ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={tempSalary}
                onChange={(e) => setTempSalary(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-xl px-3 py-1.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 w-32 font-bold"
                placeholder="Valor"
              />
              <button
                onClick={handleSaveSalary}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-3xl font-extrabold tracking-tight">
                {formatCurrency(salary, data.settings.currency)}
              </p>
              <button
                onClick={() => setIsEditingSalary(true)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <div>
            <p className="text-indigo-100 text-xs font-semibold mb-0.5">Total Contas Fixas</p>
            <p className="text-sm font-bold">{formatCurrency(totalFixedBills, data.settings.currency)}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-100 text-xs font-semibold mb-0.5">Saldo Previsto</p>
            <p className="text-sm font-bold">{formatCurrency(saldoPrevisto, data.settings.currency)}</p>
          </div>
        </div>
      </div>

      {/* Gráfico de Projeção */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Projeção (6 Meses)</h3>
        </div>
        <div className="h-56 -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} width={45} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                formatter={(value: number) => formatCurrency(value, data.settings.currency)}
              />
              <Area type="monotone" dataKey="Saldo" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSaldo)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-[11px] text-slate-500 mt-2 font-medium">Baseado no salário e contas fixas atuais.</p>
      </div>

      {/* Lista de Contas Fixas */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Contas Fixas</h3>
          <button
            onClick={() => setShowNewBillForm(!showNewBillForm)}
            className="p-1.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showNewBillForm && (
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-700">
            <input
              type="text"
              placeholder="Nome da Conta"
              value={newBill.name}
              onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
              className="w-full text-sm p-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Valor"
                value={newBill.amount || ''}
                onChange={(e) => setNewBill({ ...newBill, amount: Number(e.target.value) })}
                className="w-1/2 text-sm p-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <select
                value={newBill.category}
                onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}
                className="w-1/2 text-sm p-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Moradia">Moradia</option>
                <option value="Educação">Educação</option>
                <option value="Assinaturas">Assinaturas</option>
                <option value="Saúde">Saúde</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <button
              onClick={handleAddBill}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Adicionar Conta
            </button>
          </div>
        )}

        <div className="space-y-3">
          {(!data.fixedBills || data.fixedBills.length === 0) ? (
            <p className="text-center text-xs text-slate-400 py-4 font-medium">
              Nenhuma conta fixa cadastrada.
            </p>
          ) : (
            data.fixedBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-colors group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{bill.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{bill.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-pink-600 dark:text-pink-400">
                    - {formatCurrency(bill.amount, data.settings.currency)}
                  </span>
                  <button
                    onClick={() => handleDeleteBill(bill.id)}
                    className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
