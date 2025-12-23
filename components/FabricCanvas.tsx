
import React, { useRef, useEffect, useState } from 'react';
import { AFRICAN_PALETTE } from '../constants';
import { CanvasState } from '../types';

interface Props {
  onSave: (base64: string) => void;
}

type SymmetryMode = 'none' | 'horizontal' | 'vertical' | 'quad';

const STAMPS = [
  { id: 'gye-nyame', path: 'M12,2A10,10,0,1,0,22,12,10.011,10.011,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8.009,8.009,0,0,1,12,20ZM12,6a6,6,0,1,0,6,6A6.007,6.007,0,0,0,12,6Zm0,10a4,4,0,1,1,4-4A4.005,4.005,0,0,1,12,16Z', label: 'Gye Nyame' },
  { id: 'elephant', path: 'M17,10c0-1.66-1.34-3-3-3s-3,1.34-3,3s1.34,3,3,3S17,11.66,17,10z M22,7c-2-2-5-3-8-3S8,5,6,7C4,9,3,12,3,15c0,3,1,6,3,8c0,0,1,0,1-1s0-2,0-3c0-3,2-5,5-5h6c3,0,5,2,5,5c0,1,0,2,0,3s1,1,1,1c2-2,3-5,3-8C25,12,24,9,22,7z', label: 'Elephant' },
  { id: 'baobab', path: 'M12,2L10,5L12,8L14,5L12,2M8,8L6,10L8,12L10,10L8,8M16,8L14,10L16,12L18,10L16,8M12,10V22M12,14L9,17M12,16L15,19', label: 'Baobab' },
  { id: 'cowry', path: 'M12,2C7.58,2,4,6.48,4,12s3.58,10,8,10s8-4.48,8-10S16.42,2,12,2z M12,20c-3.31,0-6-3.58-6-8s2.69-8,6-8s6,3.58,6,8S15.31,20,12,20z M12,7c-0.55,0-1,2.24-1,5s0.45,5,1,5s1-2.24,1-5S12.55,7,12,7z', label: 'Wealth' },
  { id: 'triangle', path: 'M 5 0 L 10 10 L 0 10 Z', label: 'Triangle' },
  { id: 'zigzag', path: 'M 0 5 L 2.5 0 L 7.5 10 L 10 5', label: 'Zigzag' },
];

