
import React, { useState, useEffect, useRef } from 'react';
import { getRentalById, getCompanySettings, updateRental } from '../services/api';
import { Rental, CompanySettings, Payment } from '../types';
import { PartyPopper, CheckCircle, Package } from './icons';

declare const QRCode: any;

interface Props {
    rentalId: string;
}

const PaymentPage: React.FC<Props> = ({ rentalId }) => {
    const [rental, setRental] = useState<Rental | null>(null);
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirming' | 'confirmed' | 'error'>('pending');
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rentalData, settingsData] = await Promise.all([
                    getRentalById(rentalId),
                    getCompanySettings()
                ]);

                if (!rentalData) {
                    throw new Error("Aluguel não encontrado. Verifique o link e tente novamente.");
                }
                
                setRental(rentalData);
                setSettings(settingsData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [rentalId]);
    
    const totalPaid = rental?.paymentHistory.reduce((sum, p) => sum + p.amount, 0) || 0;
    const balanceDue = (rental?.totalValue || 0) - (rental?.discount || 0) - totalPaid;

    useEffect(() => {
        if (qrCanvasRef.current && settings?.pixKey && balanceDue > 0) {
            QRCode.toCanvas(qrCanvasRef.current, settings.pixKey, { width: 200 }, (error: any) => {
                if (error) console.error("Failed to generate QR Code:", error);
            });
        }
    }, [settings, balanceDue]);

    const handleConfirmPayment = async () => {
        if (!rental || balanceDue <= 0) return;

        setPaymentStatus('confirming');
        try {
            const newPayment: Payment = {
                id: `payment_link_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                amount: balanceDue,
                method: 'payment_link',
            };

            const updatedHistory = [...rental.paymentHistory, newPayment];
            
            await updateRental(rental.id, {
                paymentHistory: updatedHistory,
                paymentStatus: 'paid'
            });

            setPaymentStatus('confirmed');
        } catch (err) {
            console.error("Failed to confirm payment", err);
            setPaymentStatus('error');
        }
    };


    if (loading) return <div className="text-center p-10">Carregando informações do pagamento...</div>;
    if (error) return <div className="text-center p-10 text-red-600 bg-red-50">{error}</div>;
    if (!rental) return null;

    return (
        <div className="bg-slate-50 min-h-screen py-12 px-4">
             <header className="max-w-xl mx-auto mb-6 flex items-center justify-center">
                {settings?.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto"/>
                ) : (
                    <PartyPopper className="h-12 w-12 text-indigo-600" />
                )}
                <span className="text-3xl font-bold ml-4 text-slate-800">{settings?.companyName || 'Festa Fácil'}</span>
            </header>
            
            <main className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                {paymentStatus === 'confirmed' ? (
                    <div className="text-center">
                        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4"/>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">Pagamento Confirmado!</h1>
                        <p className="text-slate-600">Obrigado, {rental.client.name}! Recebemos a confirmação do seu pagamento.</p>
                        <p className="text-slate-600 mt-2">Entraremos em contato em breve para alinhar os detalhes finais. Agradecemos a preferência!</p>
                    </div>
                ) : paymentStatus === 'error' ? (
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-red-600 mb-2">Erro na Confirmação</h1>
                        <p className="text-slate-600">Não foi possível processar a confirmação. Por favor, tente novamente ou entre em contato conosco.</p>
                         <button onClick={() => setPaymentStatus('pending')} className="mt-6 w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700">
                            Tentar Novamente
                        </button>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Olá, {rental.client.name}!</h1>
                        <p className="text-slate-500 mb-6">Aqui estão os detalhes para o pagamento do seu aluguel para o evento de {new Date(rental.eventDate).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'long' })}.</p>
                        
                        <div className="bg-slate-50 rounded-lg p-4 mb-6">
                            <h3 className="font-semibold mb-2">Itens do Aluguel</h3>
                            <ul className="text-sm space-y-1">
                                {rental.kits?.map(k => <li key={k.id} className="flex items-center"><Package className="w-4 h-4 mr-2 text-slate-500"/>{k.name} (Kit)</li>)}
                                {rental.items.map(i => <li key={i.id} className="flex items-center"><Package className="w-4 h-4 mr-2 text-slate-500"/>{i.name} (Qtd: {i.quantity})</li>)}
                            </ul>
                            <hr className="my-3"/>
                             <div className="space-y-1 text-sm">
                                <div className="flex justify-between"><span>Total</span><span>{rental.totalValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></div>
                                <div className="flex justify-between"><span>Desconto</span><span>- {(rental.discount || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></div>
                                <div className="flex justify-between"><span>Já Pago</span><span>- {totalPaid.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></div>
                             </div>
                             <hr className="my-3"/>
                             <div className="flex justify-between items-center">
                                <span className="font-bold">Valor Pendente:</span>
                                <span className="text-2xl font-bold text-indigo-600">{balanceDue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                             </div>
                        </div>

                        {balanceDue > 0 && settings?.pixKey ? (
                            <div className="text-center">
                                <h2 className="text-xl font-semibold mb-2">Instruções para Pagamento</h2>
                                <p className="text-slate-500 mb-4">Utilize a chave PIX ou o QR Code abaixo para efetuar o pagamento.</p>
                                <div className="flex justify-center my-4">
                                    <canvas ref={qrCanvasRef} />
                                </div>
                                <div className="bg-slate-100 p-3 rounded-lg">
                                    <p className="text-sm text-slate-600">Chave PIX:</p>
                                    <p className="font-mono font-bold text-lg text-slate-800">{settings.pixKey}</p>
                                </div>

                                <button 
                                    onClick={handleConfirmPayment} 
                                    disabled={paymentStatus === 'confirming'}
                                    className="mt-6 w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                                >
                                    {paymentStatus === 'confirming' ? 'Confirmando...' : 'Já Realizei o Pagamento'}
                                </button>
                                <p className="text-xs text-slate-400 mt-2">Após pagar, clique no botão acima para nos notificar e confirmar sua reserva.</p>
                            </div>
                        ) : (
                            <div className="text-center p-4 bg-green-50 text-green-700 rounded-lg">
                                <h2 className="font-bold">Este aluguel já está totalmente pago.</h2>
                                <p>Obrigado!</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default PaymentPage;