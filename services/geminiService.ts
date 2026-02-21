
import { GoogleGenAI } from "@google/genai";
import { Expense, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getFinancialInsights(expenses: Expense[], categories: Category[]) {
  const model = "gemini-3-flash-preview";
  
  const summary = expenses.map(e => {
    const cat = categories.find(c => c.id === e.categoryId);
    return `${e.date}: ${e.amount}€ - ${cat?.name || 'Sconosciuta'} (${e.description})`;
  }).join('\n');

  const prompt = `Analizza queste spese familiari recenti e fornisci un breve commento (max 3 punti elenco) su come risparmiare o sulle tendenze osservate. Sii incoraggiante e pratico. Usa l'italiano.\n\nSpese:\n${summary}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: "Sei un esperto consulente finanziario per famiglie. Analizzi i dati e offri consigli brevi e utili.",
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Errore nell'analisi Gemini:", error);
    return "Non è stato possibile generare analisi in questo momento.";
  }
}
