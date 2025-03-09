// src/simulation/ecs/components/PositionComponent.js
import { Component } from '../Component';
import { Vector2 } from '../utils/Vector2';

/**
 * Component that stores the position of an entity in 2D space
 */
export class PositionComponent extends Component {
  /**
   * Create a new position component
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  constructor(x, y) {
    super();
    this.position = new Vector2(x, y);
  }
}

export default PositionComponent;
