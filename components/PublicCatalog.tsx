import React, { useState, useEffect, useMemo } from 'react';
import { getInventory, getRentals, findOrCreateClient, addRental, getCompanySettings } from '../services/api';
import { InventoryItem, Rental, Kit, CompanySettings, Payment } from '../types';
import { PartyPopper, ShoppingCart, X, Trash2, CheckCircle } from './icons';

type CartItem = Pick<InventoryItem, 'id' | 'name' | 'price'>;

const PublicCatalog: React.FC = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [inventoryData, rentalsData, settingsData] = await Promise.all([getInventory(), getRentals(), getCompanySettings()]);
            setInventory(inventoryData);
            setRentals(rentalsData);
            setSettings(settingsData);
            setLoading(false);
        };
        fetchData();
    }, []);

    const unavailableItemIds = useMemo(() => {
        const unavailable = new Set<string>();
        if (!selectedDate) return unavailable;

        const checkDate = new Date(selectedDate);

        rentals.forEach(rental => {
            const pickup = new Date(rental.pickupDate);
            const aReturn = new Date(rental.returnDate);
            if (checkDate >= pickup && checkDate <= aReturn && rental.status !== 'quote-requested') {
                rental.items.forEach(item => unavailable.add(item.id));
                rental.kits?.forEach(kit => kit.items.forEach(item => unavailable.add(item.id)));
            }
        });
        return unavailable;
    }, [selectedDate, rentals]);

    const handleAddToCart = (item: InventoryItem) => {
        if (cartItems.some(q => q.id === item.id)) return;
        setCartItems(prev => [...prev, { id: item.id, name: item.name, price: item.price }]);
        setIsCartSidebarOpen(true);
    };

    const handleRemoveFromCart = (itemId: string) => {
        setCartItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleBooking = async (clientData: { name: string; phone: string; email: string }) => {
        setSubmissionStatus('submitting');
        try {
            const client = await findOrCreateClient(clientData);
            const totalValue = cartItems.reduce((sum, item) => sum + item.price, 0);
            const depositAmount = totalValue * 0.5;

            const depositPayment: Payment = {
                id: `payment_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                amount: depositAmount,
                method: 'pix' // Simulating PIX payment
            };
            
            const newRental: Omit<Rental, 'id'> = {
                client: { id: client.id, name: client.name },
                eventDate: selectedDate,
                pickupDate: selectedDate, 
                returnDate: selectedDate, 
                items: cartItems.map(ci => ({ ...ci, quantity: 1})),
                totalValue,
                status: 'booked',
                discount: 0,
                notes: 'Reserva online via catálogo público com sinal de 50%.',
                paymentStatus: 'partial',
                paymentHistory: [depositPayment],
                kits: [],
                pickupChecklist: {},
                returnChecklist: {},
            };
            
            await addRental(newRental);
            setSubmissionStatus('success');
            setCartItems([]);
            setIsCartSidebarOpen(false);
        } catch (error) {
            console.error("Booking submission failed", error);
            setSubmissionStatus('error');
        }
    };
    
    const totalValue = cartItems.reduce((sum, item) => sum + item.price, 0);

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        {settings?.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="h-10 w-auto"/>
                        ) : (
                            <PartyPopper className="h-10 w-10 text-indigo-600" />
                        )}
                        <span className="text-2xl font-bold ml-3 text-slate-800">{settings?.companyName || 'Catálogo Festa Fácil'}</span>
                    </div>
                    <button onClick={() => setIsCartSidebarOpen(true)} className="relative p-2 rounded-full hover:bg-slate-100">
                        <ShoppingCart className="h-6 w-6 text-slate-600" />
                        {cartItems.length > 0 && (
                            <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">{cartItems.length}</span>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h1 className="text-xl font-semibold text-slate-800 mb-2">Veja nossos itens!</h1>
                    <p className="text-slate-500 mb-4">Selecione a data do seu evento para verificar a disponibilidade dos itens e fazer sua reserva.</p>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition w-full sm:w-auto"
                    />
                </div>

                {loading ? (
                    <p>Carregando itens...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {inventory.map(item => {
                            const isUnavailable = unavailableItemIds.has(item.id) || item.status !== 'available';
                            const isInCart = cartItems.some(q => q.id === item.id);
                            return (
                                <div key={item.id} className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${isUnavailable ? 'opacity-50' : ''}`}>
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-1 truncate">{item.name}</h3>
                                        <p className="text-sm text-slate-500 mb-2">{item.category}</p>
                                        <div className="flex justify-between items-center mt-4">
                                            <p className="text-lg font-bold text-indigo-600">{item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            <button 
                                                onClick={() => handleAddToCart(item)} 
                                                disabled={isUnavailable || isInCart}
                                                className="font-semibold py-2 px-4 rounded-lg text-sm transition-colors disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                            >
                                                {isUnavailable ? 'Indisponível' : isInCart ? 'Adicionado' : 'Adicionar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
            
            {/* Cart Sidebar */}
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity ${isCartSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartSidebarOpen(false)}></div>
            <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 ${isCartSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                 <div className="p-4 flex flex-col h-full">
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <h2 className="text-xl font-bold">Cesta de Reserva</h2>
                        <button onClick={() => setIsCartSidebarOpen(false)} className="p-2 rounded-full hover:bg-slate-100"><X /></button>
                    </div>
                    {cartItems.length === 0 ? (
                        <p className="text-center text-slate-500 flex-grow flex items-center justify-center">Sua cesta está vazia.</p>
                    ) : (
                        <div className="flex-grow overflow-y-auto">
                           {cartItems.map(item => (
                               <div key={item.id} className="flex justify-between items-center p-2 mb-2 bg-slate-50 rounded-md">
                                   <div>
                                       <p className="font-semibold">{item.name}</p>
                                       <p className="text-sm text-slate-600">{item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                   </div>
                                   <button onClick={() => handleRemoveFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 className="w-4 h-4" /></button>
                               </div>
                           ))}
                        </div>
                    )}
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-lg font-semibold">Total</span>
                            <span className="text-xl font-bold text-indigo-600">{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                         <div className="flex justify-between items-center mb-4 text-sm text-green-600">
                            <span>Sinal para reserva (50%)</span>
                            <span className="font-bold">{(totalValue * 0.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <button onClick={() => setIsCheckoutModalOpen(true)} disabled={cartItems.length === 0} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                            Finalizar Reserva
                        </button>
                    </div>
                </div>
            </div>

            {/* Checkout Modal */}
             {isCheckoutModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        {submissionStatus === 'success' ? (
                            <div className="text-center">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4"/>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Reserva Confirmada!</h2>
                                <p className="text-slate-600 mb-6">Sua reserva foi efetuada com sucesso. Entraremos em contato para alinhar os detalhes da retirada. Obrigado!</p>
                                <button onClick={() => { setIsCheckoutModalOpen(false); setSubmissionStatus('idle'); }} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700">Fechar</button>
                            </div>
                        ) : submissionStatus === 'error' ? (
                             <div>
                                <h2 className="text-2xl font-bold text-red-600 mb-4">Ocorreu um Erro</h2>
                                <p className="text-slate-600 mb-6">Não foi possível processar sua reserva. Por favor, tente novamente mais tarde ou entre em contato conosco diretamente.</p>
                                <button onClick={() => setSubmissionStatus('idle')} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700">Tentar Novamente</button>
                            </div>
                        ) : (
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleBooking({
                                    name: formData.get('name') as string,
                                    phone: formData.get('phone') as string,
                                    email: formData.get('email') as string,
                                });
                            }}>
                                <h2 className="text-2xl font-bold text-slate-800 mb-4">Finalizar Reserva</h2>
                                <p className="text-slate-500 mb-4">Preencha seus dados e pague o sinal de 50% para garantir sua reserva.</p>
                                <div className="space-y-4">
                                    <input name="name" type="text" placeholder="Nome Completo" className="w-full p-2 border border-slate-300 rounded-lg" required />
                                    <input name="phone" type="tel" placeholder="Telefone (com DDD)" className="w-full p-2 border border-slate-300 rounded-lg" required />
                                    <input name="email" type="email" placeholder="E-mail" className="w-full p-2 border border-slate-300 rounded-lg" required />
                                </div>
                                <div className="mt-6 p-4 bg-slate-50 rounded-lg text-center">
                                    <p className="text-slate-600">Valor do sinal (50%):</p>
                                    <p className="text-3xl font-bold text-indigo-700">{(totalValue * 0.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    <p className="text-xs text-slate-500 mt-2">(Simulação de pagamento. Nenhuma cobrança será feita.)</p>
                                </div>
                                <div className="flex justify-end gap-4 mt-6">
                                    <button type="button" onClick={() => setIsCheckoutModalOpen(false)} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Cancelar</button>
                                    <button type="submit" disabled={submissionStatus === 'submitting'} className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400">
                                        {submissionStatus === 'submitting' ? 'Processando...' : 'Pagar Sinal e Reservar'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default PublicCatalog;
