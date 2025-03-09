// src/simulation/ecs/systems/EvolutionSystem.js
import { System } from '../System';
import { OrganismComponent } from '../components/OrganismComponent';
import { FitnessComponent } from '../components/FitnessComponent';
import { PositionComponent } from '../components/PositionComponent';
import { GeneticComponent } from '../components/GeneticComponent';
import { FoodComponent } from '../components/FoodComponent';
import { Vector2 } from '../utils/Vector2';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MIN_JOINT_COUNT, 
  MAX_JOINT_COUNT 
} from '../../constants';

/**
 * System that handles organism reproduction and evolution
 * Updated to select for movement patterns that lead to food
 */
export class EvolutionSystem extends System {
  /**
   * Create a new evolution system
   * @param {World} world - Reference to the world
   * @param {EntityFactory} entityFactory - Factory for creating entities
   * @param {number} foodAmount - Amount of food to create
   * @param {number} populationSize - Size of the population
   * @param {number} mutationRate - Rate of genetic mutation
   */
  constructor(world, entityFactory, foodAmount, populationSize, mutationRate) {
    super(world);
    this.entityFactory = entityFactory;
    this.foodAmount = foodAmount;
    this.populationSize = populationSize;
    this.mutationRate = mutationRate;
    this.stats = {
      bestFitness: 0,
      averageFitness: 0,
      minJoints: 0,
      maxJoints: 0,
      avgJoints: 0
    };
    this.generationCount = 0;
  }

  /**
   * Update not used for this system, as it's called externally
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // This system doesn't run every frame, but is called externally to start a new generation
  }

  /**
   * Set simulation parameters
   * @param {number} foodAmount - Amount of food to create
   * @param {number} populationSize - Size of the population
   * @param {number} mutationRate - Rate of genetic mutation
   */
  setParams(foodAmount, populationSize, mutationRate) {
    this.foodAmount = foodAmount;
    this.populationSize = populationSize;
    this.mutationRate = mutationRate;
  }

  /**
   * Initialize the first generation of organisms
   */
  initializeGeneration() {
    // Clear existing entities
    this.world.clear();
    this.generationCount = 0;
    
    // Create initial organisms with random positions
    for (let i = 0; i < this.populationSize; i++) {
      const pos = new Vector2(
        Math.random() * CANVAS_WIDTH,
        Math.random() * CANVAS_HEIGHT
      );
      
      // Random joint count
      const jointCount = MIN_JOINT_COUNT + Math.floor(Math.random() * (MAX_JOINT_COUNT - MIN_JOINT_COUNT + 1));
      
      // Create organism with new genetic component
      this.entityFactory.createOrganism(pos.x, pos.y, jointCount, new GeneticComponent());
    }
    
    // Create food
    this.initializeFood();
  }

  /**
   * Initialize food for a new generation
   */
  initializeFood() {
    for (let i = 0; i < this.foodAmount; i++) {
      this.createFoodEntity();
    }
  }

  /**
   * Create a single food entity at a random position
   * @returns {Entity} - The created food entity
   */
  createFoodEntity() {
    const pos = new Vector2(
      Math.random() * CANVAS_WIDTH,
      Math.random() * CANVAS_HEIGHT
    );
    
    return this.entityFactory.createFood(pos.x, pos.y);
  }

  /**
   * Replenish food in the simulation
   * @param {number} amount - Amount of food to add
   */
  replenishFood(amount) {
    const foodEntities = this.world.getEntitiesWithComponent(FoodComponent);
    const currentFoodCount = foodEntities.length;
    const foodToAdd = Math.min(amount, this.foodAmount - currentFoodCount);
    
    for (let i = 0; i < foodToAdd; i++) {
      this.createFoodEntity();
    }
  }

  /**
   * Create the next generation based on fitness selection
   * @returns {Object} - Statistics for the new generation
   */
  createNextGeneration() {
    this.generationCount++;
    
    // Get all organisms
    const organismEntities = this.world.getEntitiesWithComponent(OrganismComponent);
    
    // Sort by fitness
    organismEntities.sort((a, b) => {
      const fitnessA = a.getComponent(FitnessComponent).fitness;
      const fitnessB = b.getComponent(FitnessComponent).fitness;
      return fitnessB - fitnessA;
    });
    
    // Calculate fitness stats
    this.calculateStats(organismEntities);
    
    // Select top organisms for reproduction (50% selection pressure)
    const selectionRatio = 0.5; // Top 50% are selected
    const numSurvivors = Math.max(2, Math.floor(organismEntities.length * selectionRatio));
    const survivors = organismEntities.slice(0, numSurvivors);
    
    // Store IDs of all entities to be removed
    const entitiesToRemove = new Set();
    
    // Mark all current organisms and their joints for removal
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      
      // Mark all joints for removal
      for (const jointId of organism.jointIds) {
        entitiesToRemove.add(jointId);
      }
      
      // Mark organism for removal
      entitiesToRemove.add(organismEntity.id);
    }
    
    // Create new generation
    const newGeneration = [];
    
