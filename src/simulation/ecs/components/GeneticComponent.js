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
    sensorDistance = 150, // Significantly increased from 120 for better food detection
    moveThreshold = 0.8,  // Significantly increased from 0.65 to encourage more movement
    anchorThreshold = 0.1, // Decreased from 0.15 to anchor less frequently
    anchorRatio = 0.15     // Decreased from 0.25 to have fewer anchors, more movement
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
    // Apply more significant mutations for greater variation
    const newGeneticComponent = new GeneticComponent(
      this.sensorDistance + (Math.random() * 2 - 1) * rate * 70,   // Increased mutation range
      this.moveThreshold + (Math.random() * 2 - 1) * rate * 0.4,   // Increased mutation range
      this.anchorThreshold + (Math.random() * 2 - 1) * rate * 0.3, // Same mutation range
      this.anchorRatio + (Math.random() * 2 - 1) * rate * 0.25     // Increased mutation range
    );
    
    // Allow wider ranges for parameters to evolve more diverse strategies
    newGeneticComponent.sensorDistance = Math.max(80, Math.min(250, newGeneticComponent.sensorDistance));
    newGeneticComponent.moveThreshold = Math.max(0.4, Math.min(0.95, newGeneticComponent.moveThreshold));
    newGeneticComponent.anchorThreshold = Math.max(0.05, Math.min(0.25, newGeneticComponent.anchorThreshold));
    newGeneticComponent.anchorRatio = Math.max(0.05, Math.min(0.4, newGeneticComponent.anchorRatio));
    
    return newGeneticComponent;
  }
}

export default GeneticComponent;