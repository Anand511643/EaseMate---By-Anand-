import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const predictCost = async (serviceType: string, description: string, district: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert cost estimator for home services in Bihar, India. 
      Based on the following details, provide a realistic estimated cost range in Indian Rupees (₹).
      
      Service Type: ${serviceType}
      Location: ${district}, Bihar
      Problem Description: ${description}
      
      Consider current market rates in Tier-2/Tier-3 cities of Bihar like Patna, Purnia, etc.
      Provide the response in JSON format with the following structure:
      {
        "estimatedRange": "₹XXX - ₹YYY",
        "explanation": "Brief explanation of why this cost is estimated (e.g., parts, labor time).",
        "tips": "One or two tips for the customer to save money or prepare for the technician."
      }`,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Prediction Error:", error);
    return {
      estimatedRange: "Unable to estimate",
      explanation: "There was an error connecting to the AI estimator.",
      tips: "Try describing the problem in more detail."
    };
  }
};

export const generateTechnicianResponse = async (
  serviceType: string,
  userMessage: string,
  currentPrice: number,
  counterPrice: number | null,
  district: string,
  chatHistory: { sender: string, content: string }[]
) => {
  try {
    const historyStr = chatHistory.map(m => `${m.sender}: ${m.content}`).join('\n');
    const prompt = `You are a professional technician in Bihar, India. You are chatting with a customer in Hinglish (Hindi + English).
    
    Context:
    Service: ${serviceType}
    Location: ${district}
    Current Negotiated Price: ₹${currentPrice}
    Customer's Counter Offer: ${counterPrice ? `₹${counterPrice}` : 'None'}
    
    Chat History:
    ${historyStr}
    
    Customer's Latest Message: "${userMessage}"
    
    Rules:
    1. Respond in Hinglish (e.g., "Theek hai", "Mei kar dunga", "Thoda kam hai").
    2. Be professional but friendly.
    3. If the customer is bargaining (counterPrice is provided), you can either agree, disagree, or give a counter-offer.
    4. If you give a counter-offer, it should be a number between the current price and the customer's offer.
    5. If you agree, say it clearly.
    6. Your response MUST be in JSON format:
    {
      "message": "Your Hinglish response here",
      "proposedPrice": number (the price you are proposing or agreeing to),
      "isAgreement": boolean (true if you are agreeing to the customer's price or if you think the deal is done)
    }
    
    Example responses:
    - "₹600 thoda kam hai sir, ₹750 me done karte hain?" (isAgreement: false)
    - "Theek hai, ₹700 me kar dunga. Kab aana hai?" (isAgreement: true)
    - "Mei aapki kya madad kar sakta hoon?" (isAgreement: false)`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Negotiation Error:", error);
    return null;
  }
};
