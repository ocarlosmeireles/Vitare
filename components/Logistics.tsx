
import React, { useState, useEffect, useMemo } from 'react';
import { getRentals } from '../services/api';
import { Rental } from '../types';
import { Truck } from './icons';

const Logistics: React.FC = () => {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const rentalsData = await getRentals();
            setRentals(rentalsData);
            setLoading(false);
        };
        loadData();
    }, []);

    const dailyTasks = useMemo(() => {
        const deliveries: Rental[] = [];
        const pickups: Rental[] = [];

        rentals.forEach(rental => {
            if (rental.deliveryService) {
                if (rental.pickupDate === selectedDate) {
                    deliveries.push(rental);
                }
                if (rental.returnDate === selectedDate) {
                    pickups.push(rental);
                }
            }
        });
        return { deliveries, pickups };
    }, [rentals, selectedDate]);

    const handleOptimizeRoute = () => {
        const addresses = new Set<string>();
        dailyTasks.deliveries.forEach(r => r.deliveryAddress && addresses.add(r.deliveryAddress));
        dailyTasks.pickups.forEach(r => r.deliveryAddress && addresses.add(r.deliveryAddress));

        if (addresses.size === 0) {
            alert("Nenhum endereço para otimizar na data selecionada.");
            return;
        }

        const waypoints = Array.from(addresses).map(addr => encodeURIComponent(addr)).join('/');
        const googleMapsUrl = `https://www.google.com/maps/dir/${waypoints}`;
        
        window.open(googleMapsUrl, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-semibold">Planejamento de Rotas</h2>
                <div className="flex items-center gap-4">
                     <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="p-2 border border-slate-300 rounded-lg"
                    />
                    <button 
                        onClick={handleOptimizeRoute}
                        className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center"
                        disabled={dailyTasks.deliveries.length === 0 && dailyTasks.pickups.length === 0}
                    >
                        <Truck className="w-5 h-5 mr-2" />
                        Otimizar Rota do Dia
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deliveries Column */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-slate-700">Entregas ({dailyTasks.deliveries.length})</h3>
                    {loading ? <p>Carregando...</p> : dailyTasks.deliveries.length === 0 ? (
                        <p className="text-slate-500">Nenhuma entrega para esta data.</p>
                    ) : (
                        <ul className="space-y-3">
                            {dailyTasks.deliveries.map(rental => (
                                <li key={rental.id} className="p-3 bg-slate-50 rounded-lg border-l-4 border-blue-500">
                                    <p className="font-semibold text-slate-800">{rental.client.name}</p>
                                    <p className="text-sm text-slate-600">{rental.deliveryAddress}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Pickups Column */}
                 <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4 text-slate-700">Retiradas ({dailyTasks.pickups.length})</h3>
                     {loading ? <p>Carregando...</p> : dailyTasks.pickups.length === 0 ? (
                        <p className="text-slate-500">Nenhuma retirada para esta data.</p>
                    ) : (
                        <ul className="space-y-3">
                            {dailyTasks.pickups.map(rental => (
                                <li key={rental.id} className="p-3 bg-slate-50 rounded-lg border-l-4 border-green-500">
                                    <p className="font-semibold text-slate-800">{rental.client.name}</p>
                                    <p className="text-sm text-slate-600">{rental.deliveryAddress}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Logistics;