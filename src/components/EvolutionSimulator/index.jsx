// src/components/EvolutionSimulator/index.jsx
import React, { useRef } from 'react';
import useECSSimulation from '../../hooks/useECSSimulation';  // Update this import
import SimulationCanvas from './SimulationCanvas';
import SimulationControls from './SimulationControls';
import SimulationStats from './SimulationStats';
import HelpPanel from './HelpPanel';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../simulation/constants';
import './EvolutionSimulator.css';

const EvolutionSimulator = () => {
  const canvasRef = useRef(null);
  
  // Use the ECS simulation hook instead of the original
  const simulation = useECSSimulation(canvasRef);
  
  return (
    <div className="simulator-container">
      <h1 className="simulator-title">Dot Organism Evolution Simulator (ECS)</h1>
      
      <div className="simulator-layout">
        <div className="simulation-area">
          <SimulationCanvas 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            canvasRef={canvasRef} 
          />
          
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