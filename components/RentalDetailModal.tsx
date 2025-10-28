
import React, { useState, useEffect, useMemo } from 'react';
import { Rental, Payment, InventoryItem, Kit, CompanySettings, PaymentMethod } from '../types';
import { updateRental, updateInventoryItem, getCompanySettings } from '../services/api';
import { generateRentalContract } from '../services/pdfGenerator';
import { X, DollarSign, ClipboardList, ClipboardCheck, CreditCard, Trash2, Wrench, QrCode, Truck, FileText } from './icons';
import QrScanner from './QrScanner';

interface Props {
    rental: Rental | null;
    onClose: () => void;
    onUpdate: () => void;
}

export const RentalDetailModal: React.FC<Props> = ({ rental, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'pickup' | 'return'>('details');
    const [editableRental, setEditableRental] = useState<Rental | null>(null);
    const [newPayment, setNewPayment] = useState({ amount: 0, date: new Date().toISOString().split('T')[0], method: 'pix' as PaymentMethod });
    const [isSaving, setIsSaving] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanFeedback, setScanFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

    useEffect(() => {
        if (rental) {
            setEditableRental(JSON.parse(JSON.stringify(rental))); // Deep copy
            getCompanySettings().then(setCompanySettings);
        }
    }, [rental]);

    if (!rental || !editableRental) return null;
    
    const allItemsForChecklist = useMemo(() => {
        const itemsMap = new Map<string, {id: string, name: string, quantity: number}>();
        rental.items.forEach(item => {
            itemsMap.set(item.id, {id: item.id, name: item.name, quantity: item.quantity});
        });
        return Array.from(itemsMap.values());
    }, [rental.items]);

    const allValidIds = useMemo(() => {
        const ids = new Set<string>();
        allItemsForChecklist.forEach(item => ids.add(item.id));
        rental.kits?.forEach(kit => ids.add(kit.id));
        return ids;
    }, [allItemsForChecklist, rental.kits]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: any = value;
        if (type === 'number') {
            processedValue = parseFloat(value) || 0;
        } else if (type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        }

        setEditableRental(prev => prev ? { ...prev, [name]: processedValue } : null);
    };
    
    const handleAddPayment = async () => {
        if(newPayment.amount <= 0) return;
        const paymentToAdd: Payment = { ...newPayment, id: `payment_${Date.now()}` };
        
        const updatedHistory = [...editableRental.paymentHistory, paymentToAdd];
        const totalPaid = updatedHistory.reduce((sum, p) => sum + p.amount, 0);
        const finalValue = editableRental.totalValue - editableRental.discount;

        let newPaymentStatus: Rental['paymentStatus'] = 'partial';
        if(totalPaid >= finalValue) {
            newPaymentStatus = 'paid';
        } else if (totalPaid === 0) {
            newPaymentStatus = 'pending';
        }

        const updatedRental: Rental = { ...editableRental, paymentHistory: updatedHistory, paymentStatus: newPaymentStatus };
        setEditableRental(updatedRental);
        await handleSave(updatedRental);
        setNewPayment({ amount: 0, date: new Date().toISOString().split('T')[0], method: 'pix' });
    };

    const handleRemovePayment = async (paymentId: string) => {
        const updatedHistory = editableRental.paymentHistory.filter(p => p.id !== paymentId);
        const totalPaid = updatedHistory.reduce((sum, p) => sum + p.amount, 0);
        const finalValue = editableRental.totalValue - editableRental.discount;

        let newPaymentStatus: Rental['paymentStatus'] = 'partial';
        if(totalPaid >= finalValue) {
            newPaymentStatus = 'paid';
        } else if (totalPaid === 0) {
            newPaymentStatus = 'pending';
        }
        
        const updatedRental: Rental = { ...editableRental, paymentHistory: updatedHistory, paymentStatus: newPaymentStatus };
        setEditableRental(updatedRental);
        await handleSave(updatedRental);
    }
    
    const handleChecklistItemToggle = (list: 'pickupChecklist' | 'returnChecklist', itemId: string) => {
        setEditableRental(prev => {
            if(!prev) return null;
            const updatedList = { ...prev[list], [itemId]: !prev[list][itemId] };
            return { ...prev, [list]: updatedList };
        })
    };

     const handleScan = (scannedId: string, type: 'item' | 'kit') => {
        const list = activeTab as 'pickupChecklist' | 'returnChecklist';
        let feedbackMessage = '';

        if (type === 'kit') {
            const kit = rental.kits?.find(k => k.id === scannedId);
            if (kit) {
                let updatedRental = { ...editableRental };
                kit.items.forEach(item => {
                    updatedRental[list][item.id] = true;
                });
                setEditableRental(updatedRental);
                feedbackMessage = `Kit "${kit.name}" verificado!`;
            }
        } else {
            handleChecklistItemToggle(list, scannedId);
            const item = allItemsForChecklist.find(i => i.id === scannedId);
            if(item) feedbackMessage = `Item "${item.name}" verificado!`;
        }
        
        setScanFeedback({type: 'success', message: feedbackMessage});
        // Play a success sound
        const audio = new Audio('https://cdn.jsdelivr.net/gh/dev-guilhermealves/codepen-assets@main/notification-sound.mp3');
        audio.play();

        setTimeout(() => setScanFeedback(null), 2000);
    };
    
    const handleReportDamage = async (itemId: string) => {
        const reason = prompt("Por favor, descreva a avaria ou o motivo da manutenção:");
        if (reason) {
            try {
                await updateInventoryItem(itemId, { status: 'maintenance', maintenanceNotes: reason });
                const notes = `Item avariado reportado: ${allItemsForChecklist.find(i=> i.id === itemId)?.name || 'ID desconhecido'}. Motivo: ${reason}`;
                const updatedRental: Rental = { ...editableRental, notes: `${editableRental.notes || ''}\n${notes}`.trim() };
                setEditableRental(updatedRental);
                await handleSave(updatedRental);
                alert("Item movido para manutenção com sucesso.");
            } catch(error) {
                console.error(error);
                alert("Falha ao reportar avaria.");
            }
        }
    }
    
    const handleConfirmStatusChange = async (newStatus: 'picked-up' | 'returned') => {
        const updatedRental = { ...editableRental, status: newStatus };
        await handleSave(updatedRental);
    };

    const handleSave = async (rentalToSave: Rental = editableRental) => {
        if(!rentalToSave) return;
        setIsSaving(true);
        try {
            const { id, ...dataToUpdate } = rentalToSave;
            await updateRental(id, dataToUpdate);
            onUpdate();
        } catch(error) {
            console.error("Failed to save rental", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleGenerateContract = () => {
        generateRentalContract(rental, companySettings);
    };

    const totalPaid = editableRental.paymentHistory.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = (editableRental.totalValue - (editableRental.discount || 0)) - totalPaid;

    const areAllItemsChecked = (list: 'pickupChecklist' | 'returnChecklist') => {
        return allItemsForChecklist.every(item => editableRental[list][item.id]);
    }

    const checklistContent = (listType: 'pickupChecklist' | 'returnChecklist') => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-slate-500">
                    {listType === 'pickupChecklist' ? 'Marque cada item ao entregá-lo para o cliente.' : 'Marque cada item ao recebê-lo de volta.'}
                </p>
                <button onClick={() => setIsScannerOpen(true)} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center">
                    <QrCode className="w-5 h-5 mr-2" /> Escanear Item
                </button>
            </div>
             {scanFeedback && (
                <div className={`p-3 mb-4 rounded-lg text-sm ${scanFeedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {scanFeedback.message}
                </div>
            )}
             <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                {/* Display Kits First */}
                {rental.kits && rental.kits.map(kit => (
                    <div key={kit.id} className="p-3 bg-indigo-50 border-l-4 border-indigo-400 rounded-lg">
                        <p className="font-bold text-indigo-800">{kit.name} (Kit)</p>
                         <div className="pl-4 mt-2 space-y-2">
                            {kit.items.map(item => (
                                <div key={item.id} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                         <input type="checkbox" id={`${listType}-${item.id}`} checked={!!editableRental[listType][item.id]} onChange={() => handleChecklistItemToggle(listType, item.id)} className="w-5 h-5 text-indigo-600 rounded" />
                                        <label htmlFor={`${listType}-${item.id}`} className="ml-3 font-medium text-slate-700">{item.name}</label>
                                    </div>
                                    {listType === 'returnChecklist' && (
                                        <button onClick={() => handleReportDamage(item.id)} className="flex items-center text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md hover:bg-red-200">
                                            <Wrench className="w-3 h-3 mr-1"/> Avaria
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {/* Display Individual Items */}
                {allItemsForChecklist
                    .filter(item => !(rental.kits || []).some(k => k.items.some(ki => ki.id === item.id)))
                    .map(item => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                            <input type="checkbox" id={`${listType}-${item.id}`} checked={!!editableRental[listType][item.id]} onChange={() => handleChecklistItemToggle(listType, item.id)} className="w-5 h-5 text-indigo-600 rounded" />
                            <label htmlFor={`${listType}-${item.id}`} className="ml-3 font-medium text-slate-700">{item.name} (Qtd: {item.quantity})</label>
                        </div>
                         {listType === 'returnChecklist' && (
                            <button onClick={() => handleReportDamage(item.id)} className="flex items-center text-sm bg-red-100 text-red-700 px-2 py-1 rounded-md hover:bg-red-200">
                                <Wrench className="w-4 h-4 mr-1"/> Reportar Avaria
                            </button>
                         )}
                    </div>
                ))}
             </div>
             <div className="mt-4">
                <button 
                    disabled={!areAllItemsChecked(listType) || editableRental.status === (listType === 'pickupChecklist' ? 'picked-up' : 'returned')} 
                    onClick={() => handleConfirmStatusChange(listType === 'pickupChecklist' ? 'picked-up' : 'returned')} 
                    className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    { editableRental.status === (listType === 'pickupChecklist' ? 'picked-up' : 'returned') ? 
                        (listType === 'pickupChecklist' ? 'Retirada Confirmada' : 'Devolução Confirmada') :
                        (listType === 'pickupChecklist' ? 'Confirmar Retirada de Todos os Itens' : 'Confirmar Devolução de Todos os Itens')
                    }
                </button>
             </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            {isScannerOpen && (
                <QrScanner 
                    validIds={allValidIds}
                    onScanSuccess={handleScan}
                    onScanError={(message) => setScanFeedback({type: 'error', message})}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Gerenciar Aluguel</h2>
                        <p className="text-slate-500">{rental.client.name} - Evento em {new Date(rental.eventDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('details')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}><DollarSign className="w-4 h-4 inline mr-2"/>Financeiro</button>
                        <button onClick={() => setActiveTab('pickup')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'pickup' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}><ClipboardList className="w-4 h-4 inline mr-2"/>Checklist Retirada</button>
                        <button onClick={() => setActiveTab('return')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'return' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}><ClipboardCheck className="w-4 h-4 inline mr-2"/>Checklist Devolução</button>
                    </nav>
                </div>

                <div className="flex-grow overflow-y-auto py-4">
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left: Details & Payments Form */}
                            <div className="space-y-4">
                               <div className="p-4 border rounded-lg">
                                 <h3 className="font-semibold mb-2">Detalhes Financeiros</h3>
                                 <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>Subtotal (Itens):</span> <span>{(editableRental.totalValue - (editableRental.deliveryFee || 0) - (editableRental.setupFee || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                                     {editableRental.deliveryService && <div className="flex justify-between"><span>Taxa de Entrega:</span> <span>{(editableRental.deliveryFee || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>}
                                     {editableRental.setupService && <div className="flex justify-between"><span>Taxa de Montagem:</span> <span>{(editableRental.setupFee || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>}
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="discount">Desconto:</label>
                                        <input type="number" name="discount" id="discount" value={editableRental.discount} onChange={handleInputChange} className="w-24 p-1 border rounded-md text-right"/>
                                    </div>
                                    <hr/>
                                    <div className="flex justify-between font-bold"><span>Total:</span> <span>{(editableRental.totalValue - (editableRental.discount || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                                    <div className="flex justify-between text-green-600"><span>Total Pago:</span> <span>{totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                                    <div className="flex justify-between font-bold text-red-600"><span>Saldo Devedor:</span> <span>{balanceDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                                 </div>
                               </div>
                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold mb-2 flex items-center"><Truck className="w-4 h-4 mr-2"/>Serviços Adicionais</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center"><input type="checkbox" name="deliveryService" checked={editableRental.deliveryService} onChange={handleInputChange} className="h-4 w-4 rounded"/><label className="ml-2 text-sm">Serviço de Entrega</label></div>
                                        {editableRental.deliveryService && <div className="pl-6 space-y-2">
                                            <input type="text" name="deliveryAddress" placeholder="Endereço de entrega" value={editableRental.deliveryAddress} onChange={handleInputChange} className="w-full p-2 border rounded-md text-sm" />
                                            <input type="number" name="deliveryFee" placeholder="Taxa de Entrega" value={editableRental.deliveryFee} onChange={handleInputChange} className="w-1/2 p-2 border rounded-md text-sm" />
                                        </div>}
                                         <div className="flex items-center"><input type="checkbox" name="setupService" checked={editableRental.setupService} onChange={handleInputChange} className="h-4 w-4 rounded"/><label className="ml-2 text-sm">Serviço de Montagem</label></div>
                                         {editableRental.setupService && <div className="pl-6"><input type="number" name="setupFee" placeholder="Taxa de Montagem" value={editableRental.setupFee} onChange={handleInputChange} className="w-1/2 p-2 border rounded-md text-sm" /></div>}
                                    </div>
                                </div>
                               <div className="p-4 border rounded-lg">
                                    <h3 className="font-semibold mb-2">Adicionar Pagamento</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="number" placeholder="Valor" value={newPayment.amount || ''} onChange={e => setNewPayment(p => ({...p, amount: parseFloat(e.target.value) || 0}))} className="p-2 border rounded-md w-full"/>
                                        <input type="date" value={newPayment.date} onChange={e => setNewPayment(p => ({...p, date: e.target.value}))} className="p-2 border rounded-md"/>
                                        <select value={newPayment.method} onChange={e => setNewPayment(p => ({...p, method: e.target.value as PaymentMethod}))} className="col-span-2 p-2 border rounded-md">
                                            <option value="pix">PIX</option>
                                            <option value="card">Cartão</option>
                                            <option value="cash">Dinheiro</option>
                                            <option value="bank_transfer">Transferência Bancária</option>
                                            <option value="other">Outro</option>
                                        </select>
                                    </div>
                                    <button onClick={handleAddPayment} className="w-full mt-2 bg-green-500 text-white p-2 rounded-lg hover:bg-green-600">Adicionar</button>
                               </div>
                               <div>
                                    <label className="font-semibold">Observações</label>
                                    <textarea name="notes" value={editableRental.notes} onChange={handleInputChange} className="w-full p-2 border rounded-lg mt-1" rows={3}></textarea>
                               </div>
                            </div>
                            {/* Right: Payment History */}
                            <div className="p-4 border rounded-lg flex flex-col">
                                 <h3 className="font-semibold mb-2">Histórico de Pagamentos</h3>
                                 <div className="space-y-2 flex-grow max-h-80 overflow-y-auto">
                                    {editableRental.paymentHistory.map(p => (
                                        <div key={p.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                            <div>
                                                <p className="font-medium">{p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                <p className="text-xs text-slate-500">{new Date(p.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {p.method}</p>
                                            </div>
                                            <button onClick={() => handleRemovePayment(p.id)} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                    {editableRental.paymentHistory.length === 0 && <p className="text-slate-500 text-center py-4">Nenhum pagamento registrado.</p>}
                                 </div>
                                 <div className="mt-auto pt-4 border-t">
                                     <button onClick={handleGenerateContract} className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-colors flex items-center justify-center">
                                        <FileText className="w-5 h-5 mr-2" />
                                        Gerar Contrato PDF
                                    </button>
                                 </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'pickup' && checklistContent('pickupChecklist')}
                    {activeTab === 'return' && checklistContent('returnChecklist')}
                </div>

                <div className="flex justify-end gap-4 mt-4 border-t pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Fechar</button>
                    <button type="button" onClick={() => handleSave()} disabled={isSaving} className="py-2 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400">
                         {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};
