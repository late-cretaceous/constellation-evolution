import React from 'react';
import { TURBO_SPEED } from '../../simulation/constants';

/**
 * Displays simulation statistics and control buttons
 * Enhanced with turbo mode button for rapid testing
 */
const SimulationStats = ({ 
  generation, 
  stats, 
  isRunning, 
  onToggleSimulation, 
  onRestartSimulation,
  showRestartConfirmation,
  onConfirmRestart,
  onCancelRestart,
  lastAutosaveTime,
  speed,
  setSpeed,
  isTurboMode,
  onToggleTurboMode
}) => {
  // Format the last autosave time
  const formatLastSaveTime = () => {
    if (!lastAutosaveTime) return 'Not saved yet';
    
    const now = new Date();
    const diffMs = now - lastAutosaveTime;
    
    // If less than a minute, show "just now"
    if (diffMs < 60000) {
      return 'Just now';
    }
    
    // If less than an hour, show minutes
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Format as time
    return lastAutosaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
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
            onClick={onToggleTurboMode}
            className={`button ${isTurboMode ? 'button-orange active' : 'button-blue'}`}
            title={`Turbo Mode (${TURBO_SPEED}x speed)`}
          >
            {isTurboMode ? 'Normal Speed' : 'Turbo Mode'}
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
      <div className="stats-details">
        <div className="joint-diversity">
          Joint Diversity: Min {stats.minJoints} | Avg {stats.avgJoints} | Max {stats.maxJoints}
        </div>
        <div className="autosave-info">
          <span className="autosave-icon">💾</span> Last autosave: {formatLastSaveTime()}
        </div>
        {isTurboMode && (
          <div className="turbo-info">
            <span className="turbo-icon">⚡</span> Turbo Mode: {TURBO_SPEED}x speed
          </div>
        )}
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