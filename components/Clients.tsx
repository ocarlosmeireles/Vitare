
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getClients, addClient, updateClient, getRentals } from '../services/api';
import { Client, Rental, Address } from '../types';
import { PlusCircle, Calendar, DollarSign, Edit } from './icons';

const emptyAddress: Address = { cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' };
const initialFormState: Omit<Client, 'id'> = {
    type: 'pf', name: '', phone: '', email: '',
    cpf: '', birthDate: '',
    cnpj: '', legalName: '', contactName: '',
    address: emptyAddress,
    howFound: '', notes: ''
};

const ClientFormModal: React.FC<{
    onClose: () => void;
    onSave: () => void;
    clientToEdit: Client | null;
}> = ({ onClose, onSave, clientToEdit }) => {
    const [client, setClient] = useState<Omit<Client, 'id'> | Client>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCepLoading, setIsCepLoading] = useState(false);
    const [cepError, setCepError] = useState<string | null>(null);
    const numberInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (clientToEdit) {
            setClient(clientToEdit);
        } else {
            setClient(initialFormState);
        }
    }, [clientToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setClient(prev => ({ ...prev, [name]: value }));
    };

    const fetchAddressFromCEP = async (cep: string) => {
        setIsCepLoading(true);
        setCepError(null);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.ok) throw new Error('CEP não encontrado.');
            const data = await response.json();
            if (data.erro) {
                setClient(prev => ({ ...prev, address: { ...prev.address, street: '', neighborhood: '', city: '', state: '' } }));
                throw new Error('CEP inválido.');
            }

            setClient(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    street: data.logradouro || '',
                    neighborhood: data.bairro || '',
                    city: data.localidade || '',
                    state: data.uf || '',
                }
            }));
            numberInputRef.current?.focus();

        } catch (error) {
            setCepError(error instanceof Error ? error.message : "Erro ao buscar CEP.");
        } finally {
            setIsCepLoading(false);
        }
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'cep') {
            const cleanedCep = value.replace(/\D/g, '');
            setClient(prev => ({ ...prev, address: { ...prev.address, cep: cleanedCep } }));
            if (cleanedCep.length === 8) {
                fetchAddressFromCEP(cleanedCep);
            } else if (cleanedCep.length < 8) {
                setCepError(null);
            }
        } else {
            setClient(prev => ({ ...prev, address: { ...prev.address, [name]: value } }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if ('id' in client) {
                const { id, ...dataToUpdate } = client;
                await updateClient(id, dataToUpdate);
            } else {
                await addClient(client);
            }
            onSave();
        } catch (error) {
            console.error("Failed to save client", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">{clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-4">
                    {/* Tipo de Cliente */}
                    <div className="flex gap-4">
                        <label className="flex items-center">
                            <input type="radio" name="type" value="pf" checked={client.type === 'pf'} onChange={handleChange} className="h-4 w-4" />
                            <span className="ml-2">Pessoa Física</span>
                        </label>
                        <label className="flex items-center">
                            <input type="radio" name="type" value="pj" checked={client.type === 'pj'} onChange={handleChange} className="h-4 w-4" />
                            <span className="ml-2">Pessoa Jurídica</span>
                        </label>
                    </div>

                    {/* Campos Condicionais */}
                    {client.type === 'pf' ? (
                        <>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium">Nome Completo</label><input name="name" value={client.name} onChange={handleChange} className="w-full p-2 border rounded" required /></div>
                                <div><label className="block text-sm font-medium">CPF</label><input name="cpf" value={client.cpf || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                            </div>
                            <div><label className="block text-sm font-medium">Data de Nascimento</label><input type="date" name="birthDate" value={client.birthDate || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                        </>
                    ) : (
                        <>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium">Nome Fantasia</label><input name="name" value={client.name} onChange={handleChange} className="w-full p-2 border rounded" required /></div>
                                <div><label className="block text-sm font-medium">Razão Social</label><input name="legalName" value={client.legalName || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium">CNPJ</label><input name="cnpj" value={client.cnpj || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                                <div><label className="block text-sm font-medium">Nome do Contato</label><input name="contactName" value={client.contactName || ''} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                            </div>
                        </>
                    )}

                    {/* Campos Comuns */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Telefone</label><input type="tel" name="phone" value={client.phone} onChange={handleChange} className="w-full p-2 border rounded" required /></div>
                        <div><label className="block text-sm font-medium">Email</label><input type="email" name="email" value={client.email} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                    </div>
                    
                    <h3 className="font-semibold pt-2 border-t">Endereço</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                             <label className="block text-sm font-medium">CEP</label>
                             <div className="relative">
                                <input name="cep" value={client.address.cep} onChange={handleAddressChange} className="w-full p-2 border rounded" maxLength={8}/>
                                {isCepLoading && <div className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>}
                             </div>
                             {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
                        </div>
                        <div className="md:col-span-2"><label className="block text-sm font-medium">Rua</label><input name="street" value={client.address.street} onChange={handleAddressChange} className="w-full p-2 border rounded" /></div>
                    </div>
                     <div className="grid md:grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium">Número</label><input ref={numberInputRef} name="number" value={client.address.number} onChange={handleAddressChange} className="w-full p-2 border rounded" /></div>
                        <div><label className="block text-sm font-medium">Complemento</label><input name="complement" value={client.address.complement || ''} onChange={handleAddressChange} className="w-full p-2 border rounded" /></div>
                        <div><label className="block text-sm font-medium">Bairro</label><input name="neighborhood" value={client.address.neighborhood} onChange={handleAddressChange} className="w-full p-2 border rounded" /></div>
                    </div>
                     <div className="grid md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Cidade</label><input name="city" value={client.address.city} onChange={handleAddressChange} className="w-full p-2 border rounded" /></div>
                        <div><label className="block text-sm font-medium">Estado</label><input name="state" value={client.address.state} onChange={handleAddressChange} className="w-full p-2 border rounded" /></div>
                    </div>

                    <h3 className="font-semibold pt-2 border-t">Outras Informações</h3>
                     <div>
                        <label className="block text-sm font-medium">Como nos conheceu?</label>
                        <select name="howFound" value={client.howFound || ''} onChange={handleChange} className="w-full p-2 border rounded">
                            <option value="">Selecione</option>
                            <option value="indication">Indicação</option>
                            <option value="instagram">Instagram</option>
                            <option value="google">Google</option>
                            <option value="other">Outro</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Observações</label>
                        <textarea name="notes" value={client.notes || ''} onChange={handleChange} className="w-full p-2 border rounded" rows={3}></textarea>
                    </div>

                </form>
                <div className="flex justify-end gap-4 mt-6 border-t pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400">
                        {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Clients: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

    const loadData = async () => {
        setLoading(true);
        const [clientsData, rentalsData] = await Promise.all([getClients(), getRentals()]);
        setClients(clientsData.sort((a, b) => a.name.localeCompare(b.name)));
        setRentals(rentalsData);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = () => {
        setIsModalOpen(false);
        setClientToEdit(null);
        loadData();
    };

    const handleEdit = (client: Client) => {
        setClientToEdit(client);
        setIsModalOpen(true);
    };

    const clientRentals = useMemo(() => {
        if (!selectedClient) return [];
        return rentals
            .filter(r => r.client.id === selectedClient.id)
            .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
    }, [selectedClient, rentals]);

    const clientTotalValue = useMemo(() => {
        return clientRentals.reduce((sum, rental) => sum + (rental.totalValue - rental.discount), 0);
    }, [clientRentals]);


    if (loading) return <div className="text-center p-8">Carregando clientes...</div>;

    return (
        <>
            {isModalOpen && <ClientFormModal onClose={() => { setIsModalOpen(false); setClientToEdit(null); }} onSave={handleSave} clientToEdit={clientToEdit} />}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Client List */}
                <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-md flex flex-col h-[calc(100vh-120px)]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Clientes ({clients.length})</h2>
                        <button onClick={() => { setClientToEdit(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-indigo-700 flex items-center">
                            <PlusCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Nome</th>
                                    <th className="px-4 py-2">Documento</th>
                                    <th className="px-4 py-2">Telefone</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(client => (
                                    <tr key={client.id} onClick={() => setSelectedClient(client)} className={`cursor-pointer hover:bg-slate-100 ${selectedClient?.id === client.id ? 'bg-indigo-50' : ''}`}>
                                        <td className="px-4 py-2 font-medium">{client.name}</td>
                                        <td className="px-4 py-2 text-slate-600">{client.type === 'pf' ? client.cpf : client.cnpj}</td>
                                        <td className="px-4 py-2 text-slate-600">{client.phone}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Client Details */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md h-[calc(100vh-120px)] overflow-y-auto">
                    {selectedClient ? (
                        <div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{selectedClient.name}</h2>
                                    <p className="text-slate-500">{selectedClient.type === 'pf' ? `CPF: ${selectedClient.cpf || 'Não informado'}` : `CNPJ: ${selectedClient.cnpj || 'Não informado'}`}</p>
                                </div>
                                <button onClick={() => handleEdit(selectedClient)} className="flex items-center text-sm bg-slate-200 text-slate-700 px-3 py-1 rounded-md hover:bg-slate-300">
                                    <Edit className="w-4 h-4 mr-1"/> Editar
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 my-6">
                                <div className="bg-slate-50 p-4 rounded-lg"><p className="text-sm text-slate-500 font-medium flex items-center"><Calendar className="w-4 h-4 mr-2"/> Aluguéis Totais</p><p className="text-2xl font-bold">{clientRentals.length}</p></div>
                                <div className="bg-slate-50 p-4 rounded-lg"><p className="text-sm text-slate-500 font-medium flex items-center"><DollarSign className="w-4 h-4 mr-2"/> Valor Total Gasto</p><p className="text-2xl font-bold">{clientTotalValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p></div>
                            </div>
                            
                            <div className="space-y-4">
                                <div><h3 className="font-semibold border-b pb-1">Informações</h3>
                                <div className="text-sm mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                                     {selectedClient.type === 'pj' && (<>
                                        <p className="text-slate-500">Razão Social:</p><p className="text-slate-800">{selectedClient.legalName || 'N/A'}</p>
                                        <p className="text-slate-500">Contato:</p><p className="text-slate-800">{selectedClient.contactName || 'N/A'}</p>
                                     </>)}
                                    <p className="text-slate-500">Telefone:</p><p className="text-slate-800">{selectedClient.phone}</p>
                                    <p className="text-slate-500">Email:</p><p className="text-slate-800">{selectedClient.email}</p>
                                     {selectedClient.type === 'pf' && (<>
                                        <p className="text-slate-500">Nascimento:</p><p className="text-slate-800">{selectedClient.birthDate ? new Date(selectedClient.birthDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}</p>
                                     </>)}
                                </div>
                                </div>
                                <div><h3 className="font-semibold border-b pb-1">Endereço</h3>
                                 <p className="text-sm mt-2 text-slate-800">
                                    {selectedClient.address.street}, {selectedClient.address.number} {selectedClient.address.complement && `- ${selectedClient.address.complement}`} <br/>
                                    {selectedClient.address.neighborhood} - {selectedClient.address.city}/{selectedClient.address.state}<br/>
                                    CEP: {selectedClient.address.cep}
                                 </p>
                                </div>
                                <div><h3 className="font-semibold border-b pb-1">Observações</h3>
                                 <p className="text-sm mt-2 text-slate-800 italic">{selectedClient.notes || 'Nenhuma observação.'}</p>
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold mt-6 mb-4">Histórico de Aluguéis</h3>
                            <div className="space-y-3">
                                {clientRentals.map(rental => (
                                    <div key={rental.id} className="bg-slate-50 p-4 rounded-lg border-l-4 border-indigo-400">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold">Evento: {new Date(rental.eventDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                                            <p className="font-bold text-indigo-600">{(rental.totalValue - rental.discount).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-slate-500 text-lg">Selecione um cliente para ver os detalhes</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Clients;
