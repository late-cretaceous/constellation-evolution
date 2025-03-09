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
    // Track organism positions to avoid clustering
    this.spawnPositions = new Set();
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
 * Initialize the first generation of organisms with extremely random parameters
 * Includes potential for frenetic movement right from the start
 */
initializeGeneration() {
  // Clear existing entities
  this.world.clear();
  this.generationCount = 0;
  this.spawnPositions.clear();
  
  // Create initial organisms with extremely diverse genetics
  for (let i = 0; i < this.populationSize; i++) {
    // Create evenly distributed positions across the canvas
    const pos = this.getDistributedPosition();
    
    // Completely random joint count - no bias
    const jointCount = MIN_JOINT_COUNT + Math.floor(Math.random() * (MAX_JOINT_COUNT - MIN_JOINT_COUNT + 1));
    
    // Distribution type for this organism - power law
    const randomFactor = Math.random();
    let movementMag, rotationalForce, movementFreq, movementBias;
    
    if (randomFactor < 0.7) {
      // 70% chance: moderate parameters
      movementMag = Math.random() * 5;
      rotationalForce = Math.random() * 6 - 3;
      movementFreq = Math.random() * 3;
      movementBias = Math.random() * 5 - 2.5;
    } else if (randomFactor < 0.9) {
      // 20% chance: high parameters
      movementMag = 5 + Math.random() * 10;
      rotationalForce = (Math.random() * 10 - 5) * (Math.random() < 0.5 ? 1 : -1);
      movementFreq = 3 + Math.random() * 7;
      movementBias = (Math.random() * 8 - 4) * (Math.random() < 0.5 ? 1 : -1);
    } else {
      // 10% chance: extreme parameters - potentially very frenetic movement
      movementMag = 15 + Math.random() * 15;
      rotationalForce = (Math.random() * 20 - 10) * (Math.random() < 0.5 ? 1 : -1);
      movementFreq = 10 + Math.random() * 5;
      movementBias = (Math.random() * 10 - 5) * (Math.random() < 0.5 ? 1 : -1);
    }
    
    // Create truly diverse genetic parameters
    const genetics = new GeneticComponent(
      // Random sensor distance
      20 + Math.random() * 300,          // Range: 20-320
      
      // Random thresholds
      Math.random(),                     // Range: 0-1
      Math.random(),                     // Range: 0-1
      Math.random(),                     // Range: 0-1
      
      // Movement parameters can be extreme
      movementMag,                      
      movementFreq,                      
      movementBias,                     
      rotationalForce                   
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
    this.spawnPositions.clear();
    
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
    
    // Choose between different spawn strategies
    let childPos;
    const spawnStrategy = Math.random();
    
    if (spawnStrategy < 0.4) {
      // 40% chance: Completely random position across the entire canvas
      childPos = new Vector2(
        Math.random() * CANVAS_WIDTH,
        Math.random() * CANVAS_HEIGHT
      );
    } else if (spawnStrategy < 0.7) {
      // 30% chance: Position in a different quadrant than parent
      const position = this.getOrganismPosition(organismEntity);
      
      // Determine parent's quadrant
      const parentQuadrantX = position.x < CANVAS_WIDTH / 2 ? 0 : 1;
      const parentQuadrantY = position.y < CANVAS_HEIGHT / 2 ? 0 : 1;
      
      // Choose a different quadrant
      let childQuadrantX, childQuadrantY;
      do {
        childQuadrantX = Math.floor(Math.random() * 2);
        childQuadrantY = Math.floor(Math.random() * 2);
      } while (childQuadrantX === parentQuadrantX && childQuadrantY === parentQuadrantY);
      
      // Calculate position in the chosen quadrant
      childPos = new Vector2(
        childQuadrantX * (CANVAS_WIDTH / 2) + Math.random() * (CANVAS_WIDTH / 2),
        childQuadrantY * (CANVAS_HEIGHT / 2) + Math.random() * (CANVAS_HEIGHT / 2)
      );
    } else {
      // 30% chance: Position distributed across a grid cell
      childPos = this.getDistributedPosition();
    }
    
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
   * Get a position that is distributed across the canvas in a grid-like manner
   * @returns {Vector2} - The distributed position
   */
  getDistributedPosition() {
    // Define a virtual grid for distribution
    const gridCellsX = 8;  // Divide canvas into 8x5 grid
    const gridCellsY = 5;
    const cellWidth = CANVAS_WIDTH / gridCellsX;
    const cellHeight = CANVAS_HEIGHT / gridCellsY;
    
    // First try to find empty cells
    let attempts = 0;
    const maxAttempts = 15;
    
    while (attempts < maxAttempts) {
      const gridX = Math.floor(Math.random() * gridCellsX);
      const gridY = Math.floor(Math.random() * gridCellsY);
      
      // Add some randomness within the cell
      const x = gridX * cellWidth + Math.random() * cellWidth;
      const y = gridY * cellHeight + Math.random() * cellHeight;
      
      // Check for minimum distance from existing positions
      const posKey = `${Math.floor(x / 50)},${Math.floor(y / 50)}`;
      
      if (!this.spawnPositions.has(posKey)) {
        this.spawnPositions.add(posKey);
        return new Vector2(x, y);
      }
      
      attempts++;
    }
    
    // If we couldn't find an empty cell after max attempts, just return random position
    return new Vector2(
      Math.random() * CANVAS_WIDTH,
      Math.random() * CANVAS_HEIGHT
    );
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