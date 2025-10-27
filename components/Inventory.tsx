import React, { useState, useEffect, useMemo } from 'react';
import { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../services/api';
import { InventoryItem } from '../types';
import { PlusCircle, Edit, Trash2, Search, QrCode } from './icons';
import QrCodeModal from './QrCodeModal';

const StatusBadge: React.FC<{ status: InventoryItem['status'] }> = ({ status }) => {
    const statusMap = {
        available: { text: 'Disponível', color: 'bg-green-100 text-green-800' },
        rented: { text: 'Alugado', color: 'bg-amber-100 text-amber-800' },
        maintenance: { text: 'Manutenção', color: 'bg-red-100 text-red-800' },
    };
    const { text, color } = statusMap[status ?? 'available'];
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>{text}</span>;
};

const InventoryCard: React.FC<{ item: InventoryItem, onEdit: (item: InventoryItem) => void, onDelete: (item: InventoryItem) => void, onQrCode: (item: InventoryItem) => void }> = ({ item, onEdit, onDelete, onQrCode }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 duration-300 group relative">
        <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
        <div className="p-4">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-slate-800 mb-1 pr-16">{item.name}</h3>
                <StatusBadge status={item.status} />
            </div>
            <p className="text-sm text-slate-500 mb-2">{item.category}</p>
            <div className="flex justify-between items-center mt-4">
                <p className="text-lg font-bold text-indigo-600">{item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p className="text-sm text-slate-600">Qtd: {item.quantity}</p>
            </div>
        </div>
        <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button onClick={() => onQrCode(item)} className="bg-white p-2 rounded-full shadow-lg hover:bg-slate-100 text-slate-600 hover:scale-110 transition-all"><QrCode className="w-4 h-4"/></button>
            <button onClick={() => onEdit(item)} className="bg-white p-2 rounded-full shadow-lg hover:bg-blue-100 text-blue-600 hover:scale-110 transition-all"><Edit className="w-4 h-4"/></button>
            <button onClick={() => onDelete(item)} className="bg-white p-2 rounded-full shadow-lg hover:bg-red-100 text-red-600 hover:scale-110 transition-all"><Trash2 className="w-4 h-4"/></button>
        </div>
    </div>
);

const Inventory: React.FC = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState<'all' | InventoryItem['status']>('all');
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [itemForQr, setItemForQr] = useState<InventoryItem | null>(null);
    
    const initialFormState: Omit<InventoryItem, 'id'> = { name: '', category: '', quantity: 1, price: 0, imageUrl: `https://placehold.co/600x400/e2e8f0/64748b?text=Imagem`, status: 'available', lowStockThreshold: 1, maintenanceNotes: '', purchaseCost: 0 };
    const [formState, setFormState] = useState<Omit<InventoryItem, 'id'> | InventoryItem>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadInventory = async () => {
        setLoading(true);
        const items = await getInventory();
        setInventory(items);
        setLoading(false);
    };

    useEffect(() => { loadInventory(); }, []);
    
    useEffect(() => {
        if(itemToEdit) setFormState(itemToEdit);
        else if (!isModalOpen) setFormState(initialFormState);
    }, [itemToEdit, isModalOpen])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormState(prev => ({ ...prev, [name]: isNumber ? parseInt(value, 10) || 0 : value }));
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setItemToEdit(null);
        setError(null);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError(null);
        try {
            if ('id' in formState) { // Editing
                const { id, ...dataToUpdate } = formState;
                await updateInventoryItem(id, dataToUpdate);
            } else { // Adding
                await addInventoryItem({ ...formState, status: 'available' });
            }
            closeModal();
            await loadInventory();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (item: InventoryItem) => {
        if (window.confirm(`Tem certeza que deseja excluir "${item.name}"? Esta ação não pode ser desfeita.`)) {
            try {
                await deleteInventoryItem(item.id);
                await loadInventory();
            } catch (err) {
                 setError(err instanceof Error ? err.message : "Ocorreu um erro ao excluir.");
            }
        }
    };

    const handleQrCode = (item: InventoryItem) => {
        setItemForQr(item);
        setIsQrModalOpen(true);
    };
    
    const categories = useMemo(() => ['all', ...Array.from(new Set(inventory.map(i => i.category)))], [inventory]);
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (selectedCategory === 'all' || item.category === selectedCategory) &&
            (selectedStatus === 'all' || item.status === selectedStatus)
        );
    }, [inventory, searchTerm, selectedCategory, selectedStatus]);
    
    return (
        <>
            {isQrModalOpen && itemForQr && (
                <QrCodeModal 
                    data={{ type: 'item', id: itemForQr.id }}
                    name={itemForQr.name}
                    onClose={() => setIsQrModalOpen(false)}
                />
            )}
            {(isModalOpen || itemToEdit) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSubmit}>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">{itemToEdit ? 'Editar Item' : 'Adicionar Novo Item'}</h2>
                            {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</p>}
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Nome</label>
                                    <input type="text" name="name" id="name" value={formState.name} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="category" className="block text-sm font-medium text-slate-600 mb-1">Categoria</label>
                                        <input type="text" name="category" id="category" value={formState.category} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg" required />
                                    </div>
                                    {itemToEdit && (
                                        <div>
                                            <label htmlFor="status" className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                                            <select name="status" id="status" value={formState.status} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg">
                                                <option value="available">Disponível</option>
                                                <option value="rented">Alugado</option>
                                                <option value="maintenance">Manutenção</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="quantity" className="block text-sm font-medium text-slate-600 mb-1">Qtd.</label>
                                        <input type="number" name="quantity" id="quantity" value={formState.quantity} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg" min="0" required />
                                    </div>
                                    <div>
                                        <label htmlFor="price" className="block text-sm font-medium text-slate-600 mb-1">Preço Aluguel (R$)</label>
                                        <input type="number" step="0.01" name="price" id="price" value={formState.price} onChange={e => setFormState(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} className="w-full p-2 border border-slate-300 rounded-lg" min="0" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label htmlFor="purchaseCost" className="block text-sm font-medium text-slate-600 mb-1">Custo de Compra (R$)</label>
                                        <input type="number" step="0.01" name="purchaseCost" id="purchaseCost" value={formState.purchaseCost || 0} onChange={e => setFormState(prev => ({ ...prev, purchaseCost: parseFloat(e.target.value) || 0 }))} className="w-full p-2 border border-slate-300 rounded-lg" min="0" />
                                    </div>
                                    <div>
                                        <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-slate-600 mb-1">Alerta de Estoque</label>
                                        <input type="number" name="lowStockThreshold" id="lowStockThreshold" value={formState.lowStockThreshold || 1} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg" min="0" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="imageUrl" className="block text-sm font-medium text-slate-600 mb-1">URL da Imagem</label>
                                    <input type="text" name="imageUrl" id="imageUrl" value={formState.imageUrl} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-6">
                                <button type="button" onClick={closeModal} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-2/5">
                        <input 
                            type="text" 
                            placeholder="Buscar item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 pl-10 border border-slate-300 rounded-lg"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="p-2 border border-slate-300 rounded-lg w-full sm:w-auto"
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'Todas as Categorias' : cat}</option>)}
                        </select>
                        <select 
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as any)}
                            className="p-2 border border-slate-300 rounded-lg w-full sm:w-auto"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="available">Disponível</option>
                            <option value="rented">Alugado</option>
                            <option value="maintenance">Manutenção</option>
                        </select>
                        <button onClick={() => { setItemToEdit(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center shrink-0 w-full sm:w-auto justify-center">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Adicionar
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-md animate-pulse">
                                <div className="bg-slate-200 h-48 w-full"></div>
                                <div className="p-4 space-y-3"><div className="h-6 bg-slate-200 rounded w-3/4"></div><div className="h-4 bg-slate-200 rounded w-1/2"></div><div className="flex justify-between items-center pt-2"><div className="h-6 bg-slate-200 rounded w-1/4"></div><div className="h-4 bg-slate-200 rounded w-1/4"></div></div></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredInventory.map(item => (
                            <InventoryCard key={item.id} item={item} onEdit={setItemToEdit} onDelete={handleDelete} onQrCode={handleQrCode} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Inventory;
