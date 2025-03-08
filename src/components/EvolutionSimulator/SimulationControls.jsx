import React from 'react';
import {
  MIN_POPULATION,
  MAX_POPULATION,
  MIN_FOOD_AMOUNT,
  MAX_FOOD_AMOUNT,
  MIN_MUTATION_RATE,
  MAX_MUTATION_RATE,
  MIN_SIMULATION_SPEED,
  MAX_SIMULATION_SPEED
} from '../../simulation/constants';

/**
 * Controls for adjusting simulation parameters
 */
const SimulationControls = ({
  population,
  foodAmount,
  mutationRate,
  speed,
  setPopulation,
  setFoodAmount,
  setMutationRate,
  setSpeed
}) => {
  return (
    <div className="controls-container">
      <div className="control-item">
        <label className="control-label">Population Size</label>
        <input 
          type="range" 
          min={MIN_POPULATION} 
          max={MAX_POPULATION} 
          value={population} 
          onChange={(e) => setPopulation(parseInt(e.target.value))}
          className="control-slider"
        />
        <div className="control-value">{population}</div>
      </div>
      
      <div className="control-item">
        <label className="control-label">Food Amount</label>
        <input 
          type="range" 
          min={MIN_FOOD_AMOUNT} 
          max={MAX_FOOD_AMOUNT} 
          value={foodAmount} 
          onChange={(e) => setFoodAmount(parseInt(e.target.value))}
          className="control-slider"
        />
        <div className="control-value">{foodAmount}</div>
      </div>
      
      <div className="control-item">
        <label className="control-label">Mutation Rate</label>
        <input 
          type="range" 
          min={MIN_MUTATION_RATE} 
          max={MAX_MUTATION_RATE} 
          step="0.01" 
          value={mutationRate} 
          onChange={(e) => setMutationRate(parseFloat(e.target.value))}
          className="control-slider"
        />
        <div className="control-value">{mutationRate.toFixed(2)}</div>
      </div>
      
      <div className="control-item">
        <label className="control-label">Simulation Speed</label>
        <input 
          type="range" 
          min={MIN_SIMULATION_SPEED} 
          max={MAX_SIMULATION_SPEED} 
          step="0.1" 
          value={speed} 
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="control-slider"
        />
        <div className="control-value">{speed.toFixed(1)}x</div>
      </div>
    </div>
  );
};

export default SimulationControls;
