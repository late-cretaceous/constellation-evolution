// src/simulation/ecs/World.js
import { Entity } from './Entity';

/**
 * World class that manages all entities and systems
 */
export class World {
  /**
   * Create a new world
   */
  constructor() {
    this.entities = new Map();
    this.systems = [];
    this.nextEntityId = 1;
  }

  /**
   * Create a new entity in this world
   * @returns {Entity} - The newly created entity
   */
  createEntity() {
    const entity = new Entity(this.nextEntityId++);
    this.entities.set(entity.id, entity);
    return entity;
  }

  /**
   * Remove an entity from this world
   * @param {number} entityId - ID of the entity to remove
   */
  removeEntity(entityId) {
    this.entities.delete(entityId);
  }

  /**
   * Get an entity by its ID
   * @param {number} entityId - ID of the entity to get
   * @returns {Entity|undefined} - The entity or undefined if not found
   */
  getEntity(entityId) {
    return this.entities.get(entityId);
  }

  /**
   * Add a system to this world
   * @param {System} system - The system to add
   * @returns {World} - This world (for chaining)
   */
  addSystem(system) {
    this.systems.push(system);
    return this;
  }

  /**
   * Update all systems in this world
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    for (const system of this.systems) {
      system.update(deltaTime);
    }
  }

  /**
   * Get all entities that have a specific component
   * @param {Function|string} componentClass - The component class or name to check for
   * @returns {Entity[]} - Array of entities with the component
   */
  getEntitiesWithComponent(componentClass) {
    const componentName = typeof componentClass === 'string' 
      ? componentClass 
      : componentClass.name;
    
    const result = [];
    for (const entity of this.entities.values()) {
      if (entity.hasComponent(componentName)) {
        result.push(entity);
      }
    }
    return result;
  }

  /**
   * Clear all entities from this world
   */
  clear() {
    this.entities.clear();
    this.nextEntityId = 1;
  }
}

export default World;