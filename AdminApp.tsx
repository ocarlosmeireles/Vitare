import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Rentals from './components/Rentals';
import ThemeGenerator from './components/ThemeGenerator';
import CalendarView from './components/CalendarView';
import Clients from './components/Clients';
import Kits from './components/Kits';
import Financial from './components/Financial';
import AIAssistant from './components/AIAssistant';
import Maintenance from './components/Maintenance';
import Logistics from './components/Logistics';
import Reports from './components/Reports';
import Settings from './components/Settings';
import NotificationPopover from './components/NotificationPopover';
import { Page, Notification, Rental, InventoryItem } from './types';
import { getRentals, getInventory } from './services/api';
import { Package, LayoutDashboard, Calendar, Lightbulb, Users, Layers, Banknote, Sparkles, Wrench, Bell, Truck, BarChart3, Settings as SettingsIcon } from './components/icons';

const AdminApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Centralized data fetching for notifications
  useEffect(() => {
    const generateNotifications = async () => {
        const [rentals, inventory] = await Promise.all([getRentals(), getInventory()]);
        const newNotifications: Notification[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Overdue returns
        rentals.forEach(r => {
            const returnDate = new Date(r.returnDate);
            if (r.status !== 'returned' && returnDate < today) {
                newNotifications.push({
                    id: `overdue-${r.id}`,
                    type: 'overdue_return',
                    message: `Devolução de ${r.client.name} está atrasada.`,
                    referenceId: r.id,
                });
            }
        });

        // 2. Upcoming final payments
        rentals.forEach(r => {
            const balance = (r.totalValue - (r.discount || 0)) - r.paymentHistory.reduce((sum, p) => sum + p.amount, 0);
            const eventDate = new Date(r.eventDate);
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(today.getDate() + 7);
            if (balance > 0 && eventDate > today && eventDate <= sevenDaysFromNow) {
                newNotifications.push({
                    id: `payment-${r.id}`,
                    type: 'payment_due',
                    message: `Pagamento final de ${r.client.name} vence em breve.`,
                    referenceId: r.id,
                });
            }
        });
        
        // 3. Low stock
        inventory.forEach(i => {
            if (i.status === 'available' && i.lowStockThreshold && i.quantity <= i.lowStockThreshold) {
                 newNotifications.push({
                    id: `stock-${i.id}`,
                    type: 'low_stock',
                    message: `Estoque baixo para ${i.name} (Qtd: ${i.quantity})`,
                    referenceId: i.id,
                });
            }
        });

        setNotifications(newNotifications);
        setIsLoading(false);
    };
    generateNotifications();
  }, []);


  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'rentals':
        return <Rentals />;
      case 'clients':
        return <Clients />;
      case 'kits':
        return <Kits />;
      case 'calendar':
        return <CalendarView />;
      case 'financial':
        return <Financial />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'theme-generator':
        return <ThemeGenerator />;
      case 'maintenance':
        return <Maintenance />;
      case 'logistics':
        return <Logistics />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
        case 'dashboard':
            return { title: 'Dashboard', icon: <LayoutDashboard className="w-6 h-6 mr-2" /> };
        case 'inventory':
            return { title: 'Gerenciar Estoque', icon: <Package className="w-6 h-6 mr-2" /> };
        case 'rentals':
            return { title: 'Aluguéis e Eventos', icon: <Calendar className="w-6 h-6 mr-2" /> };
        case 'clients':
            return { title: 'Clientes', icon: <Users className="w-6 h-6 mr-2" /> };
        case 'kits':
            return { title: 'Kits Temáticos', icon: <Layers className="w-6 h-6 mr-2" /> };
        case 'calendar':
            return { title: 'Calendário de Eventos', icon: <Calendar className="w-6 h-6 mr-2" /> };
        case 'financial':
            return { title: 'Gestão Financeira', icon: <Banknote className="w-6 h-6 mr-2" /> };
        case 'reports':
            return { title: 'Relatórios e Insights', icon: <BarChart3 className="w-6 h-6 mr-2" /> };
        case 'settings':
            return { title: 'Configurações da Empresa', icon: <SettingsIcon className="w-6 h-6 mr-2" /> };
        case 'ai-assistant':
            return { title: 'Assistente de Negócios IA', icon: <Sparkles className="w-6 h-6 mr-2" /> };
        case 'theme-generator':
            return { title: 'Gerador de Temas', icon: <Lightbulb className="w-6 h-6 mr-2" /> };
        case 'maintenance':
            return { title: 'Gestão de Manutenção', icon: <Wrench className="w-6 h-6 mr-2" /> };
        case 'logistics':
            return { title: 'Logística do Dia', icon: <Truck className="w-6 h-6 mr-2" /> };
        default:
            return { title: 'Dashboard', icon: <LayoutDashboard className="w-6 h-6 mr-2" /> };
    }
  };
  
  const { title, icon } = getPageTitle();

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-md p-4 z-20 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-700 flex items-center">{icon} {title}</h1>
          <div className="relative">
            <button onClick={() => setIsPopoverOpen(prev => !prev)} className="relative p-2 rounded-full hover:bg-slate-100">
                <Bell className="w-6 h-6 text-slate-600"/>
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center border-2 border-white">
                        {notifications.length}
                    </span>
                )}
            </button>
            {isPopoverOpen && (
                <NotificationPopover 
                    notifications={notifications}
                    onClose={() => setIsPopoverOpen(false)}
                />
            )}
          </div>
        </header>
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminApp;
