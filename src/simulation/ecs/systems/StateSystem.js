// src/simulation/ecs/systems/StateSystem.js
import { System } from '../System';
import { JointComponent } from '../components/JointComponent';
import { OrganismComponent } from '../components/OrganismComponent';
import { PositionComponent } from '../components/PositionComponent';
import { GeneticComponent } from '../components/GeneticComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { FoodComponent } from '../components/FoodComponent';

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
        
        // Check thresholds to determine state
        if (normalizedDistance < genetics.anchorThreshold) {
          // Very close to food - anchor
          joint.isAnchored = true;
        } else if (normalizedDistance < genetics.moveThreshold) {
          // Moderately close - move toward food, but ensure we maintain minimum anchors
          if (currentAnchorRatio < genetics.anchorRatio && Math.random() < 0.7) {
            joint.isAnchored = true; // Become an anchor to maintain ratio
          } else {
            joint.isAnchored = false;
            
            // Add force toward food
            if (jointEntity.hasComponent(PhysicsComponent)) {
              const physics = jointEntity.getComponent(PhysicsComponent);
              const directionToFood = closestFoodPosition.subtract(position.position).normalize();
              physics.force = physics.force.add(directionToFood.multiply(0.1));
            }
          }
        } else {
          // Far from food but still in sensor range
          // Make anchor decision based on current ratio
          joint.isAnchored = (currentAnchorRatio < genetics.anchorRatio);
        }
      } else {
        // No food in range - default behavior
        // Some joints should still be anchored based on genetics
        if (currentAnchorRatio < genetics.anchorRatio) {
          joint.isAnchored = true;
        } else {
          joint.isAnchored = false;
        }
      }
    }
  }
}

export default StateSystem;
