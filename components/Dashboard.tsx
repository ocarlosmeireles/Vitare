
import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/api';
import { Package, PackageCheck, CalendarClock, DollarSign, ArrowUp, ArrowDown, Banknote } from './icons';

interface Stats {
  totalItems: number;
  rentedItems: number;
  upcomingEvents: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyNetProfit: number;
  monthlyRentalCounts: number[];
  popularItems: { name: string; count: number }[];
}

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

const BarChart: React.FC<{ data: number[]; labels: string[] }> = ({ data, labels }) => {
    const maxVal = Math.max(...data, 1);
    return (
        <div className="flex justify-around items-end h-full px-4 pt-4">
            {data.map((value, index) => (
                <div key={index} className="flex flex-col items-center w-1/6">
                    <div
                        className="w-full bg-indigo-300 hover:bg-indigo-400 rounded-t-md transition-all duration-300"
                        style={{ height: `${(value / maxVal) * 100}%` }}
                        title={`${value} aluguéis`}
                    ></div>
                    <span className="text-xs text-slate-500 mt-2 font-medium">{labels[index]}</span>
                </div>
            ))}
        </div>
    );
};

const PopularItemsChart: React.FC<{ data: { name: string; count: number }[] }> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="h-full flex items-center justify-center"><p className="text-slate-500">Não há dados de aluguel para exibir.</p></div>;
    }
    const maxCount = Math.max(...data.map(item => item.count), 1);
    return (
        <div className="space-y-4 h-full flex flex-col justify-center">
            {data.map(item => (
                <div key={item.name} className="flex items-center">
                    <span className="text-sm font-medium text-slate-600 w-2/5 truncate pr-2" title={item.name}>{item.name}</span>
                    <div className="w-3/5 bg-slate-200 rounded-full h-5">
                        <div
                            className="bg-green-400 h-5 rounded-full text-right pr-2 text-white text-xs flex items-center justify-end"
                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                        >
                           <span className="font-bold">{item.count}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};


const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-md animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-slate-200 h-12 w-12"></div>
              <div>
                <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-slate-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const monthLabels = [...Array(6)].map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
  });

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <StatCard 
                icon={<Package className="w-6 h-6 text-blue-800"/>} 
                title="Total de Itens" 
                value={stats?.totalItems ?? 0}
                color="bg-blue-100"
            />
            <StatCard 
                icon={<PackageCheck className="w-6 h-6 text-green-800"/>} 
                title="Itens Alugados" 
                value={stats?.rentedItems ?? 0}
                color="bg-green-100"
            />
            <StatCard 
                icon={<CalendarClock className="w-6 h-6 text-amber-800"/>} 
                title="Próximos Eventos" 
                value={stats?.upcomingEvents ?? 0}
                color="bg-amber-100"
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             <StatCard 
                icon={<ArrowUp className="w-6 h-6 text-green-800"/>} 
                title="Receita do Mês" 
                value={stats?.monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'}
                color="bg-green-100"
            />
             <StatCard 
                icon={<ArrowDown className="w-6 h-6 text-red-800"/>} 
                title="Despesas do Mês" 
                value={stats?.monthlyExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'}
                color="bg-red-100"
            />
             <StatCard 
                icon={<DollarSign className="w-6 h-6 text-indigo-800"/>} 
                title="Lucro Líquido (Mês)" 
                value={stats?.monthlyNetProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'}
                color="bg-indigo-100"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Aluguéis (Últimos 6 Meses)</h2>
                <div className="h-80 rounded-lg">
                    {stats && <BarChart data={stats.monthlyRentalCounts} labels={monthLabels} />}
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Itens Mais Populares</h2>
                <div className="h-80 rounded-lg">
                     {stats && <PopularItemsChart data={stats.popularItems} />}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
