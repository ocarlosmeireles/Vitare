import React, { useState, useRef, useEffect } from 'react';
import { getBusinessInsights } from '../services/geminiService';
import { getRentals, getInventory, getClients } from '../services/api';
import { Sparkles, Bot, Users } from './icons';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const AIAssistant: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: 'Olá! Sou seu assistente de negócios. Como posso ajudar você a analisar seus dados hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (prompt?: string) => {
        const userMessage = prompt || input;
        if (!userMessage.trim()) return;

        setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        setInput('');
        setLoading(true);

        try {
            // Fetch all necessary data in parallel
            const [rentals, inventory, clients] = await Promise.all([
                getRentals(),
                getInventory(),
                getClients()
            ]);

            // --- Create a rich, detailed context from the data ---
            
            // 1. Popular Items
            const itemCounts = new Map<string, number>();
            rentals.forEach(rental => {
                rental.items.forEach(item => {
                    itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + 1); // Count rentals, not quantity
                });
                rental.kits?.forEach(kit => {
                     itemCounts.set(`${kit.name} (Kit)`, (itemCounts.get(`${kit.name} (Kit)`) || 0) + 1);
                });
            });
            const popularItems = [...itemCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => `${name} (${count} aluguéis)`)
                .join(', ');

            // 2. Top Clients by Value
            const clientValue = new Map<string, number>();
            rentals.forEach(rental => {
                const value = rental.totalValue - rental.discount;
                clientValue.set(rental.client.name, (clientValue.get(rental.client.name) || 0) + value);
            });
            const topClients = [...clientValue.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, value]) => `${name} (${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`)
                .join(', ');

            // 3. Monthly Revenue (last 6 months)
            const monthlyRevenue: {[key: string]: number} = {};
            const today = new Date();
            for(let i=5; i>=0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthKey = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
                monthlyRevenue[monthKey] = 0;
            }
            rentals.forEach(r => {
                r.paymentHistory.forEach(p => {
                    const paymentDate = new Date(p.date);
                    const monthKey = paymentDate.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
                    if(monthlyRevenue.hasOwnProperty(monthKey)) {
                        monthlyRevenue[monthKey] += p.amount;
                    }
                });
            });
            const revenueTrend = Object.entries(monthlyRevenue)
                .map(([key, value]) => `${key}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
                .join('; ');


            const context = `
- **Resumo Geral:**
  - Total de Itens no Estoque: ${inventory.length}
  - Total de Aluguéis Registrados: ${rentals.length}
  - Total de Clientes: ${clients.length}
- **Performance de Itens:**
  - 5 Itens Mais Populares: ${popularItems || 'N/A'}
- **Performance de Clientes:**
  - 5 Clientes Mais Valiosos: ${topClients || 'N/A'}
- **Performance Financeira:**
  - Faturamento Mensal (últimos 6 meses): ${revenueTrend || 'N/A'}
            `;
            
            const aiResponse = await getBusinessInsights(userMessage, context);
            setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            setMessages(prev => [...prev, { sender: 'ai', text: `Desculpe, não consegui processar sua solicitação. Erro: ${errorMessage}` }]);
        } finally {
            setLoading(false);
        }
    };
    
    const suggestionPrompts = [
        "Quais são meus clientes mais valiosos?",
        "Qual a tendência de faturamento?",
        "Sugira um novo kit baseado nos meus itens populares.",
        "Como posso aumentar meu lucro?"
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-150px)] bg-white rounded-xl shadow-md">
            {/* Message Area */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && (
                                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-6 h-6" />
                                </div>
                            )}
                            <div className={`p-4 rounded-2xl max-w-lg ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                             {msg.sender === 'user' && (
                                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                                    <Users className="w-6 h-6" />
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                         <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div className="p-4 rounded-2xl max-w-lg bg-slate-100 text-slate-800 rounded-bl-none">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t">
                 <div className="mb-3 flex flex-wrap gap-2">
                    {suggestionPrompts.map(prompt => (
                         <button 
                            key={prompt}
                            onClick={() => handleSend(prompt)}
                            disabled={loading}
                            className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full hover:bg-slate-200 disabled:opacity-50"
                        >
                            {prompt}
                        </button>
                    ))}
                 </div>
                 <div className="flex items-center gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
                        placeholder="Pergunte algo ao seu assistente..."
                        className="flex-1 p-3 border border-slate-300 rounded-lg"
                        disabled={loading}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={loading}
                        className="bg-indigo-600 text-white font-semibold py-3 px-5 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400"
                    >
                        Enviar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;