const FabricCanvas: React.FC<Props> = ({ onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [overlayCtx, setOverlayCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [symmetry, setSymmetry] = useState<SymmetryMode>('none');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [customText, setCustomText] = useState("AJIBIKE");
  
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isPinned, setIsPinned] = useState(false);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ctx || !canvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.min(hRatio, vRatio);
        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;
        
        ctx.globalAlpha = 1;
        ctx.drawImage(img, 0, 0, img.width, img.height,
          centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
        setHasDrawn(true);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
      if (Math.abs(data[pos] - startR) < 15 && Math.abs(data[pos+1] - startG) < 15 && Math.abs(data[pos+2] - startB) < 15) {
        data[pos] = fr;
        data[pos + 1] = fg;
        data[pos + 2] = fb;
        data[pos + 3] = 255;
        seen[idx] = 1;
        stack.push([curX + 1, curY], [curX - 1, curY], [curX, curY + 1], [curX, curY - 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const drawShape = (context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    context.strokeStyle = config.tool === 'eraser' ? '#ffffff' : config.color;
    context.fillStyle = config.tool === 'eraser' ? '#ffffff' : config.color;
    context.lineWidth = config.brushSize;
    context.globalAlpha = config.opacity / 100;

    const { width, height } = canvasRef.current!;

    const drawSingleShape = (cx1: number, cy1: number, cx2: number, cy2: number) => {
      if (config.shapeType === 'circle') {
        const radius = Math.sqrt(Math.pow(cx2 - cx1, 2) + Math.pow(cy2 - cy1, 2));
        context.beginPath();
        context.arc(cx1, cy1, radius, 0, 2 * Math.PI);
        context.stroke();
      } else if (config.shapeType === 'square') {
        context.strokeRect(cx1, cy1, cx2 - cx1, cy2 - cy1);
      } else if (config.shapeType === 'line') {
        context.beginPath();
        context.moveTo(cx1, cy1);
        context.lineTo(cx2, cy2);
        context.stroke();
      } else if (config.tool === 'text') {
        context.font = `bold ${config.brushSize * 2}px Outfit`;
        context.fillText(customText, cx2, cy2);
      }
    };

    drawSingleShape(x1, y1, x2, y2);
    if (symmetry === 'horizontal' || symmetry === 'quad') drawSingleShape(width - x1, y1, width - x2, y2);
    if (symmetry === 'vertical' || symmetry === 'quad') drawSingleShape(x1, height - y1, x2, height - y2);
    if (symmetry === 'quad') drawSingleShape(width - x1, height - y1, width - x2, height - y2);
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.cancelable) e.preventDefault();
    const pos = getPos(e);
    setStartPos(pos);
    setIsDrawing(true);
    setHasDrawn(true);

    if (config.tool === 'fill') {
      floodFill(pos.x, pos.y, config.color);
      setIsDrawing(false);
      return;
    }

    if (config.tool === 'text') {
      drawShape(ctx!, pos.x, pos.y, pos.x, pos.y);
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
      drawShape(overlayCtx!, startPos.x, startPos.y, pos.x, pos.y);
    } else if (config.tool !== 'fill' && !config.stamp) {
      applySymmetry(pos.x, pos.y, true);
    }
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    if (config.tool === 'shape') {
      overlayCtx?.clearRect(0, 0, overlayCanvasRef.current!.width, overlayCanvasRef.current!.height);
      drawShape(ctx!, startPos.x, startPos.y, pos.x, pos.y);
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
        if (stamp) {
          context.save();
          context.translate(px, py);
          const scale = config.brushSize / 10;
          context.scale(scale, scale);
          context.translate(-12, -12); // Center of a 24x24 standard icon path
          context.strokeStyle = config.color;
          context.fillStyle = config.color;
          context.globalAlpha = config.opacity / 100;
          const p = new Path2D(stamp.path);
          context.stroke(p);
          context.fill(p);
          context.restore();
        }
        return;
      }

      context.globalAlpha = config.tool === 'eraser' ? 1 : config.opacity / 100;
      context.shadowBlur = (config.hardness < 100 && config.tool !== 'pencil') ? (100 - config.hardness) / 2 : 0;
      context.shadowColor = config.tool === 'eraser' ? '#ffffff' : config.color;

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
      setHasDrawn(false);
    }
  };

  const handleTableMouseEnter = () => {
    if (!isPinned) setControlsVisible(false);
  };

  const handleTableMouseLeave = () => {
    setControlsVisible(true);
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform ${
          controlsVisible || isPinned ? 'translate-y-0 opacity-100' : '-translate-y-[85%] opacity-0 pointer-events-none'
        }`}
        onMouseEnter={() => setControlsVisible(true)}
      >
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-b-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border-x border-b border-orange-100 relative group/toolbar">
            
            <button 
              onClick={() => setIsPinned(!isPinned)}
              className={`absolute -bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-full shadow-lg transition-all ${isPinned ? 'bg-orange-600 text-white scale-110' : 'bg-white text-stone-400 hover:text-orange-600'}`}
              title={isPinned ? "Unlock Toolbar" : "Pin Toolbar"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 10" className={isPinned ? 'hidden' : 'block'} /><path d="M21 21l-6-6m0 0V9m0 6H9" className={isPinned ? 'block' : 'hidden'} /></svg>
            </button>

            <div className="flex flex-wrap items-center gap-6 justify-center">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5" aria-label="Color Palette">
                  <div className="relative group/spectrum">
                    <button
                      onClick={() => colorInputRef.current?.click()}
                      className="w-10 h-10 rounded-full shadow-md transition-all hover:scale-110 border-2 border-white overflow-hidden p-[2px]"
                      style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                      title="Custom Color Spectrum"
                    >
                      <div className="w-full h-full rounded-full border border-black/10" style={{ backgroundColor: config.color }} />
                    </button>
                    <input ref={colorInputRef} type="color" className="absolute opacity-0 pointer-events-none w-0 h-0" value={config.color} onChange={(e) => setConfig(prev => ({ ...prev, color: e.target.value }))} />
                  </div>

                  <div className="h-6 w-[1px] bg-stone-200 mx-1" />

                  {AFRICAN_PALETTE.map(c => (
                    <button
                      key={c}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-125 ${config.color === c ? 'border-black scale-110 shadow-md ring-2 ring-orange-200' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setConfig(prev => ({ ...prev, color: c }))}
                    />
                  ))}
                </div>
              </div>

              <div className="h-10 w-[1px] bg-orange-100 hidden lg:block" />

              <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-2xl">
                {[
                  { id: 'brush', icon: 'M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z', label: 'Brush' },
                  { id: 'fill', icon: 'M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z', label: 'Pour' },
                  { id: 'text', icon: 'M4 7V4h16v3M9 20h6M12 4v16', label: 'Text' },
                  { id: 'shape', icon: 'M21 3H3v18h18V3z', label: 'Shapes' },
                  { id: 'stamp', icon: 'M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z', label: 'Stamps' },
                  { id: 'eraser', icon: 'm7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21Z', label: 'Eraser' }
                ].map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setConfig(prev => ({ ...prev, tool: tool.id as any, stamp: tool.id === 'stamp' ? STAMPS[0].id : null }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${config.tool === tool.id ? 'bg-orange-600 text-white shadow-lg scale-105' : 'text-stone-500 hover:bg-stone-200'}`}
                    title={tool.label}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={tool.icon} /></svg>
                    <span className="text-[8px] font-black uppercase tracking-tighter">{tool.label}</span>
                  </button>
                ))}
              </div>

              <div className="h-10 w-[1px] bg-orange-100 hidden lg:block" />

              <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl">
                 {(['none', 'horizontal', 'vertical', 'quad'] as SymmetryMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setSymmetry(mode)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${symmetry === mode ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-stone-400 hover:bg-stone-200'}`}
                  >
                    {mode === 'none' ? 'Single' : mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-stone-100 items-end mt-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{config.tool === 'stamp' ? 'Stamp Scale' : 'Brush Size'}</label>
                  <span className="text-[10px] font-mono text-orange-600">{config.brushSize}px</span>
                </div>
                <input type="range" min="1" max="150" value={config.brushSize} onChange={(e) => setConfig(prev => ({ ...prev, brushSize: parseInt(e.target.value) }))} className="accent-orange-600 h-1.5" />
              </div>

              {config.tool === 'text' && (
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Pattern Text</label>
                  <input type="text" value={customText} onChange={(e) => setCustomText(e.target.value)} className="p-3 border-2 border-stone-100 rounded-xl text-sm bg-stone-50 focus:border-orange-400 focus:bg-white transition-all outline-none" placeholder="Type pattern text..." />
                </div>
              )}

              {config.tool === 'shape' && (
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Select Shape</label>
                  <div className="flex gap-2">
                    {(['circle', 'square', 'line'] as const).map(s => (
                      <button key={s} onClick={() => setConfig(prev => ({ ...prev, shapeType: s }))} className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold capitalize transition-all ${config.shapeType === s ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-stone-50 border-stone-100 text-stone-600 hover:border-orange-200'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {config.tool === 'stamp' && (
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Select Heritage Motif</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {STAMPS.map(stamp => (
                      <button
                        key={stamp.id}
                        onClick={() => setConfig(prev => ({ ...prev, stamp: stamp.id }))}
                        className={`p-2 rounded-lg border-2 transition-all ${config.stamp === stamp.id ? 'bg-orange-50 border-orange-600 scale-105' : 'bg-white border-stone-100 hover:border-orange-200'}`}
                        title={stamp.label}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d={stamp.path} /></svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={`flex justify-end gap-2 ${config.tool === 'text' || config.tool === 'shape' || config.tool === 'stamp' ? 'md:col-start-4' : 'md:col-span-3'}`}>
                 <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-orange-600 hover:bg-orange-50 px-4 py-2.5 rounded-xl transition-all uppercase tracking-widest border border-orange-100 flex items-center gap-2">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                   Upload
                 </button>
                 <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                 <button onClick={clearCanvas} className="text-[10px] font-black text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all uppercase tracking-widest border border-transparent hover:border-red-100">Clear</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed top-0 left-0 right-0 h-4 z-[101] cursor-pointer group/trigger" onMouseEnter={() => setControlsVisible(true)}>
        <div className={`mx-auto w-32 h-1 bg-stone-200 rounded-full mt-1 transition-all ${controlsVisible ? 'opacity-0' : 'opacity-100 group-hover/trigger:bg-orange-400 group-hover/trigger:w-48'}`} />
      </div>

      <div className="relative group bg-stone-200 p-8 md:p-16 rounded-[4rem] shadow-inner border-[1px] border-stone-300 transition-all duration-500 mt-12" onMouseEnter={handleTableMouseEnter} onMouseLeave={handleTableMouseLeave}>
        <div className="absolute top-12 left-12 w-4 h-4 bg-stone-400 rounded-full shadow-md z-10 border-b-2 border-stone-500" />
        <div className="absolute top-12 right-12 w-4 h-4 bg-stone-400 rounded-full shadow-md z-10 border-b-2 border-stone-500" />
        <div className="absolute bottom-12 left-12 w-4 h-4 bg-stone-400 rounded-full shadow-md z-10 border-b-2 border-stone-500" />
        <div className="absolute bottom-12 right-12 w-4 h-4 bg-stone-400 rounded-full shadow-md z-10 border-b-2 border-stone-500" />

        <div className={`relative bg-white rounded-lg transition-all duration-700 ${!controlsVisible && !isPinned ? 'shadow-[0_40px_100px_rgba(0,0,0,0.3)] ring-4 ring-orange-100/30' : 'shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-stone-100'} border-[20px] border-white overflow-hidden cursor-crosshair touch-none`}>
          
          {/* Symmetry Visual Feedback Layer */}
          {symmetry !== 'none' && (
            <div className="absolute inset-0 pointer-events-none z-[6] overflow-hidden">
              {(symmetry === 'horizontal' || symmetry === 'quad') && (
                <>
                  <div className="absolute inset-y-0 left-1/2 w-0 border-l-2 border-dashed border-orange-500/20 -translate-x-1/2" />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-2 py-0.5 rounded-full border border-orange-100 text-[8px] font-black text-orange-400 uppercase tracking-tighter shadow-sm">Y-Axis</div>
                </>
              )}
              {(symmetry === 'vertical' || symmetry === 'quad') && (
                <>
                  <div className="absolute inset-x-0 top-1/2 h-0 border-t-2 border-dashed border-orange-500/20 -translate-y-1/2" />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 bg-white/80 backdrop-blur px-2 py-0.5 rounded-full border border-orange-100 text-[8px] font-black text-orange-400 uppercase tracking-tighter shadow-sm">X-Axis</div>
                </>
              )}
            </div>
          )}

          {!hasDrawn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 bg-white/40 backdrop-blur-[1px]">
               <div className="bg-white/90 p-8 rounded-full shadow-xl border border-orange-100 flex flex-col items-center animate-bounce">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5"><path d="M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /></svg>
               </div>
               <p className="mt-4 text-orange-600 font-black uppercase tracking-[0.3em] text-sm text-center">Sketch Your Pattern<br/><span className="text-[10px] text-stone-400">Controls hide automatically while designing</span></p>
            </div>
          )}
          <div className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/fabric-of-the-nation.png')] z-[5]" />
          <canvas ref={canvasRef} width={1200} height={900} onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd} className="w-full h-auto aspect-[4/3] bg-white" />
          <canvas ref={overlayCanvasRef} width={1200} height={900} className="absolute inset-0 pointer-events-none w-full h-auto aspect-[4/3] z-[8]" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 mt-8">
        <button onClick={() => onSave(canvasRef.current!.toDataURL('image/png'))} className="group relative bg-black text-white font-black py-6 px-20 rounded-[2rem] shadow-2xl transition-all transform hover:scale-105 active:scale-95 text-2xl uppercase tracking-[0.25em] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          <span className="relative z-10 flex items-center gap-4">
            <span>Confirm Bespoke Pattern</span>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-2 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </button>
        <div className="flex items-center gap-6 px-8 py-3 bg-stone-100 rounded-full border border-stone-200">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${!controlsVisible && !isPinned ? 'bg-orange-500' : 'bg-green-500'}`} />
            <span className="text-[10px] text-stone-500 font-black uppercase tracking-widest">{!controlsVisible && !isPinned ? 'Studio Focus Mode' : 'Standard Editing Mode'}</span>
          </div>
          <div className="h-3 w-[1px] bg-stone-300" />
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">1200 x 900 DPI</span>
          <div className="h-3 w-[1px] bg-stone-300" />
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Ajibikes Signature Edition</span>
        </div>
      </div>
    </div>
  );
};

export default FabricCanvas;
