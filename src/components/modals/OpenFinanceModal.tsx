import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, ShieldCheck, CheckCircle2, Trash2, Loader2, ArrowRightLeft } from 'lucide-react';
import { useAppData } from '../../hooks/useAppData';
import { formatCurrency } from '../../utils/formatters';

interface OpenFinanceModalProps {
  onClose: () => void;
}

const banks = [
  { id: 'bradesco', name: 'Bradesco', color: 'bg-red-600', logoText: 'B' },
  { id: 'mercadopago', name: 'Mercado Pago', color: 'bg-blue-500', logoText: 'M' },
  { id: 'portoseguro', name: 'Porto Bank', color: 'bg-indigo-600', logoText: 'P' },
];

export const OpenFinanceModal: React.FC<OpenFinanceModalProps> = ({ onClose }) => {
  const { data, setData } = useAppData();
  const [loadingBankId, setLoadingBankId] = useState<string | null>(null);
  
  // Check if there are any mock transactions currently
  const mockTransactions = data.transactions.filter(t => t.source === 'open_finance_mock');
  const isConnected = mockTransactions.length > 0;

  const handleConnect = (bankId: string) => {
    setLoadingBankId(bankId);
    
    // Simulate API delay
    setTimeout(() => {
      const bank = banks.find(b => b.id === bankId);
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Create mock transactions
      const newMocks = [
        {
          id: `tx-mock-${Date.now()}-1`,
          description: `UBER *TRIP (${bank?.name})`,
          amount: 25.50,
          type: 'despesa' as const,
          category: 'Transporte',
          date: todayStr,
          source: 'open_finance_mock'
        },
        {
          id: `tx-mock-${Date.now()}-2`,
          description: `IFOOD *RESTAURANTE (${bank?.name})`,
          amount: 89.90,
          type: 'despesa' as const,
          category: 'Alimentação',
          date: yesterdayStr,
          source: 'open_finance_mock'
        },
        {
          id: `tx-mock-${Date.now()}-3`,
          description: `PIX RECEBIDO (${bank?.name})`,
          amount: 500.00,
          type: 'receita' as const,
          category: 'Renda',
          date: yesterdayStr,
          source: 'open_finance_mock'
        }
      ];

      setData(prev => ({
        ...prev,
        transactions: [...newMocks, ...prev.transactions]
      }));
      
      setLoadingBankId(null);
      onClose(); // Close after connecting
    }, 2000);
  };

  const handleDisconnect = () => {
    if (window.confirm('Isso irá remover todas as transações de teste que foram importadas. Continuar?')) {
      setData(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.source !== 'open_finance_mock')
      }));
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30">
            <ArrowRightLeft className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Conectar Banco</h2>
          <p className="text-indigo-100 text-sm font-medium">
            Sincronização Automática via Open Finance
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Security Badge */}
          <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl mb-6 border border-emerald-100 dark:border-emerald-900/50">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              Ambiente seguro. Apenas simulação para teste. Os dados não serão enviados a nenhum servidor real.
            </p>
          </div>

          {isConnected ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Banco Conectado!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Você importou {mockTransactions.length} transações de teste com sucesso. Explore o aplicativo para ver os resultados nos gráficos e saldos.
              </p>
              <button
                onClick={handleDisconnect}
                className="w-full py-3 px-4 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Desconectar e Limpar Dados
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Selecione uma instituição</h3>
              <div className="space-y-3">
                {banks.map(bank => (
                  <button
                    key={bank.id}
                    onClick={() => handleConnect(bank.id)}
                    disabled={loadingBankId !== null}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm ${bank.color}`}>
                        {bank.logoText}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{bank.name}</span>
                    </div>
                    {loadingBankId === bank.id ? (
                      <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                        <ArrowRightLeft className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
