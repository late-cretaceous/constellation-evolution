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
 * Enhanced with more effective movement dynamics for larger world area
 */
export class PhysicsSystem extends System {
  /**
   * Create a new physics system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    
    // Physics simulation constants - adjusted for more effective movement in larger area
    this.velocityMultiplier = 1.6;    // Increased for larger area (was 1.4)
    this.forceMagnifier = 2.8;        // Increased force multiplier (was 2.5)
    this.damping = 0.95;              // Less damping for more fluid movement (0.98 originally)
    this.maxVelocity = 60.0;          // Higher max velocity for larger area (was 45.0)
    this.bounceEnergyRetention = 0.9; // Energy retained on bounce
    
    // Random impulse settings - to prevent organisms from getting stuck in larger area
    this.applyImpulse = true;         // Apply random impulses occasionally
    this.impulseStrength = 20.0;      // Increased strength of random impulses (was 15.0)
    this.impulseProbability = 0.002;  // Higher probability for larger area (was 0.001)
    
    // Spatial partitioning for large world
    this.useQuadtree = false;         // Set to true to enable spatial acceleration for very large worlds
    this.quadtreeMaxDepth = 5;        // Maximum depth of the quadtree
    this.quadtreeMaxObjects = 10;     // Maximum objects per quadtree node
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
        // More important in larger area to avoid getting stuck at the edges
        if (this.applyImpulse && Math.random() < this.impulseProbability) {
          // If near edge, apply impulse away from edge
          const nearEdge = this.isNearEdge(position.position.x, position.position.y, 50);
          
          if (nearEdge) {
            // Apply impulse away from nearest edge
            const impulse = this.getEdgeAvoidanceImpulse(position.position.x, position.position.y);
            physics.force = physics.force.add(impulse.multiply(this.impulseStrength * 1.5));
          } else {
            // Regular random impulse in open space
            const angle = Math.random() * Math.PI * 2;
            const impulse = new Vector2(
              Math.cos(angle) * this.impulseStrength,
              Math.sin(angle) * this.impulseStrength
            );
            physics.force = physics.force.add(impulse);
          }
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
  
  /**
   * Check if a position is near an edge of the simulation area
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} threshold - Distance threshold to consider "near edge"
   * @returns {boolean} - True if position is near an edge
   */
  isNearEdge(x, y, threshold) {
    return (
      x < threshold || 
      x > CANVAS_WIDTH - threshold || 
      y < threshold || 
      y > CANVAS_HEIGHT - threshold
    );
  }
  
  /**
   * Generate an impulse vector pointing away from the nearest edge
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Vector2} - Impulse vector
   */
  getEdgeAvoidanceImpulse(x, y) {
    // Calculate distance to each edge
    const distLeft = x;
    const distRight = CANVAS_WIDTH - x;
    const distTop = y;
    const distBottom = CANVAS_HEIGHT - y;
    
    // Find the nearest edge
    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
    
    // Create impulse away from nearest edge
    if (minDist === distLeft) {
      return new Vector2(1, 0); // Right impulse
    } else if (minDist === distRight) {
      return new Vector2(-1, 0); // Left impulse
    } else if (minDist === distTop) {
      return new Vector2(0, 1); // Down impulse
    } else {
      return new Vector2(0, -1); // Up impulse
    }
  }
}

export default PhysicsSystem;