    // Elite reproduction: directly copy the best organism with minimal mutation
    if (survivors.length > 0) {
      const bestOrganism = survivors[0];
      newGeneration.push(this.reproduceOrganism(bestOrganism, this.mutationRate * 0.2));
    }
    
    // Fill the rest with children from selected parents
    while (newGeneration.length < this.populationSize) {
      // Select parent based on fitness (tournament selection)
      const parent = this.selectParentWeighted(survivors);
      
      // Reproduce with normal mutation rate
      newGeneration.push(this.reproduceOrganism(parent, this.mutationRate));
    }
    
    // Remove old entities
    for (const entityId of entitiesToRemove) {
      this.world.removeEntity(entityId);
    }
    
    // Remove all food
    const foodEntities = this.world.getEntitiesWithComponent(FoodComponent);
    for (const foodEntity of foodEntities) {
      this.world.removeEntity(foodEntity.id);
    }
    
    // Create new food
    this.initializeFood();
    
    return this.stats;
  }

  /**
   * Select a parent using tournament selection based on fitness
   * @param {Entity[]} organisms - The available parent organisms
   * @returns {Entity} - The selected parent organism
   */
  selectParentWeighted(organisms) {
    if (organisms.length === 0) return null;
    
    // Alternative: roulette wheel selection
    const totalFitness = organisms.reduce((sum, org) => {
      return sum + Math.max(0.1, org.getComponent(FitnessComponent).fitness);
    }, 0);
    
    let selectionPoint = Math.random() * totalFitness;
    let runningTotal = 0;
    
    for (const organism of organisms) {
      const fitness = Math.max(0.1, organism.getComponent(FitnessComponent).fitness);
      runningTotal += fitness;
      
      if (runningTotal >= selectionPoint) {
        return organism;
      }
    }
    
    // Fallback, should rarely happen
    return organisms[organisms.length - 1];
  }

  /**
   * Create a child organism from a parent with mutations
   * @param {Entity} organismEntity - The parent organism entity
   * @param {number} mutationRate - Rate of genetic mutation
   * @returns {Entity} - The newly created child organism
   */
  reproduceOrganism(organismEntity, mutationRate) {
    const genetics = organismEntity.getComponent(GeneticComponent);
    
    // Random position anywhere on the canvas
    const pos = new Vector2(
      Math.random() * CANVAS_WIDTH,
      Math.random() * CANVAS_HEIGHT
    );
    
    // Mutate genes
    const childGenetics = genetics.mutate(mutationRate);
    
    // Number of joints can sometimes change (modifying the body plan)
    const organism = organismEntity.getComponent(OrganismComponent);
    let childJointCount = organism.jointIds.length;
    
    // 10% chance to change joint count
    if (Math.random() < 0.1) {
      // Add or remove 1 joint
      childJointCount += Math.random() < 0.5 ? -1 : 1;
      childJointCount = Math.max(MIN_JOINT_COUNT, Math.min(MAX_JOINT_COUNT, childJointCount));
    }
    
    return this.entityFactory.createOrganism(pos.x, pos.y, childJointCount, childGenetics);
  }

  /**
   * Calculate the center position of an organism
   * @param {Entity} organismEntity - The organism entity
   * @returns {Vector2} - The center position
   */
  getOrganismPosition(organismEntity) {
    const organism = organismEntity.getComponent(OrganismComponent);
    let totalX = 0;
    let totalY = 0;
    let count = 0;
    
    for (const jointId of organism.jointIds) {
      const jointEntity = this.world.getEntity(jointId);
      if (!jointEntity) continue;
      
      const position = jointEntity.getComponent(PositionComponent);
      totalX += position.position.x;
      totalY += position.position.y;
      count++;
    }
    
    if (count === 0) return new Vector2(0, 0);
    
    return new Vector2(totalX / count, totalY / count);
  }

  /**
   * Calculate statistics for the current generation
   * @param {Entity[]} organismEntities - Array of organism entities
   * @returns {Object} - Statistics object
   */
  calculateStats(organismEntities) {
    if (organismEntities.length === 0) {
      this.stats = {
        bestFitness: 0,
        averageFitness: 0,
        minJoints: 0,
        maxJoints: 0,
        avgJoints: 0
      };
      return;
    }
    
    let bestFitness = 0;
    let totalFitness = 0;
    let minJoints = Infinity;
    let maxJoints = 0;
    let totalJoints = 0;
    
    for (const organismEntity of organismEntities) {
      const fitness = organismEntity.getComponent(FitnessComponent).fitness;
      const organism = organismEntity.getComponent(OrganismComponent);
      const jointCount = organism.jointIds.length;
      
      bestFitness = Math.max(bestFitness, fitness);
      totalFitness += fitness;
      
      minJoints = Math.min(minJoints, jointCount);
      maxJoints = Math.max(maxJoints, jointCount);
      totalJoints += jointCount;
    }
    
    this.stats = {
      bestFitness: bestFitness,
      averageFitness: (totalFitness / organismEntities.length).toFixed(1),
      minJoints: minJoints,
      maxJoints: maxJoints,
      avgJoints: (totalJoints / organismEntities.length).toFixed(1)
    };
    
    return this.stats;
  }
}

export default EvolutionSystem;