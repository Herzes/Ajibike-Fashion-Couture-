
export type GarmentStyle = 'Gown' | 'Peplum' | 'Straight Gown' | 'Ball Dress' | 'Pants & Jacket' | 'Traditional Set' | 'Buba & Iro';
export type Occasion = 'Party' | 'Gala Event' | 'Graduation' | 'Get Together' | 'Wedding' | 'Office';
export type Audience = 'Male' | 'Female' | 'Child';

export interface FashionDetails {
  style: GarmentStyle;
  occasion: Occasion;
  audience: Audience;
  age?: string;
  hairPreference: string;
  shoePreference: string;
  jewelryPreference: string;
  accessories: string[];
  additionalInfo?: string;
}

export interface GeneratedDesign {
  id: string;
  imageUrl: string;
  description: string;
}

export interface CanvasState {
  color: string;
  brushSize: number;
  opacity: number;
  hardness: number;
  tool: 'pencil' | 'brush' | 'eraser' | 'watercolor' | 'fill' | 'text' | 'shape' | 'stamp';
  shapeType?: 'circle' | 'square' | 'line';
}
