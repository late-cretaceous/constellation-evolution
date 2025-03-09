// src/simulation/ecs/systems/PhysicsSystem.js
import { System } from '../System';
import { PositionComponent } from '../components/PositionComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { Vector2 } from '../utils/Vector2';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants';

/**
 * System that handles physics calculations and movement
 */
export class PhysicsSystem extends System {
  /**
   * Create a new physics system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
  }

  /**
   * Update physics for all entities with position, velocity, and physics components
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Get entities with position, velocity, and physics components
    const entities = this.world.entities.values();
    
    for (const entity of entities) {
      if (
        entity.hasComponent(PositionComponent) &&
        entity.hasComponent(VelocityComponent) &&
        entity.hasComponent(PhysicsComponent)
      ) {
        const position = entity.getComponent(PositionComponent);
        const velocity = entity.getComponent(VelocityComponent);
        const physics = entity.getComponent(PhysicsComponent);
        
        // Skip if entity is joint that is anchored
        if (entity.hasComponent('JointComponent') && entity.getComponent('JointComponent').isAnchored) {
          velocity.velocity = new Vector2(0, 0);
          continue;
        }
        
        // Apply force based on mass (F = ma)
        const acceleration = physics.force.multiply(1 / physics.mass);
        
        // Update velocity with acceleration
        velocity.velocity = velocity.velocity.add(acceleration);
        
        // Apply damping
        velocity.velocity = velocity.velocity.multiply(physics.damping);
        
        // Update position
        position.position = position.position.add(velocity.velocity);
        
        // Boundary checks
        if (position.position.x < 0) {
          position.position.x = 0;
          velocity.velocity.x *= -0.5;
        }
        if (position.position.x > CANVAS_WIDTH) {
          position.position.x = CANVAS_WIDTH;
          velocity.velocity.x *= -0.5;
        }
        if (position.position.y < 0) {
          position.position.y = 0;
          velocity.velocity.y *= -0.5;
        }
        if (position.position.y > CANVAS_HEIGHT) {
          position.position.y = CANVAS_HEIGHT;
          velocity.velocity.y *= -0.5;
        }
        
        // Reset force for next update
        physics.force = new Vector2(0, 0);
      }
    }
  }
}

export default PhysicsSystem;
