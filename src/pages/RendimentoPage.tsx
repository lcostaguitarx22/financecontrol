/**
 * @file RendimentoPage.tsx
 * @description Tela Resumo de Rendimentos dinâmica.
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Trash2,
  Edit2,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { useAppData } from '../hooks/useAppData';
import { formatCurrency } from '../utils/formatters';
import { addRendimento, updateRendimento, deleteRendimento } from '../services/storage';

interface RendimentoPageProps {
  onBack: () => void;
}

export const RendimentoPage: React.FC<RendimentoPageProps> = ({ onBack }) => {
  const { data } = useAppData();
  const [dailyValue, setDailyValue] = useState('');
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [typeVal, setTypeVal] = useState('Outros');
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalAcumulado = data.totalAccumulatedYield || 0;

  // Gráfico de evolução real simplificado
  const evolutionData = data.rendimentos.length > 0 
    ? [...data.rendimentos].reverse().map(r => ({ d: r.date, v: r.amount }))
    : [{ d: 'Hoje', v: 0 }];

  const handleAddYield = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(dailyValue.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      alert('Por favor informe um valor válido para o rendimento.');
      return;
    }

    if (editingId) {
      updateRendimento(editingId, {
        amount: parsed,
        date: dateVal,
        type: typeVal,
      });
      setEditingId(null);
    } else {
      addRendimento({
        amount: parsed,
        date: dateVal,
        label: 'Registro',
        type: typeVal,
        variationPercentage: 0,
      });
    }

    setDailyValue('');
    setTypeVal('Outros');
  };

  const handleEdit = (r: any) => {
    setEditingId(r.id);
    setDailyValue(r.amount.toString());
    setDateVal(r.date);
    setTypeVal(r.type || 'Outros');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este rendimento?')) {
      deleteRendimento(id);
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          id="rendimento-back-btn"
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Resumo
        </h2>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white rounded-3xl p-6 shadow-xl shadow-indigo-200/50 dark:shadow-none border border-indigo-500/30">
        <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest">
          Montante Total Acumulado
        </p>
        <div className="text-3xl font-extrabold text-white my-3 tracking-tight">
          {formatCurrency(totalAcumulado, data.settings.currency)}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            <p className="text-[11px] text-indigo-100 font-medium">Rendimentos</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-extrabold text-white">
                 {data.rendimentos.length} Registros
              </span>
            </div>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            <p className="text-[11px] text-indigo-100 font-medium">Última Adição</p>
            <p className="text-sm font-extrabold text-white mt-1">
               {data.rendimentos.length > 0 ? formatCurrency(data.rendimentos[0].amount, data.settings.currency) : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-3 uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Evolução dos Registros
        </h3>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="d" hide />
              <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
              <Area
                type="monotone"
                dataKey="v"
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#yieldGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-indigo-100/80 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">
          {editingId ? 'Editar Rendimento' : 'Nova Entrada'}
        </h3>

        <form onSubmit={handleAddYield} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Valor
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="R$ 0,00"
              value={dailyValue}
              onChange={(e) => setDailyValue(e.target.value)}
              className="w-full px-4 py-3 bg-indigo-50/40 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Data
            </label>
            <input
              type="date"
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
              className="w-full px-4 py-3 bg-indigo-50/40 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tipo
            </label>
            <select
              value={typeVal}
              onChange={(e) => setTypeVal(e.target.value)}
              className="w-full px-4 py-3 bg-indigo-50/40 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Cofrinho">Cofrinho</option>
              <option value="Saldo em conta">Saldo em conta</option>
              <option value="Emergência">Emergência</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              id="add-rendimento-submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
            >
              {editingId ? 'Atualizar' : 'Adicionar'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setDailyValue('');
                  setTypeVal('Outros');
                }}
                className="w-1/3 py-3.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-extrabold rounded-2xl text-xs transition-all"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
          Histórico Recente
        </h3>

        <div className="space-y-3">
          {data.rendimentos.length === 0 ? (
             <p className="text-center text-slate-400 text-xs py-4">Nenhum registro.</p>
          ) : (
            data.rendimentos.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-xl">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {item.label} 
                      {item.type && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">{item.type}</span>}
                    </p>
                    <p className="text-[11px] text-slate-400">{item.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.amount, data.settings.currency)}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
