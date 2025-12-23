
import { GoogleGenAI } from "@google/genai";
import { FashionDetails } from "../types";

const STYLE_CATEGORIES = {
  "casual_chic_women": {
    "positive_template": "Full-body fashion editorial of a woman wearing a distinct two-piece outfit. TOP: A fitted crop top made of [Ankara_Pattern] wax print fabric. BOTTOM: A high-waisted, floor-length wrap skirt constructed from authentic [Aso_Oke_Texture] woven fabric. OUTERWEAR: A light-wash denim jacket draped over the shoulders. FEET: Leather ankle boots. Ensure sharp garment edges and no fabric bleeding.",
    "negative_prompt": "pants, trousers, leggings, jumpsuit, merged patterns, dots on woven fabric, blurry textile, distorted limbs, fused clothing, messy seams",
    "material_descriptors": ["stiff woven ribs", "vibrant wax print", "heavy textile"]
  },
  "business_casual_men": {
    "positive_template": "A sharp, professional Adire suit with a subtle indigo resist-dye pattern. LAYER: A crisp solid-colored shirt underneath. OUTERWEAR: A heavy tailored wool overcoat. The suit features distinct lapels and structured shoulders. Professional studio lighting.",
    "negative_prompt": "hoodie, sweatshirt, baggy clothes, sneakers, casual denim, mismatched patterns, messy dye, low resolution",
    "material_descriptors": ["tailored cotton", "heavy wool", "indigo dye"]
  }
};

const GLOBAL_QUALITY_SHORTHAND = "8k resolution, high-fashion photography, photorealistic, depth of field, sharp focus on fabric weave";

export const generateFashionIdeas = async (
  fabricBase64: string,
  details: FashionDetails
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  let basePrompt = '';
  let negativePrompt = '';
  let descriptors = '';

  if (details.audience === 'Female') {
    const config = STYLE_CATEGORIES.casual_chic_women;
    basePrompt = config.positive_template.replace('[Ankara_Pattern]', 'the attached hand-drawn pattern');
    basePrompt = basePrompt.replace('[Aso_Oke_Texture]', 'complementary texturized');
    negativePrompt = config.negative_prompt;
    descriptors = config.material_descriptors.join(', ');
  } else if (details.audience === 'Male') {
    const config = STYLE_CATEGORIES.business_casual_men;
    basePrompt = config.positive_template;
    negativePrompt = config.negative_prompt;
    descriptors = config.material_descriptors.join(', ');
  } else {
    // Fallback for Child or generic
    basePrompt = `Full-body fashion portrait of a child wearing a vibrant ${details.style} made from the attached fabric pattern.`;
    negativePrompt = "blurry, distorted, low quality";
    descriptors = "vibrant wax print, soft cotton";
  }

  const prompt = `
    ${basePrompt}
    
    Style Overrides:
    - Silhouette: ${details.style}
    - Occasion: ${details.occasion}
    - Hair: ${details.hairPreference}
    - Shoes: ${details.shoePreference}
    - Jewelry: ${details.jewelryPreference}
    - Accessories: ${details.accessories.join(', ')}
    ${details.additionalInfo ? `- Extra Notes: ${details.additionalInfo}` : ''}
    
    Materials & Quality:
    - ${descriptors}
    - ${GLOBAL_QUALITY_SHORTHAND}
    
    Constraint (VERY IMPORTANT): The garment MUST use the colors and pattern seen in the attached image for the main textile parts.
    
    AVOID: ${negativePrompt}
  `;

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
