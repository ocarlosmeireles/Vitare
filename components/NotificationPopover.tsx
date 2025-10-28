
import React from 'react';
import { Notification } from '../types';
import { TriangleAlert, DollarSign, PackageIcon } from './icons';

interface Props {
    notifications: Notification[];
    onClose: () => void;
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    switch (type) {
        case 'overdue_return':
            return <div className="bg-red-100 p-2 rounded-full"><TriangleAlert className="w-5 h-5 text-red-600" /></div>;
        case 'payment_due':
            return <div className="bg-yellow-100 p-2 rounded-full"><DollarSign className="w-5 h-5 text-yellow-600" /></div>;
        case 'low_stock':
            return <div className="bg-blue-100 p-2 rounded-full"><PackageIcon className="w-5 h-5 text-blue-600" /></div>;
        default:
            return null;
    }
};


const NotificationPopover: React.FC<Props> = ({ notifications, onClose }) => {
    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border z-30">
            <div className="p-4 border-b">
                <h3 className="font-semibold">Notificações</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="text-slate-500 text-center py-8 px-4">Nenhum alerta no momento.</p>
                ) : (
                    <ul className="divide-y">
                        {notifications.map(n => (
                            <li key={n.id} className="flex items-start gap-3 p-4 hover:bg-slate-50">
                                <NotificationIcon type={n.type} />
                                <p className="text-sm text-slate-700">{n.message}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default NotificationPopover;