
import React, { useState } from 'react';
import FabricCanvas from './components/FabricCanvas';
import GarmentForm from './components/GarmentForm';
import DesignGallery from './components/DesignGallery';
import { FashionDetails, GeneratedDesign } from './types';
import { generateFashionIdeas } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<'canvas' | 'form' | 'results'>('canvas');
  const [fabricImage, setFabricImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  
  const [details, setDetails] = useState<FashionDetails>({
    style: 'Gown',
    occasion: 'Wedding',
    audience: 'Adult',
    hairPreference: '',
    shoePreference: '',
    jewelryPreference: '',
    accessories: [],
  });

  const handlePatternSave = (base64: string) => {
    setFabricImage(base64);
    setStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async () => {
    if (!fabricImage) return;
    setLoading(true);
    try {
      const images = await generateFashionIdeas(fabricImage, details);
      setGeneratedImages(images);
      setStep('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert("Failed to generate designs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8">
      {/* Header */}
      <header className="py-8 flex flex-col items-center text-center">
        <div className="inline-block p-2 px-6 bg-orange-100 rounded-full mb-4">
          <span className="text-orange-700 font-bold text-xs uppercase tracking-[0.3em]">Ajibikes Fashion Collection</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4 tracking-tight">Ajibikes</h1>
        <p className="text-gray-500 max-w-xl text-lg italic">
          Draw your heritage. Stitch your soul. Visualize your bespoke African collection.
        </p>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* Progress Tracker */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step === 'canvas' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-600'}`}>1</div>
            <div className={`h-1 w-12 rounded ${step !== 'canvas' ? 'bg-orange-600' : 'bg-orange-100'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step === 'form' ? 'bg-orange-600 text-white' : (step === 'results' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-600')}`}>2</div>
            <div className={`h-1 w-12 rounded ${step === 'results' ? 'bg-orange-600' : 'bg-orange-100'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step === 'results' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-600'}`}>3</div>
          </div>
        </div>

        {step === 'canvas' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 italic">Create Your Pattern</h2>
              <p className="text-gray-500 mt-2">Use pencils, brushes, or upload an image to sketch your unique Ankara design.</p>
            </div>
            <FabricCanvas onSave={handlePatternSave} />
          </div>
        )}

        {step === 'form' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="mb-8 flex items-center justify-center gap-8">
               <div className="relative">
                 <img src={fabricImage!} alt="Your Pattern" className="w-24 h-24 rounded-xl shadow-lg border-2 border-orange-200 object-cover" />
                 <button onClick={() => setStep('canvas')} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border text-orange-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                 </button>
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-gray-800">Next Step: Styling</h2>
                 <p className="text-gray-500">Define the garment and accessories for your fabric.</p>
               </div>
             </div>
             <GarmentForm 
               details={details} 
               onChange={setDetails} 
               onSubmit={handleGenerate}
               isLoading={loading}
             />
          </div>
        )}

        {step === 'results' && (
          <div className="animate-in zoom-in-95 duration-700">
            <DesignGallery images={generatedImages} />
            <div className="mt-12 text-center">
               <button 
                onClick={() => setStep('canvas')}
                className="bg-orange-100 text-orange-700 px-8 py-3 rounded-full font-bold hover:bg-orange-200 transition-colors"
               >
                 Start New Creation
               </button>
            </div>
          </div>
        )}
      </main>

      {/* Background Decor */}
      <div className="fixed top-20 -left-20 w-64 h-64 bg-orange-100 rounded-full opacity-30 blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-20 -right-20 w-96 h-96 bg-red-100 rounded-full opacity-30 blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default App;
