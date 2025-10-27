
import React, { useState } from 'react';
import { generatePartyThemeIdeas } from '../services/geminiService';
import { PartyThemeSuggestion } from '../types';
import { Wand2, CheckCircle, Palette, Gift, List } from './icons';

const ThemeGenerator: React.FC = () => {
  const [keywords, setKeywords] = useState('');
  const [suggestions, setSuggestions] = useState<PartyThemeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      setError('Por favor, insira algumas palavras-chave.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const result = await generatePartyThemeIdeas(keywords);
      setSuggestions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Gerador de Temas com IA</h2>
        <p className="text-slate-500 mb-4">
          Sem ideias para a próxima festa? Descreva o que você imagina (ex: "menina 5 anos princesa rosa") e deixe a IA criar temas incríveis para você.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Ex: menino 3 anos dinossauros floresta"
            className="flex-grow p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            disabled={loading}
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Gerando...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Gerar Ideias
              </>
            )}
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {loading && (
        <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-md animate-pulse">
                    <div className="h-7 bg-slate-200 rounded w-1/2 mb-4"></div>
                    <div className="h-5 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-6">
          {suggestions.map((theme, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
              <h3 className="text-2xl font-bold text-indigo-700 mb-3 flex items-center">
                <Gift className="w-6 h-6 mr-2" />
                {theme.themeName}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold text-slate-700 mb-2 flex items-center"><Palette className="w-5 h-5 mr-2 text-slate-500"/> Paleta de Cores</h4>
                    <p className="text-slate-600">{theme.colorPalette}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-slate-700 mb-2 flex items-center"><List className="w-5 h-5 mr-2 text-slate-500"/> Itens Essenciais</h4>
                    <ul className="list-none space-y-1">
                        {theme.rentalItems.map((item, i) => (
                        <li key={i} className="flex items-center text-slate-600">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                            {item}
                        </li>
                        ))}
                    </ul>
                </div>
                <div className="md:col-span-2">
                    <h4 className="font-semibold text-slate-700 mb-2 flex items-center"><Wand2 className="w-5 h-5 mr-2 text-slate-500"/> Ideias de Decoração</h4>
                     <ul className="list-none space-y-1">
                        {theme.decorationIdeas.map((idea, i) => (
                        <li key={i} className="flex items-start text-slate-600">
                            <span className="text-indigo-500 mr-2 mt-1">&#8226;</span>
                            <span>{idea}</span>
                        </li>
                        ))}
                    </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeGenerator;
