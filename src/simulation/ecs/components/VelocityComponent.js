// src/simulation/ecs/components/VelocityComponent.js
import { Component } from '../Component';
import { Vector2 } from '../utils/Vector2';

/**
 * Component that stores the velocity of an entity
 */
export class VelocityComponent extends Component {
  /**
   * Create a new velocity component
   * @param {number} x - X velocity
   * @param {number} y - Y velocity
   */
  constructor(x = 0, y = 0) {
    super();
    this.velocity = new Vector2(x, y);
  }
}

export default VelocityComponent;
