// src/simulation/ecs/components/GeneticComponent.js
import { Component } from '../Component';

/**
 * Component that stores the genetic information of an organism
 */
export class GeneticComponent extends Component {
  /**
   * Create a new genetic component
   * @param {number} sensorDistance - Distance at which organism can sense food (fixed for all organisms)
   * @param {number} moveThreshold - Threshold for movement decision
   * @param {number} anchorThreshold - Threshold for anchoring decision
   * @param {number} anchorRatio - Portion of joints that should be anchored
   * @param {number} movementMagnitude - Magnitude of movement impulses
   * @param {number} movementFrequency - Frequency of movement pattern changes
   * @param {number} movementBias - Directional bias in movement (0-1 = random, >1 = food-seeking)
   * @param {number} rotationalForce - Strength of rotational movement
   */
  constructor(
    sensorDistance = 150,     // Fixed food sensing distance (same for all organisms)
    moveThreshold = 0.65,     // Standard movement threshold
    anchorThreshold = 0.2,    // Standard anchoring threshold
    anchorRatio = 0.2,        // Standard anchor ratio
    movementMagnitude = 2.0,  // Initially high for random movement
    movementFrequency = 0.5,  // Medium oscillation frequency
    movementBias = 0.1,       // Very low initial bias toward food (mostly random)
    rotationalForce = 1.0     // Medium rotational force
  ) {
    super();
    this.sensorDistance = sensorDistance;
    this.moveThreshold = moveThreshold;
    this.anchorThreshold = anchorThreshold;
    this.anchorRatio = anchorRatio;
    this.movementMagnitude = movementMagnitude;
    this.movementFrequency = movementFrequency;
    this.movementBias = movementBias;
    this.rotationalForce = rotationalForce;
  }

  /**
   * Create a mutated copy of this genetic component
   * @param {number} rate - Mutation rate
   * @returns {GeneticComponent} - A new genetic component with mutations
   */
  mutate(rate) {
    // Apply mutations to movement-related parameters
    const newGeneticComponent = new GeneticComponent(
      this.sensorDistance,    // Keep sensor distance constant
      this.moveThreshold + (Math.random() * 2 - 1) * rate * 0.3,
      this.anchorThreshold + (Math.random() * 2 - 1) * rate * 0.2,
      this.anchorRatio + (Math.random() * 2 - 1) * rate * 0.2,
      this.movementMagnitude + (Math.random() * 2 - 1) * rate * 1.0,
      this.movementFrequency + (Math.random() * 2 - 1) * rate * 0.4,
      this.movementBias + (Math.random() * 2 - 1) * rate * 0.3,
      this.rotationalForce + (Math.random() * 2 - 1) * rate * 0.5
    );
    
    // Define acceptable ranges for the parameters
    // sensorDistance is fixed and not mutated
    newGeneticComponent.moveThreshold = Math.max(0.3, Math.min(0.95, newGeneticComponent.moveThreshold));
    newGeneticComponent.anchorThreshold = Math.max(0.05, Math.min(0.4, newGeneticComponent.anchorThreshold));
    newGeneticComponent.anchorRatio = Math.max(0.05, Math.min(0.5, newGeneticComponent.anchorRatio));
    newGeneticComponent.movementMagnitude = Math.max(0.1, Math.min(4.0, newGeneticComponent.movementMagnitude));
    newGeneticComponent.movementFrequency = Math.max(0.1, Math.min(2.0, newGeneticComponent.movementFrequency));
    newGeneticComponent.movementBias = Math.max(0.0, Math.min(3.0, newGeneticComponent.movementBias));
    newGeneticComponent.rotationalForce = Math.max(0.1, Math.min(3.0, newGeneticComponent.rotationalForce));
    
    return newGeneticComponent;
  }
}

export default GeneticComponent;