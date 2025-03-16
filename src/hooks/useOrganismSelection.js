// src/hooks/useOrganismSelection.js
import { useState, useRef, useCallback, useEffect } from 'react';
import { OrganismComponent } from '../simulation/ecs/components/OrganismComponent';
import { PositionComponent } from '../simulation/ecs/components/PositionComponent';
import { FitnessComponent } from '../simulation/ecs/components/FitnessComponent';
import { JointComponent } from '../simulation/ecs/components/JointComponent';
import { GeneticComponent } from '../simulation/ecs/components/GeneticComponent';

/**
 * Custom hook to manage organism selection and inspection
 * 
 * @param {Object} world - The ECS world instance
 * @param {Object} viewportOffset - Current viewport offset
 * @param {number} viewportScale - Current viewport scale
 * @returns {Object} - Selection state and functions
 */
export function useOrganismSelection(world, viewportOffset, viewportScale) {
  // Selection state
  const [selectedOrganismId, setSelectedOrganismId] = useState(null);
  const [selectedOrganismData, setSelectedOrganismData] = useState(null);
  
  // Reference to the world
  const worldRef = useRef(world);
  
  // Update world reference when it changes
  useEffect(() => {
    worldRef.current = world;
  }, [world]);
  
  /**
   * Select an organism at the given screen coordinates
   * 
   * @param {number} screenX - X coordinate on screen
   * @param {number} screenY - Y coordinate on screen
   * @param {Object} currentViewportOffset - Current viewport offset at time of click
   * @param {number} currentViewportScale - Current viewport scale at time of click
   */
  const selectOrganismAt = useCallback((screenX, screenY, currentViewportOffset, currentViewportScale) => {
    // First, clear current selection
    clearSelection();
    
    if (!worldRef.current) return null;
    
    // Use provided viewport parameters if available, otherwise use the hook's state
    const offset = currentViewportOffset || viewportOffset;
    const scale = currentViewportScale || viewportScale;
    
    // Convert screen coordinates to world coordinates
    const worldX = (screenX - offset.x) / scale;
    const worldY = (screenY - offset.y) / scale;
    
    // Get all organisms
    const organismEntities = worldRef.current.getEntitiesWithComponent(OrganismComponent);
    
    // Find the organism closest to the click point
    let closestOrganism = null;
    let closestDistance = Infinity;
    
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      
      // Calculate center position of organism and bounding box
      let centerX = 0;
      let centerY = 0;
      let jointCount = 0;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      for (const jointId of organism.jointIds) {
        const jointEntity = worldRef.current.getEntity(jointId);
        if (!jointEntity) continue;
        
        const position = jointEntity.getComponent(PositionComponent);
        if (!position) continue;
        
        const posX = position.position.x;
        const posY = position.position.y;
        
        centerX += posX;
        centerY += posY;
        jointCount++;
        
        // Update bounding box
        minX = Math.min(minX, posX);
        minY = Math.min(minY, posY);
        maxX = Math.max(maxX, posX);
        maxY = Math.max(maxY, posY);
      }
      
      if (jointCount === 0) continue;
      
      centerX /= jointCount;
      centerY /= jointCount;
      
      // Calculate width and height of bounding box
      const width = maxX - minX;
      const height = maxY - minY;
      
      // Use a more reliable selection method:
      // 1. Check if point is within the bounding box (with padding)
      const padding = 40;  // Add padding in world units
      if (
        worldX >= minX - padding &&
        worldX <= maxX + padding &&
        worldY >= minY - padding &&
        worldY <= maxY + padding
      ) {
        // 2. Calculate distance to organism center for tiebreaking
        const distance = Math.sqrt(
          Math.pow(centerX - worldX, 2) + 
          Math.pow(centerY - worldY, 2)
        );
        
        // If we're within the bounding box or this is the closest organism so far
        if (distance < closestDistance) {
          closestOrganism = organismEntity;
          closestDistance = distance;
        }
      }
    }
    
    // If we found an organism, select it
    if (closestOrganism) {
      setSelectedOrganismId(closestOrganism.id);
      
      // Extract organism data
      const organismData = extractOrganismData(closestOrganism, worldRef.current);
      setSelectedOrganismData(organismData);
      
      return organismData;
    } else {
      // Clear selection if click is not on any organism
      clearSelection();
      return null;
    }
  }, [viewportOffset, viewportScale]);
  
  /**
   * Extract relevant data from an organism entity
   * 
   * @param {Object} organismEntity - The organism entity
   * @param {Object} world - The ECS world instance
   * @returns {Object} - Organism data object
   */
  const extractOrganismData = useCallback((organismEntity, world) => {
    if (!organismEntity) return null;
    
    const organism = organismEntity.getComponent(OrganismComponent);
    const fitness = organismEntity.getComponent(FitnessComponent);
    const genetics = organismEntity.getComponent(GeneticComponent);
    
    // Extract joint data for visualization
    const joints = [];
    const connections = [];
    let centerX = 0;
    let centerY = 0;
    
    // First pass: collect joint positions
    for (const jointId of organism.jointIds) {
      const jointEntity = world.getEntity(jointId);
      if (!jointEntity) continue;
      
      const position = jointEntity.getComponent(PositionComponent);
      const joint = jointEntity.getComponent(JointComponent);
      
      centerX += position.position.x;
      centerY += position.position.y;
      
      joints.push({
        id: jointId,
        x: position.position.x,
        y: position.position.y,
        isAnchored: joint.isAnchored,
        radius: joint.radius
      });
    }
    
    // Calculate center for normalization
    if (joints.length > 0) {
      centerX /= joints.length;
      centerY /= joints.length;
    }
    
    // Normalize positions relative to center for viewer
    const normalizedJoints = joints.map(joint => ({
      ...joint,
      x: joint.x - centerX,
      y: joint.y - centerY
    }));
    
    // Second pass: collect connections
    for (const jointId of organism.jointIds) {
      const jointEntity = world.getEntity(jointId);
      if (!jointEntity) continue;
      
      const joint = jointEntity.getComponent(JointComponent);
      
      for (const connectedJointId of joint.connections) {
        // Only add connection once (avoid duplicates)
        if (jointId < connectedJointId) {
          connections.push({
            from: jointId,
            to: connectedJointId,
            restLength: joint.restLengths.get(connectedJointId) || joint.defaultRestLength
          });
        }
      }
    }
    
    // Return organism data object
    return {
      id: organismEntity.id,
      fitness: fitness ? fitness.fitness : 0,
      foodEaten: fitness ? fitness.foodEaten : 0,
      jointCount: joints.length,
      joints: normalizedJoints,
      connections,
      genetics: {
        patternSpeed: genetics.patternSpeed,
        bodyPlanSeed: genetics.bodyPlanSeed,
        morphologyFactor: genetics.morphologyFactor,
        symmetryFactor: genetics.symmetryFactor
      }
    };
  }, []);
  
  /**
   * Clear the current selection
   */
  const clearSelection = useCallback(() => {
    setSelectedOrganismId(null);
    setSelectedOrganismData(null);
  }, []);
  
  /**
   * Set organism data directly (for loaded organisms from library)
   * 
   * @param {Object} data - Organism data
   */
  const setOrganismData = useCallback((data) => {
    if (!data) {
      clearSelection();
      return;
    }
    
    setSelectedOrganismId(data.id || 'external');
    setSelectedOrganismData(data);
  }, [clearSelection]);
  
  /**
   * Get the current selected organism entity
   * 
   * @returns {Object|null} - The selected organism entity or null
   */
  const getSelectedOrganismEntity = useCallback(() => {
    if (!worldRef.current || !selectedOrganismId) return null;
    return worldRef.current.getEntity(selectedOrganismId);
  }, [selectedOrganismId]);
  
  /**
   * Refresh the selected organism data
   * Useful for updating the viewer when the organism changes
   */
  const refreshSelectedOrganism = useCallback(() => {
    const organismEntity = getSelectedOrganismEntity();
    if (organismEntity) {
      const data = extractOrganismData(organismEntity, worldRef.current);
      setSelectedOrganismData(data);
      return data;
    }
    return null;
  }, [getSelectedOrganismEntity, extractOrganismData]);
  
  /**
   * Check if the selected organism still exists in the world
   * @returns {boolean} - True if the organism exists
   */
  const selectedOrganismExists = useCallback(() => {
    if (!worldRef.current || !selectedOrganismId) return false;
    const entity = worldRef.current.getEntity(selectedOrganismId);
    return !!entity && entity.hasComponent(OrganismComponent);
  }, [selectedOrganismId]);
  
  return {
    selectedOrganismId,
    selectedOrganismData,
    selectOrganismAt,
    clearSelection,
    setOrganismData,
    refreshSelectedOrganism,
    selectedOrganismExists
  };
}

export default useOrganismSelection;