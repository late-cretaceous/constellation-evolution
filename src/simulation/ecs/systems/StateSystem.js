// src/simulation/ecs/systems/StateSystem.js
import { System } from '../System';
import { JointComponent } from '../components/JointComponent';
import { OrganismComponent } from '../components/OrganismComponent';
import { PositionComponent } from '../components/PositionComponent';
import { GeneticComponent } from '../components/GeneticComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { FoodComponent } from '../components/FoodComponent';
import { Vector2 } from '../utils/Vector2';

/**
 * System that determines the state of joints (anchored or moving)
 * based on genetic information and food proximity
 */
export class StateSystem extends System {
  /**
   * Create a new state system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    this.stateChangeTimer = {}; // Track timers for state changes by joint ID
  }

  /**
   * Update states of all joints based on food and genetics
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Get all joint entities
    const jointEntities = this.world.getEntitiesWithComponent(JointComponent);
    
    // Get all food entities
    const foodEntities = this.world.getEntitiesWithComponent(FoodComponent);
    
    // For each joint, determine whether it should be anchored based on genes and food proximity
    for (const jointEntity of jointEntities) {
      const joint = jointEntity.getComponent(JointComponent);
      
      // Skip joints that are in a timer state change
      if (this.stateChangeTimer[jointEntity.id]) continue;
      
      const position = jointEntity.getComponent(PositionComponent);
      
      // Get the organism this joint belongs to
      const organismEntity = this.world.getEntity(joint.organismId);
      if (!organismEntity) continue;
      
      const organism = organismEntity.getComponent(OrganismComponent);
      const genetics = organismEntity.getComponent(GeneticComponent);
      
      // Find the closest food
      let closestFoodDistance = Number.MAX_VALUE;
      let closestFoodPosition = null;
      
      for (const foodEntity of foodEntities) {
        const foodPosition = foodEntity.getComponent(PositionComponent);
        const distance = position.position.distanceTo(foodPosition.position);
        
        if (distance < closestFoodDistance) {
          closestFoodDistance = distance;
          closestFoodPosition = foodPosition.position;
        }
      }
      
      // Check current anchor ratio in the organism
      let anchoredJoints = 0;
      for (const jointId of organism.jointIds) {
        const otherJointEntity = this.world.getEntity(jointId);
        if (otherJointEntity && otherJointEntity.getComponent(JointComponent).isAnchored) {
          anchoredJoints++;
        }
      }
      
      const totalJoints = organism.jointIds.length;
      const currentAnchorRatio = anchoredJoints / totalJoints;
      
      // If there's food within sensor range
      if (closestFoodPosition && closestFoodDistance < genetics.sensorDistance) {
        // Calculate normalized distance (1.0 when at sensor edge, 0.0 when at food)
        const normalizedDistance = closestFoodDistance / genetics.sensorDistance;
        
        // Add a random component to make anchoring less deterministic
        const randomFactor = Math.random() * 0.3; // 0-0.3 random factor
        
        // Check thresholds to determine state
        if (normalizedDistance < genetics.anchorThreshold - randomFactor) {
          // Very close to food - temporarily anchor
          this.temporaryStateChange(jointEntity, true, 200 + Math.random() * 300);
          
          // Add strong force toward food
          if (jointEntity.hasComponent(PhysicsComponent)) {
            const physics = jointEntity.getComponent(PhysicsComponent);
            const directionToFood = closestFoodPosition.subtract(position.position).normalize();
            physics.force = physics.force.add(directionToFood.multiply(3.0)); // Very strong pull toward food
          }
        } else if (normalizedDistance < genetics.moveThreshold) {
          // Moderately close - dynamic anchor decisions with more movement
          if (currentAnchorRatio < genetics.anchorRatio * 0.7 && Math.random() < 0.4) {
            // Become an anchor briefly to maintain ratio
            this.temporaryStateChange(jointEntity, true, 100 + Math.random() * 200);
          } else {
            // Move most of the time
            this.temporaryStateChange(jointEntity, false, 300 + Math.random() * 300);
            
            // Add stronger force toward food
            if (jointEntity.hasComponent(PhysicsComponent)) {
              const physics = jointEntity.getComponent(PhysicsComponent);
              const directionToFood = closestFoodPosition.subtract(position.position).normalize();
              physics.force = physics.force.add(directionToFood.multiply(2.0)); // Strong food attraction
            }
          }
        } else {
          // Far from food but still in sensor range - mostly movement
          if (Math.random() < 0.15 && currentAnchorRatio < genetics.anchorRatio) {
            // Occasionally anchor briefly for stability
            this.temporaryStateChange(jointEntity, true, 100 + Math.random() * 150);
          } else {
            // Move most of the time
            this.temporaryStateChange(jointEntity, false, 400 + Math.random() * 300);
            
            // Add moderate force toward food
            if (jointEntity.hasComponent(PhysicsComponent)) {
              const physics = jointEntity.getComponent(PhysicsComponent);
              const directionToFood = closestFoodPosition.subtract(position.position).normalize();
              physics.force = physics.force.add(directionToFood.multiply(1.2)); // Moderate food attraction
            }
          }
        }
      } else {
        // No food in range - default behavior with randomness for exploration
        if (currentAnchorRatio < genetics.anchorRatio && Math.random() < 0.4) {
          // Occasionally anchor for stability but for shorter periods
          this.temporaryStateChange(jointEntity, true, 150 + Math.random() * 150);
        } else {
          // Move most of the time for longer periods
          this.temporaryStateChange(jointEntity, false, 400 + Math.random() * 400);
          
          // Add larger random force for more dynamic exploration
          if (jointEntity.hasComponent(PhysicsComponent)) {
            const physics = jointEntity.getComponent(PhysicsComponent);
            physics.force = physics.force.add(
              new Vector2(
                (Math.random() * 2 - 1) * 1.0,
                (Math.random() * 2 - 1) * 1.0
              )
            );
          }
        }
      }
    }
  }
  
  /**
   * Change a joint's state temporarily and set a timer to revert
   * @param {Entity} jointEntity - The joint entity
   * @param {boolean} anchorState - Whether to anchor the joint
   * @param {number} duration - Duration of the state change in milliseconds
   */
  temporaryStateChange(jointEntity, anchorState, duration) {
    const joint = jointEntity.getComponent(JointComponent);
    
    // Skip if already in the desired state
    if (joint.isAnchored === anchorState) return;
    
    // Change the state
    joint.isAnchored = anchorState;
    
    // Set a timer to change back for more dynamic behavior
    this.stateChangeTimer[jointEntity.id] = true;
    
    setTimeout(() => {
      if (this.world.getEntity(jointEntity.id)) {
        delete this.stateChangeTimer[jointEntity.id];
      }
    }, duration);
  }
}

export default StateSystem;