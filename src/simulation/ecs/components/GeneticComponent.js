// src/simulation/ecs/components/GeneticComponent.js
import { Component } from '../Component';

/**
 * Component that stores the genetic information of an organism
 */
export class GeneticComponent extends Component {
  /**
   * Create a new genetic component
   * @param {number} sensorDistance - Distance at which organism can sense food
   * @param {number} moveThreshold - Threshold for movement decision
   * @param {number} anchorThreshold - Threshold for anchoring decision
   * @param {number} anchorRatio - Portion of joints that should be anchored
   */
  constructor(
    sensorDistance = 100, 
    moveThreshold = 0.5, 
    anchorThreshold = 0.2, 
    anchorRatio = 0.3
  ) {
    super();
    this.sensorDistance = sensorDistance;
    this.moveThreshold = moveThreshold;
    this.anchorThreshold = anchorThreshold;
    this.anchorRatio = anchorRatio;
  }

  /**
   * Create a mutated copy of this genetic component
   * @param {number} rate - Mutation rate
   * @returns {GeneticComponent} - A new genetic component with mutations
   */
  mutate(rate) {
    const newGeneticComponent = new GeneticComponent(
      this.sensorDistance + (Math.random() * 2 - 1) * rate * 50,
      this.moveThreshold + (Math.random() * 2 - 1) * rate * 0.3,
      this.anchorThreshold + (Math.random() * 2 - 1) * rate * 0.3,
      this.anchorRatio + (Math.random() * 2 - 1) * rate * 0.2
    );
    
    // Clamp values to reasonable ranges
    newGeneticComponent.sensorDistance = Math.max(10, Math.min(200, newGeneticComponent.sensorDistance));
    newGeneticComponent.moveThreshold = Math.max(0.1, Math.min(0.9, newGeneticComponent.moveThreshold));
    newGeneticComponent.anchorThreshold = Math.max(0.1, Math.min(0.9, newGeneticComponent.anchorThreshold));
    newGeneticComponent.anchorRatio = Math.max(0.1, Math.min(0.7, newGeneticComponent.anchorRatio));
    
    return newGeneticComponent;
  }
}

export default GeneticComponent;
