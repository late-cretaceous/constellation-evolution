// src/simulation/ecs/components/GeneticComponent.js
import { Component } from '../Component';

/**
 * Component that stores the genetic information of an organism
 * Enhanced to allow for much more extreme parameter values
 */
export class GeneticComponent extends Component {
  /**
   * Create a new genetic component with extremely random parameters
   * @param {number} sensorDistance - Distance at which organism can sense food
   * @param {number} moveThreshold - Threshold for movement decision
   * @param {number} anchorThreshold - Threshold for anchoring decision
   * @param {number} anchorRatio - Portion of joints that should be anchored
   * @param {number} movementMagnitude - Magnitude of movement impulses
   * @param {number} movementFrequency - Frequency of movement pattern changes
   * @param {number} movementBias - Directional bias in movement
   * @param {number} rotationalForce - Strength of rotational movement
   */
  constructor(
    sensorDistance = 150,     // Default sensor distance
    moveThreshold = 0.5,      // Default value
    anchorThreshold = 0.5,    // Default value
    anchorRatio = 0.5,        // Default value
    movementMagnitude = 1.0,  // Default value
    movementFrequency = 1.0,  // Default value
    movementBias = 0.0,       // Default value
    rotationalForce = 1.0     // Default value
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
   * Create a mutated copy with potentially extreme mutations
   * @param {number} rate - Mutation rate
   * @returns {GeneticComponent} - A new genetic component with mutations
   */
  mutate(rate) {
    // Power law distribution for mutation magnitude
    // Most mutations are small, but occasionally there are extreme mutations
    const getMutationScale = () => {
      const rand = Math.random();
      if (rand < 0.7) {
        // 70% chance: small mutation
        return rate;
      } else if (rand < 0.9) {
        // 20% chance: medium mutation
        return rate * 3.0;
      } else {
        // 10% chance: large mutation
        return rate * 10.0;
      }
    };
    
    // Create new component with potential for extreme mutations
    const newGeneticComponent = new GeneticComponent(
      // Sensor distance - can change dramatically
      this.sensorDistance + (Math.random() * 2 - 1) * getMutationScale() * 100,
      
      // Thresholds can completely flip
      this.moveThreshold + (Math.random() * 2 - 1) * getMutationScale(),
      this.anchorThreshold + (Math.random() * 2 - 1) * getMutationScale(),
      this.anchorRatio + (Math.random() * 2 - 1) * getMutationScale(),
      
      // Movement magnitude can increase dramatically
      this.movementMagnitude * Math.exp((Math.random() * 2 - 1) * getMutationScale() * 0.5),
      
      // Frequency can change dramatically
      this.movementFrequency * Math.exp((Math.random() * 2 - 1) * getMutationScale() * 0.5),
      
      // Bias can completely reverse
      this.movementBias + (Math.random() * 2 - 1) * getMutationScale() * 3.0,
      
      // Rotational force can change dramatically and reverse
      this.rotationalForce + (Math.random() * 2 - 1) * getMutationScale() * 5.0
    );
    
    // Wider bounds but still with some limits to prevent breaking the simulation
    newGeneticComponent.sensorDistance = Math.max(1, Math.min(400, newGeneticComponent.sensorDistance));
    newGeneticComponent.moveThreshold = Math.max(0, Math.min(1, newGeneticComponent.moveThreshold));
    newGeneticComponent.anchorThreshold = Math.max(0, Math.min(1, newGeneticComponent.anchorThreshold));
    newGeneticComponent.anchorRatio = Math.max(0, Math.min(1, newGeneticComponent.anchorRatio));
    
    // Much wider bounds for movement parameters
    newGeneticComponent.movementMagnitude = Math.max(0, Math.min(30.0, newGeneticComponent.movementMagnitude));
    newGeneticComponent.movementFrequency = Math.max(0, Math.min(15.0, newGeneticComponent.movementFrequency));
    
    // Movement bias can be extremely negative (flee) or positive (seek)
    newGeneticComponent.movementBias = Math.max(-10.0, Math.min(10.0, newGeneticComponent.movementBias));
    
    // Rotational force can be extremely negative or positive
    newGeneticComponent.rotationalForce = Math.max(-20.0, Math.min(20.0, newGeneticComponent.rotationalForce));
    
    return newGeneticComponent;
  }
}

export default GeneticComponent;