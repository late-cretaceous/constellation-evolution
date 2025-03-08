import React from 'react';

/**
 * Displays simulation statistics and control buttons
 */
const SimulationStats = ({ 
  generation, 
  stats, 
  isRunning, 
  onToggleSimulation, 
  onRestartSimulation 
}) => {
  return (
    <div className="stats-container">
      <div className="stats-row">
        <div className="stats-values">
          <span className="stats-value">Generation: {generation}</span>
          <span className="stats-value">Best Fitness: {stats.bestFitness}</span>
          <span className="stats-value">Avg Fitness: {stats.averageFitness}</span>
        </div>
        <div className="buttons-container">
          <button 
            onClick={onToggleSimulation}
            className="button button-blue"
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={onRestartSimulation}
            className="button button-red"
          >
            Restart
          </button>
        </div>
      </div>
      <div className="joint-diversity">
        Joint Diversity: Min {stats.minJoints} | Avg {stats.avgJoints} | Max {stats.maxJoints}
      </div>
    </div>
  );
};

export default SimulationStats;
