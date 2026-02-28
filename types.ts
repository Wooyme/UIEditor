export interface UIComponent {
  id: string;
  name: string;
  imageBase64: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalX: number; // Position in the original image
  originalY: number; // Position in the original image
  originalWidth: number;
  originalHeight: number;
  isSelected?: boolean;
  importTime: number;
  sourceFileName: string;
  tags?: string[];
  locked?: boolean;
  scaleMode?: 'proportional' | 'nine-slice' | 'crop';
  nineSlice?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  textProperties?: {
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
  };
}

export interface ProcessingOptions {
  threshold: number; // Alpha threshold 0-255
  minArea: number; // Minimum pixel area to consider a component
  padding: number; // Padding around the detected blob
}

export enum DragType {
  CANVAS_COMPONENT = 'CANVAS_COMPONENT',
  SIDEBAR_ASSET = 'SIDEBAR_ASSET'
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface GridSystem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rows: number;
  cols: number;
  locked?: boolean;
}