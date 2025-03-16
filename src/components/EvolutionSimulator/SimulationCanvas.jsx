import React, { useEffect, useState, useCallback, useRef } from 'react';
import MinimapOverlay from './MinimapOverlay';
import { DEFAULT_SCALE, MIN_SCALE, MAX_SCALE } from '../../simulation/constants';

/**
 * The canvas component for rendering the simulation with high-DPI support, scrolling,
 * and organism selection
 * 
 * @param {Object} props - Component props
 * @param {number} props.width - Logical canvas width
 * @param {number} props.height - Logical canvas height
 * @param {number} props.pixelRatio - Pixel ratio for high-DPI rendering (default: devicePixelRatio)
 * @param {React.RefObject} props.canvasRef - Reference to the canvas element
 * @param {Array} props.organismPositions - Positions of organisms for minimap
 * @param {Array} props.foodPositions - Positions of food for minimap
 * @param {Function} props.onOrganismSelect - Function to call when an organism is selected
 * @param {boolean} props.selectionEnabled - Whether organism selection is enabled
 */
const SimulationCanvas = ({ 
  width, 
  height, 
  pixelRatio = window.devicePixelRatio || 1, 
  canvasRef,
  organismPositions = [],
  foodPositions = [],
  onOrganismSelect = null,
  selectionEnabled = true
}) => {
  // Viewport state
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  
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
  
  // Handle mouse down to start dragging or selecting
  const handleMouseDown = (e) => {
    // Only primary mouse button (left click)
    if (e.button !== 0) return;
    
    // Start a potential selection or drag
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialOffset({ ...viewportOffset });
    
    // Reset movement flag
    setHasMoved(false);
    
    // Track if we're starting a selection or drag (we'll know on mouse move)
    setIsSelecting(true);
  };
  
  // Handle mouse move to update viewport while dragging
  const handleMouseMove = (e) => {
    if (!isDragging && isSelecting) {
      // Check if we've moved enough to consider this a drag
      const deltaX = Math.abs(e.clientX - dragStart.x);
      const deltaY = Math.abs(e.clientY - dragStart.y);
      
      // If moved more than 5 pixels, consider it a drag
      if (deltaX > 5 || deltaY > 5) {
        setIsDragging(true);
        setHasMoved(true);
      }
    }
    
    // If dragging, update viewport
    if (isDragging) {
      const deltaX = (e.clientX - dragStart.x);
      const deltaY = (e.clientY - dragStart.y);
      
      setViewportOffset({
        x: initialOffset.x + deltaX,
        y: initialOffset.y + deltaY
      });
    }
  };
  
  // Handle click for organism selection
  const handleClick = (e) => {
    // Only register clicks, not drags
    if (hasMoved || !selectionEnabled || !onOrganismSelect) return;
    
    // Get canvas rect for coordinate calculation
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Calculate coordinates relative to canvas
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Call selection handler with coordinates and current viewport info
    onOrganismSelect(x, y, viewportOffset, scale);
  };
  
  // Handle mouse up to stop dragging and potentially select
  const handleMouseUp = (e) => {
    // Only register as a click if we haven't moved much
    if (isSelecting && !hasMoved) {
      handleClick(e);
    }
    
    // End dragging/selecting
    setIsDragging(false);
    setIsSelecting(false);
  };
  
  // Handle mouse leave to stop dragging
  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsSelecting(false);
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
      const worldX = (mouseX - viewportOffset.x) / scale;
      const worldY = (mouseY - viewportOffset.y) / scale;
      
      // Calculate new viewport offset to keep mouse position fixed
      const newOffsetX = mouseX - worldX * newScale;
      const newOffsetY = mouseY - worldY * newScale;
      
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
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setInitialOffset({ ...viewportOffset });
      setIsSelecting(true);
      setHasMoved(false);
    }
  };
  
  // Touch move handler
  const handleTouchMove = (e) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    
    if (!isDragging && isSelecting) {
      // Check if we've moved enough to consider this a drag
      const deltaX = Math.abs(touch.clientX - dragStart.x);
      const deltaY = Math.abs(touch.clientY - dragStart.y);
      
      // If moved more than 10 pixels, consider it a drag (larger threshold for touch)
      if (deltaX > 10 || deltaY > 10) {
        setIsDragging(true);
        setHasMoved(true);
      }
    }
    
    if (isDragging) {
      const deltaX = (touch.clientX - dragStart.x);
      const deltaY = (touch.clientY - dragStart.y);
      
      setViewportOffset({
        x: initialOffset.x + deltaX,
        y: initialOffset.y + deltaY
      });
    }
  };
  
  // Handle touch end for selection
  const handleTouchEnd = (e) => {
    // If it was a tap (not a drag), try to select organism
    if (isSelecting && !hasMoved && selectionEnabled && onOrganismSelect) {
      // Get the last touch position
      if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const rect = canvasRef.current.getBoundingClientRect();
        
        // Call the selection handler with canvas coordinates
        onOrganismSelect(
          touch.clientX - rect.left, 
          touch.clientY - rect.top,
          viewportOffset,
          scale
        );
      }
    }
    
    // End dragging/selecting
    setIsDragging(false);
    setIsSelecting(false);
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
          cursor: isDragging ? 'grabbing' : selectionEnabled ? 'pointer' : 'grab'
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