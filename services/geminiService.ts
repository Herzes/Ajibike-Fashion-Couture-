
import { GoogleGenAI } from "@google/genai";
import { FashionDetails } from "../types";

export const generateFashionIdeas = async (
  fabricBase64: string,
  details: FashionDetails
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const audienceText = details.audience === 'Child' ? `a young African child aged ${details.age || '5-10'}` : 'a stylish Nigerian woman/celebrity';
  
  const prompt = `
    Transform the attached hand-drawn African fabric pattern into a realistic, high-fashion ${details.style} for ${audienceText}. 
    Occasion: ${details.occasion}.
    Styling Details:
    - Hair: ${details.hairPreference}
    - Shoes: ${details.shoePreference}
    - Jewelry: ${details.jewelryPreference}
    - Accessories: ${details.accessories.join(', ')}
    
    The final image should feature a full-body view of a model or high-quality mannequin wearing a garment made FROM THE EXACT FABRIC PATTERN provided. 
    The theme is vibrant African (Ankara) fashion. Use real-life lighting, professional photography style, and showcase the fabric's texture.
  `;

  const results: string[] = [];

  // Generate 4 ideas by making multiple requests to get distinct variations
  const generationPromises = Array(4).fill(null).map(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: fabricBase64.split(',')[1],
                mimeType: 'image/png',
              },
            },
            { text: prompt },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      return null;
    }
    return null;
  });

  const resolvedImages = await Promise.all(generationPromises);
  return resolvedImages.filter((img): img is string => img !== null);
};
