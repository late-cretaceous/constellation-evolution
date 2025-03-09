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
 * Enhanced to allow much more frenetic and diverse movement
 */
export class PhysicsSystem extends System {
  /**
   * Create a new physics system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    this.entityImpulses = new Map(); // Track random impulse timers
  }

  /**
   * Update physics with greatly enhanced randomness and potential for energetic movement
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
        if (entity.hasComponent(JointComponent) && entity.getComponent(JointComponent).isAnchored) {
          velocity.velocity = new Vector2(0, 0);
          physics.force = new Vector2(0, 0);
          continue;
        }
        
        // Add random force with potentially much higher magnitude
        const randForceFactor = Math.random();
        let randomForceMagnitude;
        
        // Power law distribution - most forces are small, but occasional very large forces
        // This creates the occasional frenetic movement we want
        if (randForceFactor < 0.8) {
          // 80% of the time: small to medium force
          randomForceMagnitude = Math.random() * 1.0;
        } else if (randForceFactor < 0.95) {
          // 15% of the time: medium to large force
          randomForceMagnitude = 1.0 + Math.random() * 3.0; 
        } else {
          // 5% of the time: very large force (potential for chaotic movement)
          randomForceMagnitude = 4.0 + Math.random() * 8.0;
        }
        
        physics.force = physics.force.add(new Vector2(
          (Math.random() * 2 - 1) * randomForceMagnitude,
          (Math.random() * 2 - 1) * randomForceMagnitude
        ));
        
        // Apply occasional sudden impulses for erratic movement
        if (!this.entityImpulses.has(entity.id)) {
          // Initialize with random interval
          this.entityImpulses.set(entity.id, Math.random() * 3.0);
        }
        
        // Update impulse timer
        let impulseTimer = this.entityImpulses.get(entity.id) - deltaTime;
        if (impulseTimer <= 0) {
          // Apply random impulse
          const impulseMagnitude = 5.0 + Math.random() * 15.0; // Strong impulse
          const impulseDirection = new Vector2(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
          ).normalize();
          
          velocity.velocity = velocity.velocity.add(
            impulseDirection.multiply(impulseMagnitude)
          );
          
          // Reset timer with random interval (0.5-5 seconds)
          impulseTimer = 0.5 + Math.random() * 4.5;
        }
        this.entityImpulses.set(entity.id, impulseTimer);
        
        // Apply force based on mass (F = ma)
        const acceleration = physics.force.multiply(1 / physics.mass);
        
        // Update velocity with acceleration
        velocity.velocity = velocity.velocity.add(acceleration.multiply(deltaTime));
        
        // Random damping - some objects maintain momentum better than others
        const randomDamping = Math.random() < 0.7 ? 
          0.92 + (Math.random() * 0.08) : // 70% chance: 0.92-1.00 (little damping)
          0.8 + (Math.random() * 0.12);   // 30% chance: 0.8-0.92 (more damping)
        
        velocity.velocity = velocity.velocity.multiply(randomDamping);
        
        // Random velocity disturbance
        if (Math.random() < 0.05) { // 5% chance
          velocity.velocity = new Vector2(
            velocity.velocity.x * (0.5 + Math.random() * 1.5), // 50-150% of current
            velocity.velocity.y * (0.5 + Math.random() * 1.5)
          );
        }
        
        // Allow much higher max velocities for more frenetic movement
        const maxVelocity = Math.random() < 0.95 ? 20.0 : 40.0; // 5% chance of extreme speed
        
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
        
        // Boundary checks with random bounce characteristics
        if (position.position.x < 0) {
          position.position.x = 0;
          velocity.velocity.x *= -(0.5 + Math.random() * 0.7); // 50-120% energy (can gain energy)
        }
        if (position.position.x > CANVAS_WIDTH) {
          position.position.x = CANVAS_WIDTH;
          velocity.velocity.x *= -(0.5 + Math.random() * 0.7);
        }
        if (position.position.y < 0) {
          position.position.y = 0;
          velocity.velocity.y *= -(0.5 + Math.random() * 0.7);
        }
        if (position.position.y > CANVAS_HEIGHT) {
          position.position.y = CANVAS_HEIGHT;
          velocity.velocity.y *= -(0.5 + Math.random() * 0.7);
        }
        
        // Reset force for next update
        physics.force = new Vector2(0, 0);
      }
    }
  }
}

export default PhysicsSystem;