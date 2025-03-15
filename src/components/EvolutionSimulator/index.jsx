// src/components/EvolutionSimulator/index.jsx
import React, { useRef, useState } from 'react';
import useECSSimulation from '../../hooks/useECSSimulation';
import SimulationCanvas from './SimulationCanvas';
import SimulationControls from './SimulationControls';
import SimulationStats from './SimulationStats';
import HelpPanel from './HelpPanel';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../simulation/constants';
import './EvolutionSimulator.css';

/**
 * Main Evolution Simulator component with scrolling and zooming
 */
const EvolutionSimulator = () => {
  const canvasRef = useRef(null);
  
  // Get device pixel ratio for high-DPI rendering (default to 1.5 for better performance)
  const [pixelRatio] = useState(() => Math.min(1.5, window.devicePixelRatio || 1));
  
  // Use the ECS simulation hook
  const simulation = useECSSimulation(canvasRef);
  
  return (
    <div className="simulator-container">
      <h1 className="simulator-title">Dot Organism Evolution Simulator</h1>
      
      <div className="simulator-layout">
        <div className="simulation-area">
          <div className="canvas-wrapper">
            <SimulationCanvas 
              width={CANVAS_WIDTH} 
              height={CANVAS_HEIGHT}
              pixelRatio={pixelRatio}
              canvasRef={canvasRef} 
            />
            <div className="canvas-instructions">
              <p>Drag to pan, scroll to zoom. Watch organisms evolve to seek food!</p>
            </div>
          </div>
          
          <SimulationStats 
            generation={simulation.generation}
            stats={simulation.stats}
            isRunning={simulation.isRunning}
            onToggleSimulation={simulation.toggleSimulation}
            onRestartSimulation={simulation.restartSimulation}
          />
        </div>
        
        <div className="control-panel">
          <HelpPanel />
          
          <SimulationControls 
            population={simulation.population}
            foodAmount={simulation.foodAmount}
            mutationRate={simulation.mutationRate}
            speed={simulation.speed}
            setPopulation={simulation.setPopulation}
            setFoodAmount={simulation.setFoodAmount}
            setMutationRate={simulation.setMutationRate}
            setSpeed={simulation.setSpeed}
          />
        </div>
      </div>
    </div>
  );
};

export default EvolutionSimulator;