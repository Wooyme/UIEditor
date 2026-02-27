import React, { useState, useRef, useEffect } from 'react';
import { Download, Trash2, Image as ImageIcon, Wand2, Upload, X, Grid, Maximize2, Type, FolderDown, FolderUp } from 'lucide-react';
import { Button } from './Button';

interface ToolbarProps {
  onExport: () => void;
  onClear: () => void;
  componentCount: number;
  onSetBackground: (file: File) => void;
  onGenerateBackground: (prompt: string) => void;
  onClearBackground: () => void;
  hasBackground: boolean;
  hasApiKey: boolean;
  isProcessing: boolean;
  artboardSize: { width: number; height: number };
  onResize: (width: number, height: number) => void;
  interactionMode: 'select' | 'draw_grid' | 'scale';
  onSetInteractionMode: (mode: 'select' | 'draw_grid' | 'scale') => void;
  onAddText: (text: string, fontSize: number, fontFamily: string, color: string) => void;
  onExportWorkspace: () => void;
  onImportWorkspace: (file: File) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onExport, 
  onClear, 
  componentCount,
  onSetBackground,
  onGenerateBackground,
  onClearBackground,
  hasBackground,
  hasApiKey,
  isProcessing,
  artboardSize,
  onResize,
  interactionMode,
  onSetInteractionMode,
  onAddText,
  onExportWorkspace,
  onImportWorkspace
}) => {
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [textInput, setTextInput] = useState('New Text');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [textColor, setTextColor] = useState('#ffffff');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const textMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importWorkspaceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowBgMenu(false);
      }
      if (textMenuRef.current && !textMenuRef.current.contains(event.target as Node)) {
        setShowTextMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerateBackground(prompt);
      setShowBgMenu(false);
      setPrompt('');
    }
  };

  const handleAddText = () => {
    if (textInput.trim()) {
      onAddText(textInput, fontSize, fontFamily, textColor);
      setShowTextMenu(false);
    }
  };

  return (
    <div className="h-14 bg-surface border-b border-slate-700 flex items-center justify-between px-4 shrink-0 relative z-30">
      <div className="flex items-center gap-2">
         <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-md flex items-center justify-center font-bold text-white text-lg">
           S
         </div>
         <span className="font-semibold text-slate-200">UI Slicer</span>
      </div>

      <div className="flex items-center gap-3">
         <div className="flex items-center gap-2 bg-slate-800 rounded px-2 py-1 border border-slate-700">
            <span className="text-xs text-slate-400 font-medium">W</span>
            <input 
              type="number" 
              className="w-12 bg-transparent text-xs text-white focus:outline-none text-right" 
              value={artboardSize.width}
              onChange={(e) => onResize(parseInt(e.target.value) || 0, artboardSize.height)}
            />
            <span className="text-xs text-slate-600">x</span>
            <span className="text-xs text-slate-400 font-medium">H</span>
            <input 
              type="number" 
              className="w-12 bg-transparent text-xs text-white focus:outline-none text-right" 
              value={artboardSize.height}
              onChange={(e) => onResize(artboardSize.width, parseInt(e.target.value) || 0)}
            />
         </div>

         <div className="h-6 w-px bg-slate-700 mx-1"></div>

         <Button
            variant={interactionMode === 'draw_grid' ? 'primary' : 'ghost'}
            onClick={() => onSetInteractionMode(interactionMode === 'draw_grid' ? 'select' : 'draw_grid')}
            title="Draw Grid"
            icon={<Grid className="w-4 h-4" />}
         >
            Grid
         </Button>

         <Button
            variant={interactionMode === 'scale' ? 'primary' : 'ghost'}
            onClick={() => onSetInteractionMode(interactionMode === 'scale' ? 'select' : 'scale')}
            title="Scale Tool"
            icon={<Maximize2 className="w-4 h-4" />}
         >
            Scale
         </Button>

         <div className="relative" ref={textMenuRef}>
            <Button
                variant="ghost"
                onClick={() => setShowTextMenu(!showTextMenu)}
                icon={<Type className="w-4 h-4" />}
                title="Insert Text"
            >
                Text
            </Button>

            {showTextMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-4 flex flex-col gap-4 z-50">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Insert Text</h4>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-medium">Text Content</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-primary"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-medium">Font Size</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-primary"
                                value={fontSize}
                                onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-medium">Color</label>
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="color" 
                                    className="w-8 h-8 bg-transparent border-none cursor-pointer"
                                    value={textColor}
                                    onChange={(e) => setTextColor(e.target.value)}
                                />
                                <span className="text-[10px] text-slate-400 uppercase">{textColor}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-medium">Font Family</label>
                        <select 
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-primary"
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value)}
                        >
                            <option value="sans-serif">Sans Serif</option>
                            <option value="serif">Serif</option>
                            <option value="monospace">Monospace</option>
                            <option value="cursive">Cursive</option>
                            <option value="'Inter', sans-serif">Inter</option>
                        </select>
                    </div>

                    <Button onClick={handleAddText} className="w-full mt-2">
                        Insert Text
                    </Button>
                </div>
            )}
         </div>

         <div className="relative" ref={menuRef}>
            <Button 
                variant={hasBackground ? "secondary" : "ghost"}
                onClick={() => setShowBgMenu(!showBgMenu)}
                icon={<ImageIcon className="w-4 h-4" />}
            >
                Reference
            </Button>

            {showBgMenu && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-3 flex flex-col gap-3">
                   <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Background Reference</h4>
                   
                   <div 
                     className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer transition-colors border border-slate-700 hover:border-slate-500"
                     onClick={() => fileInputRef.current?.click()}
                   >
                      <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-primary">
                        <Upload size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-200">Upload Image</p>
                        <p className="text-[10px] text-slate-500">From local file</p>
                      </div>
                   </div>
                   <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      accept="image/*"
                      onChange={(e) => {
                          if (e.target.files?.[0]) {
                              onSetBackground(e.target.files[0]);
                              setShowBgMenu(false);
                          }
                      }}
                   />

                   {hasApiKey && (
                       <div className="border-t border-slate-700 pt-3">
                         <div className="flex gap-2 mb-2">
                            <input 
                                type="text" 
                                placeholder="Describe UI (e.g. 'Dark dashboard')"
                                className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            />
                            <button 
                                onClick={handleGenerate}
                                disabled={isProcessing || !prompt.trim()}
                                className="bg-primary hover:bg-blue-600 disabled:opacity-50 text-white p-1.5 rounded"
                                title="Generate with AI"
                            >
                                <Wand2 size={14} />
                            </button>
                         </div>
                         <p className="text-[10px] text-slate-500">Generates a reference image using AI</p>
                       </div>
                   )}

                   {hasBackground && (
                       <div className="border-t border-slate-700 pt-2">
                           <Button 
                                variant="danger" 
                                className="w-full text-xs h-8" 
                                onClick={() => {
                                    onClearBackground();
                                    setShowBgMenu(false);
                                }}
                                icon={<X size={14} />}
                            >
                                Remove Background
                            </Button>
                       </div>
                   )}
                </div>
            )}
         </div>

         <div className="h-6 w-px bg-slate-700 mx-1"></div>

         <Button 
            variant="ghost" 
            onClick={onClear} 
            disabled={componentCount === 0}
            title="Clear Workspace"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          
         <Button 
           onClick={onExport} 
           icon={<Download className="w-4 h-4" />}
           disabled={componentCount === 0}
         >
           Export Layout JSON
         </Button>

         <div className="h-6 w-px bg-slate-700 mx-1"></div>

         <Button 
           variant="ghost"
           onClick={() => importWorkspaceRef.current?.click()} 
           icon={<FolderUp className="w-4 h-4" />}
           title="Import Workspace"
         >
           Import
         </Button>
         <input 
            type="file" 
            className="hidden" 
            ref={importWorkspaceRef} 
            accept=".json"
            onChange={(e) => {
                if (e.target.files?.[0]) {
                    onImportWorkspace(e.target.files[0]);
                }
                // Reset input so the same file can be selected again
                if (importWorkspaceRef.current) {
                    importWorkspaceRef.current.value = '';
                }
            }}
         />

         <Button 
           variant="ghost"
           onClick={onExportWorkspace} 
           icon={<FolderDown className="w-4 h-4" />}
           title="Export Workspace"
         >
           Export
         </Button>
      </div>
    </div>
  );
};