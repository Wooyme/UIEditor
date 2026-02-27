import React, { useRef, useState, useEffect, useCallback } from 'react';
import { UIComponent, DragType, GridSystem } from '../types';

interface WorkspaceProps {
  components: UIComponent[];
  onUpdateComponent: (id: string, updates: Partial<UIComponent>) => void;
  onSelectComponent: (id: string | null) => void;
  selectedId: string | null;
  onDropAsset: (libraryId: string, x: number, y: number) => void;
  backgroundImage: string | null;
  artboardSize: { width: number; height: number };
  grids: GridSystem[];
  onAddGrid: (grid: GridSystem) => void;
  onSelectGrid: (id: string | null) => void;
  selectedGridId: string | null;
  interactionMode: 'select' | 'draw_grid' | 'scale';
}

export const Workspace: React.FC<WorkspaceProps> = ({ 
  components, 
  onUpdateComponent, 
  onSelectComponent,
  selectedId,
  onDropAsset,
  backgroundImage,
  artboardSize,
  grids,
  onAddGrid,
  onSelectGrid,
  selectedGridId,
  interactionMode
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [drawingGrid, setDrawingGrid] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const [resizing, setResizing] = useState<{ id: string; handle: string; startX: number; startY: number; startWidth: number; startHeight: number; startXPos: number; startYPos: number } | null>(null);
  const [adjustingSlice, setAdjustingSlice] = useState<{ id: string; side: 'left' | 'right' | 'top' | 'bottom'; startVal: number; startMouse: number } | null>(null);

  // Handle Drop from Sidebar
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('type');
      const id = e.dataTransfer.getData('id');

      if (type === DragType.SIDEBAR_ASSET && containerRef.current) {
          // Get artboard rect
          const artboard = containerRef.current.querySelector('.artboard');
          if (!artboard) return;
          
          const rect = artboard.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Optional: Snap to grid on drop
          const snappedX = Math.round(x / 10) * 10;
          const snappedY = Math.round(y / 10) * 10;
          
          onDropAsset(id, snappedX, snappedY);
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Allow drop
      e.dataTransfer.dropEffect = 'copy';
  };

  // Handle Internal Canvas Movement
  const handleMouseDown = (e: React.MouseEvent, component?: UIComponent) => {
    e.stopPropagation();
    
    // If drawing grid, start drawing
    if (interactionMode === 'draw_grid') {
        const artboard = containerRef.current?.querySelector('.artboard');
        if (!artboard) return;
        const rect = artboard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setDrawingGrid({ startX: x, startY: y, currentX: x, currentY: y });
        return;
    }

    // If clicking on component
    if (component) {
        if (component.locked) {
            return;
        }

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setDraggingId(component.id);
        onSelectComponent(component.id);
    } else {
        // Clicking on empty space
        onSelectComponent(null);
        onSelectGrid(null);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, component: UIComponent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing({
        id: component.id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: component.width,
        startHeight: component.height,
        startXPos: component.x,
        startYPos: component.y
    });
  };

  const handleSliceAdjustStart = (e: React.MouseEvent, component: UIComponent, side: 'left' | 'right' | 'top' | 'bottom') => {
    e.stopPropagation();
    e.preventDefault();
    const currentVal = component.nineSlice?.[side] || 0;
    setAdjustingSlice({
        id: component.id,
        side,
        startVal: currentVal,
        startMouse: (side === 'left' || side === 'right') ? e.clientX : e.clientY
    });
  };

  const calculateSnap = (x: number, y: number, width: number, height: number) => {
    let newX = x;
    let newY = y;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const SNAP_THRESHOLD = 15;

    // Check all grids
    for (const grid of grids) {
        // Check if component center is within grid bounds (with some padding)
        if (centerX >= grid.x - SNAP_THRESHOLD && 
            centerX <= grid.x + grid.width + SNAP_THRESHOLD &&
            centerY >= grid.y - SNAP_THRESHOLD && 
            centerY <= grid.y + grid.height + SNAP_THRESHOLD) {
            
            const cellWidth = grid.width / grid.cols;
            const cellHeight = grid.height / grid.rows;

            // Find nearest column center
            const relativeX = centerX - grid.x;
            const colIndex = Math.round((relativeX - cellWidth/2) / cellWidth);
            const targetCenterX = grid.x + (colIndex * cellWidth) + cellWidth/2;

            if (Math.abs(centerX - targetCenterX) < SNAP_THRESHOLD) {
                newX = targetCenterX - width / 2;
            }

            // Find nearest row center
            const relativeY = centerY - grid.y;
            const rowIndex = Math.round((relativeY - cellHeight/2) / cellHeight);
            const targetCenterY = grid.y + (rowIndex * cellHeight) + cellHeight/2;

            if (Math.abs(centerY - targetCenterY) < SNAP_THRESHOLD) {
                newY = targetCenterY - height / 2;
            }
        }
    }
    return { x: newX, y: newY };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const artboard = containerRef.current?.querySelector('.artboard');
    if (!artboard) return;
    const artboardRect = artboard.getBoundingClientRect();

    if (drawingGrid) {
        const x = e.clientX - artboardRect.left;
        const y = e.clientY - artboardRect.top;
        setDrawingGrid(prev => prev ? { ...prev, currentX: x, currentY: y } : null);
        return;
    }

    if (resizing) {
        const dx = e.clientX - resizing.startX;
        const dy = e.clientY - resizing.startY;
        const component = components.find(c => c.id === resizing.id);
        if (!component) return;

        let newWidth = resizing.startWidth;
        let newHeight = resizing.startHeight;
        let newX = resizing.startXPos;
        let newY = resizing.startYPos;

        if (resizing.handle.includes('e')) newWidth = Math.max(10, resizing.startWidth + dx);
        if (resizing.handle.includes('s')) newHeight = Math.max(10, resizing.startHeight + dy);
        if (resizing.handle.includes('w')) {
            const delta = Math.min(resizing.startWidth - 10, dx);
            newWidth = resizing.startWidth - delta;
            newX = resizing.startXPos + delta;
        }
        if (resizing.handle.includes('n')) {
            const delta = Math.min(resizing.startHeight - 10, dy);
            newHeight = resizing.startHeight - delta;
            newY = resizing.startYPos + delta;
        }

        // Proportional scaling if shift key or mode is proportional
        if (e.shiftKey || component.scaleMode === 'proportional' || !component.scaleMode) {
            const ratio = resizing.startWidth / resizing.startHeight;
            if (resizing.handle === 'se' || resizing.handle === 'nw') {
                if (Math.abs(dx) > Math.abs(dy)) {
                    newHeight = newWidth / ratio;
                } else {
                    newWidth = newHeight * ratio;
                }
            }
        }

        onUpdateComponent(resizing.id, { width: newWidth, height: newHeight, x: newX, y: newY });
        return;
    }

    if (adjustingSlice) {
        const component = components.find(c => c.id === adjustingSlice.id);
        if (!component) return;

        const mousePos = (adjustingSlice.side === 'left' || adjustingSlice.side === 'right') ? e.clientX : e.clientY;
        const delta = mousePos - adjustingSlice.startMouse;
        
        // We need to map screen delta to image pixel delta
        // But for now let's just use screen delta as a proxy or assume 1:1 if not scaled too much
        // Actually, the nine-slice values are in pixels of the ORIGINAL image? 
        // Or pixels of the CURRENT component size?
        // Usually they are pixels of the original image.
        
        let newVal = adjustingSlice.startVal + delta;
        newVal = Math.max(0, newVal);

        const currentSlice = component.nineSlice || { left: 0, right: 0, top: 0, bottom: 0 };
        onUpdateComponent(adjustingSlice.id, { 
            nineSlice: { ...currentSlice, [adjustingSlice.side]: Math.round(newVal) } 
        });
        return;
    }

    if (draggingId) {
        const component = components.find(c => c.id === draggingId);
        if (!component) return;

        let newX = e.clientX - artboardRect.left - dragOffset.x;
        let newY = e.clientY - artboardRect.top - dragOffset.y;

        // Apply grid snapping
        const snapped = calculateSnap(newX, newY, component.width, component.height);
        
        // Fallback to 10px grid if no custom grid snap happened
        if (snapped.x === newX) snapped.x = Math.round(newX / 10) * 10;
        if (snapped.y === newY) snapped.y = Math.round(newY / 10) * 10;

        onUpdateComponent(draggingId, { x: snapped.x, y: snapped.y });
    }
  }, [draggingId, dragOffset, onUpdateComponent, drawingGrid, components, grids, resizing, adjustingSlice]);

  const handleMouseUp = useCallback(() => {
    if (drawingGrid) {
        const width = Math.abs(drawingGrid.currentX - drawingGrid.startX);
        const height = Math.abs(drawingGrid.currentY - drawingGrid.startY);
        
        if (width > 20 && height > 20) {
            const newGrid: GridSystem = {
                id: `grid_${Date.now()}`,
                x: Math.min(drawingGrid.startX, drawingGrid.currentX),
                y: Math.min(drawingGrid.startY, drawingGrid.currentY),
                width,
                height,
                rows: 2,
                cols: 2
            };
            onAddGrid(newGrid);
        }
        setDrawingGrid(null);
    }
    setDraggingId(null);
    setResizing(null);
    setAdjustingSlice(null);
  }, [drawingGrid, onAddGrid]);

  useEffect(() => {
    if (draggingId || drawingGrid || resizing || adjustingSlice) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, drawingGrid, resizing, adjustingSlice, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className={`flex-1 relative overflow-auto bg-slate-900 flex items-center justify-center p-8 ${interactionMode === 'draw_grid' ? 'cursor-crosshair' : ''}`}
      ref={containerRef}
      onMouseDown={(e) => handleMouseDown(e)}
    >
      <div 
        className="artboard relative border-2 border-slate-600 transition-all duration-300 ease-in-out"
        style={{ width: artboardSize.width, height: artboardSize.height }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
            <svg width="100%" height="100%">
            <defs>
                <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
        </div>

        {/* Custom Grids */}
        {grids.map(grid => (
            <div
                key={grid.id}
                className={`absolute border border-blue-400/50 pointer-events-none ${selectedGridId === grid.id ? 'bg-blue-500/10 border-blue-500' : ''}`}
                style={{
                    left: grid.x,
                    top: grid.y,
                    width: grid.width,
                    height: grid.height,
                    zIndex: 50 // Ensure grid is on top
                }}
            >
                {/* Hit area for selection */}
                <div 
                    className={`absolute inset-0 ${grid.locked ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'}`}
                    onMouseDown={(e) => {
                        if (interactionMode === 'select' && !grid.locked) {
                            e.stopPropagation();
                            onSelectGrid(grid.id);
                        }
                    }}
                />

                {/* Render Grid Lines */}
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                    {Array.from({ length: grid.rows - 1 }).map((_, i) => (
                        <div key={i} className="flex-1 border-b border-blue-400/50 border-dashed w-full" />
                    ))}
                    <div className="flex-1" />
                </div>
                <div className="absolute inset-0 flex flex-row pointer-events-none">
                    {Array.from({ length: grid.cols - 1 }).map((_, i) => (
                        <div key={i} className="flex-1 border-r border-blue-400/50 border-dashed h-full" />
                    ))}
                    <div className="flex-1" />
                </div>
                
                {selectedGridId === grid.id && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-1 rounded-bl pointer-events-none">
                        {grid.rows}x{grid.cols}
                    </div>
                )}
            </div>
        ))}

        {/* Drawing Preview */}
        {drawingGrid && (
            <div 
                className="absolute border-2 border-blue-500 bg-blue-500/10 z-50"
                style={{
                    left: Math.min(drawingGrid.startX, drawingGrid.currentX),
                    top: Math.min(drawingGrid.startY, drawingGrid.currentY),
                    width: Math.abs(drawingGrid.currentX - drawingGrid.startX),
                    height: Math.abs(drawingGrid.currentY - drawingGrid.startY)
                }}
            />
        )}

        {backgroundImage && (
            <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
                <img 
                src={backgroundImage} 
                alt="Reference Background" 
                className="max-w-full max-h-full object-contain opacity-50"
                />
            </div>
        )}

        {components.length === 0 && !backgroundImage && grids.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 z-10">
                <p className="text-slate-500 text-lg font-medium">Drag components here</p>
            </div>
        )}

        {components.map((comp) => {
            const isSelected = selectedId === comp.id;
            const isNineSlice = comp.scaleMode === 'nine-slice';
            const slice = comp.nineSlice || { left: 10, right: 10, top: 10, bottom: 10 };

            return (
                <div
                    key={comp.id}
                    style={{
                        position: 'absolute',
                        left: comp.x,
                        top: comp.y,
                        width: comp.width,
                        height: comp.height,
                        zIndex: isSelected ? 20 : 10,
                    }}
                    className={`
                        group
                        ${comp.locked ? 'pointer-events-none' : 'cursor-move'}
                        ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:ring-2 hover:ring-blue-400'}
                    `}
                    onMouseDown={(e) => handleMouseDown(e, comp)}
                >
                    {/* Render Content */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {isNineSlice ? (
                            <div 
                                className="w-full h-full"
                                style={{
                                    borderStyle: 'solid',
                                    borderWidth: `${slice.top}px ${slice.right}px ${slice.bottom}px ${slice.left}px`,
                                    borderImageSource: `url(${comp.imageBase64})`,
                                    borderImageSlice: `${slice.top} ${slice.right} ${slice.bottom} ${slice.left} fill`,
                                    borderImageRepeat: 'stretch'
                                }}
                            />
                        ) : (
                            <div 
                                className="w-full h-full"
                                style={{
                                    backgroundImage: `url(${comp.imageBase64})`,
                                    backgroundSize: '100% 100%',
                                    backgroundRepeat: 'no-repeat',
                                }}
                            />
                        )}
                    </div>

                    {/* Label */}
                    <div className={`
                        absolute -top-6 left-0 bg-primary text-xs px-2 py-0.5 rounded text-white whitespace-nowrap z-30
                        ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                        transition-opacity pointer-events-none
                    `}>
                        {comp.name}
                    </div>

                    {/* Resize Handles */}
                    {isSelected && interactionMode === 'scale' && !comp.locked && (
                        <>
                            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full cursor-nw-resize z-40" onMouseDown={(e) => handleResizeStart(e, comp, 'nw')} />
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full cursor-ne-resize z-40" onMouseDown={(e) => handleResizeStart(e, comp, 'ne')} />
                            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full cursor-sw-resize z-40" onMouseDown={(e) => handleResizeStart(e, comp, 'sw')} />
                            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full cursor-se-resize z-40" onMouseDown={(e) => handleResizeStart(e, comp, 'se')} />
                            
                            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-primary rounded-full cursor-w-resize z-40" onMouseDown={(e) => handleResizeStart(e, comp, 'w')} />
                            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-primary rounded-full cursor-e-resize z-40" onMouseDown={(e) => handleResizeStart(e, comp, 'e')} />
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-primary rounded-full cursor-n-resize z-40" onMouseDown={(e) => handleResizeStart(e, comp, 'n')} />
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-primary rounded-full cursor-s-resize z-40" onMouseDown={(e) => handleResizeStart(e, comp, 's')} />
                        </>
                    )}

                    {/* 9-Slice Grid Adjusters */}
                    {isSelected && isNineSlice && interactionMode === 'scale' && !comp.locked && (
                        <>
                            <div 
                                className="absolute top-0 bottom-0 border-l border-dashed border-primary/50 cursor-col-resize hover:border-primary z-30"
                                style={{ left: slice.left }}
                                onMouseDown={(e) => handleSliceAdjustStart(e, comp, 'left')}
                            />
                            <div 
                                className="absolute top-0 bottom-0 border-r border-dashed border-primary/50 cursor-col-resize hover:border-primary z-30"
                                style={{ right: slice.right }}
                                onMouseDown={(e) => handleSliceAdjustStart(e, comp, 'right')}
                            />
                            <div 
                                className="absolute left-0 right-0 border-t border-dashed border-primary/50 cursor-row-resize hover:border-primary z-30"
                                style={{ top: slice.top }}
                                onMouseDown={(e) => handleSliceAdjustStart(e, comp, 'top')}
                            />
                            <div 
                                className="absolute left-0 right-0 border-b border-dashed border-primary/50 cursor-row-resize hover:border-primary z-30"
                                style={{ bottom: slice.bottom }}
                                onMouseDown={(e) => handleSliceAdjustStart(e, comp, 'bottom')}
                            />
                        </>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};