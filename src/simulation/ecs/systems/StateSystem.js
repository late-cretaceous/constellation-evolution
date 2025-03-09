// src/simulation/ecs/systems/StateSystem.js - Complete replacement
import { System } from '../System';
import { JointComponent } from '../components/JointComponent';
import { OrganismComponent } from '../components/OrganismComponent';
import { PositionComponent } from '../components/PositionComponent';
import { GeneticComponent } from '../components/GeneticComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { FoodComponent } from '../components/FoodComponent';
import { Vector2 } from '../utils/Vector2';

/**
 * System that determines joint states with pure randomness
 * No inherent patterns or behaviors - all structure emerges through evolution
 */
export class StateSystem extends System {
  /**
   * Create a new state system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    this.stateChangeTimer = {}; // Track timers for state changes by joint ID
    this.simulationTime = 0;
  }

  /**
   * Update states of joints with pure randomness
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Update simulation time
    this.simulationTime += deltaTime;
    
    // Get all joint entities
    const jointEntities = this.world.getEntitiesWithComponent(JointComponent);
    
    // Get all food entities
    const foodEntities = this.world.getEntitiesWithComponent(FoodComponent);
    
    // For each joint, determine state based on pure randomness
    for (const jointEntity of jointEntities) {
      const joint = jointEntity.getComponent(JointComponent);
      
      // Skip joints that are in a timer state change
      if (this.stateChangeTimer[jointEntity.id]) continue;
      
      const position = jointEntity.getComponent(PositionComponent);
      
      // Get the organism this joint belongs to
      const organismEntity = this.world.getEntity(joint.organismId);
      if (!organismEntity) continue;
      
      const genetics = organismEntity.getComponent(GeneticComponent);
      
      // Find the closest food - basic sensing capability
      let closestFoodDistance = Number.MAX_VALUE;
      let closestFoodPosition = null;
      
      for (const foodEntity of foodEntities) {
        const foodPosition = foodEntity.getComponent(PositionComponent);
        const distance = position.position.distanceTo(foodPosition.position);
        
        // Check if food is within this organism's sensor range (completely random per organism)
        if (distance < genetics.sensorDistance && distance < closestFoodDistance) {
          closestFoodDistance = distance;
          closestFoodPosition = foodPosition.position;
        }
      }
      
      // Pure random state changes - no inherent patterns at all
      const randomDecision = Math.random();
      
      // Each organism has truly random behavior regarding food
      if (closestFoodPosition && closestFoodDistance < genetics.sensorDistance) {
        // Organism can sense food, but reaction is completely random
        // No inherent bias toward "good" behavior - evolution will select what works
        
        // Completely random decision to anchor or move
        const shouldAnchor = randomDecision < (Math.random() * genetics.anchorThreshold);
        
        // Random duration of the state change
        const duration = 50 + Math.random() * 500; // 50-550ms
        
        // Apply random force if we have physics
        if (jointEntity.hasComponent(PhysicsComponent) && !shouldAnchor) {
          const physics = jointEntity.getComponent(PhysicsComponent);
          
          // Direction to food
          const directionToFood = closestFoodPosition.subtract(position.position).normalize();
          
          // Purely random force application - might move toward food, away from it, or randomly
          // The genetic movementBias parameter determines if there's any tendency to move toward food
          const foodBias = genetics.movementBias;
          
          // Completely random force direction - may or may not be related to food
          const randomDirection = new Vector2(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
          ).normalize();
          
          // Mix random direction with food direction based on genetic bias
          // Negative bias means move away from food
          // Zero bias means ignore food
          // Positive bias means move toward food
          const mixRatio = Math.max(-1, Math.min(1, foodBias));
          let moveDirection;
          
          if (mixRatio > 0) {
            // Some tendency toward food
            moveDirection = this.mixVectors(randomDirection, directionToFood, mixRatio);
          } else if (mixRatio < 0) {
            // Some tendency away from food
            moveDirection = this.mixVectors(randomDirection, directionToFood.multiply(-1), -mixRatio);
          } else {
            // Pure random movement
            moveDirection = randomDirection;
          }
          
          // Apply force with random magnitude
          const forceMagnitude = Math.random() * genetics.movementMagnitude;
          physics.force = physics.force.add(moveDirection.multiply(forceMagnitude));
        }
        
        // Change state
        this.temporaryStateChange(jointEntity, shouldAnchor, duration);
      } else {
        // No food in sensor range - pure random behavior
        
        // Completely random anchoring
        const shouldAnchor = randomDecision < 0.5; // 50% chance either way
        
        // Random duration
        const duration = 100 + Math.random() * 1000; // 100-1100ms
        
        // Apply pure noise forces if not anchored
        if (jointEntity.hasComponent(PhysicsComponent) && !shouldAnchor) {
          const physics = jointEntity.getComponent(PhysicsComponent);
          
          // Pure noise force
          physics.force = physics.force.add(new Vector2(
            (Math.random() * 2 - 1) * (Math.random() * genetics.movementMagnitude),
            (Math.random() * 2 - 1) * (Math.random() * genetics.movementMagnitude)
          ));
        }
        
        // Change state
        this.temporaryStateChange(jointEntity, shouldAnchor, duration);
      }
    }
  }
  
  /**
   * Mix two vectors based on ratio
   * @param {Vector2} v1 - First vector
   * @param {Vector2} v2 - Second vector
   * @param {number} ratio - Mix ratio (0-1)
   * @returns {Vector2} - Mixed vector
   */
  mixVectors(v1, v2, ratio) {
    return new Vector2(
      v1.x * (1 - ratio) + v2.x * ratio,
      v1.y * (1 - ratio) + v2.y * ratio
    ).normalize();
  }
  
  /**
   * Change a joint's state temporarily with pure randomness
   * @param {Entity} jointEntity - The joint entity
   * @param {boolean} anchorState - Whether to anchor the joint
   * @param {number} duration - Duration of the state change in milliseconds
   */
  temporaryStateChange(jointEntity, anchorState, duration) {
    const joint = jointEntity.getComponent(JointComponent);
    
    // Completely random chance to simply ignore the state change
    if (Math.random() < 0.1) { // 10% chance to ignore
      return;
    }
    
    // Change the state
    joint.isAnchored = anchorState;
    
    // Set a timer to change back
    this.stateChangeTimer[jointEntity.id] = true;
    
    setTimeout(() => {
      if (this.world.getEntity(jointEntity.id)) {
        delete this.stateChangeTimer[jointEntity.id];
      }
    }, duration);
  }
}

export default StateSystem;