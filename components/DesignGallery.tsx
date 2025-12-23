
import React from 'react';

interface Props {
  images: string[];
  onRefresh: () => void;
  isLoading: boolean;
}

const DesignGallery: React.FC<Props> = ({ images, onRefresh, isLoading }) => {
  return (
    <div className="mt-16 space-y-12 animate-in fade-in duration-700">
      <div className="text-center relative">
        <h2 className="text-4xl font-bold text-gray-900 mb-2 italic">Your Bespoke Collection</h2>
        <p className="text-gray-500 mb-6">Masterfully tailored Nigerian fashion excellence</p>
        
        {/* Refresh Action */}
        <div className="flex justify-center">
          <button 
            onClick={onRefresh}
            disabled={isLoading}
            className={`group flex items-center gap-3 px-6 py-2.5 rounded-full border-2 border-orange-200 text-orange-700 font-black uppercase text-xs tracking-widest transition-all hover:bg-orange-600 hover:text-white hover:border-orange-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-700 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} 
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              <path d="M12 7V2l5 5-5 5V7z" />
            </svg>
            {isLoading ? 'Regenerating Vision...' : 'Regenerate Collection'}
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 transition-opacity duration-300 ${isLoading ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
        {images.map((img, idx) => (
          <div key={idx} className="group relative bg-white rounded-3xl overflow-hidden shadow-xl border border-orange-50 transition-all hover:shadow-2xl hover:-translate-y-2">
            <div className="aspect-[3/4] overflow-hidden">
              <img 
                src={img} 
                alt={`Design Idea ${idx + 1}`} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="p-6">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Variation {idx + 1}</span>
              <h3 className="text-xl font-bold text-gray-800 mt-1">Stitch Vision</h3>
              <p className="text-sm text-gray-500 mt-2 italic">Fabric integrated with master-level tailoring.</p>
              
              <button className="mt-4 w-full py-3 rounded-xl border-2 border-stone-100 text-xs font-black uppercase tracking-widest hover:bg-orange-50 hover:border-orange-200 transition-all">
                Save Design
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-12 gap-6">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-stone-400 font-black text-xs uppercase tracking-widest hover:text-orange-600 transition-colors"
        >
          Return to Studio
        </button>
      </div>
    </div>
  );
};

export default DesignGallery;
