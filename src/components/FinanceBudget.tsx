import React, { useState, useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import { formatCurrency } from '../utils/formatters';
import { Plus, Trash2, Edit3, TrendingUp, Save, Calendar, Wallet } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { FixedBill } from '../types';

export const FinanceBudget: React.FC = () => {
  const { data, setData } = useAppData();

  // Salário do mês atual
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const currentSalary = data.monthlySalaries?.[selectedMonth] ?? (data.salary || 0);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [tempSalary, setTempSalary] = useState(currentSalary.toString());

  const currentExtra = data.monthlyExtras?.[selectedMonth] ?? 0;
  const [isEditingExtra, setIsEditingExtra] = useState(false);
  const [tempExtra, setTempExtra] = useState(currentExtra.toString());

  const categories = data.settings.categories || [
    'Água', 'Assinaturas', 'Dízimo', 'Energia', 'Internet',
    'IPTU', 'IPVA', 'Streaming', 'Telefonia', 'Parcela de Carro',
    'Parcela Terreno', 'Outros'
  ];
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showNewBillForm, setShowNewBillForm] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

  const [newBill, setNewBill] = useState<Partial<FixedBill>>({
    name: '',
    amount: 0,
    category: 'Moradia',
    dueDate: '',
    paymentSource: '',
    recurrence: 'mensal'
  });

  // Atualizar tempSalary quando mudar de mês
  const getStatusBadge = (status: string) => {
    if (status === 'pago') {
      return (
        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 px-1.5 py-0.5 rounded-md">
          PAGO
        </span>
      );
    }
    if (status === 'atrasado') {
      return (
        <span className="text-[9px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950/80 dark:text-rose-300 px-1.5 py-0.5 rounded-md">
          ATRASADO
        </span>
      );
    }
    return (
      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 px-1.5 py-0.5 rounded-md">
        PENDENTE
      </span>
    );
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM
    setSelectedMonth(val);
    const sal = data.monthlySalaries?.[val] ?? (data.salary || 0);
    const extr = data.monthlyExtras?.[val] ?? 0;
    setTempSalary(sal.toString());
    setTempExtra(extr.toString());
    setIsEditingSalary(false);
    setIsEditingExtra(false);
  };

  const handleSaveSalary = () => {
    const val = parseFloat(tempSalary);
    if (!isNaN(val)) {
      setData((prev) => ({
        ...prev,
        monthlySalaries: {
          ...(prev.monthlySalaries || {}),
          [selectedMonth]: val
        }
      }));
    }
    setIsEditingSalary(false);
  };

  const handleSaveExtra = () => {
    const val = parseFloat(tempExtra);
    if (!isNaN(val)) {
      setData((prev) => ({
        ...prev,
        monthlyExtras: {
          ...(prev.monthlyExtras || {}),
          [selectedMonth]: val
        }
      }));
    }
    setIsEditingExtra(false);
  };

  const handleEditBill = (bill: FixedBill) => {
    setEditingBillId(bill.id);
    setNewBill({
      name: bill.name,
      amount: bill.amount,
      category: bill.category,
      dueDate: bill.dueDate || '',
      paymentSource: bill.paymentSource || '',
      recurrence: bill.recurrence || 'mensal'
    });
    setShowNewBillForm(true);
    window.scrollTo({ top: document.getElementById('fixed-bills-section')?.offsetTop, behavior: 'smooth' });
  };

  const handleSaveBill = () => {
    if (newBill.name && newBill.amount && newBill.amount > 0) {
      const bill: FixedBill = {
        id: editingBillId || `fb-${Date.now()}`,
        name: newBill.name,
        amount: Number(newBill.amount),
        category: newBill.category || 'Outros',
        dueDate: newBill.dueDate || '',
        paymentSource: newBill.paymentSource,
        recurrence: newBill.recurrence || 'mensal'
      };

      setData((prev) => {
        const bills = prev.fixedBills || [];
        if (editingBillId) {
          return { ...prev, fixedBills: bills.map(b => b.id === editingBillId ? bill : b) };
        } else {
          return { ...prev, fixedBills: [...bills, bill] };
        }
      });

      setNewBill({ name: '', amount: 0, category: 'Moradia', dueDate: '', paymentSource: '', recurrence: 'mensal' });
      setShowNewBillForm(false);
      setEditingBillId(null);
      setIsAddingNewCategory(false);
      setNewCategoryName('');
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const currentCats = [...categories];
    if (!currentCats.includes(newCategoryName)) {
      currentCats.push(newCategoryName);
      setData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          categories: currentCats
        }
      }));
    }
    setNewBill({ ...newBill, category: newCategoryName });
    setIsAddingNewCategory(false);
    setNewCategoryName('');
  };

  const handleDeleteBill = (id: string) => {
    setData((prev) => ({
      ...prev,
      fixedBills: (prev.fixedBills || []).filter((b) => b.id !== id)
    }));
  };

  const handleCancelForm = () => {
    setShowNewBillForm(false);
    setEditingBillId(null);
    setNewBill({ name: '', amount: 0, category: 'Moradia', dueDate: '', paymentSource: '', recurrence: 'mensal' });
  };

  // Calcula projeção para os próximos 6 meses
  const generateProjection = () => {
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentD = new Date();

    // Obter array de salários ordenados por data para fallback
    const knownSalaries = Object.entries(data.monthlySalaries || {})
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(e => e[1]);
    const lastKnownSalary = knownSalaries.length > 0 ? knownSalaries[knownSalaries.length - 1] : (data.salary || 0);

    // We need to filter fixed bills for each target month in projection
    const allFixedBills = data.fixedBills || [];

    const projection = [];
    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(currentD.getFullYear(), currentD.getMonth() + i, 1);
      const targetYyyyMm = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

      // Salário do mês alvo, se não existir pega o último conhecido
      const monthSalary = data.monthlySalaries?.[targetYyyyMm] ?? lastKnownSalary;
      const monthExtra = data.monthlyExtras?.[targetYyyyMm] ?? 0;

      // Calculate total bills for this specific month
      const monthTotalBills = allFixedBills.reduce((acc, bill) => {
        const bRecurrence = bill.recurrence || 'mensal';
        const bMonthKey = bill.dueDate ? bill.dueDate.substring(0, 7) : '';
        if (!bMonthKey) return acc + bill.amount; // fallback if no date

        if (bRecurrence === 'unico') {
          return bMonthKey === targetYyyyMm ? acc + bill.amount : acc;
        } else {
          // mensal: só projeta se o mês de criação for <= mês alvo
          return bMonthKey <= targetYyyyMm ? acc + bill.amount : acc;
        }
      }, 0);

      const totalReceitas = monthSalary + monthExtra;
      const monthlyBalance = totalReceitas - monthTotalBills;

      projection.push({
        name: monthsNames[targetDate.getMonth()],
        Receitas: totalReceitas,
        Despesas: monthTotalBills,
        Saldo: monthlyBalance
      });
    }
    return projection;
  };

  const projectionData = useMemo(() => generateProjection(), [data.monthlySalaries, data.monthlyExtras, data.fixedBills, data.salary]);
  const filteredFixedBills = useMemo(() => {
    return (data.fixedBills || []).filter(bill => {
      const bRecurrence = bill.recurrence || 'mensal';
      const bMonthKey = bill.dueDate ? bill.dueDate.substring(0, 7) : '';
      if (!bMonthKey) return true;
      if (bRecurrence === 'unico') {
        return bMonthKey === selectedMonth;
      }
      return bMonthKey <= selectedMonth;
    });
  }, [data.fixedBills, selectedMonth]);

  const totalFixedBills = filteredFixedBills.reduce((acc, bill) => acc + bill.amount, 0);
  const totalReceitasAtuais = currentSalary + currentExtra;
  const saldoPrevisto = totalReceitasAtuais - totalFixedBills;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Resumo Rápido */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 shadow-lg shadow-indigo-200/50 dark:shadow-none text-white flex flex-col gap-4 relative overflow-hidden">
        {/* Decorativo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider">
              Salário Previsto
            </p>
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="bg-white/10 text-xs text-white border border-white/20 rounded-lg px-2 py-1 outline-none"
            />
          </div>

          {isEditingSalary ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={tempSalary}
                onChange={(e) => setTempSalary(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-xl px-3 py-1.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 w-28 font-bold"
                placeholder="Valor"
                autoFocus
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
              <p className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {formatCurrency(currentSalary, data.settings.currency)}
              </p>
              <button
                onClick={() => {
                  setTempSalary(currentSalary.toString());
                  setIsEditingSalary(true);
                }}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="mt-2">
            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider mb-1">
              Serviços Extras (Mês)
            </p>
            {isEditingExtra ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={tempExtra}
                  onChange={(e) => setTempExtra(e.target.value)}
                  className="bg-white/20 border border-white/30 rounded-xl px-3 py-1.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 w-28 font-bold"
                  placeholder="Valor Extra"
                  autoFocus
                />
                <button
                  onClick={handleSaveExtra}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold">
                  {formatCurrency(currentExtra, data.settings.currency)}
                </p>
                <button
                  onClick={() => {
                    setTempExtra(currentExtra.toString());
                    setIsEditingExtra(true);
                  }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/20 relative z-10">
          <div>
            <p className="text-indigo-100 text-[10px] font-semibold mb-0.5">RECEITAS TOTAIS</p>
            <p className="text-sm font-bold truncate">{formatCurrency(totalReceitasAtuais, data.settings.currency)}</p>
          </div>
          <div>
            <p className="text-indigo-100 text-[10px] font-semibold mb-0.5">TOTAL CONTAS FIXAS</p>
            <p className="text-sm font-bold truncate">{formatCurrency(totalFixedBills, data.settings.currency)}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 sm:text-right">
            <p className="text-indigo-100 text-[10px] font-semibold mb-0.5">SALDO NO MÊS</p>
            <p className="text-sm font-bold truncate">{formatCurrency(saldoPrevisto, data.settings.currency)}</p>
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
        <p className="text-center text-[11px] text-slate-500 mt-2 font-medium">Leva em conta salários futuros e total das contas fixas.</p>
      </div>

      {/* Lista de Contas Fixas */}
      <div id="fixed-bills-section" className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Contas Fixas</h3>
          {!showNewBillForm && (
            <button
              onClick={() => setShowNewBillForm(true)}
              className="p-1.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
        </div>

        {showNewBillForm && (
          <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {editingBillId ? 'Editar Conta' : 'Nova Conta'}
            </h4>

            <input
              type="text"
              placeholder="Nome da Conta"
              value={newBill.name}
              onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
              className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Valor</label>
                <input
                  type="number"
                  placeholder="Valor"
                  value={newBill.amount || ''}
                  onChange={(e) => setNewBill({ ...newBill, amount: Number(e.target.value) })}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Categoria</label>
                <select
                  value={isAddingNewCategory ? '__NEW__' : newBill.category}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsAddingNewCategory(true);
                      setNewBill({ ...newBill, category: '' });
                    } else {
                      setIsAddingNewCategory(false);
                      setNewBill({ ...newBill, category: e.target.value });
                    }
                  }}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__NEW__">➕ Nova Categoria...</option>
                </select>

                {isAddingNewCategory && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome da categoria"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 text-sm p-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Dia do Vencimento</label>
                <input
                  type="date"
                  value={newBill.dueDate || ''}
                  onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Débito</label>
                <select
                  value={newBill.paymentSource}
                  onChange={(e) => setNewBill({ ...newBill, paymentSource: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Não especificado</option>
                  <option value="Saldo em conta">Saldo em conta</option>
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1 mb-1 block">Recorrência</label>
                <select
                  value={newBill.recurrence || 'mensal'}
                  onChange={(e) => setNewBill({ ...newBill, recurrence: e.target.value as 'mensal' | 'unico' })}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="mensal">Fixo (Todos os meses)</option>
                  <option value="unico">Único (Apenas neste mês)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 ml-1">
                  Se "Único", a conta só aparecerá no mês da data de vencimento. Se "Fixo", aparecerá do mês de vencimento em diante.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCancelForm}
                className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBill}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Salvar Conta
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filteredFixedBills.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-4 font-medium">
              Nenhuma conta fixa cadastrada para este mês.
            </p>
          ) : (
            filteredFixedBills.map((bill) => {
              // Extrair o dia e mês se dueDate estiver preenchido (ex: "2026-08-05" -> "05/08")
              let formattedDate = bill.dueDate ? bill.dueDate : '';
              if (bill.dueDate && bill.dueDate.includes('-')) {
                const parts = bill.dueDate.split('-');
                if (parts.length === 3) {
                  formattedDate = `${parts[2]}/${parts[1]}`;
                }
              }

              const generatedBill = data.bills.find(b => b.fixedBillId === bill.id && b.dueDate.startsWith(selectedMonth));

              return (
                <div
                  key={bill.id}
                  className="flex flex-col p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{bill.name}</p>
                        {generatedBill && getStatusBadge(generatedBill.status)}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{bill.category}</p>
                    </div>
                    <span className="text-sm font-extrabold text-pink-600 dark:text-pink-400 whitespace-nowrap">
                      - {formatCurrency(bill.amount, data.settings.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-1">
                    <div className="flex items-center gap-3">
                      {formattedDate && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                          <Calendar className="w-3 h-3" /> {formattedDate}
                        </div>
                      )}
                      {bill.paymentSource && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                          <Wallet className="w-3 h-3" /> {bill.paymentSource}
                        </div>
                      )}
                    </div>

                    {/* Botões sempre visíveis mas discretos, sem depender de hover de grupo */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditBill(bill)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
                        className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
