import React from 'react';

/**
 * Displays simulation statistics and control buttons
 * Enhanced with restart confirmation dialog
 */
const SimulationStats = ({ 
  generation, 
  stats, 
  isRunning, 
  onToggleSimulation, 
  onRestartSimulation,
  showRestartConfirmation,
  onConfirmRestart,
  onCancelRestart
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
          
          {!showRestartConfirmation ? (
            <button
              onClick={onRestartSimulation}
              className="button button-red"
            >
              Restart
            </button>
          ) : (
            <>
              <button
                onClick={onConfirmRestart}
                className="button button-red"
              >
                Confirm
              </button>
              <button
                onClick={onCancelRestart}
                className="button button-green"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      <div className="joint-diversity">
        Joint Diversity: Min {stats.minJoints} | Avg {stats.avgJoints} | Max {stats.maxJoints}
      </div>
      {showRestartConfirmation && (
        <div className="restart-warning">
          Warning: Restarting will erase all current progress. Continue?
        </div>
      )}
    </div>
  );
};

export default SimulationStats;