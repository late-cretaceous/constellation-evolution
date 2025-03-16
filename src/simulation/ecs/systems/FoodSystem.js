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
 * Improved to provide better reward structure while still respecting evolutionary principles
 */
export class FoodSystem extends System {
  /**
   * Create a new food system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    this.foodsEaten = 0;
    
    // Food consumption parameters
    this.eatingDistance = EATING_DISTANCE;
    this.foodValue = FOOD_VALUE;
    
    // New: Track which food items are currently being targeted by an organism
    // This is just for efficiency - we don't reward "getting closer", just avoid rechecking already targeted food
    this.targetedFood = new Set();
  }

  /**
   * Check for food consumption by organisms
   * @param {number} deltaTime - Time elapsed since last update
   * @returns {number} - Number of food items eaten in this update
   */
  update(deltaTime) {
    this.foodsEaten = 0;
    this.targetedFood.clear();
    
    // Get all food entities
    const foodEntities = this.world.getEntitiesWithComponent(FoodComponent);
    
    // Get all organism entities
    const organismEntities = this.world.getEntitiesWithComponent(OrganismComponent);
    
    // Check for food consumption by each organism
    const entitiesToRemove = [];
    
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      const fitness = organismEntity.getComponent(FitnessComponent);
      
      // Only reward for actually eating food - no automatic survival bonus
      
      // For efficiency, prioritize checking food that's not already targeted
      const prioritizedFoodEntities = [...foodEntities].sort((a, b) => {
        const aIsTargeted = this.targetedFood.has(a.id) ? 1 : 0;
        const bIsTargeted = this.targetedFood.has(b.id) ? 1 : 0;
        return aIsTargeted - bIsTargeted;
      });
      
      for (const foodEntity of prioritizedFoodEntities) {
        if (entitiesToRemove.includes(foodEntity.id)) continue; // Skip if already marked for removal
        
        const foodPosition = foodEntity.getComponent(PositionComponent);
        
        // Check if any joint of the organism is close to the food
        for (const jointId of organism.jointIds) {
          const jointEntity = this.world.getEntity(jointId);
          if (!jointEntity) continue;
          
          const jointPosition = jointEntity.getComponent(PositionComponent);
          
          const distance = jointPosition.position.distanceTo(foodPosition.position);
          
          // Mark food as "targeted" when any joint is within twice the eating distance
          // This is just for optimization, not for additional fitness rewards
          if (distance < this.eatingDistance * 2) {
            this.targetedFood.add(foodEntity.id);
          }
          
          if (distance < this.eatingDistance) {
            // Eat the food - fixed value that doesn't change with distance
            fitness.fitness += this.foodValue;
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