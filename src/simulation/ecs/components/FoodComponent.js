// src/simulation/ecs/components/FoodComponent.js
import { Component } from '../Component';
import { FOOD_RADIUS } from '../../constants';

/**
 * Component that defines an entity as food
 */
export class FoodComponent extends Component {
  /**
   * Create a new food component
   */
  constructor() {
    super();
    this.radius = FOOD_RADIUS;
  }
}

export default FoodComponent;
