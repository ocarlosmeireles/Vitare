
import { GoogleGenAI, Type } from "@google/genai";
import { PartyThemeSuggestion } from '../types';

// IMPORTANT: The API key is injected automatically from environment variables.
// Do not add any code to handle the API key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        themeName: {
          type: Type.STRING,
          description: 'O nome criativo do tema da festa.',
        },
        colorPalette: {
          type: Type.STRING,
          description: 'Uma paleta de 3 a 5 cores que combinam com o tema. Ex: "Rosa, Dourado, Branco".',
        },
        decorationIdeas: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: 'Uma lista de 3 ideias criativas para a decoração da festa.'
        },
        rentalItems: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: 'Uma lista de 5 a 7 itens de "pegue e monte" essenciais para este tema.',
        },
      },
      required: ["themeName", "colorPalette", "decorationIdeas", "rentalItems"],
    },
};

export const generatePartyThemeIdeas = async (keywords: string): Promise<PartyThemeSuggestion[]> => {
    try {
        const prompt = `
            Você é um especialista em decoração de festas 'pegue e monte'.
            Baseado nas seguintes palavras-chave: "${keywords}", gere 3 ideias de temas para festas.
            Para cada tema, forneça um nome, uma paleta de cores, ideias de decoração e uma lista de itens de aluguel essenciais.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.8,
            },
        });
        
        const jsonText = response.text.trim();
        const suggestions: PartyThemeSuggestion[] = JSON.parse(jsonText);
        return suggestions;

    } catch (error) {
        console.error("Error generating party themes:", error);
        throw new Error("Não foi possível gerar as ideias de temas. Tente novamente.");
    }
};

export const getBusinessInsights = async (userPrompt: string, dataContext: string): Promise<string> => {
    try {
        const fullPrompt = `
            Você é um consultor de negócios especialista em empresas de aluguel de itens para festas "pegue e monte".
            Analise o contexto de dados fornecido e responda à pergunta do usuário de forma clara, objetiva e com insights práticos.

            **Contexto dos Dados da Empresa:**
            ${dataContext}

            **Pergunta do Usuário:**
            "${userPrompt}"

            **Sua Resposta (em markdown):**
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro", // Using a more powerful model for analysis
            contents: fullPrompt,
            config: {
                temperature: 0.5,
            },
        });
        
        return response.text.trim();

    } catch (error) {
        console.error("Error getting business insights:", error);
        throw new Error("Não foi possível obter a análise da IA. Tente novamente.");
    }
};
