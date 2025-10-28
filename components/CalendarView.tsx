import React, { useState, useEffect, useMemo } from 'react';
import { getRentals } from '../services/api';
import { Rental } from '../types';
import { ChevronLeft, ChevronRight, PackageIcon } from './icons';

const statusColors: { [key in Rental['status']]: { bg: string; text: string; border: string } } = {
  booked: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
  'picked-up': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  returned: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
  overdue: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
  // FIX: Added 'quote-requested' status to satisfy the Rental['status'] type.
  'quote-requested': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-500' },
};

const RentalDetailModal: React.FC<{ rental: Rental | null; onClose: () => void }> = ({ rental, onClose }) => {
    if (!rental) return null;

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">{rental.client.name}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Data do Evento</p>
                        <p className="text-lg text-slate-700">{formatDate(rental.eventDate)}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-slate-500">Período do Aluguel</p>
                        <p className="text-md text-slate-700">{formatDate(rental.pickupDate)} - {formatDate(rental.returnDate)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Itens Alugados</p>
                        <ul className="mt-1 space-y-2 max-h-48 overflow-y-auto">
                            {rental.items.map(item => (
                                <li key={item.id} className="flex items-center text-slate-600 bg-slate-50 p-2 rounded-md">
                                    <PackageIcon className="w-4 h-4 mr-3 text-indigo-500 flex-shrink-0" />
                                    <span>{item.name} (Qtd: {item.quantity})</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div className="flex justify-between items-center pt-2 border-t mt-2">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[rental.status].bg} ${statusColors[rental.status].text}`}>
                            {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                        </span>
                        <p className="text-xl font-bold text-indigo-600">{rental.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


const CalendarView: React.FC = () => {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

    useEffect(() => {
        getRentals().then(setRentals);
    }, []);

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const startingDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const rentalsByDate = useMemo(() => {
        const map = new Map<string, Rental[]>();
        rentals.forEach(rental => {
            const date = rental.eventDate;
            if (!map.has(date)) {
                map.set(date, []);
            }
            map.get(date)?.push(rental);
        });
        return map;
    }, [rentals]);
    
    const renderCalendarDays = () => {
        const days = [];
        // Padding for days before the start of the month
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="border-r border-b border-slate-200"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateString = date.toISOString().split('T')[0];
            const dayRentals = rentalsByDate.get(dateString) || [];
            const isToday = new Date().toISOString().split('T')[0] === dateString;

            days.push(
                <div key={day} className="border-r border-b border-slate-200 p-2 min-h-[9rem] flex flex-col relative">
                    <span className={`font-medium text-sm self-start ${isToday ? 'bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-slate-700'}`}>
                        {day}
                    </span>
                    <div className="flex-grow overflow-y-auto mt-1 space-y-1">
                        {dayRentals.map(rental => (
                             <button 
                                key={rental.id}
                                onClick={() => setSelectedRental(rental)}
                                className={`w-full text-left p-1 rounded-md text-xs font-semibold truncate transition-all hover:ring-2 hover:ring-offset-1 ${statusColors[rental.status].bg} ${statusColors[rental.status].text} border-l-4 ${statusColors[rental.status].border}`}
                            >
                                {rental.client.name}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-4">
            <RentalDetailModal rental={selectedRental} onClose={() => setSelectedRental(null)} />
            <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-xl font-bold text-slate-800">
                    {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                </h2>
                <div className="flex space-x-2">
                    <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-slate-100 text-slate-600">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-slate-100 text-slate-600">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 text-center font-semibold text-sm text-slate-500">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="py-2 border-b-2 border-slate-200">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr">
                {renderCalendarDays()}
            </div>
        </div>
    );
};

export default CalendarView;