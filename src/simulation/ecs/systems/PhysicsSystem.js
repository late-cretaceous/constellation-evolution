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
 * Enhanced with more effective movement dynamics
 */
export class PhysicsSystem extends System {
  /**
   * Create a new physics system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    
    // Physics simulation constants - adjusted for more effective movement
    this.velocityMultiplier = 1.4;    // Multiplier for velocity (overall speed factor)
    this.forceMagnifier = 2.5;        // Multiplier for forces (power of movements)
    this.damping = 0.95;              // Less damping for more fluid movement (0.98 originally)
    this.maxVelocity = 45.0;          // Higher max velocity (30.0 originally)
    this.bounceEnergyRetention = 0.9; // Energy retained on bounce (0.8 originally)
    this.applyImpulse = true;         // Apply random impulses occasionally
    this.impulseStrength = 15.0;      // Strength of random impulses
    this.impulseProbability = 0.001;  // Probability of impulse per frame per entity
  }

  /**
   * Update physics with enhanced movement dynamics
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
        
        // Apply occasional random impulse to help "unstick" organisms
        if (this.applyImpulse && Math.random() < this.impulseProbability) {
          const angle = Math.random() * Math.PI * 2;
          const impulse = new Vector2(
            Math.cos(angle) * this.impulseStrength,
            Math.sin(angle) * this.impulseStrength
          );
          physics.force = physics.force.add(impulse);
        }
        
        // Calculate acceleration (F = ma) with force multiplier
        const magnifiedForce = physics.force.multiply(this.forceMagnifier);
        const acceleration = magnifiedForce.multiply(1 / physics.mass);
        
        // Update velocity with acceleration and velocity multiplier
        const velocityChange = acceleration.multiply(deltaTime * this.velocityMultiplier);
        velocity.velocity = velocity.velocity.add(velocityChange);
        
        // Apply custom damping (lower than original for more fluid movement)
        velocity.velocity = velocity.velocity.multiply(
          // Use joint-specific damping if available, otherwise use system default
          entity.hasComponent(JointComponent) ? physics.damping : this.damping
        );
        
        // Apply velocity limit to prevent extreme movement
        const currentSpeed = Math.sqrt(
          velocity.velocity.x * velocity.velocity.x + 
          velocity.velocity.y * velocity.velocity.y
        );
        
        if (currentSpeed > this.maxVelocity) {
          const scale = this.maxVelocity / currentSpeed;
          velocity.velocity = velocity.velocity.multiply(scale);
        }
        
        // Update position with velocity
        position.position = position.position.add(velocity.velocity.multiply(deltaTime));
        
        // Check for boundary collisions
        const padding = 10;
        
        // Enhanced boundary collision handling with better energy retention
        if (position.position.x < padding) {
          position.position.x = padding;
          velocity.velocity.x *= -this.bounceEnergyRetention;
        }
        else if (position.position.x > CANVAS_WIDTH - padding) {
          position.position.x = CANVAS_WIDTH - padding;
          velocity.velocity.x *= -this.bounceEnergyRetention;
        }
        
        if (position.position.y < padding) {
          position.position.y = padding;
          velocity.velocity.y *= -this.bounceEnergyRetention;
        }
        else if (position.position.y > CANVAS_HEIGHT - padding) {
          position.position.y = CANVAS_HEIGHT - padding;
          velocity.velocity.y *= -this.bounceEnergyRetention;
        }
        
        // Reset force for next update
        physics.force = new Vector2(0, 0);
      }
    }
  }
}

export default PhysicsSystem;