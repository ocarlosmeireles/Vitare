
import React, { useState, useEffect, useMemo } from 'react';
import { getRentals, getExpenses, getRevenues, addExpense, addRevenue } from '../services/api';
import { Rental, Expense, Revenue, Transaction, PaymentMethod } from '../types';
import { DollarSign, ArrowUp, ArrowDown, ArrowRightLeft, PlusCircle } from './icons';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string }> = ({ icon, title, value, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const AddTransactionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    type: 'revenue' | 'expense';
}> = ({ isOpen, onClose, onSave, type }) => {
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setDescription('');
            setCategory('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setPaymentMethod('pix');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amount === '' || amount <= 0) return;
        setIsSubmitting(true);
        const transactionData = { description, category, amount, date, paymentMethod };
        try {
            if (type === 'revenue') {
                await addRevenue(transactionData as Omit<Revenue, 'id'>);
            } else {
                await addExpense(transactionData as Omit<Expense, 'id'>);
            }
            onSave();
        } catch (error) {
            console.error(`Failed to add ${type}`, error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!isOpen) return null;

    const title = type === 'revenue' ? 'Adicionar Nova Receita' : 'Adicionar Nova Despesa';
    const amountLabel = type === 'revenue' ? 'Valor Recebido' : 'Valor da Despesa';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">{title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Descrição</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Categoria</label>
                        <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Venda de item, Limpeza" className="w-full p-2 border border-slate-300 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">{amountLabel} (R$)</label>
                            <input type="number" step="0.01" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || '')} className="w-full p-2 border border-slate-300 rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Data</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Método de Pagamento/Recebimento</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full p-2 border border-slate-300 rounded-lg">
                            <option value="pix">PIX</option>
                            <option value="card">Cartão</option>
                            <option value="cash">Dinheiro</option>
                            <option value="bank_transfer">Transferência Bancária</option>
                            <option value="other">Outro</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400">
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Financial: React.FC = () => {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [revenues, setRevenues] = useState<Revenue[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'month' | '3months' | 'all'>('month');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'revenue' | 'expense'>('expense');

    const loadData = async () => {
        setLoading(true);
        const [rentalsData, expensesData, revenuesData] = await Promise.all([getRentals(), getExpenses(), getRevenues()]);
        setRentals(rentalsData);
        setExpenses(expensesData);
        setRevenues(revenuesData);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);
    
    const openModal = (type: 'revenue' | 'expense') => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        loadData(); // Reload all data to reflect changes
    };

    const { startDate, endDate } = useMemo(() => {
        const end = new Date();
        let start = new Date();
        if (dateRange === 'month') {
            start = new Date(end.getFullYear(), end.getMonth(), 1);
        } else if (dateRange === '3months') {
            start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
        } else {
            start = new Date(0); // The beginning of time
        }
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        return { startDate: start, endDate: end };
    }, [dateRange]);

    const filteredTransactions = useMemo<Transaction[]>(() => {
        const transactions: Transaction[] = [];

        // Process revenues from rental payments
        rentals.forEach(rental => {
            rental.paymentHistory.forEach(payment => {
                const paymentDate = new Date(payment.date);
                if (paymentDate >= startDate && paymentDate <= endDate) {
                    transactions.push({
                        type: 'revenue',
                        date: payment.date,
                        description: `Pgto. Aluguel: ${rental.client.name}`,
                        amount: payment.amount,
                        referenceId: rental.id + payment.id,
                        method: payment.method
                    });
                }
            });
        });
        
        // Process other revenues
        revenues.forEach(revenue => {
            const revenueDate = new Date(revenue.date);
            if (revenueDate >= startDate && revenueDate <= endDate) {
                transactions.push({
                    type: 'revenue',
                    date: revenue.date,
                    description: revenue.description,
                    amount: revenue.amount,
                    referenceId: revenue.id,
                    method: revenue.paymentMethod,
                });
            }
        });

        // Process expenses
        expenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            if (expenseDate >= startDate && expenseDate <= endDate) {
                transactions.push({
                    type: 'expense',
                    date: expense.date,
                    description: expense.description,
                    amount: expense.amount,
                    referenceId: expense.id,
                    method: expense.paymentMethod,
                });
            }
        });
        
        return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [rentals, expenses, revenues, startDate, endDate]);

    const summary = useMemo(() => {
        const totalRevenue = filteredTransactions
            .filter(t => t.type === 'revenue')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        return {
            revenue: totalRevenue,
            expenses: totalExpenses,
            netProfit: totalRevenue - totalExpenses,
        };
    }, [filteredTransactions]);
    
    const paymentMethodLabels: Record<string, string> = {
        pix: 'PIX',
        card: 'Cartão',
        cash: 'Dinheiro',
        bank_transfer: 'Transferência',
        payment_link: 'Link de Pagamento',
        other: 'Outro'
    };

    return (
        <>
            <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} type={modalType} />
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
                     <h2 className="text-xl font-semibold">Visão Financeira</h2>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setDateRange('month')} className={`px-3 py-1 text-sm rounded-full ${dateRange === 'month' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>Este Mês</button>
                        <button onClick={() => setDateRange('3months')} className={`px-3 py-1 text-sm rounded-full ${dateRange === '3months' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>3 Meses</button>
                        <button onClick={() => setDateRange('all')} className={`px-3 py-1 text-sm rounded-full ${dateRange === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>Tudo</button>
                     </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        icon={<ArrowUp className="w-6 h-6 text-green-800"/>} 
                        title="Receita Bruta" 
                        value={summary.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        color="bg-green-100"
                    />
                    <StatCard 
                        icon={<ArrowDown className="w-6 h-6 text-red-800"/>} 
                        title="Despesas Totais" 
                        value={summary.expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        color="bg-red-100"
                    />
                    <StatCard 
                        icon={<DollarSign className="w-6 h-6 text-indigo-800"/>} 
                        title="Lucro Líquido" 
                        value={summary.netProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        color="bg-indigo-100"
                    />
                </div>
                
                 <div className="bg-white p-6 rounded-xl shadow-md">
                     <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <h3 className="text-xl font-semibold flex items-center"><ArrowRightLeft className="w-5 h-5 mr-2"/> Extrato de Transações</h3>
                        <div className="flex items-center gap-4">
                            <button onClick={() => openModal('revenue')} className="flex items-center text-sm bg-green-100 text-green-700 font-semibold px-3 py-2 rounded-lg hover:bg-green-200">
                                <PlusCircle className="w-4 h-4 mr-1"/> Adicionar Receita
                            </button>
                            <button onClick={() => openModal('expense')} className="flex items-center text-sm bg-red-100 text-red-700 font-semibold px-3 py-2 rounded-lg hover:bg-red-200">
                                <PlusCircle className="w-4 h-4 mr-1"/> Adicionar Despesa
                            </button>
                        </div>
                     </div>
                     <div className="max-h-[50vh] overflow-y-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                                 <tr>
                                    <th scope="col" className="px-6 py-3">Data</th>
                                    <th scope="col" className="px-6 py-3">Descrição</th>
                                    <th scope="col" className="px-6 py-3">Método</th>
                                    <th scope="col" className="px-6 py-3 text-right">Valor</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white">
                                {loading ? (
                                    <tr><td colSpan={4} className="text-center p-4">Carregando...</td></tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center p-4">Nenhuma transação no período selecionado.</td></tr>
                                ) : (
                                    filteredTransactions.map((t, i) => (
                                        <tr key={`${t.referenceId}-${i}`} className="border-b hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                            <td className="px-6 py-4">{t.description}</td>
                                            <td className="px-6 py-4">{t.method ? paymentMethodLabels[t.method] : '-'}</td>
                                            <td className={`px-6 py-4 text-right font-medium ${t.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'revenue' ? '+' : '-'} {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                     </div>
                </div>
            </div>
        </>
    );
};

export default Financial;