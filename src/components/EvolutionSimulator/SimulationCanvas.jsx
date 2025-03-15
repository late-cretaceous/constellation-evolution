import React, { useEffect } from 'react';

/**
 * The canvas component for rendering the simulation with high-DPI support
 * @param {Object} props - Component props
 * @param {number} props.width - Logical canvas width
 * @param {number} props.height - Logical canvas height
 * @param {number} props.pixelRatio - Pixel ratio for high-DPI rendering (default: devicePixelRatio)
 * @param {React.RefObject} props.canvasRef - Reference to the canvas element
 */
const SimulationCanvas = ({ width, height, pixelRatio = window.devicePixelRatio || 1, canvasRef }) => {
  // Set up high-DPI canvas scaling on mount
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set the canvas dimensions accounting for device pixel ratio
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    
    // Scale all canvas operations by pixel ratio
    ctx.scale(pixelRatio, pixelRatio);
    
    // Store the pixel ratio on the context for the render system to use
    ctx.pixelRatio = pixelRatio;
    
    // Reset rendering when component unmounts
    return () => {
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    };
  }, [width, height, pixelRatio, canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      // Set CSS dimensions to logical size
      style={{
        width: `${width}px`,
        height: `${height}px`
      }}
      className="simulation-canvas"
    />
  );
};

export default SimulationCanvas;