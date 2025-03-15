// src/components/EvolutionSimulator/index.jsx
import React, { useRef, useState } from 'react';
import useECSSimulation from '../../hooks/useECSSimulation';
import SimulationCanvas from './SimulationCanvas';
import SimulationControls from './SimulationControls';
import SimulationStats from './SimulationStats';
import HelpPanel from './HelpPanel';
import './EvolutionSimulator.css';

/**
 * Main Evolution Simulator component with responsive canvas
 */
const EvolutionSimulator = () => {
  const canvasRef = useRef(null);
  
  // Get device pixel ratio for high-DPI rendering (default to 2 for better quality)
  const [pixelRatio] = useState(() => Math.max(2, window.devicePixelRatio || 1));
  
  // Use the ECS simulation hook
  const simulation = useECSSimulation(canvasRef);
  
  return (
    <div className="simulator-container">
      <h1 className="simulator-title">Dot Organism Evolution Simulator</h1>
      
      <div className="simulator-layout">
        <div className="simulation-area">
          <div className="canvas-container">
            <SimulationCanvas 
              pixelRatio={pixelRatio}
              canvasRef={canvasRef} 
            />
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