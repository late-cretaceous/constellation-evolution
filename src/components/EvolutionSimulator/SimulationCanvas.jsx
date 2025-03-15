import React, { useState, useEffect, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../simulation/constants';

/**
 * The canvas component for rendering the simulation with high-DPI support and responsive sizing
 * @param {Object} props - Component props
 * @param {number} props.pixelRatio - Pixel ratio for high-DPI rendering (default: devicePixelRatio)
 * @param {React.RefObject} props.canvasRef - Reference to the canvas element
 */
const SimulationCanvas = ({ pixelRatio = window.devicePixelRatio || 1, canvasRef }) => {
  // Track canvas dimensions for responsive sizing
  const [dimensions, setDimensions] = useState({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT
  });

  // Calculate optimal canvas size based on container
  const calculateCanvasSize = useCallback(() => {
    if (!canvasRef.current) return;

    // Get the container dimensions
    const container = canvasRef.current.parentElement;
    const containerWidth = container.clientWidth;
    
    // Get the available height (account for stats display below the canvas)
    // Using 80% of the viewport height as a reasonable estimate for available space
    // This prevents the canvas from being too tall
    const viewportHeight = window.innerHeight;
    const availableHeight = Math.min(
      viewportHeight * 0.8, 
      container.clientHeight || viewportHeight * 0.8
    );
    
    // Calculate the maximum possible size while maintaining aspect ratio
    const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
    
    let newWidth, newHeight;
    
    // If container is wider than needed for full height
    if (containerWidth / availableHeight > aspectRatio) {
      // Height constrained
      newHeight = availableHeight;
      newWidth = newHeight * aspectRatio;
    } else {
      // Width constrained
      newWidth = containerWidth;
      newHeight = newWidth / aspectRatio;
    }
    
    // Update dimensions if changed
    if (newWidth !== dimensions.width || newHeight !== dimensions.height) {
      setDimensions({
        width: newWidth,
        height: newHeight
      });
    }
  }, [canvasRef, dimensions.width, dimensions.height]);

  // Handle window resize
  useEffect(() => {
    // Initial calculation
    calculateCanvasSize();
    
    // Add resize listener
    window.addEventListener('resize', calculateCanvasSize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', calculateCanvasSize);
    };
  }, [calculateCanvasSize]);

  // Set up high-DPI canvas scaling when dimensions change
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set the canvas dimensions accounting for device pixel ratio
    canvas.width = dimensions.width * pixelRatio;
    canvas.height = dimensions.height * pixelRatio;
    
    // Scale all canvas operations by pixel ratio
    ctx.scale(pixelRatio, pixelRatio);
    
    // Store the pixel ratio and logical dimensions on the context for the render system
    ctx.pixelRatio = pixelRatio;
    ctx.logicalWidth = CANVAS_WIDTH;
    ctx.logicalHeight = CANVAS_HEIGHT;
    
    // Set scaling factor between simulation coordinates and display coordinates
    ctx.simulationScale = dimensions.width / CANVAS_WIDTH;
    
    // Reset rendering when component unmounts or dimensions change
    return () => {
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    };
  }, [dimensions.width, dimensions.height, pixelRatio, canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      // Set CSS dimensions to calculated size
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        maxWidth: '100%'
      }}
      className="simulation-canvas"
    />
  );
};

export default SimulationCanvas;