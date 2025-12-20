
import React from 'react';

interface Props {
  images: string[];
}

const DesignGallery: React.FC<Props> = ({ images }) => {
  return (
    <div className="mt-16 space-y-12">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Your Bespoke Collection</h2>
        <p className="text-gray-500">Transforming your patterns into Nigerian fashion excellence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Option {idx + 1}</span>
              <h3 className="text-xl font-bold text-gray-800 mt-1">Stitch Vision</h3>
              <p className="text-sm text-gray-500 mt-2">Fabric integrated with master-level tailoring.</p>
              
              <button className="mt-4 w-full py-2 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-orange-50 hover:border-orange-200 transition-colors">
                Save Design
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-12">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-orange-600 font-bold hover:underline"
        >
          Design Another Fabric Pattern
        </button>
      </div>
    </div>
  );
};

export default DesignGallery;
