// src/components/EvolutionSimulator/OrganismViewer.jsx
import React, { useRef, useEffect, useState } from 'react';
import { saveOrganismToLibrary } from '../../utils/organismStorage';

/**
 * Component to display a selected organism in a separate canvas
 * Enhanced with animation and save functionality
 * 
 * @param {Object} props - Component props
 * @param {Object} props.organismData - Data for the selected organism
 * @param {Function} props.onClose - Function to call when closing viewer
 * @param {number} props.generation - Current generation number
 * @param {Function} props.onViewLibrary - Function to open the organism library
 */
const OrganismViewer = ({ 
  organismData, 
  onClose, 
  generation = 0,
  onViewLibrary = () => {}
}) => {
  const canvasRef = useRef(null);
  const [canSave, setCanSave] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [animating, setAnimating] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0);
  const animationRef = useRef(null);
  
  // Initialize organism name on selection
  useEffect(() => {
    if (organismData && !saveName) {
      setSaveName(`Gen ${generation} Organism #${organismData.id}`);
    }
  }, [organismData, generation, saveName]);
  
  // Set up canvas and draw organism whenever data changes
  useEffect(() => {
    if (!canvasRef.current || !organismData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw organism, centered and scaled to fit canvas
    drawOrganism(ctx, organismData);
    
    // Enable save button
    setCanSave(true);
    
    // Stop any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Reset simulation time
    setSimulationTime(0);
    setAnimating(false);
  }, [organismData]);
  
  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  /**
   * Draw organism on the canvas
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} data - Organism data
   * @param {number} time - Simulation time for animation
   */
  const drawOrganism = (ctx, data, time = 0) => {
    if (!data || !data.joints || !data.connections) return;
    
    const { joints, connections, genetics } = data;
    
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
    
    // Make a copy of joint data for animation
    let jointData = joints;
    
    // If animating, update joint states based on genetic patterns
    if (time > 0 && genetics) {
      jointData = joints.map(joint => {
        // Simple animation for preview - alternates between anchored/not anchored
        // based on genetic pattern speed
        const phase = (time * genetics.patternSpeed * 2) % 10;
        const isAnchored = phase > 5 ? !joint.isAnchored : joint.isAnchored;
        
        return {
          ...joint,
          isAnchored
        };
      });
    }
    
    // Draw connections first
    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    for (const connection of connections) {
      const fromJoint = jointData.find(j => j.id === connection.from);
      const toJoint = jointData.find(j => j.id === connection.to);
      
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
    for (const joint of jointData) {
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
        // Add subtle glow to anchored joints (red)
        const gradient = ctx.createRadialGradient(
          joint.x * scale + offsetX,
          joint.y * scale + offsetY,
          joint.radius * scale * 0.5,
          joint.x * scale + offsetX,
          joint.y * scale + offsetY,
          joint.radius * scale * 1.3
        );
        gradient.addColorStop(0, '#ff3030');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        // Draw glow
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(
          joint.x * scale + offsetX,
          joint.y * scale + offsetY,
          joint.radius * scale * 1.3,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
        
        // Draw joint
        ctx.beginPath();
        ctx.arc(
          joint.x * scale + offsetX,
          joint.y * scale + offsetY,
          joint.radius * scale,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = '#ff3030';
      } else {
        // Add subtle glow to moving joints (green)
        const gradient = ctx.createRadialGradient(
          joint.x * scale + offsetX,
          joint.y * scale + offsetY,
          joint.radius * scale * 0.5,
          joint.x * scale + offsetX,
          joint.y * scale + offsetY,
          joint.radius * scale * 1.3
        );
        gradient.addColorStop(0, '#40ff40');
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        
        // Draw glow
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(
          joint.x * scale + offsetX,
          joint.y * scale + offsetY,
          joint.radius * scale * 1.3,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
        
        // Draw joint
        ctx.beginPath();
        ctx.arc(
          joint.x * scale + offsetX,
          joint.y * scale + offsetY,
          joint.radius * scale,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = '#40ff40';
      }
      
      ctx.fill();
    }
  };
  
  /**
   * Start animating the organism
   */
  const toggleAnimation = () => {
    if (animating) {
      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setAnimating(false);
    } else {
      // Start animation
      setAnimating(true);
      const startTime = performance.now();
      
      const animate = (time) => {
        const elapsed = (time - startTime) / 1000;
        setSimulationTime(elapsed);
        
        if (canvasRef.current && organismData) {
          const ctx = canvasRef.current.getContext('2d');
          drawOrganism(ctx, organismData, elapsed);
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }
  };
  
  /**
   * Open save form
   */
  const handleShowSaveForm = () => {
    setShowSaveForm(true);
    setSaveMessage('');
  };
  
  /**
   * Cancel save
   */
  const handleCancelSave = () => {
    setShowSaveForm(false);
    setSaveMessage('');
  };
  
  /**
   * Save organism to library
   */
  const handleSaveOrganism = async () => {
    if (!organismData) return;
    
    try {
      // Add generation number to data
      const enhancedData = {
        ...organismData,
        generation
      };
      
      // Save to library
      const savedOrganism = await saveOrganismToLibrary(
        enhancedData,
        saveName || `Organism #${organismData.id}`,
        saveNotes
      );
      
      if (savedOrganism) {
        setSaveMessage('Organism saved successfully! 👍');
        setTimeout(() => {
          setShowSaveForm(false);
          setSaveMessage('');
        }, 2000);
      } else {
        setSaveMessage('Failed to save organism. Please try again.');
      }
    } catch (error) {
      console.error('Error saving organism:', error);
      setSaveMessage('Error saving organism: ' + error.message);
    }
  };

  // If no organism data, show empty state
  if (!organismData) {
    return (
      <div className="organism-viewer empty-state">
        <p>Click on an organism to view details</p>
        <button className="button button-blue" onClick={onViewLibrary}>
          View Library
        </button>
      </div>
    );
  }
  
  return (
    <div className="organism-viewer">
      <div className="viewer-header">
        <h3>Organism #{organismData.id}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="organism-canvas-container">
        <canvas 
          ref={canvasRef} 
          width={250} 
          height={200}
          className="organism-canvas"
        />
        <button 
          className={`animate-button ${animating ? 'active' : ''}`}
          onClick={toggleAnimation}
        >
          {animating ? 'Stop Animation' : 'Animate'}
        </button>
      </div>
      
      <div className="organism-stats">
        <div className="stat-row">
          <div className="stat-label">Fitness:</div>
          <div className="stat-value">{Math.round(organismData.fitness)}</div>
        </div>
        <div className="stat-row">
          <div className="stat-label">Food Eaten:</div>
          <div className="stat-value">{organismData.foodEaten}</div>
        </div>
        <div className="stat-row">
          <div className="stat-label">Joints:</div>
          <div className="stat-value">{organismData.jointCount}</div>
        </div>
        <div className="stat-row">
          <div className="stat-label">Movement Speed:</div>
          <div className="stat-value">{organismData.genetics.patternSpeed.toFixed(2)}</div>
        </div>
        <div className="stat-row">
          <div className="stat-label">Body Plan Seed:</div>
          <div className="stat-value">{organismData.genetics.bodyPlanSeed.toFixed(2)}</div>
        </div>
        <div className="stat-row">
          <div className="stat-label">Symmetry:</div>
          <div className="stat-value">{organismData.genetics.symmetryFactor.toFixed(2)}</div>
        </div>
      </div>
      
      <div className="viewer-actions">
        {!showSaveForm ? (
          <>
            <button 
              className="save-button" 
              onClick={handleShowSaveForm}
              disabled={!canSave}
            >
              Save to Library
            </button>
            <button 
              className="library-button" 
              onClick={onViewLibrary}
            >
              View Library
            </button>
          </>
        ) : (
          <div className="save-form">
            <h4>Save Organism to Library</h4>
            <div className="form-group">
              <label>Name:</label>
              <input 
                type="text" 
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Give your organism a name"
              />
            </div>
            <div className="form-group">
              <label>Notes:</label>
              <textarea 
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                placeholder="Add notes about this organism (optional)"
                rows={3}
              />
            </div>
            
            {saveMessage && (
              <div className="save-message">
                {saveMessage}
              </div>
            )}
            
            <div className="form-actions">
              <button 
                className="button button-blue"
                onClick={handleSaveOrganism}
                disabled={!saveName.trim()}
              >
                Save
              </button>
              <button 
                className="button button-red"
                onClick={handleCancelSave}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganismViewer;