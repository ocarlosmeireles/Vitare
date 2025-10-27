
import React, { useState, useEffect, useMemo } from 'react';
import { getKits, addKit, updateKit, deleteKit, getInventory } from '../services/api';
import { Kit, InventoryItem } from '../types';
import { PlusCircle, Edit, Trash2, Layers, QrCode } from './icons';
import QrCodeModal from './QrCodeModal';

interface KitFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    kitToEdit: Kit | null;
    inventory: InventoryItem[];
}

const KitFormModal: React.FC<KitFormModalProps> = ({ isOpen, onClose, onSave, kitToEdit, inventory }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (kitToEdit) {
            setName(kitToEdit.name);
            setPrice(kitToEdit.price);
            setSelectedItems(new Set(kitToEdit.itemIds));
        } else {
            setName('');
            setPrice(0);
            setSelectedItems(new Set());
        }
    }, [kitToEdit, isOpen]);

    const handleItemToggle = (itemId: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Fix: Explicitly type `itemIds` as `string[]` to resolve type inference issue where it was being inferred as `unknown[]`.
        const itemIds: string[] = Array.from(selectedItems);
        const items = itemIds.map(id => {
            const item = inventory.find(i => i.id === id);
            return { id: item!.id, name: item!.name };
        });

        const kitData = { name, price, itemIds, items };

        try {
            if (kitToEdit) {
                await updateKit(kitToEdit.id, kitData);
            } else {
                await addKit(kitData);
            }
            onSave();
        } catch (error) {
            console.error("Failed to save kit", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">{kitToEdit ? 'Editar Kit' : 'Novo Kit'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Nome do Kit</label>
                                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" required />
                            </div>
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-slate-600 mb-1">Preço do Kit (R$)</label>
                                <input type="number" id="price" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-slate-300 rounded-lg" required />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-600 mb-1">Itens do Inventário</label>
                             <div className="border rounded-lg p-2 h-64 overflow-y-auto">
                                {inventory.map(item => (
                                    <div key={item.id} className="flex items-center p-1 rounded hover:bg-slate-100">
                                        <input
                                            type="checkbox"
                                            id={`item-${item.id}`}
                                            checked={selectedItems.has(item.id)}
                                            onChange={() => handleItemToggle(item.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor={`item-${item.id}`} className="ml-3 text-sm text-slate-700">{item.name}</label>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                     <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400">
                            {isSubmitting ? 'Salvando...' : 'Salvar Kit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const Kits: React.FC = () => {
    const [kits, setKits] = useState<Kit[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [kitToEdit, setKitToEdit] = useState<Kit | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [kitForQr, setKitForQr] = useState<Kit | null>(null);

    const loadData = async () => {
        setLoading(true);
        const [kitsData, inventoryData] = await Promise.all([getKits(), getInventory()]);
        setKits(kitsData);
        setInventory(inventoryData);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = () => {
        setIsModalOpen(false);
        setKitToEdit(null);
        loadData();
    };

    const handleEdit = (kit: Kit) => {
        setKitToEdit(kit);
        setIsModalOpen(true);
    };

    const handleDelete = async (kitId: string) => {
        if (window.confirm("Tem certeza que deseja excluir este kit?")) {
            await deleteKit(kitId);
            loadData();
        }
    };

    const handleQrCode = (kit: Kit) => {
        setKitForQr(kit);
        setIsQrModalOpen(true);
    };
    
    if(loading) return <div className="text-center p-8">Carregando kits...</div>;

    return (
        <>
            {isQrModalOpen && kitForQr && (
                <QrCodeModal
                    data={{ type: 'kit', id: kitForQr.id }}
                    name={kitForQr.name}
                    onClose={() => setIsQrModalOpen(false)}
                />
            )}
            <KitFormModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setKitToEdit(null); }}
                onSave={handleSave}
                kitToEdit={kitToEdit}
                inventory={inventory}
            />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Kits Temáticos</h2>
                    <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 flex items-center">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Criar Kit
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kits.map(kit => (
                        <div key={kit.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between group">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-slate-800">{kit.name}</h3>
                                    <p className="text-lg font-bold text-indigo-600">{kit.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                </div>
                                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                                    {kit.items.slice(0, 5).map(item => (
                                        <li key={item.id} className="flex items-center">
                                            <Layers className="w-3 h-3 mr-2 text-slate-400"/>
                                            {item.name}
                                        </li>
                                    ))}
                                    {kit.items.length > 5 && <li className="text-xs text-slate-500">...e mais {kit.items.length - 5} itens.</li>}
                                </ul>
                            </div>
                            <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleQrCode(kit)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full"><QrCode className="w-4 h-4"/></button>
                                <button onClick={() => handleEdit(kit)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => handleDelete(kit.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </>
    );
};

export default Kits;