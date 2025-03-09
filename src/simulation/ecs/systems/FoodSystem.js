// src/simulation/ecs/systems/FoodSystem.js
import { System } from '../System';
import { FoodComponent } from '../components/FoodComponent';
import { JointComponent } from '../components/JointComponent';
import { OrganismComponent } from '../components/OrganismComponent';
import { FitnessComponent } from '../components/FitnessComponent';
import { PositionComponent } from '../components/PositionComponent';
import { EATING_DISTANCE, FOOD_VALUE } from '../../constants';

/**
 * System that handles food consumption and tracks fitness
 */
export class FoodSystem extends System {
  /**
   * Create a new food system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    this.foodsEaten = 0;
    this.accumulatedTime = 0; // Track time for survival bonus
  }

  /**
   * Check for food consumption by organisms
   * @param {number} deltaTime - Time elapsed since last update
   * @returns {number} - Number of food items eaten in this update
   */
  update(deltaTime) {
    this.accumulatedTime += deltaTime;
    this.foodsEaten = 0;
    
    // Get all food entities
    const foodEntities = this.world.getEntitiesWithComponent(FoodComponent);
    
    // Get all organism entities
    const organismEntities = this.world.getEntitiesWithComponent(OrganismComponent);
    
    // Check for food consumption by each organism
    const entitiesToRemove = [];
    
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      const fitness = organismEntity.getComponent(FitnessComponent);
      
      // Award a small survival bonus over time
      if (this.accumulatedTime > 1.0) { // Every second
        fitness.fitness += 0.1; // Small survival bonus
        this.accumulatedTime = 0;
      }
      
      for (const foodEntity of foodEntities) {
        if (entitiesToRemove.includes(foodEntity.id)) continue; // Skip if already marked for removal
        
        const foodPosition = foodEntity.getComponent(PositionComponent);
        
        // Check if any joint of the organism is close to the food
        for (const jointId of organism.jointIds) {
          const jointEntity = this.world.getEntity(jointId);
          if (!jointEntity) continue;
          
          const jointPosition = jointEntity.getComponent(PositionComponent);
          
          if (jointPosition.position.distanceTo(foodPosition.position) < EATING_DISTANCE) {
            // Eat the food
            fitness.fitness += FOOD_VALUE;
            fitness.foodEaten++;
            entitiesToRemove.push(foodEntity.id);
            this.foodsEaten++;
            break;
          }
        }
      }
    }
    
    // Remove eaten food
    for (const entityId of entitiesToRemove) {
      this.world.removeEntity(entityId);
    }
    
    return this.foodsEaten;
  }
}

export default FoodSystem;