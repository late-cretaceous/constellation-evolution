// src/simulation/ecs/systems/PhysicsSystem.js
import { System } from '../System';
import { PositionComponent } from '../components/PositionComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { JointComponent } from '../components/JointComponent';
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
    // Force a minimum deltaTime to ensure movement
    const scaledDelta = Math.max(deltaTime, 0.05);
    
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
        if (entity.hasComponent(JointComponent) && entity.getComponent(JointComponent).isAnchored) {
          velocity.velocity = new Vector2(0, 0);
          physics.force = new Vector2(0, 0);
          continue;
        }
        
        // Add a constant small motion for all objects to prevent stagnation
        physics.force = physics.force.add(new Vector2(
          (Math.random() * 2 - 1) * 0.2,
          (Math.random() * 2 - 1) * 0.2
        ));
        
        // Apply force based on mass (F = ma)
        const acceleration = physics.force.multiply(1 / physics.mass);
        
        // Update velocity with acceleration and scaled delta time
        velocity.velocity = velocity.velocity.add(acceleration.multiply(scaledDelta * 1.5)); // Increased force multiplier
        
        // Apply damping (much less damping for more movement)
        velocity.velocity = velocity.velocity.multiply(physics.damping);
        
        // Ensure minimum velocity (prevents objects from coming to a complete stop)
        const minSpeed = 0.01;
        const currentSpeed = Math.sqrt(
          velocity.velocity.x * velocity.velocity.x + 
          velocity.velocity.y * velocity.velocity.y
        );
        
        if (currentSpeed < minSpeed && currentSpeed > 0) {
          const scale = minSpeed / currentSpeed;
          velocity.velocity = velocity.velocity.multiply(scale);
        }
        
        // Cap maximum velocity to prevent explosion
        const maxVelocity = 8.0; // Increased from 5.0
        if (currentSpeed > maxVelocity) {
          const scale = maxVelocity / currentSpeed;
          velocity.velocity = velocity.velocity.multiply(scale);
        }
        
        // Update position with scaled velocity (slightly increased)
        position.position = position.position.add(velocity.velocity.multiply(scaledDelta * 1.2));
        
        // Boundary checks with bounce
        if (position.position.x < 0) {
          position.position.x = 0;
          velocity.velocity.x *= -0.8; // Less energy loss on bounce
        }
        if (position.position.x > CANVAS_WIDTH) {
          position.position.x = CANVAS_WIDTH;
          velocity.velocity.x *= -0.8;
        }
        if (position.position.y < 0) {
          position.position.y = 0;
          velocity.velocity.y *= -0.8;
        }
        if (position.position.y > CANVAS_HEIGHT) {
          position.position.y = CANVAS_HEIGHT;
          velocity.velocity.y *= -0.8;
        }
        
        // Reset force for next update
        physics.force = new Vector2(0, 0);
      }
    }
  }
}

export default PhysicsSystem;