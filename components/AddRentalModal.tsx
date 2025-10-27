
import React, { useState, useEffect, useMemo } from 'react';
import { Client, InventoryItem, Rental, Kit } from '../types';
import { getClients, getInventory, addRental, getKits } from '../services/api';
import { X, Trash2 } from './icons';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onRentalAdded: () => void;
}

type SelectedItem = Pick<InventoryItem, 'id' | 'name' | 'price'> & { quantity: number };

const AddRentalModal: React.FC<Props> = ({ isOpen, onClose, onRentalAdded }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [kits, setKits] = useState<Kit[]>([]);
    const [activeTab, setActiveTab] = useState<'items' | 'kits'>('items');

    // Form state
    const [selectedClientId, setSelectedClientId] = useState('');
    const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
    const [pickupDate, setPickupDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [discount, setDiscount] = useState(0);
    const [notes, setNotes] = useState('');
    const [deliveryService, setDeliveryService] = useState(false);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [setupService, setSetupService] = useState(false);
    const [setupFee, setSetupFee] = useState(0);
    const [deliveryAddress, setDeliveryAddress] = useState('');

    
    // New state for items and kits
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [selectedKits, setSelectedKits] = useState<Kit[]>([]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                const [clientsData, inventoryData, kitsData] = await Promise.all([getClients(), getInventory(), getKits()]);
                setClients(clientsData);
                setInventory(inventoryData);
                setKits(kitsData);
            };
            fetchData();
        }
    }, [isOpen]);

    const itemIdsInSelectedKits = useMemo(() => {
        const ids = new Set<string>();
        selectedKits.forEach(kit => kit.itemIds.forEach(id => ids.add(id)));
        return ids;
    }, [selectedKits]);

    const availableInventory = useMemo(() => {
        return inventory.filter(i => i.status === 'available' && !itemIdsInSelectedKits.has(i.id));
    }, [inventory, itemIdsInSelectedKits]);

    const availableKits = useMemo(() => {
        const selectedItemIds = new Set(selectedItems.map(i => i.id));
        return kits.filter(kit => !kit.itemIds.some(itemId => selectedItemIds.has(itemId)));
    }, [kits, selectedItems]);
    
    const subtotal = useMemo(() => {
        const itemsTotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const kitsTotal = selectedKits.reduce((sum, kit) => sum + kit.price, 0);
        return itemsTotal + kitsTotal;
    }, [selectedItems, selectedKits]);
    
    const totalValue = useMemo(() => {
        const servicesTotal = (deliveryService ? deliveryFee : 0) + (setupService ? setupFee : 0);
        return subtotal + servicesTotal;
    }, [subtotal, deliveryService, deliveryFee, setupService, setupFee]);


    const handleAddItem = (item: InventoryItem) => {
        setSelectedItems(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                const inventoryItem = inventory.find(invItem => invItem.id === item.id);
                if(inventoryItem && existing.quantity >= inventoryItem.quantity) return prev;
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
        });
    };
    
    const handleAddKit = (kit: Kit) => {
        const allItemsAvailable = kit.itemIds.every(itemId => inventory.find(i => i.id === itemId)?.status === 'available');
        if (!allItemsAvailable) {
            alert(`O kit "${kit.name}" não pode ser adicionado pois um ou mais itens não estão disponíveis.`);
            return;
        }
        setSelectedKits(prev => [...prev, kit]);
    };
    
    const handleRemoveItem = (itemId: string) => setSelectedItems(prev => prev.filter(i => i.id !== itemId));
    const handleRemoveKit = (kitId: string) => setSelectedKits(prev => prev.filter(k => k.id !== kitId));

    const resetForm = () => {
        setSelectedClientId('');
        setEventDate(new Date().toISOString().split('T')[0]);
        setPickupDate('');
        setReturnDate('');
        setDiscount(0);
        setNotes('');
        setSelectedItems([]);
        setSelectedKits([]);
        setActiveTab('items');
        setDeliveryService(false);
        setDeliveryFee(0);
        setSetupService(false);
        setSetupFee(0);
        setDeliveryAddress('');
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedClient = clients.find(c => c.id === selectedClientId);
        if (!selectedClient || (selectedItems.length === 0 && selectedKits.length === 0)) {
            alert("Por favor, selecione um cliente e adicione pelo menos um item ou kit.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const allItemsForRental = [...selectedItems];
            // Only add kit items if they aren't already there as individual items
            const selectedItemIds = new Set(selectedItems.map(i => i.id));
            selectedKits.forEach(kit => {
                kit.itemIds.forEach(itemId => {
                    if(!selectedItemIds.has(itemId)){
                        const invItem = inventory.find(i => i.id === itemId);
                        if(invItem) allItemsForRental.push({id: invItem.id, name: invItem.name, price: invItem.price, quantity: 1});
                    }
                })
            });

            const newRental: Omit<Rental, 'id' | 'paymentStatus' | 'paymentHistory' | 'pickupChecklist' | 'returnChecklist'> = {
                client: { id: selectedClient.id, name: selectedClient.name },
                eventDate,
                pickupDate,
                returnDate,
                items: allItemsForRental,
                kits: selectedKits.map(k => ({id: k.id, name: k.name, price: k.price, items: k.items })),
                totalValue: totalValue,
                status: 'booked',
                discount,
                notes,
                deliveryService,
                deliveryFee,
                setupService,
                setupFee,
                deliveryAddress,
            };
            await addRental(newRental as Omit<Rental, 'id'>);
            resetForm();
            onRentalAdded();
        } catch (error) {
            console.error("Failed to add rental", error);
            alert("Falha ao adicionar aluguel.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">Criar Novo Aluguel</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200"><X className="w-5 h-5"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
                    {/* Left Column: Client, Dates, Total */}
                    <div className="md:w-1/2 flex flex-col space-y-4 overflow-y-auto pr-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Cliente</label>
                            <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" required>
                                <option value="" disabled>Selecione um cliente</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Data Evento</label>
                                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" required/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Desconto (R$)</label>
                                <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-slate-300 rounded-lg" />
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Retirada</label>
                                <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" required/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Devolução</label>
                                <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" required/>
                            </div>
                        </div>

                         {/* Services Section */}
                        <div className="p-4 border rounded-lg space-y-4">
                            <h3 className="font-semibold text-slate-700">Serviços Adicionais</h3>
                             <div className="flex items-center">
                                <input type="checkbox" id="deliveryService" checked={deliveryService} onChange={e => setDeliveryService(e.target.checked)} className="h-4 w-4 rounded"/>
                                <label htmlFor="deliveryService" className="ml-2 text-sm font-medium text-slate-600">Serviço de Entrega/Retirada</label>
                            </div>
                             {deliveryService && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-6">
                                    <div className="sm:col-span-2">
                                        <label htmlFor="deliveryAddress" className="block text-xs font-medium text-slate-500">Endereço</label>
                                        <input type="text" id="deliveryAddress" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Rua, Número, Bairro" className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                                    </div>
                                    <div>
                                         <label htmlFor="deliveryFee" className="block text-xs font-medium text-slate-500">Taxa (R$)</label>
                                         <input type="number" id="deliveryFee" value={deliveryFee} onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                                    </div>
                                </div>
                            )}
                             <div className="flex items-center">
                                <input type="checkbox" id="setupService" checked={setupService} onChange={e => setSetupService(e.target.checked)} className="h-4 w-4 rounded"/>
                                <label htmlFor="setupService" className="ml-2 text-sm font-medium text-slate-600">Serviço de Montagem/Desmontagem</label>
                            </div>
                             {setupService && (
                                <div className="pl-6">
                                     <label htmlFor="setupFee" className="block text-xs font-medium text-slate-500">Taxa de Montagem (R$)</label>
                                     <input type="number" id="setupFee" value={setupFee} onChange={e => setSetupFee(parseFloat(e.target.value) || 0)} className="w-full sm:w-1/3 p-2 border border-slate-300 rounded-lg text-sm" />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Observações</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" rows={2}></textarea>
                        </div>
                         <div className="bg-slate-50 p-4 rounded-lg mt-auto">
                             <div className="flex justify-between text-sm text-slate-500"><span>Subtotal (Itens)</span><span>{subtotal.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></div>
                             {deliveryService && <div className="flex justify-between text-sm text-slate-500"><span>Taxa Entrega</span><span>{(deliveryFee || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></div>}
                             {setupService && <div className="flex justify-between text-sm text-slate-500"><span>Taxa Montagem</span><span>{(setupFee || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></div>}
                             <div className="flex justify-between text-sm text-red-500"><span>Desconto</span><span>- {discount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></div>
                            <hr className="my-2"/>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-slate-500 font-medium">Valor Total</p>
                                <p className="text-3xl font-bold text-indigo-600">{(totalValue - discount).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Column: Selections */}
                    <div className="md:w-1/2 flex flex-col gap-4 overflow-hidden">
                         {/* Item/Kit Selection */}
                        <div className="flex flex-col border border-slate-200 rounded-lg h-1/2">
                           <div className="flex border-b">
                                <button type="button" onClick={() => setActiveTab('items')} className={`flex-1 p-3 font-semibold ${activeTab === 'items' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Itens</button>
                                <button type="button" onClick={() => setActiveTab('kits')} className={`flex-1 p-3 font-semibold ${activeTab === 'kits' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Kits</button>
                            </div>
                            <div className="overflow-y-auto flex-grow p-2">
                                {activeTab === 'items' && availableInventory.map(item => (
                                    <button type="button" key={item.id} onClick={() => handleAddItem(item)} className="w-full text-left p-2 rounded-md hover:bg-slate-100 flex justify-between">
                                        <span>{item.name}</span>
                                        <span className="font-semibold text-slate-600">{item.price.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                                    </button>
                                ))}
                                {activeTab === 'kits' && availableKits.map(kit => (
                                    <button type="button" key={kit.id} onClick={() => handleAddKit(kit)} className="w-full text-left p-2 rounded-md hover:bg-slate-100 flex justify-between">
                                        <span>{kit.name}</span>
                                        <span className="font-semibold text-slate-600">{kit.price.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                         {/* Selected Items */}
                        <div className="border rounded-lg flex-grow flex flex-col overflow-hidden h-1/2">
                             <h3 className="font-semibold p-3 border-b">Itens Selecionados</h3>
                             <div className="overflow-y-auto flex-grow bg-slate-50 p-2">
                                {selectedKits.length === 0 && selectedItems.length === 0 && <p className="text-center text-slate-500 py-4">Nenhum item adicionado.</p>}
                                {selectedKits.map(kit => (
                                    <div key={kit.id} className="flex justify-between items-center p-2 bg-indigo-50 border-l-4 border-indigo-400 rounded-md mb-2 shadow-sm">
                                        <div><p className="font-bold">{kit.name} (Kit)</p></div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-bold text-indigo-700">{kit.price.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                                            <button type="button" onClick={() => handleRemoveKit(kit.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ))}
                                 {selectedItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded-md mb-2 shadow-sm">
                                        <div><p className="font-semibold">{item.name} (Qtd: {item.quantity})</p></div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-bold text-slate-700">{(item.price * item.quantity).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                                            <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                </form>

                 <div className="flex justify-end gap-4 mt-6 border-t pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="py-2 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400">
                         {isSubmitting ? 'Salvando...' : 'Salvar Aluguel'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddRentalModal;