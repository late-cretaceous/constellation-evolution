// src/components/EvolutionSimulator/MinimapOverlay.jsx
import React, { useRef, useEffect } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../simulation/constants';

/**
 * A simplified minimap overlay that shows entity positions as minimal dots
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
    ctx.fillStyle = 'rgba(0, 0, 20, 0.7)';
    ctx.fillRect(0, 0, mapSize, mapSize);
    
    // Calculate map scale
    const mapScale = mapSize / Math.max(CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw simulation area boundary
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, CANVAS_WIDTH * mapScale, CANVAS_HEIGHT * mapScale);
    
    // Calculate viewport dimensions
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const canvasWidth = canvas.clientWidth;
      const canvasHeight = canvas.clientHeight;
      
      // Draw viewport rectangle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        -viewportOffset.x * mapScale / viewportScale,
        -viewportOffset.y * mapScale / viewportScale,
        canvasWidth * mapScale / viewportScale,
        canvasHeight * mapScale / viewportScale
      );
    }
    
    // Limit the number of dots to draw for performance
    const maxDots = 300;
    
    // Draw organisms as tiny dots
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    const visibleOrganisms = organismPositions.slice(0, maxDots);
    
    // Batch rendering for better performance
    ctx.beginPath();
    visibleOrganisms.forEach(pos => {
      ctx.rect(
        pos.x * mapScale - 0.75, 
        pos.y * mapScale - 0.75, 
        1.5, 1.5
      );
    });
    ctx.fill();
    
    // Draw food as tiny dots
    ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
    const visibleFood = foodPositions.slice(0, maxDots);
    
    // Batch rendering for better performance
    ctx.beginPath();
    visibleFood.forEach(pos => {
      ctx.rect(
        pos.x * mapScale - 0.5, 
        pos.y * mapScale - 0.5, 
        1, 1
      );
    });
    ctx.fill();
    
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