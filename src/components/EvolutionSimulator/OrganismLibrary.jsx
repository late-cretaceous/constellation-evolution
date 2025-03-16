// src/components/EvolutionSimulator/OrganismLibrary.jsx
import React, { useState, useEffect, useRef } from 'react';
import { loadOrganismsFromLibrary, saveOrganismToLibrary, deleteOrganismFromLibrary } from '../../utils/organismStorage';

/**
 * Component for managing saved organisms
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSelectOrganism - Function to call when an organism is selected from library
 * @param {Function} props.onClose - Function to call when closing the library
 */
const OrganismLibrary = ({ onSelectOrganism, onClose }) => {
  const [organisms, setOrganisms] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [sortOption, setSortOption] = useState('date-desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  const canvasRef = useRef(null);
  
  // Load organisms on mount
  useEffect(() => {
    loadOrganisms();
  }, []);
  
  // Draw the selected organism in the preview canvas
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < organisms.length && canvasRef.current) {
      const organism = organisms[selectedIndex];
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      drawOrganism(ctx, organism.data);
    }
  }, [selectedIndex, organisms]);
  
  /**
   * Load organisms from storage
   */
  const loadOrganisms = async () => {
    setIsLoading(true);
    const loadedOrganisms = await loadOrganismsFromLibrary();
    setOrganisms(loadedOrganisms);
    setIsLoading(false);
    
    // Select first organism if available
    if (loadedOrganisms.length > 0) {
      setSelectedIndex(0);
    }
  };
  
  /**
   * Select an organism from the library
   * 
   * @param {number} index - Index of the organism to select
   */
  const selectOrganism = (index) => {
    setSelectedIndex(index);
  };
  
  /**
   * Delete an organism from the library
   * 
   * @param {number} index - Index of the organism to delete
   */
  const handleConfirmDelete = async () => {
    if (confirmationAction === 'delete' && selectedIndex >= 0) {
      const organismId = organisms[selectedIndex].id;
      await deleteOrganismFromLibrary(organismId);
      
      // Reload organisms
      await loadOrganisms();
      
      // Reset selection if necessary
      if (selectedIndex >= organisms.length) {
        setSelectedIndex(organisms.length > 0 ? 0 : -1);
      }
    }
    
    setShowConfirmation(false);
    setConfirmationAction(null);
  };
  
  /**
   * Request deletion confirmation
   */
  const requestDelete = () => {
    setConfirmationAction('delete');
    setShowConfirmation(true);
  };
  
  /**
   * Cancel the current confirmation
   */
  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setConfirmationAction(null);
  };
  
  /**
   * Load the selected organism into the simulation
   */
  const loadSelectedOrganism = () => {
    if (selectedIndex >= 0 && selectedIndex < organisms.length) {
      onSelectOrganism(organisms[selectedIndex].data);
    }
  };
  
  /**
   * Draw organism on the preview canvas
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} data - Organism data
   */
  const drawOrganism = (ctx, data) => {
    if (!data || !data.joints || !data.connections) return;
    
    const { joints, connections } = data;
    
    // Calculate bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    for (const joint of joints) {
      minX = Math.min(minX, joint.x);
      minY = Math.min(minY, joint.y);
      maxX = Math.max(maxX, joint.x);
      maxY = Math.max(maxY, joint.y);
    }
    
    // Add padding
    const padding = 20;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Calculate scaling to fit canvas
    const width = maxX - minX;
    const height = maxY - minY;
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    const scale = Math.min(
      canvasWidth / Math.max(width, 1),
      canvasHeight / Math.max(height, 1)
    );
    
    // Calculate center offset for centering the organism
    const offsetX = (canvasWidth - width * scale) / 2 - minX * scale;
    const offsetY = (canvasHeight - height * scale) / 2 - minY * scale;
    
    // Draw background
    ctx.fillStyle = '#121330';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw connections first
    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    for (const connection of connections) {
      const fromJoint = joints.find(j => j.id === connection.from);
      const toJoint = joints.find(j => j.id === connection.to);
      
      if (fromJoint && toJoint) {
        ctx.moveTo(
          fromJoint.x * scale + offsetX,
          fromJoint.y * scale + offsetY
        );
        ctx.lineTo(
          toJoint.x * scale + offsetX,
          toJoint.y * scale + offsetY
        );
      }
    }
    
    ctx.stroke();
    
    // Draw joints
    for (const joint of joints) {
      ctx.beginPath();
      ctx.arc(
        joint.x * scale + offsetX,
        joint.y * scale + offsetY,
        joint.radius * scale,
        0,
        Math.PI * 2
      );
      
      // Use same colors as in the simulation
      if (joint.isAnchored) {
        ctx.fillStyle = '#ff3030';
      } else {
        ctx.fillStyle = '#40ff40';
      }
      
      ctx.fill();
    }
  };
  
  /**
   * Sort organisms based on current sort option
   * 
   * @returns {Array} - Sorted organisms
   */
  const getSortedOrganisms = () => {
    if (!organisms) return [];
    
    // Filter by search term if provided
    let filteredOrganisms = organisms;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredOrganisms = organisms.filter(org => 
        org.name.toLowerCase().includes(search) || 
        (org.notes && org.notes.toLowerCase().includes(search)) ||
        org.data.fitness.toString().includes(search)
      );
    }
    
    // Clone array before sorting
    const sorted = [...filteredOrganisms];
    
    // Sort based on selected option
    switch (sortOption) {
      case 'fitness-desc':
        return sorted.sort((a, b) => b.data.fitness - a.data.fitness);
      case 'fitness-asc':
        return sorted.sort((a, b) => a.data.fitness - b.data.fitness);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'joints-desc':
        return sorted.sort((a, b) => b.data.jointCount - a.data.jointCount);
      case 'joints-asc':
        return sorted.sort((a, b) => a.data.jointCount - b.data.jointCount);
      case 'date-asc':
        return sorted.sort((a, b) => a.savedAt - b.savedAt);
      case 'date-desc':
      default:
        return sorted.sort((a, b) => b.savedAt - a.savedAt);
    }
  };
  
  /**
   * Format a date for display
   * 
   * @param {number} timestamp - Timestamp to format
   * @returns {string} - Formatted date
   */
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Get sorted organisms
  const sortedOrganisms = getSortedOrganisms();
  
  // If no organisms, show empty state
  if (organisms.length === 0 && !isLoading) {
    return (
      <div className="organism-library">
        <div className="library-header">
          <h2>Organism Library</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="library-empty-state">
          <p>No organisms saved yet. Select and save organisms from the simulation to build your library.</p>
          <button className="button button-blue" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="organism-library">
        <div className="library-header">
          <h2>Organism Library</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="library-loading">
          <p>Loading organisms...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="organism-library">
      <div className="library-header">
        <h2>Organism Library</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="library-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search organisms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="sort-dropdown">
          <select 
            value={sortOption} 
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="fitness-desc">Highest Fitness</option>
            <option value="fitness-asc">Lowest Fitness</option>
            <option value="name">Name</option>
            <option value="joints-desc">Most Joints</option>
            <option value="joints-asc">Fewest Joints</option>
          </select>
        </div>
      </div>
      
      <div className="library-content">
        <div className="organism-list">
          {sortedOrganisms.map((organism, index) => (
            <div 
              key={organism.id}
              className={`organism-item ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => selectOrganism(index)}
            >
              <div className="organism-item-name">{organism.name}</div>
              <div className="organism-item-details">
                <span>Fitness: {Math.round(organism.data.fitness)}</span>
                <span>{organism.data.jointCount} joints</span>
              </div>
              <div className="organism-item-date">
                {formatDate(organism.savedAt)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="organism-preview">
          {selectedIndex >= 0 && (
            <>
              <div className="preview-canvas-container">
                <canvas 
                  ref={canvasRef} 
                  width={250} 
                  height={200}
                  className="preview-canvas"
                />
              </div>
              
              <div className="preview-details">
                <h3>{sortedOrganisms[selectedIndex].name}</h3>
                
                <div className="organism-stats">
                  <div className="stat-row">
                    <div className="stat-label">Fitness:</div>
                    <div className="stat-value">{Math.round(sortedOrganisms[selectedIndex].data.fitness)}</div>
                  </div>
                  <div className="stat-row">
                    <div className="stat-label">Joints:</div>
                    <div className="stat-value">{sortedOrganisms[selectedIndex].data.jointCount}</div>
                  </div>
                  <div className="stat-row">
                    <div className="stat-label">Food Eaten:</div>
                    <div className="stat-value">{sortedOrganisms[selectedIndex].data.foodEaten}</div>
                  </div>
                  <div className="stat-row">
                    <div className="stat-label">Movement Speed:</div>
                    <div className="stat-value">{sortedOrganisms[selectedIndex].data.genetics.patternSpeed.toFixed(2)}</div>
                  </div>
                  <div className="stat-row">
                    <div className="stat-label">Saved On:</div>
                    <div className="stat-value">{formatDate(sortedOrganisms[selectedIndex].savedAt)}</div>
                  </div>
                </div>
                
                {sortedOrganisms[selectedIndex].notes && (
                  <div className="preview-notes">
                    <h4>Notes:</h4>
                    <p>{sortedOrganisms[selectedIndex].notes}</p>
                  </div>
                )}
              </div>
              
              <div className="preview-actions">
                <button 
                  className="button button-blue"
                  onClick={loadSelectedOrganism}
                >
                  Examine in Viewer
                </button>
                <button 
                  className="button button-red"
                  onClick={requestDelete}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {showConfirmation && (
        <div className="confirmation-dialog">
          <div className="confirmation-content">
            <h3>Confirm Action</h3>
            {confirmationAction === 'delete' && (
              <p>Are you sure you want to delete this organism from your library?</p>
            )}
            <div className="confirmation-buttons">
              <button 
                className="button button-blue"
                onClick={handleConfirmDelete}
              >
                Yes, I'm Sure
              </button>
              <button 
                className="button button-red"
                onClick={cancelConfirmation}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganismLibrary;
