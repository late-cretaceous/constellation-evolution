// src/simulation/ecs/Component.js

/**
 * Base class for all components in the ECS system
 * Components are pure data containers with no behavior
 */
export class Component {
  /**
   * Create a new component
   */
  constructor() {
    /**
     * Reference to the entity this component belongs to
     * @type {Entity|null}
     */
    this.entity = null;
  }
}

export default Component;