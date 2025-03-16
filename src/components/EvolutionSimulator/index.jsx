// src/components/EvolutionSimulator/index.jsx
import React, { useRef, useState, useEffect } from 'react';
import useECSSimulation from '../../hooks/useECSSimulation';
import useOrganismSelection from '../../hooks/useOrganismSelection';
import SimulationCanvas from './SimulationCanvas';
import SimulationControls from './SimulationControls';
import SimulationStats from './SimulationStats';
import HelpPanel from './HelpPanel';
import OrganismViewer from './OrganismViewer';
import OrganismLibrary from './OrganismLibrary';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../simulation/constants';
import './EvolutionSimulator.css';
import './OrganismViewer.css';
import './OrganismLibrary.css';

/**
 * Main Evolution Simulator component with organism selection and viewing
 */
const EvolutionSimulator = () => {
  // Canvas reference
  const canvasRef = useRef(null);
  
  // Get device pixel ratio for high-DPI rendering (default to 1.5 for better performance)
  const [pixelRatio] = useState(() => Math.min(1.5, window.devicePixelRatio || 1));
  
  // Use the ECS simulation hook
  const simulation = useECSSimulation(canvasRef);
  
  // Viewport state for selection
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const [viewportScale, setViewportScale] = useState(1);
  
  // State for organism library
  const [showLibrary, setShowLibrary] = useState(false);
  
  // Update viewport state when simulation canvas updates
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Access viewport info from canvas context (set by SimulationCanvas)
    if (ctx.viewportOffset) {
      setViewportOffset(ctx.viewportOffset);
    }
    
    if (ctx.viewportScale) {
      setViewportScale(ctx.viewportScale);
    }
  }, [simulation.isRunning]); // Update when simulation state changes
  
  // Use organism selection hook with the world reference
  const selection = useOrganismSelection(
    simulation.worldRef?.current,
    viewportOffset,
    viewportScale
  );
  
  // Handle organism selection with viewport info
  const handleOrganismSelect = (x, y, currentViewportOffset, currentViewportScale) => {
    // Pass along both the coordinates and current viewport state
    selection.selectOrganismAt(x, y, currentViewportOffset, currentViewportScale);
  };
  
  // Handle organism deselection
  const handleCloseViewer = () => {
    selection.clearSelection();
  };
  
  // Handle opening organism library
  const handleOpenLibrary = () => {
    setShowLibrary(true);
  };
  
  // Handle closing organism library
  const handleCloseLibrary = () => {
    setShowLibrary(false);
  };
  
  // Handle selecting organism from library for viewing
  const handleSelectFromLibrary = (organismData) => {
    // Load organism data into viewer
    selection.clearSelection();
    setShowLibrary(false);
    
    // Set selected organism data manually
    if (organismData) {
      selection.setOrganismData(organismData);
    }
  };
  
  // Refresh selected organism data when simulation state changes
  useEffect(() => {
    // Only refresh if there's a selected organism
    if (selection.selectedOrganismId) {
      // Check if organism still exists
      if (!selection.selectedOrganismExists()) {
        selection.clearSelection();
      } else {
        selection.refreshSelectedOrganism();
      }
    }
  }, [simulation.generation, simulation.isRunning]);
  
  // Layout mode (default, with viewer, etc.)
  const getLayoutMode = () => {
    if (selection.selectedOrganismData) {
      return 'with-viewer';
    }
    return 'default';
  };
  
  return (
    <div className="simulator-container">
      <h1 className="simulator-title">Dot Organism Evolution Simulator</h1>
      
      {simulation.hasLoadedSavedState && (
        <div className="autosave-notice">
          Loaded saved simulation from your last session!
        </div>
      )}
      
      <div className={`simulator-layout layout-${getLayoutMode()}`}>
        <div className="simulation-area">
          <div className="canvas-wrapper">
            <SimulationCanvas 
              width={CANVAS_WIDTH} 
              height={CANVAS_HEIGHT}
              pixelRatio={pixelRatio}
              canvasRef={canvasRef}
              organismPositions={simulation.organismPositions}
              foodPositions={simulation.foodPositions}
              onOrganismSelect={handleOrganismSelect}
              selectionEnabled={true}
            />
            <div className="canvas-instructions">
              <p>Drag to pan, scroll to zoom. Click on an organism to select it.</p>
            </div>
          </div>
          
          <SimulationStats 
            generation={simulation.generation}
            stats={simulation.stats}
            isRunning={simulation.isRunning}
            onToggleSimulation={simulation.toggleSimulation}
            onRestartSimulation={simulation.requestRestartSimulation}
            showRestartConfirmation={simulation.showRestartConfirmation}
            onConfirmRestart={simulation.confirmRestartSimulation}
            onCancelRestart={simulation.cancelRestartSimulation}
            lastAutosaveTime={simulation.lastAutosaveTime}
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
          
          {/* Organism Viewer */}
          <OrganismViewer 
            organismData={selection.selectedOrganismData}
            onClose={handleCloseViewer}
            generation={simulation.generation}
            onViewLibrary={handleOpenLibrary}
          />
        </div>
      </div>
      
      {/* Organism Library (shown as modal) */}
      {showLibrary && (
        <OrganismLibrary
          onSelectOrganism={handleSelectFromLibrary}
          onClose={handleCloseLibrary}
        />
      )}
    </div>
  );
};

export default EvolutionSimulator;