// src/simulation/ecs/components/RenderComponent.js
import { Component } from '../Component';

/**
 * Component that stores rendering information for an entity
 */
export class RenderComponent extends Component {
  /**
   * Create a new render component
   * @param {string} type - Type of entity for rendering ('joint', 'food', etc.)
   * @param {string} color - Color for rendering
   * @param {number} radius - Radius for rendering
   */
  constructor(type, color = '#ffffff', radius = 5) {
    super();
    this.type = type; // 'joint', 'food', etc.
    this.color = color;
    this.radius = radius;
  }
}

export default RenderComponent;
