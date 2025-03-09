// src/simulation/ecs/components/FitnessComponent.js
import { Component } from '../Component';

/**
 * Component that tracks fitness-related data for an organism
 */
export class FitnessComponent extends Component {
  /**
   * Create a new fitness component
   */
  constructor() {
    super();
    this.fitness = 0;
    this.foodEaten = 0;
  }
}

export default FitnessComponent;
