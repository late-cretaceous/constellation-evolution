// src/components/EvolutionSimulator/MinimapOverlay.jsx
import React, { useRef, useEffect } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../simulation/constants';

/**
 * A separate overlay component for the minimap
 */
const MinimapOverlay = ({ 
  canvasRef, 
  viewportOffset = { x: 0, y: 0 }, 
  viewportScale = 1, 
  organismPositions = [], 
  foodPositions = [] 
}) => {
  const minimapRef = useRef(null);
  
  useEffect(() => {
    if (!minimapRef.current) return;
    
    const minimap = minimapRef.current;
    const ctx = minimap.getContext('2d');
    const mapSize = minimap.width;
    
    // Clear previous frame
    ctx.clearRect(0, 0, mapSize, mapSize);
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 30, 0.8)';
    ctx.fillRect(0, 0, mapSize, mapSize);
    
    // Calculate map scale
    const mapScale = mapSize / Math.max(CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw simulation area boundary
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, CANVAS_WIDTH * mapScale, CANVAS_HEIGHT * mapScale);
    
    // Calculate viewport dimensions
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const canvasWidth = canvas.clientWidth;
      const canvasHeight = canvas.clientHeight;
      
      // Draw viewport rectangle
      ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(
        -viewportOffset.x * mapScale / viewportScale,
        -viewportOffset.y * mapScale / viewportScale,
        canvasWidth * mapScale / viewportScale,
        canvasHeight * mapScale / viewportScale
      );
    }
    
    // Draw organisms
    ctx.fillStyle = 'rgba(0, 255, 0, 1.0)';
    organismPositions.forEach(pos => {
      ctx.beginPath();
      ctx.arc(
        pos.x * mapScale, 
        pos.y * mapScale, 
        2, 0, Math.PI * 2
      );
      ctx.fill();
    });
    
    // Draw food
    ctx.fillStyle = 'rgba(255, 255, 0, 1.0)';
    foodPositions.forEach(pos => {
      ctx.beginPath();
      ctx.arc(
        pos.x * mapScale, 
        pos.y * mapScale, 
        1, 0, Math.PI * 2
      );
      ctx.fill();
    });
    
    // Add label
    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MAP', mapSize/2, 10);
    
  }, [canvasRef, viewportOffset, viewportScale, organismPositions, foodPositions]);
  
  return (
    <div className="minimap-container">
      <canvas
        ref={minimapRef}
        width={100}
        height={100}
        className="minimap-canvas"
      />
    </div>
  );
};

export default MinimapOverlay;