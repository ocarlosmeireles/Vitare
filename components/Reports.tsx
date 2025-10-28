import React, { useState, useEffect } from 'react';
import { getReportsData } from '../services/api';
import { PackageIcon, Users, DollarSign } from './icons';

interface ItemReport {
    id: string;
    name: string;
    purchaseCost: number;
    totalRevenue: number;
    maintenanceCosts: number;
    profit: number;
    roi: number;
    rentalCount: number;
}

interface ClientReport {
    id: string;
    name: string;
    rentalCount: number;
    totalSpent: number;
}

const Reports: React.FC = () => {
    const [itemReports, setItemReports] = useState<ItemReport[]>([]);
    const [clientReports, setClientReports] = useState<ClientReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getReportsData();
                setItemReports(data.itemReports);
                setClientReports(data.clientReports);
            } catch (error) {
                console.error("Failed to fetch reports data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const getRoiColor = (roi: number) => {
        if (roi > 100) return 'text-green-600';
        if (roi > 0) return 'text-yellow-600';
        if (roi < 0) return 'text-red-600';
        return 'text-slate-600';
    };

    if (loading) {
        return <div className="text-center p-8">Gerando relatórios...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Item Profitability Report */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 flex items-center"><PackageIcon className="w-6 h-6 mr-2" /> Rentabilidade por Item</h2>
                <p className="text-sm text-slate-500 mb-4">Analise quais itens trazem o melhor retorno sobre o investimento (ROI). ROI = (Lucro / Custo de Compra) * 100.</p>
                <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3">Item</th>
                                <th scope="col" className="px-6 py-3 text-right">ROI</th>
                                <th scope="col" className="px-6 py-3 text-right">Lucro</th>
                                <th scope="col" className="px-6 py-3 text-right">Receita Total</th>
                                <th scope="col" className="px-6 py-3 text-right">Custo Compra</th>
                                <th scope="col" className="px-6 py-3 text-center">Nº Aluguéis</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemReports.map(item => (
                                <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{item.name}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${getRoiColor(item.roi)}`}>{item.purchaseCost > 0 ? `${item.roi.toFixed(1)}%` : 'N/A'}</td>
                                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.profit)}</td>
                                    <td className="px-6 py-4 text-right">{formatCurrency(item.totalRevenue)}</td>
                                    <td className="px-6 py-4 text-right">{formatCurrency(item.purchaseCost)}</td>
                                    <td className="px-6 py-4 text-center">{item.rentalCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Client Value Report */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 flex items-center"><Users className="w-6 h-6 mr-2" /> Valor por Cliente (LTV)</h2>
                <p className="text-sm text-slate-500 mb-4">Identifique seus clientes mais valiosos com base no total gasto.</p>
                 <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3">Cliente</th>
                                <th scope="col" className="px-6 py-3 text-right">Total Gasto</th>
                                <th scope="col" className="px-6 py-3 text-center">Nº Aluguéis</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientReports.map(client => (
                                <tr key={client.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{client.name}</td>
                                    <td className="px-6 py-4 text-right font-bold text-indigo-600">{formatCurrency(client.totalSpent)}</td>
                                    <td className="px-6 py-4 text-center">{client.rentalCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;