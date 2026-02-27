import React from 'react';
import { Trash2, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Layers, Grid, Lock, Unlock, Copy } from 'lucide-react';
import { UIComponent, GridSystem } from '../types';
import { Button } from './Button';

interface PropertyPanelProps {
  component: UIComponent | null;
  selectedGrid: GridSystem | null;
  components: UIComponent[];
  grids: GridSystem[];
  onSelect: (id: string | null) => void;
  onSelectGrid: (id: string | null) => void;
  onChange: (id: string, updates: Partial<UIComponent>) => void;
  onGridChange: (id: string, updates: Partial<GridSystem>) => void;
  onGridDelete: (id: string) => void;
  hasApiKey: boolean;
  onSingleAutoName: (comp: UIComponent) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onZIndexChange: (id: string, action: 'front' | 'back' | 'forward' | 'backward') => void;
  isWorkspaceComponent: boolean;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ 
  component, 
  selectedGrid,
  components,
  grids,
  onSelect,
  onSelectGrid,
  onChange,
  onGridChange,
  onGridDelete,
  hasApiKey,
  onSingleAutoName,
  onDelete,
  onDuplicate,
  onZIndexChange,
  isWorkspaceComponent
}) => {
  return (
    <div className="w-64 bg-surface border-l border-slate-700 flex flex-col shrink-0 h-full">
      {/* Properties Section */}
      <div className="flex-1 overflow-y-auto border-b border-slate-700">
        <div className="p-4 border-b border-slate-700 sticky top-0 bg-surface z-10">
          <h3 className="font-bold text-slate-200">Properties</h3>
        </div>
        
        {selectedGrid ? (
             <div className="p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Grid size={16} />
                        <span className="text-sm font-medium">Grid System</span>
                    </div>
                    <button 
                        onClick={() => onGridChange(selectedGrid.id, { locked: !selectedGrid.locked })}
                        className={`p-1 rounded hover:bg-slate-700 ${selectedGrid.locked ? 'text-red-400' : 'text-slate-400'}`}
                        title={selectedGrid.locked ? "Unlock Grid" : "Lock Grid"}
                    >
                        {selectedGrid.locked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium">Rows</label>
                        <input 
                            type="number" 
                            min="1"
                            value={selectedGrid.rows}
                            onChange={(e) => onGridChange(selectedGrid.id, { rows: parseInt(e.target.value) || 1 })}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                            disabled={selectedGrid.locked}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium">Columns</label>
                        <input 
                            type="number" 
                            min="1"
                            value={selectedGrid.cols}
                            onChange={(e) => onGridChange(selectedGrid.id, { cols: parseInt(e.target.value) || 1 })}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                            disabled={selectedGrid.locked}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium">X</label>
                        <input 
                            type="number" 
                            value={Math.round(selectedGrid.x)}
                            onChange={(e) => onGridChange(selectedGrid.id, { x: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                            disabled={selectedGrid.locked}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium">Y</label>
                        <input 
                            type="number" 
                            value={Math.round(selectedGrid.y)}
                            onChange={(e) => onGridChange(selectedGrid.id, { y: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                            disabled={selectedGrid.locked}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium">Width</label>
                        <input 
                            type="number" 
                            value={Math.round(selectedGrid.width)}
                            onChange={(e) => onGridChange(selectedGrid.id, { width: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                            disabled={selectedGrid.locked}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-medium">Height</label>
                        <input 
                            type="number" 
                            value={Math.round(selectedGrid.height)}
                            onChange={(e) => onGridChange(selectedGrid.id, { height: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                            disabled={selectedGrid.locked}
                        />
                    </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-700">
                    <Button 
                        variant="danger" 
                        onClick={() => onGridDelete(selectedGrid.id)}
                        className="w-full text-xs"
                        icon={<Trash2 className="w-4 h-4"/>}
                        disabled={selectedGrid.locked}
                    >
                        Delete Grid
                    </Button>
                </div>
             </div>
        ) : component ? (
          <div className="p-4 space-y-4">
            {/* Preview */}
            <div className="w-full h-32 bg-slate-800 rounded border border-slate-600 flex items-center justify-center p-2 checkerboard relative">
               <img 
                 src={component.imageBase64} 
                 alt="Preview" 
                 className="max-w-full max-h-full object-contain shadow-sm" 
               />
               {component.locked && (
                   <div className="absolute top-2 right-2 bg-slate-900/80 p-1 rounded text-red-400">
                       <Lock size={14} />
                   </div>
               )}
            </div>

            {/* Fields */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 font-medium">Name</label>
                  <button 
                        onClick={() => onChange(component.id, { locked: !component.locked })}
                        className={`p-1 rounded hover:bg-slate-700 ${component.locked ? 'text-red-400' : 'text-slate-400'}`}
                        title={component.locked ? "Unlock Component" : "Lock Component"}
                    >
                        {component.locked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
              </div>
              <div className="flex gap-1">
                 <input 
                  type="text" 
                  value={component.name}
                  onChange={(e) => onChange(component.id, { name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                  disabled={component.locked}
                />
                {hasApiKey && (
                    <button 
                      onClick={() => onSingleAutoName(component)}
                      className="bg-primary/20 hover:bg-primary/30 text-primary px-2 rounded text-xs border border-primary/20 disabled:opacity-50"
                      title="Auto-Name this component"
                      disabled={component.locked}
                    >
                      AI
                    </button>
                )}
              </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Tags</label>
                <div className="flex flex-wrap gap-1">
                    {['Button', 'Slot', 'Panel'].map(tag => (
                        <button
                            key={tag}
                            disabled={component.locked}
                            onClick={() => {
                                const currentTags = component.tags || [];
                                const newTags = currentTags.includes(tag) 
                                    ? currentTags.filter(t => t !== tag)
                                    : [...currentTags, tag];
                                onChange(component.id, { tags: newTags });
                            }}
                            className={`
                                px-2 py-1 rounded text-xs border transition-colors
                                ${(component.tags || []).includes(tag)
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                }
                                ${component.locked ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">X</label>
                <input 
                  type="number" 
                  value={Math.round(component.x)}
                  onChange={(e) => onChange(component.id, { x: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                  disabled={component.locked}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Y</label>
                <input 
                  type="number" 
                  value={Math.round(component.y)}
                  onChange={(e) => onChange(component.id, { y: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                  disabled={component.locked}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
               <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Width</label>
                <input 
                  type="number" 
                  value={Math.round(component.width)}
                  onChange={(e) => onChange(component.id, { width: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                  disabled={component.locked}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Height</label>
                <input 
                  type="number" 
                  value={Math.round(component.height)}
                  onChange={(e) => onChange(component.id, { height: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                  disabled={component.locked}
                />
              </div>
            </div>

            {/* Text Properties */}
            {component.textProperties && (
                <div className="pt-2 border-t border-slate-700 space-y-3">
                    <label className="text-xs text-slate-400 font-medium block">Text Properties</label>
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-medium">Content</label>
                            <input 
                                type="text" 
                                value={component.textProperties.text}
                                onChange={(e) => onChange(component.id, { textProperties: { ...component.textProperties!, text: e.target.value } })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-primary"
                                disabled={component.locked}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-medium">Size</label>
                                <input 
                                    type="number" 
                                    value={component.textProperties.fontSize}
                                    onChange={(e) => onChange(component.id, { textProperties: { ...component.textProperties!, fontSize: parseInt(e.target.value) || 12 } })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-primary"
                                    disabled={component.locked}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-medium">Color</label>
                                <input 
                                    type="color" 
                                    value={component.textProperties.color}
                                    onChange={(e) => onChange(component.id, { textProperties: { ...component.textProperties!, color: e.target.value } })}
                                    className="w-full h-7 bg-transparent border-none cursor-pointer"
                                    disabled={component.locked}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-medium">Font</label>
                            <select 
                                value={component.textProperties.fontFamily}
                                onChange={(e) => onChange(component.id, { textProperties: { ...component.textProperties!, fontFamily: e.target.value } })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-primary"
                                disabled={component.locked}
                            >
                                <option value="sans-serif">Sans Serif</option>
                                <option value="serif">Serif</option>
                                <option value="monospace">Monospace</option>
                                <option value="cursive">Cursive</option>
                                <option value="'Inter', sans-serif">Inter</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Scaling Section */}
            <div className="pt-2 border-t border-slate-700 space-y-3">
                <label className="text-xs text-slate-400 font-medium block">Scaling Mode</label>
                <div className="flex bg-slate-900 rounded p-1 border border-slate-700">
                    <button 
                        onClick={() => onChange(component.id, { scaleMode: 'proportional' })}
                        className={`flex-1 py-1 text-[10px] rounded transition-colors ${component.scaleMode === 'proportional' || !component.scaleMode ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        disabled={component.locked}
                    >
                        Proportional
                    </button>
                    <button 
                        onClick={() => onChange(component.id, { 
                            scaleMode: 'nine-slice', 
                            nineSlice: component.nineSlice || { left: 10, right: 10, top: 10, bottom: 10 } 
                        })}
                        className={`flex-1 py-1 text-[10px] rounded transition-colors ${component.scaleMode === 'nine-slice' ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        disabled={component.locked}
                    >
                        9-Slice
                    </button>
                </div>

                {component.scaleMode === 'nine-slice' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-medium">Top</label>
                                <input 
                                    type="number" 
                                    value={component.nineSlice?.top || 0}
                                    onChange={(e) => onChange(component.id, { nineSlice: { ...(component.nineSlice || {left:0,right:0,top:0,bottom:0}), top: parseInt(e.target.value) || 0 } })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"
                                    disabled={component.locked}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-medium">Bottom</label>
                                <input 
                                    type="number" 
                                    value={component.nineSlice?.bottom || 0}
                                    onChange={(e) => onChange(component.id, { nineSlice: { ...(component.nineSlice || {left:0,right:0,top:0,bottom:0}), bottom: parseInt(e.target.value) || 0 } })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"
                                    disabled={component.locked}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-medium">Left</label>
                                <input 
                                    type="number" 
                                    value={component.nineSlice?.left || 0}
                                    onChange={(e) => onChange(component.id, { nineSlice: { ...(component.nineSlice || {left:0,right:0,top:0,bottom:0}), left: parseInt(e.target.value) || 0 } })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"
                                    disabled={component.locked}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-medium">Right</label>
                                <input 
                                    type="number" 
                                    value={component.nineSlice?.right || 0}
                                    onChange={(e) => onChange(component.id, { nineSlice: { ...(component.nineSlice || {left:0,right:0,top:0,bottom:0}), right: parseInt(e.target.value) || 0 } })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"
                                    disabled={component.locked}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isWorkspaceComponent && (
                <>
                    <div className="pt-2 border-t border-slate-700">
                        <label className="text-xs text-slate-400 font-medium mb-2 block">Hierarchy</label>
                        <div className="flex gap-1 justify-between">
                            <button 
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-50"
                                title="Bring to Front"
                                onClick={() => onZIndexChange(component.id, 'front')}
                                disabled={component.locked}
                            >
                                <ChevronsUp className="w-4 h-4" />
                            </button>
                            <button 
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-50"
                                title="Bring Forward"
                                onClick={() => onZIndexChange(component.id, 'forward')}
                                disabled={component.locked}
                            >
                                <ChevronUp className="w-4 h-4" />
                            </button>
                            <button 
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-50"
                                title="Send Backward"
                                onClick={() => onZIndexChange(component.id, 'backward')}
                                disabled={component.locked}
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            <button 
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-50"
                                title="Send to Back"
                                onClick={() => onZIndexChange(component.id, 'back')}
                                disabled={component.locked}
                            >
                                <ChevronsDown className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-700 flex flex-col gap-2">
                        <Button 
                            variant="secondary" 
                            onClick={() => onDuplicate(component.id)}
                            className="w-full text-xs"
                            icon={<Copy className="w-4 h-4"/>}
                        >
                            Duplicate
                        </Button>
                        <Button 
                            variant="danger" 
                            onClick={() => onDelete(component.id)}
                            className="w-full text-xs"
                            icon={<Trash2 className="w-4 h-4"/>}
                            disabled={component.locked}
                        >
                            Delete Component
                        </Button>
                    </div>
                </>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm">
            Select a component to edit properties
          </div>
        )}
      </div>

      {/* Layers Section */}
      <div className="flex-1 overflow-y-auto bg-slate-900/50">
        <div className="p-3 border-b border-slate-700 bg-surface sticky top-0 z-10 flex items-center gap-2">
          <Layers size={14} className="text-slate-400" />
          <h3 className="font-bold text-slate-200 text-sm">Layers</h3>
          <span className="ml-auto text-xs text-slate-500">{components.length + grids.length}</span>
        </div>
        <div className="p-2 space-y-1">
          {components.length === 0 && grids.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-4">
              No components on canvas
            </div>
          ) : (
            <>
                {/* Grids */}
                {grids.map((grid) => (
                    <div 
                        key={grid.id}
                        onClick={() => onSelectGrid(grid.id)}
                        className={`
                        flex items-center gap-2 p-2 rounded cursor-pointer text-sm transition-colors group
                        ${selectedGrid?.id === grid.id ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-slate-800 text-slate-300 border border-transparent'}
                        `}
                    >
                        <div className="w-6 h-6 bg-slate-800 rounded flex-shrink-0 flex items-center justify-center border border-slate-700 text-blue-400">
                            <Grid size={14} />
                        </div>
                        <span className="truncate flex-1">Grid ({grid.rows}x{grid.cols})</span>
                        {grid.locked && <Lock size={12} className="text-slate-500" />}
                        {selectedGrid?.id === grid.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        )}
                    </div>
                ))}

                {/* Components */}
                {components.slice().reverse().map((comp) => (
                <div 
                    key={comp.id}
                    onClick={() => onSelect(comp.id)}
                    className={`
                    flex items-center gap-2 p-2 rounded cursor-pointer text-sm transition-colors group
                    ${component?.id === comp.id ? 'bg-primary/20 text-primary border border-primary/30' : 'hover:bg-slate-800 text-slate-300 border border-transparent'}
                    `}
                >
                    <div className="w-6 h-6 bg-slate-800 rounded flex-shrink-0 overflow-hidden border border-slate-700">
                    <img src={comp.imageBase64} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="truncate flex-1">{comp.name}</span>
                    {comp.locked && <Lock size={12} className="text-slate-500" />}
                    {component?.id === comp.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    )}
                </div>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};