// src/simulation/ecs/components/OrganismComponent.js
import { Component } from '../Component';

/**
 * Component that defines an entity as an organism
 */
export class OrganismComponent extends Component {
  /**
   * Create a new organism component
   */
  constructor() {
    super();
    this.jointIds = []; // Array of joint entity IDs that make up this organism
  }
}

export default OrganismComponent;
