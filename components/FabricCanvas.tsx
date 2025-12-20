
import React, { useRef, useEffect, useState } from 'react';
import { AFRICAN_PALETTE } from '../constants';
import { CanvasState } from '../types';

interface Props {
  onSave: (base64: string) => void;
}

type SymmetryMode = 'none' | 'horizontal' | 'vertical' | 'quad';

const STAMPS = [
  { id: 'dot', path: 'M 0 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0', label: 'Dot' },
  { id: 'triangle', path: 'M 5 0 L 10 10 L 0 10 Z', label: 'Triangle' },
  { id: 'diamond', path: 'M 5 0 L 10 5 L 5 10 L 0 5 Z', label: 'Diamond' },
  { id: 'zigzag', path: 'M 0 5 L 2.5 0 L 7.5 10 L 10 5', label: 'Zigzag' },
];

const FabricCanvas: React.FC<Props> = ({ onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [overlayCtx, setOverlayCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [symmetry, setSymmetry] = useState<SymmetryMode>('none');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [customText, setCustomText] = useState("AJIBIKE");

  const [config, setConfig] = useState<CanvasState & { stamp: string | null }>({
    color: AFRICAN_PALETTE[0],
    brushSize: 15,
    opacity: 100,
    hardness: 80,
    tool: 'brush',
    stamp: null,
    shapeType: 'circle'
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (canvas && overlay) {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const oContext = overlay.getContext('2d');
      if (context && oContext) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        setCtx(context);
        setOverlayCtx(oContext);
      }
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return { x: 0, y: 0 };
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const x = Math.floor(startX);
    const y = Math.floor(startY);
    
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;

    const basePos = (y * canvas.width + x) * 4;
    const startR = data[basePos];
    const startG = data[basePos + 1];
    const startB = data[basePos + 2];

    const tempDiv = document.createElement('div');
    tempDiv.style.color = fillColor;
    document.body.appendChild(tempDiv);
    const rgb = window.getComputedStyle(tempDiv).color.match(/\d+/g)!.map(Number);
    document.body.removeChild(tempDiv);
    const [fr, fg, fb] = rgb;

    if (Math.abs(startR - fr) < 2 && Math.abs(startG - fg) < 2 && Math.abs(startB - fb) < 2) return;

    const stack: [number, number][] = [[x, y]];
    const seen = new Uint8Array(canvas.width * canvas.height);

    while (stack.length) {
      const [curX, curY] = stack.pop()!;
      if (curX < 0 || curX >= canvas.width || curY < 0 || curY >= canvas.height) continue;
      
      const idx = curY * canvas.width + curX;
      if (seen[idx]) continue;
      
      const pos = idx * 4;
      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];

      if (Math.abs(r - startR) < 15 && Math.abs(g - startG) < 15 && Math.abs(b - startB) < 15) {
        data[pos] = fr;
        data[pos + 1] = fg;
        data[pos + 2] = fb;
        data[pos + 3] = 255;
        seen[idx] = 1;
        
        stack.push([curX + 1, curY]);
        stack.push([curX - 1, curY]);
        stack.push([curX, curY + 1]);
        stack.push([curX, curY - 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const drawShape = (context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, isFinal: boolean) => {
    context.strokeStyle = config.tool === 'eraser' ? '#ffffff' : config.color;
    context.fillStyle = config.tool === 'eraser' ? '#ffffff' : config.color;
    context.lineWidth = config.brushSize;
    context.globalAlpha = config.opacity / 100;

    const draw = (cx: number, cy: number, cw: number, ch: number) => {
      if (config.shapeType === 'circle') {
        const radius = Math.sqrt(Math.pow(cw - cx, 2) + Math.pow(ch - cy, 2));
        context.beginPath();
        context.arc(cx, cy, radius, 0, 2 * Math.PI);
        context.stroke();
      } else if (config.shapeType === 'square') {
        context.strokeRect(cx, cy, cw - cx, ch - cy);
      } else if (config.shapeType === 'line') {
        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(cw, ch);
        context.stroke();
      } else if (config.tool === 'text') {
        context.font = `bold ${config.brushSize * 2}px Outfit`;
        context.fillText(customText, cw, ch);
      }
    };

    draw(x1, y1, x2, y2);
    
    if (isFinal) {
      const { width, height } = canvasRef.current!;
      if (symmetry === 'horizontal' || symmetry === 'quad') draw(width - x1, y1, width - x2, y2);
      if (symmetry === 'vertical' || symmetry === 'quad') draw(x1, height - y1, x2, height - y2);
      if (symmetry === 'quad') draw(width - x1, height - y1, width - x2, height - y2);
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.cancelable) e.preventDefault();
    const pos = getPos(e);
    setStartPos(pos);
    setIsDrawing(true);

    if (config.tool === 'fill') {
      floodFill(pos.x, pos.y, config.color);
      setIsDrawing(false);
      return;
    }

    if (config.tool === 'text') {
      drawShape(ctx!, pos.x, pos.y, pos.x, pos.y, true);
      setIsDrawing(false);
      return;
    }

    if (config.tool !== 'shape') {
      applySymmetry(pos.x, pos.y, false);
      if (config.stamp) {
        applySymmetry(pos.x, pos.y, true);
        setIsDrawing(false);
      }
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if ('touches' in e && e.cancelable) e.preventDefault();
    const pos = getPos(e);

    if (config.tool === 'shape') {
      overlayCtx?.clearRect(0, 0, overlayCanvasRef.current!.width, overlayCanvasRef.current!.height);
      drawShape(overlayCtx!, startPos.x, startPos.y, pos.x, pos.y, false);
    } else if (config.tool !== 'fill' && !config.stamp) {
      applySymmetry(pos.x, pos.y, true);
    }
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    
    if (config.tool === 'shape') {
      overlayCtx?.clearRect(0, 0, overlayCanvasRef.current!.width, overlayCanvasRef.current!.height);
      drawShape(ctx!, startPos.x, startPos.y, pos.x, pos.y, true);
    }

    setIsDrawing(false);
    if (ctx) ctx.beginPath();
  };

  const applySymmetry = (x: number, y: number, isMove: boolean) => {
    if (!ctx || !canvasRef.current) return;
    const { width, height } = canvasRef.current;

    ctx.strokeStyle = config.tool === 'eraser' ? '#ffffff' : config.color;
    ctx.lineWidth = config.brushSize;

    const drawPoint = (context: CanvasRenderingContext2D, px: number, py: number, moving: boolean) => {
      if (config.stamp) {
        const stamp = STAMPS.find(s => s.id === config.stamp);
        if (stamp && moving) {
          context.save();
          context.translate(px - 15, py - 15);
          context.scale(3, 3);
          context.strokeStyle = config.color;
          context.globalAlpha = config.opacity / 100;
          context.lineWidth = 1;
          context.stroke(new Path2D(stamp.path));
          context.restore();
        }
        return;
      }

      context.globalAlpha = config.tool === 'eraser' ? 1 : config.opacity / 100;
      if (config.hardness < 100 && config.tool !== 'pencil') {
        context.shadowBlur = (100 - config.hardness) / 2;
        context.shadowColor = config.tool === 'eraser' ? '#ffffff' : config.color;
      } else {
        context.shadowBlur = 0;
      }

      if (moving) {
        context.lineTo(px, py);
        context.stroke();
        context.beginPath();
        context.moveTo(px, py);
      } else {
        context.beginPath();
        context.moveTo(px, py);
      }
    };

    drawPoint(ctx, x, y, isMove);
    if (symmetry === 'horizontal' || symmetry === 'quad') drawPoint(ctx, width - x, y, isMove);
    if (symmetry === 'vertical' || symmetry === 'quad') drawPoint(ctx, x, height - y, isMove);
    if (symmetry === 'quad') drawPoint(ctx, width - x, height - y, isMove);
  };

  const clearCanvas = () => {
    if (ctx && canvasRef.current) {
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl shadow-sm border border-orange-100 sticky top-4 z-10">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5" aria-label="Color Palette">
              {AFRICAN_PALETTE.map(c => (
                <button
                  key={c}
                  className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-125 ${config.color === c ? 'border-black scale-110 shadow-md' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setConfig(prev => ({ ...prev, color: c }))}
                />
              ))}
            </div>
          </div>

          <div className="h-8 w-[1px] bg-orange-100 hidden lg:block" />

          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
            {[
              { id: 'brush', icon: 'M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z', label: 'Brush' },
              { id: 'watercolor', icon: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z', label: 'Watercolor' },
              { id: 'fill', icon: 'M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z', label: 'Pour Paint' },
              { id: 'text', icon: 'M4 7V4h16v3M9 20h6M12 4v16', label: 'Text' },
              { id: 'shape', icon: 'M21 3H3v18h18V3z', label: 'Shapes' },
              { id: 'eraser', icon: 'm7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21Z', label: 'Eraser' }
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => setConfig(prev => ({ ...prev, tool: tool.id as any, stamp: null }))}
                className={`p-2.5 rounded-lg transition-all ${config.tool === tool.id && !config.stamp ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
                title={tool.label}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={tool.icon} /></svg>
                  <span className="text-[7px] font-bold uppercase">{tool.label}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="h-8 w-[1px] bg-orange-100 hidden lg:block" />

          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl">
             {(['none', 'horizontal', 'vertical', 'quad'] as SymmetryMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setSymmetry(mode)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${symmetry === mode ? 'bg-orange-100 text-orange-700' : 'text-gray-400 hover:bg-gray-200'}`}
              >
                {mode === 'none' ? 'Off' : mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5" aria-label="African Stamps">
            {STAMPS.map(stamp => (
              <button
                key={stamp.id}
                onClick={() => setConfig(prev => ({ ...prev, stamp: stamp.id, tool: 'brush' }))}
                className={`p-2 rounded-lg transition-all border-2 ${config.stamp === stamp.id ? 'border-orange-500 bg-orange-50' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                title={stamp.label}
              >
                <svg width="18" height="18" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1"><path d={stamp.path} /></svg>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-orange-50 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Brush Size ({config.brushSize}px)</label>
            <input type="range" min="1" max="150" value={config.brushSize} onChange={(e) => setConfig(prev => ({ ...prev, brushSize: parseInt(e.target.value) }))} className="accent-orange-500" />
          </div>

          {config.tool === 'text' && (
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Pattern Text (Yoruba words/Names)</label>
              <input 
                type="text" 
                value={customText} 
                onChange={(e) => setCustomText(e.target.value)}
                className="p-2 border rounded-lg text-sm bg-orange-50 border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Type here..."
              />
            </div>
          )}

          {config.tool === 'shape' && (
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Select Shape</label>
              <div className="flex gap-2">
                {(['circle', 'square', 'line'] as const).map(s => (
                  <button 
                    key={s}
                    onClick={() => setConfig(prev => ({ ...prev, shapeType: s }))}
                    className={`flex-1 p-2 rounded-lg border text-xs capitalize ${config.shapeType === s ? 'bg-orange-600 text-white' : 'bg-gray-50'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 md:col-start-4">
             <button onClick={clearCanvas} className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors uppercase tracking-widest">Reset Canva</button>
          </div>
        </div>
      </div>

      <div className="relative bg-white rounded-3xl shadow-2xl border-[12px] border-orange-50 overflow-hidden cursor-crosshair touch-none">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/fabric-of-the-nation.png')]" />
        
        {symmetry !== 'none' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
            {(symmetry === 'horizontal' || symmetry === 'quad') && <div className="absolute inset-y-0 w-[2px] bg-orange-600 left-1/2 -translate-x-1/2" />}
            {(symmetry === 'vertical' || symmetry === 'quad') && <div className="absolute inset-x-0 h-[2px] bg-orange-600 top-1/2 -translate-y-1/2" />}
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={1200}
          height={900}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="w-full h-auto aspect-[4/3]"
        />
        
        <canvas
          ref={overlayCanvasRef}
          width={1200}
          height={900}
          className="absolute inset-0 pointer-events-none w-full h-auto aspect-[4/3]"
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => onSave(canvasRef.current!.toDataURL('image/png'))}
          className="bg-orange-600 hover:bg-orange-700 text-white font-black py-5 px-16 rounded-3xl shadow-2xl transition-all transform hover:scale-105 active:scale-95 text-xl uppercase tracking-[0.2em] flex items-center gap-4"
        >
          <span>Confirm Bespoke Pattern</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <div className="flex gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
           <span>Dimensions • Patterns • Lines • Shapes</span>
           <span>•</span>
           <span>Ajibikes Studio</span>
        </div>
      </div>
    </div>
  );
};

export default FabricCanvas;
