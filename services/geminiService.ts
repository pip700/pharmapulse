import { GoogleGenAI } from "@google/genai";
import { Medicine, Sale } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const geminiService = {
  // Analyze stock and sales to give profit tips
  getBusinessInsights: async (sales: Sale[], inventory: Medicine[]): Promise<string> => {
    const client = getClient();
    if (!client) return "Please configure your API Key to get AI insights.";

    // Summarize data for the prompt to save tokens
    const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalProfit = sales.reduce((acc, s) => acc + s.totalProfit, 0);
    const lowStockItems = inventory.filter(m => m.stock < m.threshold).map(m => m.name).join(', ');
    
    const prompt = `
      Act as a senior business consultant for a pharmacy. 
      Here is the current snapshot:
      - Total Sales (All time): $${totalSales.toFixed(2)}
      - Total Profit (All time): $${totalProfit.toFixed(2)}
      - Items currently low in stock: ${lowStockItems || 'None'}
      
      Provide 3 actionable, short, and concise tips to improve profitability and efficiency based on this data.
      Format as a simple bulleted list.
    `;

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "No insights generated.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Unable to generate insights at this moment.";
    }
  },

  // Answer generic medical questions for the assistant
  askAssistant: async (query: string): Promise<string> => {
    const client = getClient();
    if (!client) return "AI Service Unavailable.";

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a helpful pharmacy assistant. Answer this query briefly and professionally (max 50 words): "${query}"`,
      });
      return response.text || "No response.";
    } catch (error) {
      return "Error connecting to assistant.";
    }
  }
};
