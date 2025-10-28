import React from 'react';
import { Page } from '../types';
import { LayoutDashboard, Package, Calendar, Lightbulb, PartyPopper, Users, Layers, Banknote, Sparkles, Wrench, Truck, BarChart3, Settings } from './icons';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
    { id: 'rentals', label: 'Aluguéis', icon: <Calendar /> },
    { id: 'inventory', label: 'Estoque', icon: <Package /> },
    { id: 'kits', label: 'Kits', icon: <Layers /> },
    { id: 'clients', label: 'Clientes', icon: <Users /> },
    { id: 'logistics', label: 'Logística', icon: <Truck /> },
    { id: 'maintenance', label: 'Manutenção', icon: <Wrench /> },
    { id: 'calendar', label: 'Calendário', icon: <Calendar /> },
    { id: 'financial', label: 'Financeiro', icon: <Banknote /> },
    { id: 'reports', label: 'Relatórios', icon: <BarChart3 /> },
    { id: 'settings', label: 'Configurações', icon: <Settings /> },
    { id: 'ai-assistant', label: 'Assistente IA', icon: <Sparkles /> },
    { id: 'theme-generator', label: 'Gerador de Temas', icon: <Lightbulb /> },
  ];

  return (
    <nav className="bg-slate-800 text-white w-20 lg:w-64 p-4 flex flex-col justify-between transition-all duration-300">
      <div>
        <div className="flex items-center justify-center lg:justify-start mb-10 p-2">
            <PartyPopper className="h-10 w-10 text-indigo-400" />
            <span className="hidden lg:block text-2xl font-bold ml-3">Festa Fácil</span>
        </div>
        <ul>
          {navItems.map((item) => (
            <li key={item.id} className="mb-2">
              <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(item.id as Page);
                }}
                className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                  currentPage === item.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <div className="w-6 h-6">{item.icon}</div>
                <span className="hidden lg:block ml-4 font-medium">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="text-center text-xs text-slate-500 hidden lg:block">
        <p>&copy; 2024 Gestor de Festas</p>
      </div>
    </nav>
  );
};

export default Sidebar;
