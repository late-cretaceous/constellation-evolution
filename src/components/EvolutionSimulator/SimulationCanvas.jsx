import React from 'react';

/**
 * The canvas component for rendering the simulation
 * @param {Object} props - Component props
 * @param {number} props.width - Canvas width
 * @param {number} props.height - Canvas height
 * @param {React.RefObject} props.canvasRef - Reference to the canvas element
 */
const SimulationCanvas = ({ width, height, canvasRef }) => {
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="simulation-canvas"
    />
  );
};

export default SimulationCanvas;
