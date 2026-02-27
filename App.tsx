import React, { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { Toolbar } from './components/Toolbar';
import { PropertyPanel } from './components/PropertyPanel';
import { loadImage, detectComponents, renderScaledComponent, createPlaceholderImage, createTextImage } from './services/imageProcessor';
import { bulkRenameComponents, generateComponentName, generateReferenceImage } from './services/geminiService';
import { UIComponent, GridSystem } from './types';
import { useConfirm } from './contexts/ConfirmContext';

function App() {
  const [library, setLibrary] = useState<UIComponent[]>([]);
  const [workspaceComponents, setWorkspaceComponents] = useState<UIComponent[]>([]);
  const [grids, setGrids] = useState<GridSystem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedGridId, setSelectedGridId] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<'select' | 'draw_grid' | 'scale'>('select');
  const [isProcessing, setIsProcessing] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [artboardSize, setArtboardSize] = useState({ width: 800, height: 600 });
  const hasApiKey = !!process.env.API_KEY;
  const { confirm } = useConfirm();

  const getNextComponentIndex = (currentLibrary: UIComponent[], additionalComponents: UIComponent[] = []) => {
    let maxIndex = 0;
    const allComponents = [...currentLibrary, ...additionalComponents];
    allComponents.forEach(c => {
        const match = c.name.match(/^Component (\d+)$/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxIndex) maxIndex = num;
        }
    });
    return maxIndex;
  };

  const handleArtboardResize = (width: number, height: number) => {
    setArtboardSize({ width, height });
  };

  const handleAddGrid = (grid: GridSystem) => {
    setGrids(prev => [...prev, grid]);
    setInteractionMode('select');
    setSelectedGridId(grid.id);
  };

  const handleUpdateGrid = (id: string, updates: Partial<GridSystem>) => {
    setGrids(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const handleDeleteGrid = (id: string) => {
    setGrids(prev => prev.filter(g => g.id !== id));
    setSelectedGridId(null);
  };

  const handleSelect = (id: string | null, type: 'component' | 'grid' = 'component') => {
    if (type === 'component') {
        setSelectedId(id);
        setSelectedGridId(null);
    } else {
        setSelectedGridId(id);
        setSelectedId(null);
    }
  };

  const handleDuplicateComponent = useCallback(() => {
    if (!selectedId) return;
    
    setWorkspaceComponents(prev => {
      const componentToDuplicate = prev.find(c => c.id === selectedId);
      if (componentToDuplicate) {
        const newComponent: UIComponent = {
          ...componentToDuplicate,
          id: `comp_${Date.now()}_dup`,
          x: componentToDuplicate.x + 20,
          y: componentToDuplicate.y + 20,
        };
        setSelectedId(newComponent.id);
        return [...prev, newComponent];
      }
      return prev;
    });
  }, [selectedId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
          return;
        }
        e.preventDefault();
        handleDuplicateComponent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDuplicateComponent]);

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      const img = await loadImage(file);
      
      // Ensure we don't freeze the UI by deferring the heavy task
      setTimeout(() => {
        try {
            setLibrary((prev) => {
                const startIndex = getNextComponentIndex(prev);
                const detected = detectComponents(img, file.name, undefined, startIndex);
                return [...prev, ...detected];
            });
            setIsProcessing(false);
        } catch (err) {
            console.error(err);
            alert("Failed to process image. It might be too large or the browser memory is full.");
            setIsProcessing(false);
        }
      }, 100);

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      alert("Error loading image.");
    }
  };

  const handleFolderUpload = async (files: FileList) => {
    setIsProcessing(true);
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        alert("No image files found in the selected folder.");
        setIsProcessing(false);
        return;
    }

    // Process files recursively to avoid blocking UI too much
    const processNext = async (index: number, accumulatedComponents: UIComponent[]) => {
        if (index >= imageFiles.length) {
            setLibrary(prev => [...prev, ...accumulatedComponents]);
            setIsProcessing(false);
            return;
        }

        const file = imageFiles[index];
        try {
            const img = await loadImage(file);
            // Small delay to let UI update
            setTimeout(() => {
                try {
                    const startIndex = getNextComponentIndex(library, accumulatedComponents);
                    const detected = detectComponents(img, file.name, undefined, startIndex);
                    processNext(index + 1, [...accumulatedComponents, ...detected]);
                } catch (err) {
                    console.error(`Failed to process ${file.name}`, err);
                    processNext(index + 1, accumulatedComponents);
                }
            }, 50);
        } catch (err) {
            console.error(`Failed to load ${file.name}`, err);
            processNext(index + 1, accumulatedComponents);
        }
    };

    processNext(0, []);
  };

  const updateComponent = useCallback((id: string, updates: Partial<UIComponent>) => {
    // Check workspace first
    setWorkspaceComponents(prev => {
      if (prev.some(c => c.id === id)) {
        return prev.map(c => {
          if (c.id === id) {
            const next = { ...c, ...updates };
            // If text properties changed, regenerate bitmap
            if (updates.textProperties && next.textProperties) {
              const { dataUrl, width, height } = createTextImage(
                next.textProperties.text,
                next.textProperties.fontSize,
                next.textProperties.fontFamily,
                next.textProperties.color
              );
              next.imageBase64 = dataUrl;
              next.width = width;
              next.height = height;
              next.originalWidth = width;
              next.originalHeight = height;
            }
            return next;
          }
          return c;
        });
      }
      return prev;
    });

    // Check library
    setLibrary(prev => {
        if (prev.some(c => c.id === id)) {
            return prev.map(c => c.id === id ? { ...c, ...updates } : c);
        }
        return prev;
    });
  }, []);

  const handleAutoName = async () => {
    if (!hasApiKey) return;
    setIsProcessing(true);
    // Auto-name library components
    await bulkRenameComponents(library, (index, newName) => {
        setLibrary(prev => {
            const next = [...prev];
            if (next[index]) {
                next[index] = { ...next[index], name: newName };
            }
            return next;
        });
    });
    setIsProcessing(false);
  };

  const handleSingleAutoName = async (comp: UIComponent) => {
    if (!hasApiKey) return;
    updateComponent(comp.id, { name: "Analyzing..." });
    const newName = await generateComponentName(comp);
    updateComponent(comp.id, { name: newName });
  };

  const handleAddPlaceholder = () => {
    const width = 60;
    const height = 60;
    const placeholder: UIComponent = {
      id: `placeholder_${Date.now()}`,
      name: 'Placeholder',
      imageBase64: createPlaceholderImage(width, height),
      x: 0,
      y: 0,
      width,
      height,
      originalX: 0,
      originalY: 0,
      originalWidth: width,
      originalHeight: height,
      importTime: Date.now(),
      sourceFileName: 'Internal'
    };
    setLibrary(prev => [...prev, placeholder]);
  };

  const handleAddText = (text: string, fontSize: number, fontFamily: string, color: string) => {
    const { dataUrl, width, height } = createTextImage(text, fontSize, fontFamily, color);
    const newComponent: UIComponent = {
      id: `text_${Date.now()}`,
      name: text.substring(0, 20),
      imageBase64: dataUrl,
      x: artboardSize.width / 2 - width / 2,
      y: artboardSize.height / 2 - height / 2,
      width,
      height,
      originalX: 0,
      originalY: 0,
      originalWidth: width,
      originalHeight: height,
      importTime: Date.now(),
      sourceFileName: 'Text',
      textProperties: { text, fontSize, fontFamily, color }
    };
    setWorkspaceComponents(prev => [...prev, newComponent]);
    setSelectedId(newComponent.id);
  };

  const handleDropAsset = (libraryId: string, x: number, y: number) => {
    const source = library.find(c => c.id === libraryId);
    if (source) {
        const newComponent: UIComponent = {
            ...source,
            // Create a unique ID for the instance
            id: `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            x: x - (source.width / 2), // Center on mouse
            y: y - (source.height / 2),
            isSelected: false
        };
        setWorkspaceComponents(prev => [...prev, newComponent]);
        setSelectedId(newComponent.id);
    }
  };

  const handleDeleteComponent = (id: string) => {
    setWorkspaceComponents(prev => prev.filter(c => c.id !== id));
    setSelectedId(null);
  };

  const handleZIndexAction = (id: string, action: 'front' | 'back' | 'forward' | 'backward') => {
    setWorkspaceComponents(prev => {
        const index = prev.findIndex(c => c.id === id);
        if (index === -1) return prev;
        
        const newArr = [...prev];
        const item = newArr[index];

        if (action === 'front') {
            newArr.splice(index, 1);
            newArr.push(item);
        } else if (action === 'back') {
            newArr.splice(index, 1);
            newArr.unshift(item);
        } else if (action === 'forward') {
            if (index < newArr.length - 1) {
                [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
            }
        } else if (action === 'backward') {
            if (index > 0) {
                [newArr[index], newArr[index - 1]] = [newArr[index - 1], newArr[index]];
            }
        }
        return newArr;
    });
  };

  const handleExport = async () => {
    const zip = new JSZip();
    const imagesFolder = zip.folder("images");
    
    const exportData = await Promise.all(workspaceComponents.map(async (component) => {
      const { name, x, y, width, height, id, tags } = component;
      
      // Generate scaled image
      const scaledImageBase64 = await renderScaledComponent(component);
      
      // Generate a safe filename
      const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeName}_${id}.png`;
      
      // Extract base64 data (remove prefix)
      const base64Data = scaledImageBase64.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
      
      if (imagesFolder) {
        imagesFolder.file(fileName, base64Data, { base64: true });
      }
      
      return {
        name,
        tags: tags || [],
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
        imagePath: `images/${fileName}`
      };
    }));
    
    zip.file("layout.json", JSON.stringify({
      artboard: artboardSize,
      components: exportData
    }, null, 2));
    
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layout_export.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = async () => {
    const confirmed = await confirm({
      title: "Clear Workspace",
      message: "Are you sure you want to clear the workspace? This action cannot be undone.",
      confirmText: "Clear",
      type: "danger"
    });

    if (confirmed) {
      setWorkspaceComponents([]);
      setSelectedId(null);
    }
  };

  const handleExportWorkspace = () => {
    const data = {
      version: 1,
      library,
      workspaceComponents,
      grids,
      backgroundImage,
      artboardSize
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workspace.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportWorkspace = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.version === 1) {
          setLibrary(data.library || []);
          setWorkspaceComponents(data.workspaceComponents || []);
          setGrids(data.grids || []);
          setBackgroundImage(data.backgroundImage || null);
          if (data.artboardSize) {
            setArtboardSize(data.artboardSize);
          }
          setSelectedId(null);
          setSelectedGridId(null);
        } else {
          alert("Unsupported workspace version.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to import workspace. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleSetBackground = (file: File) => {
    const url = URL.createObjectURL(file);
    setBackgroundImage(url);
  };

  const handleGenerateBackground = async (prompt: string) => {
    if (!hasApiKey) return;
    setIsProcessing(true);
    try {
        const base64 = await generateReferenceImage(prompt);
        setBackgroundImage(base64);
    } catch (e) {
        console.error(e);
        alert("Failed to generate image.");
    } finally {
        setIsProcessing(false);
    }
  };

  // Determine selection source
  const workspaceComp = workspaceComponents.find(c => c.id === selectedId);
  const libraryComp = library.find(c => c.id === selectedId);
  const selectedComponent = workspaceComp || libraryComp || null;
  const isWorkspaceComponent = !!workspaceComp;

  const handleDeleteLibraryComponent = (id: string) => {
    setLibrary(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) {
        setSelectedId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Toolbar 
        onExport={handleExport} 
        onClear={handleClear} 
        componentCount={workspaceComponents.length} 
        onSetBackground={handleSetBackground}
        onGenerateBackground={handleGenerateBackground}
        onClearBackground={() => setBackgroundImage(null)}
        hasBackground={!!backgroundImage}
        hasApiKey={hasApiKey}
        isProcessing={isProcessing}
        artboardSize={artboardSize}
        onResize={handleArtboardResize}
        interactionMode={interactionMode}
        onSetInteractionMode={setInteractionMode}
        onAddText={handleAddText}
        onExportWorkspace={handleExportWorkspace}
        onImportWorkspace={handleImportWorkspace}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          onFileUpload={handleFileUpload} 
          onFolderUpload={handleFolderUpload}
          isProcessing={isProcessing}
          library={library}
          selectedId={selectedId}
          onSelectComponent={(id) => handleSelect(id, 'component')}
          onAutoName={handleAutoName}
          onAddPlaceholder={handleAddPlaceholder}
          hasApiKey={hasApiKey}
          onDeleteComponent={handleDeleteLibraryComponent}
        />
        
        <Workspace 
          components={workspaceComponents} 
          onUpdateComponent={updateComponent}
          onSelectComponent={(id) => handleSelect(id, 'component')}
          selectedId={selectedId}
          onDropAsset={handleDropAsset}
          backgroundImage={backgroundImage}
          artboardSize={artboardSize}
          grids={grids}
          onAddGrid={handleAddGrid}
          onSelectGrid={(id) => handleSelect(id, 'grid')}
          selectedGridId={selectedGridId}
          interactionMode={interactionMode}
        />
        
        <PropertyPanel 
          component={selectedComponent}
          selectedGrid={grids.find(g => g.id === selectedGridId) || null}
          components={workspaceComponents}
          grids={grids}
          onSelect={(id) => handleSelect(id, 'component')}
          onSelectGrid={(id) => handleSelect(id, 'grid')}
          onChange={updateComponent}
          onGridChange={handleUpdateGrid}
          onGridDelete={handleDeleteGrid}
          hasApiKey={hasApiKey}
          onSingleAutoName={handleSingleAutoName}
          onDelete={handleDeleteComponent}
          onDuplicate={handleDuplicateComponent}
          onZIndexChange={handleZIndexAction}
          isWorkspaceComponent={isWorkspaceComponent}
        />
      </div>
    </div>
  );
}

export default App;