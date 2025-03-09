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
 * Simplified to deterministic physics without randomness
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
   * Update physics with deterministic movement based on forces
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
        
        // Skip if entity is joint that is anchored (down state)
        if (entity.hasComponent(JointComponent) && entity.getComponent(JointComponent).isAnchored) {
          velocity.velocity = new Vector2(0, 0);
          physics.force = new Vector2(0, 0);
          continue;
        }
        
        // Calculate acceleration (F = ma)
        const acceleration = physics.force.multiply(1 / physics.mass);
        
        // Update velocity with acceleration
        velocity.velocity = velocity.velocity.add(acceleration.multiply(deltaTime));
        
        // Apply damping (friction)
        velocity.velocity = velocity.velocity.multiply(physics.damping);
        
        // Apply velocity limit to prevent extreme stretching
        const maxVelocity = 30.0;
        const currentSpeed = Math.sqrt(
          velocity.velocity.x * velocity.velocity.x + 
          velocity.velocity.y * velocity.velocity.y
        );
        
        if (currentSpeed > maxVelocity) {
          const scale = maxVelocity / currentSpeed;
          velocity.velocity = velocity.velocity.multiply(scale);
        }
        
        // Update position with velocity
        position.position = position.position.add(velocity.velocity.multiply(deltaTime));
        
        // Check for boundary collisions
        const padding = 10;
        
        // Simple boundary collision handling
        if (position.position.x < padding) {
          position.position.x = padding;
          velocity.velocity.x *= -0.8; // Lose some energy on bounce
        }
        else if (position.position.x > CANVAS_WIDTH - padding) {
          position.position.x = CANVAS_WIDTH - padding;
          velocity.velocity.x *= -0.8;
        }
        
        if (position.position.y < padding) {
          position.position.y = padding;
          velocity.velocity.y *= -0.8;
        }
        else if (position.position.y > CANVAS_HEIGHT - padding) {
          position.position.y = CANVAS_HEIGHT - padding;
          velocity.velocity.y *= -0.8;
        }
        
        // Reset force for next update
        physics.force = new Vector2(0, 0);
      }
    }
  }
}

export default PhysicsSystem;