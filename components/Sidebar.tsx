import React, { useState, useMemo } from 'react';
import { Upload, Layers, Wand2, SortAsc, FolderTree, Clock, ArrowDownAZ, ArrowUpWideNarrow, ChevronDown, ChevronRight, FolderUp, Trash2 } from 'lucide-react';
import { UIComponent, DragType } from '../types';
import { Button } from './Button';
import { useConfirm } from '../contexts/ConfirmContext';

interface SidebarProps {
  onFileUpload: (file: File) => void;
  onFolderUpload: (files: FileList) => void;
  isProcessing: boolean;
  library: UIComponent[];
  selectedId: string | null;
  onSelectComponent: (id: string) => void;
  onAutoName: () => void;
  onAddPlaceholder: () => void;
  hasApiKey: boolean;
  onDeleteComponent: (id: string) => void;
}

type SortOption = 'time' | 'name' | 'size';

export const Sidebar: React.FC<SidebarProps> = ({ 
  onFileUpload, 
  onFolderUpload,
  isProcessing, 
  library,
  selectedId,
  onSelectComponent,
  onAutoName,
  onAddPlaceholder,
  hasApiKey,
  onDeleteComponent
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [groupByFile, setGroupByFile] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const { confirm } = useConfirm();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFolderUpload(e.target.files);
    }
  };

  const handleDragStart = (e: React.DragEvent, component: UIComponent) => {
      e.dataTransfer.setData('type', DragType.SIDEBAR_ASSET);
      e.dataTransfer.setData('id', component.id);
      e.dataTransfer.effectAllowed = 'copy';
      
      const img = new Image();
      img.src = component.imageBase64;
      e.dataTransfer.setDragImage(img, component.width / 2, component.height / 2);
  };

  const toggleGroup = (fileName: string) => {
    const newSet = new Set(collapsedGroups);
    if (newSet.has(fileName)) {
      newSet.delete(fileName);
    } else {
      newSet.add(fileName);
    }
    setCollapsedGroups(newSet);
  };

  // Logic to process library list
  const processedLibrary = useMemo(() => {
    let comps = [...library];
    
    // Sort
    comps.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'size': return (b.width * b.height) - (a.width * a.height);
        case 'time': return (b.importTime || 0) - (a.importTime || 0); // Newest first
        default: return 0;
      }
    });

    if (!groupByFile) {
      return { type: 'flat', items: comps };
    }

    // Group
    const groups: Record<string, UIComponent[]> = {};
    comps.forEach(c => {
      const key = c.sourceFileName || 'Unsorted';
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });

    return { type: 'grouped', groups };

  }, [library, sortBy, groupByFile]);

  const renderComponentItem = (comp: UIComponent) => (
    <div 
      key={comp.id}
      draggable
      onDragStart={(e) => handleDragStart(e, comp)}
      onClick={() => onSelectComponent(comp.id)}
      className={`
        flex items-center gap-3 p-2 rounded cursor-grab active:cursor-grabbing transition-colors group relative
        ${selectedId === comp.id ? 'bg-primary/20 text-primary' : 'hover:bg-slate-700 text-slate-300'}
      `}
    >
      <div className="w-8 h-8 bg-slate-800 rounded border border-slate-600 flex-shrink-0 p-0.5 relative checkerboard">
        <img src={comp.imageBase64} alt="" className="w-full h-full object-contain relative z-10" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate font-medium">{comp.name}</p>
        <p className="text-[10px] text-slate-500 truncate">{Math.round(comp.width)}x{Math.round(comp.height)}</p>
      </div>
      <button 
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all absolute right-2"
        onClick={async (e) => {
            e.stopPropagation();
            const confirmed = await confirm({
                title: 'Delete Component',
                message: 'Are you sure you want to delete this component from the library?',
                confirmText: 'Delete',
                type: 'danger'
            });
            if (confirmed) {
                onDeleteComponent(comp.id);
            }
        }}
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div className="w-72 bg-surface border-r border-slate-700 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Library
        </h2>
      </div>

      <div className="p-4 flex flex-col gap-3 pb-2">
        <div className="flex gap-2">
            <div 
            className="flex-1 border-2 border-dashed border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-slate-800 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            title="Upload single file"
            >
            <Upload className="w-6 h-6 text-slate-400 mb-1" />
            <span className="text-xs text-slate-300">
                {isProcessing ? '...' : 'File'}
            </span>
            </div>
            <div 
            className="flex-1 border-2 border-dashed border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-slate-800 transition-colors"
            onClick={() => folderInputRef.current?.click()}
            title="Upload folder"
            >
            <FolderUp className="w-6 h-6 text-slate-400 mb-1" />
            <span className="text-xs text-slate-300">
                {isProcessing ? '...' : 'Folder'}
            </span>
            </div>
            <div 
            className="flex-1 border-2 border-dashed border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-slate-800 transition-colors"
            onClick={onAddPlaceholder}
            title="Add placeholder component"
            >
            <Layers className="w-6 h-6 text-slate-400 mb-1" />
            <span className="text-xs text-slate-300">
                Placeholder
            </span>
            </div>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/png, image/jpeg" 
          onChange={handleFileChange}
        />
        <input 
            type="file"
            ref={folderInputRef}
            className="hidden"
            // @ts-ignore
            webkitdirectory=""
            directory=""
            onChange={handleFolderChange}
        />
        
        {library.length > 0 && hasApiKey && (
           <Button 
            variant="secondary" 
            onClick={onAutoName} 
            disabled={isProcessing}
            icon={<Wand2 className="w-4 h-4"/>}
            className="w-full text-xs"
          >
            AI Auto-Name Library
          </Button>
        )}
      </div>

      {/* View Options */}
      {library.length > 0 && (
        <div className="px-4 py-2 flex items-center justify-between border-t border-b border-slate-700 bg-slate-800/50">
           <div className="flex bg-slate-800 rounded p-0.5 border border-slate-600">
             <button 
               onClick={() => setSortBy('name')} 
               className={`p-1 rounded ${sortBy === 'name' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
               title="Sort by Name"
             >
               <ArrowDownAZ size={14} />
             </button>
             <button 
               onClick={() => setSortBy('size')} 
               className={`p-1 rounded ${sortBy === 'size' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
               title="Sort by Size"
             >
               <ArrowUpWideNarrow size={14} />
             </button>
             <button 
               onClick={() => setSortBy('time')} 
               className={`p-1 rounded ${sortBy === 'time' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
               title="Sort by Import Time"
             >
               <Clock size={14} />
             </button>
           </div>
           
           <button 
             onClick={() => setGroupByFile(!groupByFile)}
             className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${groupByFile ? 'bg-primary/20 border-primary text-primary' : 'border-slate-600 text-slate-400 hover:text-white'}`}
             title="Group by Source File"
           >
             <FolderTree size={14} />
             <span>Group</span>
           </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 pb-4 pt-2">
        {library.length === 0 ? (
          <div className="text-center text-slate-500 mt-10 text-sm">
            Library is empty.<br/>Upload an image to slice.
          </div>
        ) : (
          <div className="space-y-1">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase px-2 mb-2 tracking-wider">
              Components ({library.length})
            </h3>
            
            {processedLibrary.type === 'flat' ? (
               // @ts-ignore
               processedLibrary.items.map(renderComponentItem)
            ) : (
               // @ts-ignore
               Object.entries(processedLibrary.groups).map(([fileName, items]) => (
                 <div key={fileName} className="mb-2">
                   <div 
                     className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer select-none"
                     onClick={() => toggleGroup(fileName)}
                   >
                     {collapsedGroups.has(fileName) ? <ChevronRight size={12}/> : <ChevronDown size={12}/>}
                     <span className="truncate">{fileName}</span>
                     <span className="text-slate-600 ml-auto text-[10px]">{(items as any[]).length}</span>
                   </div>
                   {!collapsedGroups.has(fileName) && (
                      <div className="pl-2 border-l border-slate-700 ml-2 mt-1 space-y-1">
                        {(items as UIComponent[]).map(renderComponentItem)}
                      </div>
                   )}
                 </div>
               ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};