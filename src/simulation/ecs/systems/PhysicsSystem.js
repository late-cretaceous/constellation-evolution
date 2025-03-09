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
 * Enhanced to create much more chaotic and energetic movement
 */
export class PhysicsSystem extends System {
  /**
   * Create a new physics system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    this.entityImpulses = new Map(); // Track random impulse timers
    this.entityChaosLevels = new Map(); // Individual chaos levels per entity
  }

  /**
   * Update physics with dramatically enhanced randomness and chaotic movement
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
        // Individual chaos level per entity instead of global
        if (!this.entityChaosLevels.has(entity.id)) {
          this.entityChaosLevels.set(entity.id, {
            level: 0.5 + Math.random() * 1.5, // Starting level
            timer: Math.random() * 3.0, // Individual timer
            phase: Math.random() * Math.PI * 2 // Offset phase
          });
        }
        
        // Update individual chaos level
        const chaosData = this.entityChaosLevels.get(entity.id);
        chaosData.timer -= deltaTime;
        
        if (chaosData.timer <= 0) {
          // Update chaos level randomly
          chaosData.level = 0.5 + Math.random() * 2.5;
          chaosData.timer = 0.5 + Math.random() * 2.5; // 0.5-3 seconds
          // Ensure timer is unique to this entity
          chaosData.timer += (entity.id % 10) * 0.1; // Add offset based on ID
        }
        
        // Individual chaos multiplier for this entity
        const entityChaosMultiplier = chaosData.level;
        
        const position = entity.getComponent(PositionComponent);
        const velocity = entity.getComponent(VelocityComponent);
        const physics = entity.getComponent(PhysicsComponent);
        
        // Skip if entity is joint that is anchored
        if (entity.hasComponent(JointComponent) && entity.getComponent(JointComponent).isAnchored) {
          velocity.velocity = new Vector2(0, 0);
          physics.force = new Vector2(0, 0);
          continue;
        }
        
        // Add random force with higher magnitude but with more reasonable limits
        // Still creates chaotic movement without extreme stretching
        const randFactor = Math.random();
        let randomForceMagnitude;
        
        if (randFactor < 0.6) {
          // 60% of the time: small to medium force
          randomForceMagnitude = Math.random() * 5.0;
        } else if (randFactor < 0.85) {
          // 25% of the time: medium to large force
          randomForceMagnitude = 5.0 + Math.random() * 10.0;
        } else if (randFactor < 0.95) {
          // 10% of the time: large force
          randomForceMagnitude = 15.0 + Math.random() * 15.0;
        } else {
          // 5% of the time: strong force (still chaotic but not extreme)
          randomForceMagnitude = 30.0 + Math.random() * 30.0;
        }
        
        // Apply individual chaos multiplier
        randomForceMagnitude *= entityChaosMultiplier;
        
        physics.force = physics.force.add(new Vector2(
          (Math.random() * 2 - 1) * randomForceMagnitude,
          (Math.random() * 2 - 1) * randomForceMagnitude
        ));
        
        // Apply frequent sudden impulses for erratic movement
        if (!this.entityImpulses.has(entity.id)) {
          // Initialize with random interval (much shorter intervals)
          this.entityImpulses.set(entity.id, Math.random() * 1.0);
        }
        
        // Update impulse timer
        let impulseTimer = this.entityImpulses.get(entity.id) - deltaTime;
        if (impulseTimer <= 0) {
          // Apply random impulse with more reasonable limits
          const impulseMagnitude = 15.0 + Math.random() * 25.0 * entityChaosMultiplier;
          const impulseDirection = new Vector2(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
          ).normalize();
          
          velocity.velocity = velocity.velocity.add(
            impulseDirection.multiply(impulseMagnitude)
          );
          
          // Reset timer with random short interval (0.1-2 seconds)
          impulseTimer = 0.1 + Math.random() * 1.9;
        }
        this.entityImpulses.set(entity.id, impulseTimer);
        
        // Apply force based on mass (F = ma)
        const acceleration = physics.force.multiply(1 / physics.mass);
        
        // Update velocity with acceleration
        velocity.velocity = velocity.velocity.add(acceleration.multiply(deltaTime));
        
        // Minimal damping - objects maintain momentum much better
        // 80% chance of very little damping, 20% chance of moderate damping
        const randomDamping = Math.random() < 0.8 ? 
          0.97 + (Math.random() * 0.03) : // 0.97-1.00 (almost no damping)
          0.9 + (Math.random() * 0.07);   // 0.9-0.97 (slight damping)
        
        velocity.velocity = velocity.velocity.multiply(randomDamping);
        
        // Random velocity boosts - occasionally multiply current velocity
        if (Math.random() < 0.08) { // 8% chance per frame
          velocity.velocity = new Vector2(
            velocity.velocity.x * (0.3 + Math.random() * 2.7), // 30-300% of current value
            velocity.velocity.y * (0.3 + Math.random() * 2.7)
          );
        }
        
        // Reduce the maximum velocities to prevent extreme stretching
        // 90% normal cap, 10% higher cap - but more reasonable limits
        const maxVelocity = Math.random() < 0.9 ? 
          30.0 * entityChaosMultiplier : // Normal cap (reduced from 50)
          60.0 * entityChaosMultiplier;  // Higher cap (reduced from 150)
        
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
        
        // Safety check for NaN positions (can happen with physics explosions)
        if (isNaN(position.position.x) || isNaN(position.position.y)) {
          position.position.x = Math.random() * CANVAS_WIDTH;
          position.position.y = Math.random() * CANVAS_HEIGHT;
          velocity.velocity = new Vector2(0, 0);
          physics.force = new Vector2(0, 0);
        }
        
        // Hard limits on position to keep entities on screen with some padding
        const padding = 10;
        position.position.x = Math.max(padding, Math.min(CANVAS_WIDTH - padding, position.position.x));
        position.position.y = Math.max(padding, Math.min(CANVAS_HEIGHT - padding, position.position.y));
        
        // Enhanced boundary checks with less extreme bounces
        if (position.position.x <= padding) {
          position.position.x = padding;
          velocity.velocity.x *= -(0.5 + Math.random() * 0.7); // 50-120% energy
          
          // 20% chance of wild bounce in random direction (reduced from 30%)
          if (Math.random() < 0.2) {
            velocity.velocity = new Vector2(
              Math.abs(velocity.velocity.x) * (0.5 + Math.random() * 0.5),
              (Math.random() * 2 - 1) * Math.abs(velocity.velocity.x)
            );
          }
        }
        if (position.position.x >= CANVAS_WIDTH - padding) {
          position.position.x = CANVAS_WIDTH - padding;
          velocity.velocity.x *= -(0.5 + Math.random() * 0.7);
          
          // 20% chance of wild bounce
          if (Math.random() < 0.2) {
            velocity.velocity = new Vector2(
              -Math.abs(velocity.velocity.x) * (0.5 + Math.random() * 0.5),
              (Math.random() * 2 - 1) * Math.abs(velocity.velocity.x)
            );
          }
        }
        if (position.position.y <= padding) {
          position.position.y = padding;
          velocity.velocity.y *= -(0.5 + Math.random() * 0.7);
          
          // 20% chance of wild bounce
          if (Math.random() < 0.2) {
            velocity.velocity = new Vector2(
              (Math.random() * 2 - 1) * Math.abs(velocity.velocity.y),
              Math.abs(velocity.velocity.y) * (0.5 + Math.random() * 0.5)
            );
          }
        }
        if (position.position.y >= CANVAS_HEIGHT - padding) {
          position.position.y = CANVAS_HEIGHT - padding;
          velocity.velocity.y *= -(0.5 + Math.random() * 0.7);
          
          // 20% chance of wild bounce
          if (Math.random() < 0.2) {
            velocity.velocity = new Vector2(
              (Math.random() * 2 - 1) * Math.abs(velocity.velocity.y),
              -Math.abs(velocity.velocity.y) * (0.5 + Math.random() * 0.5)
            );
          }
        }
        
        // 2% chance to apply a completely random teleportation "kick"
        // This creates sudden jumps in movement
        if (Math.random() < 0.02) {
          velocity.velocity = new Vector2(
            (Math.random() * 2 - 1) * 50 * entityChaosMultiplier,
            (Math.random() * 2 - 1) * 50 * entityChaosMultiplier
          );
        }
        
        // Reset force for next update
        physics.force = new Vector2(0, 0);
      }
    }
  }
}

export default PhysicsSystem;