
import React, { useState, useEffect } from 'react';
import { getCompanySettings, updateCompanySettings } from '../services/api';
import { CompanySettings as CompanySettingsType } from '../types';
import { Save } from './icons';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<Omit<CompanySettingsType, 'id'>>({
        companyName: '',
        cnpj: '',
        address: '',
        logoUrl: '',
        pixKey: '',
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            const fetchedSettings = await getCompanySettings();
            if (fetchedSettings) {
                const { id, ...data } = fetchedSettings;
                setSettings(data);
            }
            setLoading(false);
        };
        loadSettings();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveStatus('idle');
        try {
            await updateCompanySettings(settings);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error("Failed to save settings", error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center p-8">Carregando configurações...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Informações da Empresa</h2>
                    <p className="text-slate-500 mt-1">Estes dados serão usados nos contratos e no catálogo público.</p>
                </div>

                <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa</label>
                    <input
                        type="text"
                        name="companyName"
                        id="companyName"
                        value={settings.companyName}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                </div>

                <div>
                    <label htmlFor="cnpj" className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                    <input
                        type="text"
                        name="cnpj"
                        id="cnpj"
                        value={settings.cnpj}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                </div>

                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                    <input
                        type="text"
                        name="address"
                        id="address"
                        value={settings.address}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                </div>
                 <div>
                    <label htmlFor="logoUrl" className="block text-sm font-medium text-slate-700 mb-1">URL do Logotipo</label>
                    <input
                        type="text"
                        name="logoUrl"
                        id="logoUrl"
                        value={settings.logoUrl}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                </div>
                {settings.logoUrl && (
                    <div className="text-center bg-slate-50 p-4 rounded-lg">
                         <p className="text-sm font-medium text-slate-600 mb-2">Pré-visualização do Logo:</p>
                        <img src={settings.logoUrl} alt="Pré-visualização do logo" className="max-h-24 mx-auto"/>
                    </div>
                )}
                 <div>
                    <label htmlFor="pixKey" className="block text-sm font-medium text-slate-700 mb-1">Chave PIX</label>
                    <input
                        type="text"
                        name="pixKey"
                        id="pixKey"
                        value={settings.pixKey || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                        placeholder="Ex: CNPJ, e-mail, telefone ou chave aleatória"
                    />
                     <p className="text-xs text-slate-500 mt-1">Esta chave será exibida para seus clientes na página de pagamento.</p>
                </div>


                <div className="flex justify-end items-center gap-4 pt-4 border-t">
                    {saveStatus === 'success' && <p className="text-sm text-green-600">Configurações salvas com sucesso!</p>}
                    {saveStatus === 'error' && <p className="text-sm text-red-600">Falha ao salvar. Tente novamente.</p>}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;