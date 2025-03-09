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
   * Initialize the first generation of organisms and food
   */
  initializeGeneration() {
    // Clear existing entities
    this.world.clear();
    this.generationCount = 0;
    
    // Create initial organisms with randomized locomotion genetics
    for (let i = 0; i < this.populationSize; i++) {
      const pos = new Vector2(
        Math.random() * CANVAS_WIDTH,
        Math.random() * CANVAS_HEIGHT
      );
      // Randomize starting joint count between MIN_JOINT_COUNT and MAX_JOINT_COUNT
      const jointCount = MIN_JOINT_COUNT + Math.floor(Math.random() * (MAX_JOINT_COUNT - MIN_JOINT_COUNT + 1));
      
      // Create a completely random genetic component for the first generation
      // All organisms have the same food sensing ability, but different locomotion patterns
      const genetics = new GeneticComponent(
        150,                      // All organisms can sense food at the same distance
        0.5 + Math.random() * 0.4,   // Random moveThreshold (0.5-0.9)
        0.1 + Math.random() * 0.3,   // Random anchorThreshold (0.1-0.4)
        0.1 + Math.random() * 0.3,   // Random anchorRatio (0.1-0.4)
        0.5 + Math.random() * 2.5,   // Random movement magnitude (0.5-3.0)
        0.2 + Math.random() * 1.3,   // Random movement frequency (0.2-1.5)
        0.1 + Math.random() * 0.3,   // Very low initial food-seeking bias (mostly random)
        0.5 + Math.random() * 1.5    // Random rotational force (0.5-2.0)
      );
      
      this.entityFactory.createOrganism(pos.x, pos.y, jointCount, genetics);
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
    
    // Early generations: select wider variety to maintain diversity
    const earlyGenerations = this.generationCount <= 10;
    const selectionRatio = earlyGenerations ? 0.7 : 0.5; // Select 70% in early generations, 50% later
    
    // Select top organisms to reproduce
    const numSurvivors = Math.max(2, Math.floor(organismEntities.length * selectionRatio));
    const survivors = organismEntities.slice(0, numSurvivors);
    
    // Also include a few random organisms for diversity (even low fitness ones)
    if (organismEntities.length > numSurvivors) {
      const randomCount = Math.min(3, Math.floor(organismEntities.length * 0.1));
      for (let i = 0; i < randomCount; i++) {
        const randomIndex = numSurvivors + Math.floor(Math.random() * (organismEntities.length - numSurvivors));
        if (randomIndex < organismEntities.length && !survivors.includes(organismEntities[randomIndex])) {
          survivors.push(organismEntities[randomIndex]);
        }
      }
    }
    
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
    
    // Elite - copy the best organism directly (with tiny mutation rate)
    if (survivors.length > 0) {
      const bestOrganism = survivors[0];
      // Use a very small mutation rate for the elite (1/5th of normal)
      newGeneration.push(this.reproduceOrganism(bestOrganism, this.mutationRate * 0.2));
    }
    
    // Fill the rest with children with significant mutations to explore the solution space
    while (newGeneration.length < this.populationSize) {
      // Weighted selection (better organisms have higher chance to reproduce)
      const parent = this.selectParentWeighted(survivors);
      
      // Use higher mutation rate for early generations to explore solution space
      const adjustedMutationRate = earlyGenerations ? 
        this.mutationRate * 1.5 : this.mutationRate;
      
      newGeneration.push(this.reproduceOrganism(parent, adjustedMutationRate));
    }
    
    // Now remove old entities
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
   * Select a parent using weighted probability based on fitness
   * @param {Entity[]} organisms - The available parent organisms
   * @returns {Entity} - The selected parent organism
   */
  selectParentWeighted(organisms) {
    // Calculate total fitness
    let totalFitness = 0;
    for (const organism of organisms) {
      const fitness = organism.getComponent(FitnessComponent).fitness;
      totalFitness += Math.max(0.1, fitness); // Ensure even zero-fitness organisms have a chance
    }
    
    // If all organisms have zero fitness, select randomly
    if (totalFitness <= 0) {
      return organisms[Math.floor(Math.random() * organisms.length)];
    }
    
    // Select based on fitness proportion
    let selectionPoint = Math.random() * totalFitness;
    let runningTotal = 0;
    
    for (const organism of organisms) {
      const fitness = Math.max(0.1, organism.getComponent(FitnessComponent).fitness);
      runningTotal += fitness;
      
      if (runningTotal >= selectionPoint) {
        return organism;
      }
    }
    
    // Fallback (should rarely happen)
    return organisms[organisms.length - 1];
  }

  /**
   * Create a child organism from a parent with possible mutations
   * @param {Entity} organismEntity - The parent organism entity
   * @param {number} mutationRate - Rate of genetic mutation
   * @returns {Entity} - The newly created child organism
   */
  reproduceOrganism(organismEntity, mutationRate) {
    const genetics = organismEntity.getComponent(GeneticComponent);
    const position = this.getOrganismPosition(organismEntity);
    
    // Create a slightly offset position for the child
    const childPos = new Vector2(
      position.x + (Math.random() * 40 - 20),
      position.y + (Math.random() * 40 - 20)
    );
    
    // Constrain position to canvas bounds
    childPos.x = Math.max(10, Math.min(CANVAS_WIDTH - 10, childPos.x));
    childPos.y = Math.max(10, Math.min(CANVAS_HEIGHT - 10, childPos.y));
    
    // Mutate genes
    const childGenetics = genetics.mutate(mutationRate);
    
    // Number of joints can sometimes change
    const organism = organismEntity.getComponent(OrganismComponent);
    let childJointCount = organism.jointIds.length;
    
    // More chance of joint count mutation in early generations
    const jointMutationChance = this.generationCount <= 5 ? 0.2 : 0.1;
    
    if (Math.random() < jointMutationChance) {
      // Add or remove 1-2 joints
      childJointCount += Math.floor(Math.random() * 3) - 1;
      childJointCount = Math.max(MIN_JOINT_COUNT, Math.min(MAX_JOINT_COUNT, childJointCount));
    }
    
    return this.entityFactory.createOrganism(childPos.x, childPos.y, childJointCount, childGenetics);
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