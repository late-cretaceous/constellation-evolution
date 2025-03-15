import React, { useEffect, useState, useCallback, useRef } from 'react';
import MinimapOverlay from './MinimapOverlay';
import { DEFAULT_SCALE, MIN_SCALE, MAX_SCALE } from '../../simulation/constants';

/**
 * The canvas component for rendering the simulation with high-DPI support and scrolling
 * Enhanced with responsive sizing, improved rendering, and real entity positions in minimap
 * @param {Object} props - Component props
 * @param {number} props.width - Logical canvas width
 * @param {number} props.height - Logical canvas height
 * @param {number} props.pixelRatio - Pixel ratio for high-DPI rendering (default: devicePixelRatio)
 * @param {React.RefObject} props.canvasRef - Reference to the canvas element
 * @param {Array} props.organismPositions - Positions of organisms for minimap
 * @param {Array} props.foodPositions - Positions of food for minimap
 */
const SimulationCanvas = ({ 
  width, 
  height, 
  pixelRatio = window.devicePixelRatio || 1, 
  canvasRef,
  organismPositions = [],
  foodPositions = []
}) => {
  // Viewport state
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 });
  
  // Viewport container ref
  const containerRef = useRef(null);
  
  // Apply viewport transform to canvas context
  const applyViewportTransform = useCallback((ctx) => {
    if (!ctx) return;
    
    // Reset any existing transforms
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Apply DPI scaling
    ctx.scale(pixelRatio, pixelRatio);
    
    // Apply viewport transform
    ctx.translate(viewportOffset.x, viewportOffset.y);
    ctx.scale(scale, scale);
    
    // Store viewport info on context for render system to use
    ctx.pixelRatio = pixelRatio;
    ctx.viewportOffset = viewportOffset;
    ctx.viewportScale = scale;
  }, [pixelRatio, viewportOffset, scale]);
  
  // Resize canvas on window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const ctx = canvas.getContext('2d');
      
      // Update canvas size to match container size
      const displayWidth = container.clientWidth;
      const displayHeight = container.clientHeight;
      
      // Set the canvas dimensions accounting for device pixel ratio
      canvas.width = displayWidth * pixelRatio;
      canvas.height = displayHeight * pixelRatio;
      
      // Apply the viewport transform
      applyViewportTransform(ctx);
    };
    
    // Initial setup
    handleResize();
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [applyViewportTransform, pixelRatio]);
  
  // Center the viewport initially
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    // Initially center the viewport to show the middle of the simulation area
    const container = containerRef.current;
    const initialX = (container.clientWidth / scale - width) / 2;
    const initialY = (container.clientHeight / scale - height) / 2;
    
    setViewportOffset({ x: initialX, y: initialY });
  }, [width, height, scale]);
  
  // Apply viewport transform when it changes
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    applyViewportTransform(ctx);
  }, [viewportOffset, scale, applyViewportTransform]);
  
  // Handle mouse down to start dragging
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialOffset({ ...viewportOffset });
  };
  
  // Handle mouse move to update viewport while dragging
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = (e.clientX - dragStart.x) / scale;
    const deltaY = (e.clientY - dragStart.y) / scale;
    
    setViewportOffset({
      x: initialOffset.x + deltaX,
      y: initialOffset.y + deltaY
    });
  };
  
  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle mouse leave to stop dragging
  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  
  // Handle mouse wheel to zoom in/out
  const handleWheel = (e) => {
    e.preventDefault();
    
    // Calculate new scale
    const zoomFactor = 0.1;
    const delta = e.deltaY < 0 ? zoomFactor : -zoomFactor;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
    
    if (newScale !== scale) {
      // Calculate mouse position relative to canvas
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate old world position
      const worldX = (mouseX / scale) - viewportOffset.x;
      const worldY = (mouseY / scale) - viewportOffset.y;
      
      // Calculate new viewport offset to keep mouse position fixed
      const newOffsetX = -(worldX * newScale - mouseX);
      const newOffsetY = -(worldY * newScale - mouseY);
      
      // Update state
      setScale(newScale);
      setViewportOffset({ x: newOffsetX, y: newOffsetY });
    }
  };
  
  // Touch event handlers for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      // Single touch for panning
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setInitialOffset({ ...viewportOffset });
    }
  };
  
  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const deltaX = (touch.clientX - dragStart.x) / scale;
    const deltaY = (touch.clientY - dragStart.y) / scale;
    
    setViewportOffset({
      x: initialOffset.x + deltaX,
      y: initialOffset.y + deltaY
    });
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  
  // Reset viewport to center
  const resetViewport = () => {
    setScale(DEFAULT_SCALE);
    if (containerRef.current) {
      const container = containerRef.current;
      const initialX = (container.clientWidth / DEFAULT_SCALE - width) / 2;
      const initialY = (container.clientHeight / DEFAULT_SCALE - height) / 2;
      setViewportOffset({ x: initialX, y: initialY });
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className="simulation-canvas-container"
      style={{ 
        width: '100%', 
        height: '70vh', // Use viewport height for better responsiveness
        minHeight: '400px', // Set a minimum height
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        className="simulation-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      
      {/* Pass real entity positions to minimap overlay */}
      <MinimapOverlay 
        canvasRef={canvasRef}
        viewportOffset={viewportOffset}
        viewportScale={scale}
        organismPositions={organismPositions}
        foodPositions={foodPositions}
      />
      
      {/* Viewport controls */}
      <div className="viewport-controls">
        <button onClick={() => setScale(Math.min(MAX_SCALE, scale + 0.1))}>+</button>
        <button onClick={() => setScale(Math.max(MIN_SCALE, scale - 0.1))}>-</button>
        <button onClick={resetViewport}>Reset</button>
      </div>
    </div>
  );
};

export default SimulationCanvas;