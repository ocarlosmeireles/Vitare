
import React, { useState, useEffect, useMemo } from 'react';
import { getInventory, updateInventoryItem, addExpense } from '../services/api';
import { InventoryItem } from '../types';
import { Wrench, CheckCircle, DollarSign, Edit } from './icons';

interface MaintenanceModalProps {
    item: InventoryItem | null;
    onClose: () => void;
    onSave: () => void;
}

const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ item, onClose, onSave }) => {
    const [notes, setNotes] = useState('');
    const [cost, setCost] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (item) {
            setNotes(item.maintenanceNotes || '');
            setCost(0);
        }
    }, [item]);

    const handleSave = async () => {
        if (!item) return;
        setIsSaving(true);
        try {
            // Update maintenance notes on the item
            await updateInventoryItem(item.id, { maintenanceNotes: notes });

            // If a cost was added, create a new expense
            if (cost > 0) {
                await addExpense({
                    description: `Custo de manutenção: ${item.name}`,
                    category: 'Manutenção',
                    date: new Date().toISOString().split('T')[0],
                    amount: cost,
                });
            }
            onSave();
        } catch (error) {
            console.error("Failed to save maintenance details", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!item) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Registrar Ação em "{item.name}"</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-600 mb-1">Descrição da Ação/Problema</label>
                        <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full p-2 border border-slate-300 rounded-lg"></textarea>
                    </div>
                    <div>
                        <label htmlFor="cost" className="block text-sm font-medium text-slate-600 mb-1">Custo do Reparo/Ação (R$)</label>
                        <input type="number" id="cost" value={cost || ''} onChange={e => setCost(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-slate-300 rounded-lg" />
                        <p className="text-xs text-slate-500 mt-1">Deixe 0 se não houver custo. Um valor maior que 0 criará uma nova despesa no financeiro.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving} className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400">
                        {isSaving ? 'Salvando...' : 'Salvar Registro'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Maintenance: React.FC = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    const loadInventory = async () => {
        setLoading(true);
        const items = await getInventory();
        setInventory(items);
        setLoading(false);
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const maintenanceItems = useMemo(() => {
        return inventory.filter(item => item.status === 'maintenance');
    }, [inventory]);

    const handleCompleteMaintenance = async (item: InventoryItem) => {
        if (window.confirm(`Marcar a manutenção de "${item.name}" como concluída? O item voltará a ficar "Disponível".`)) {
            try {
                await updateInventoryItem(item.id, { status: 'available', maintenanceNotes: '' });
                loadInventory();
            } catch (error) {
                console.error("Failed to complete maintenance", error);
            }
        }
    };
    
    const handleModalSave = () => {
        setSelectedItem(null);
        loadInventory();
    };


    if (loading) {
        return <div className="text-center p-8">Carregando itens...</div>;
    }

    return (
        <>
            <MaintenanceModal item={selectedItem} onClose={() => setSelectedItem(null)} onSave={handleModalSave} />

            <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold">Itens em Manutenção ({maintenanceItems.length})</h2>
                    <p className="text-slate-500 text-sm mt-1">Acompanhe, registre custos e finalize os reparos dos seus itens.</p>
                </div>

                {maintenanceItems.length === 0 ? (
                    <div className="text-center bg-white p-12 rounded-xl shadow-md">
                        <Wrench className="w-16 h-16 mx-auto text-slate-300" />
                        <h3 className="mt-4 text-xl font-semibold text-slate-700">Tudo em ordem!</h3>
                        <p className="text-slate-500 mt-2">Nenhum item em manutenção no momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {maintenanceItems.map(item => (
                            <div key={item.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between border-l-4 border-red-500">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
                                    <p className="text-sm text-slate-500 mb-2">{item.category}</p>
                                    <div className="mt-2 p-3 bg-red-50 rounded-md">
                                        <p className="text-sm font-semibold text-red-800">Última Anotação:</p>
                                        <p className="text-sm text-red-700 italic">"{item.maintenanceNotes || 'Nenhuma anotação registrada.'}"</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={() => setSelectedItem(item)} className="flex items-center text-sm bg-slate-200 text-slate-700 px-3 py-1 rounded-md hover:bg-slate-300">
                                        <Edit className="w-4 h-4 mr-1"/> Registrar Ação
                                    </button>
                                    <button onClick={() => handleCompleteMaintenance(item)} className="flex items-center text-sm bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200">
                                        <CheckCircle className="w-4 h-4 mr-1"/> Concluir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Maintenance;
