
export type GarmentStyle = 'Gown' | 'Peplum' | 'Straight Gown' | 'Ball Dress' | 'Pants & Jacket' | 'Traditional Set' | 'Buba & Iro';
export type Occasion = 'Party' | 'Gala Event' | 'Graduation' | 'Get Together' | 'Wedding' | 'Office';
export type Audience = 'Adult' | 'Child';

export interface FashionDetails {
  style: GarmentStyle;
  occasion: Occasion;
  audience: Audience;
  age?: string;
  hairPreference: string;
  shoePreference: string;
  jewelryPreference: string;
  accessories: string[];
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
  tool: 'pencil' | 'brush' | 'eraser' | 'watercolor' | 'fill' | 'text' | 'shape';
  shapeType?: 'circle' | 'square' | 'line';
}
