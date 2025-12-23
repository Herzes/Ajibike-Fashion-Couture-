
import React from 'react';
import { GARMENT_STYLES, OCCASIONS, ACCESSORIES } from '../constants';
import { FashionDetails, GarmentStyle, Occasion, Audience } from '../types';

interface Props {
  details: FashionDetails;
  onChange: (details: FashionDetails) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const GarmentForm: React.FC<Props> = ({ details, onChange, onSubmit, isLoading }) => {
  const updateField = <K extends keyof FashionDetails>(field: K, value: FashionDetails[K]) => {
    onChange({ ...details, [field]: value });
  };

  const toggleAccessory = (acc: string) => {
    const newAccs = details.accessories.includes(acc)
      ? details.accessories.filter(a => a !== acc)
      : [...details.accessories, acc];
    updateField('accessories', newAccs);
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-orange-100 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center italic">Tailor Your Vision</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Style Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-orange-800 uppercase tracking-widest">Garment Style</label>
          <div className="grid grid-cols-2 gap-2">
            {GARMENT_STYLES.map(style => (
              <button
                key={style}
                onClick={() => updateField('style', style as GarmentStyle)}
                className={`p-3 rounded-xl border-2 text-sm transition-all ${details.style === style ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-100 hover:border-orange-200'}`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Occasion Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-orange-800 uppercase tracking-widest">The Occasion</label>
          <select 
            value={details.occasion}
            onChange={(e) => updateField('occasion', e.target.value as Occasion)}
            className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-orange-400 focus:ring-0 text-gray-700 bg-white"
          >
            {OCCASIONS.map(occ => <option key={occ} value={occ}>{occ}</option>)}
          </select>

          <label className="block text-sm font-bold text-orange-800 uppercase tracking-widest mt-6">Target Audience</label>
          <div className="flex gap-2">
            {(['Male', 'Female', 'Child'] as Audience[]).map(aud => (
              <button
                key={aud}
                onClick={() => updateField('audience', aud)}
                className={`flex-1 p-3 rounded-xl border-2 text-sm transition-all ${details.audience === aud ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-white text-gray-700 border-gray-100 hover:border-orange-200'}`}
              >
                {aud}
              </button>
            ))}
          </div>
          {details.audience === 'Child' && (
            <input 
              type="text"
              placeholder="Child's Age (e.g., 5 years old)"
              className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-orange-400 mt-2 outline-none"
              value={details.age || ''}
              onChange={(e) => updateField('age', e.target.value)}
            />
          )}
        </div>

        {/* Styling Preferences */}
        <div className="space-y-4 md:col-span-2">
          <h3 className="font-bold text-lg text-gray-800 border-b border-orange-100 pb-2">Styling & Finish</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Hair Preference</label>
              <input 
                type="text" placeholder="e.g. Braids with gold cuffs"
                className="w-full p-3 bg-gray-50 rounded-lg mt-1 border-transparent focus:bg-white focus:border-orange-400 transition-all outline-none"
                value={details.hairPreference}
                onChange={(e) => updateField('hairPreference', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Shoes</label>
              <input 
                type="text" placeholder="e.g. Emerald high heels"
                className="w-full p-3 bg-gray-50 rounded-lg mt-1 border-transparent focus:bg-white focus:border-orange-400 transition-all outline-none"
                value={details.shoePreference}
                onChange={(e) => updateField('shoePreference', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Jewelry</label>
              <input 
                type="text" placeholder="e.g. Chunky beaded necklace"
                className="w-full p-3 bg-gray-50 rounded-lg mt-1 border-transparent focus:bg-white focus:border-orange-400 transition-all outline-none"
                value={details.jewelryPreference}
                onChange={(e) => updateField('jewelryPreference', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Accessories */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-orange-800 uppercase tracking-widest mb-4">Add Accessories</label>
          <div className="flex flex-wrap gap-2">
            {ACCESSORIES.map(acc => (
              <button
                key={acc}
                onClick={() => toggleAccessory(acc)}
                className={`px-6 py-2 rounded-full border-2 text-sm transition-all ${details.accessories.includes(acc) ? 'bg-orange-100 border-orange-600 text-orange-800' : 'bg-white border-gray-100 text-gray-600 hover:border-orange-200'}`}
              >
                {acc}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Info Box */}
        <div className="md:col-span-2 space-y-2 mt-4">
          <label className="block text-sm font-bold text-orange-800 uppercase tracking-widest">Additional Designer Notes</label>
          <p className="text-xs text-stone-400 italic">Describe any specific variations, silhouettes, or cultural nuances you'd like the AI to capture.</p>
          <textarea
            rows={4}
            placeholder="e.g. Make the sleeves flared with lace trimmings, ensure a floor-length silhouette, or add a modern twist to the traditional headwrap..."
            className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-orange-400 transition-all outline-none resize-none text-gray-700"
            value={details.additionalInfo || ''}
            onChange={(e) => updateField('additionalInfo', e.target.value)}
          />
        </div>
      </div>

      <div className="mt-12 flex justify-center">
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className={`relative overflow-hidden group bg-black text-white px-12 py-4 rounded-full font-bold text-lg shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100`}
        >
          <span className={isLoading ? 'opacity-0' : 'opacity-100'}>Generate Fashion Collection</span>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default GarmentForm;
