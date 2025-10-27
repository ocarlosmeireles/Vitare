import React, { useState, useEffect } from 'react';
import { getRentals } from '../services/api';
import { Rental } from '../types';
import { PlusCircle } from './icons';
import AddRentalModal from './AddRentalModal';
import { RentalDetailModal } from './RentalDetailModal';

const StatusBadge: React.FC<{ status: Rental['status'] }> = ({ status }) => {
    const statusMap: { [key in Rental['status']]: { text: string; color: string } } = {
        booked: { text: 'Agendado', color: 'bg-blue-100 text-blue-800' },
        'picked-up': { text: 'Retirado', color: 'bg-yellow-100 text-yellow-800' },
        returned: { text: 'Devolvido', color: 'bg-green-100 text-green-800' },
        overdue: { text: 'Atrasado', color: 'bg-red-100 text-red-800' },
        'quote-requested': { text: 'Orçamento', color: 'bg-purple-100 text-purple-800' },
    };
    const { text, color } = statusMap[status] || { text: 'Desconhecido', color: 'bg-slate-100 text-slate-800' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>{text}</span>;
};

const PaymentStatusBadge: React.FC<{ status: Rental['paymentStatus'] }> = ({ status }) => {
    const statusMap: { [key in Rental['paymentStatus']]: { text: string; color: string } } = {
        pending: { text: 'Pendente', color: 'bg-red-100 text-red-800' },
        partial: { text: 'Parcial', color: 'bg-yellow-100 text-yellow-800' },
        paid: { text: 'Pago', color: 'bg-green-100 text-green-800' },
    };
    const { text, color } = statusMap[status] || { text: 'Desconhecido', color: 'bg-slate-100 text-slate-800' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>{text}</span>;
};


const Rentals: React.FC = () => {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

    const loadRentals = async () => {
        setLoading(true);
        const items = await getRentals();
        const sortedRentals = items.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
        setRentals(sortedRentals);
        setLoading(false);
    };

    useEffect(() => {
        loadRentals();
    }, []);
    
    const handleRentalAdded = () => {
        setIsAddModalOpen(false);
        loadRentals();
    };

    const handleRentalUpdated = () => {
        setSelectedRental(null);
        loadRentals();
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    }

    return (
        <>
            <AddRentalModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onRentalAdded={handleRentalAdded}
            />

            <RentalDetailModal
                rental={selectedRental}
                onClose={() => setSelectedRental(null)}
                onUpdate={handleRentalUpdated}
            />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Aluguéis e Eventos</h2>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Novo Aluguel
                    </button>
                </div>
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Cliente</th>
                                <th scope="col" className="px-6 py-3">Data do Evento</th>
                                <th scope="col" className="px-6 py-3">Valor Total</th>
                                <th scope="col" className="px-6 py-3">Status Operacional</th>
                                <th scope="col" className="px-6 py-3">Status Pagamento</th>
                                <th scope="col" className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="bg-white border-b animate-pulse">
                                        {[...Array(6)].map((_, j) => (
                                         <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                rentals.map(rental => (
                                    <tr key={rental.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{rental.client.name}</td>
                                        <td className="px-6 py-4">{formatDate(rental.eventDate)}</td>
                                        <td className="px-6 py-4 font-medium">{(rental.totalValue - rental.discount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className="px-6 py-4"><StatusBadge status={rental.status} /></td>
                                        <td className="px-6 py-4"><PaymentStatusBadge status={rental.paymentStatus} /></td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => setSelectedRental(rental)} className="font-medium text-indigo-600 hover:underline">
                                                Gerenciar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default Rentals;