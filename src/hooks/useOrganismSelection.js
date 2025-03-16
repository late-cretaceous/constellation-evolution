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
   */
  const selectOrganismAt = useCallback((screenX, screenY) => {
    // First, clear current selection
    clearSelection();
    
    if (!worldRef.current) return null;
    
    // Convert screen coordinates to world coordinates
    const worldX = (screenX - viewportOffset.x) / viewportScale;
    const worldY = (screenY - viewportOffset.y) / viewportScale;
    
    // Get all organisms
    const organismEntities = worldRef.current.getEntitiesWithComponent(OrganismComponent);
    
    // Find the organism closest to the click point
    let closestOrganism = null;
    let closestDistance = Infinity;
    
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      
      // Calculate center position of organism
      let centerX = 0;
      let centerY = 0;
      let jointCount = 0;
      
      for (const jointId of organism.jointIds) {
        const jointEntity = worldRef.current.getEntity(jointId);
        if (!jointEntity) continue;
        
        const position = jointEntity.getComponent(PositionComponent);
        centerX += position.position.x;
        centerY += position.position.y;
        jointCount++;
      }
      
      if (jointCount === 0) continue;
      
      centerX /= jointCount;
      centerY /= jointCount;
      
      // Calculate distance to click point
      const distance = Math.sqrt(
        Math.pow(centerX - worldX, 2) + 
        Math.pow(centerY - worldY, 2)
      );
      
      // Calculate organism radius (average distance from center to joints)
      let radius = 0;
      for (const jointId of organism.jointIds) {
        const jointEntity = worldRef.current.getEntity(jointId);
        if (!jointEntity) continue;
        
        const position = jointEntity.getComponent(PositionComponent);
        const jointDistance = Math.sqrt(
          Math.pow(position.position.x - centerX, 2) + 
          Math.pow(position.position.y - centerY, 2)
        );
        radius += jointDistance;
      }
      
      if (jointCount > 0) {
        radius = radius / jointCount;
      }
      
      // Add a minimum selection radius (30 pixels)
      radius = Math.max(radius, 30);
      
      // Check if click is within organism radius
      if (distance <= radius && distance < closestDistance) {
        closestOrganism = organismEntity;
        closestDistance = distance;
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