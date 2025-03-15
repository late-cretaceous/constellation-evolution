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
 * Updated with improved selection pressure and genetic diversity
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
    
    // Enhanced evolution parameters
    this.selectionRatio = 0.4;      // Reduced from 0.5 to increase selection pressure
    this.elitismCount = 2;          // Preserve top organisms with minimal mutation
    this.tournamentSize = 3;        // Number of organisms to compare in tournament selection
    this.jointMutationChance = 0.15; // Increased from 0.1 for more body plan diversity
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
   * Initialize the first generation of organisms with improved distribution
   */
  initializeGeneration() {
    // Clear existing entities
    this.world.clear();
    this.generationCount = 0;
    
    // Divide the canvas into regions for better organism distribution
    const regionSize = 300; // Size of each region
    const numRegionsX = Math.ceil(CANVAS_WIDTH / regionSize);
    const numRegionsY = Math.ceil(CANVAS_HEIGHT / regionSize);
    
    // Create initial organisms with distributed positions and diverse genetics
    for (let i = 0; i < this.populationSize; i++) {
      // Select a random region
      const regionX = Math.floor(Math.random() * numRegionsX);
      const regionY = Math.floor(Math.random() * numRegionsY);
      
      // Calculate position within region (with 10% padding)
      const padding = regionSize * 0.1;
      const regionStartX = regionX * regionSize + padding;
      const regionStartY = regionY * regionSize + padding;
      const regionWidth = Math.min(regionSize - padding * 2, CANVAS_WIDTH - regionStartX);
      const regionHeight = Math.min(regionSize - padding * 2, CANVAS_HEIGHT - regionStartY);
      
      const pos = new Vector2(
        regionStartX + Math.random() * regionWidth,
        regionStartY + Math.random() * regionHeight
      );
      
      // Random joint count with broader distribution
      const jointCount = MIN_JOINT_COUNT + Math.floor(Math.random() * (MAX_JOINT_COUNT - MIN_JOINT_COUNT + 1));
      
      // Create organism with new genetic component - ensure diversity in initial population
      this.entityFactory.createOrganism(pos.x, pos.y, jointCount, new GeneticComponent());
    }
    
    // Create food
    this.initializeFood();
  }

  /**
   * Initialize food with improved distribution for larger simulation area
   */
  initializeFood() {
    // Use quadrants to distribute food more evenly
    const quadrantWidth = CANVAS_WIDTH / 2;
    const quadrantHeight = CANVAS_HEIGHT / 2;
    
    // Distribute food among quadrants
    for (let i = 0; i < this.foodAmount; i++) {
      // Determine which quadrant to place food
      const quadrant = Math.floor(Math.random() * 4);
      
      // Calculate position within quadrant
      let x, y;
      switch (quadrant) {
        case 0: // Top-left
          x = Math.random() * quadrantWidth;
          y = Math.random() * quadrantHeight;
          break;
        case 1: // Top-right
          x = quadrantWidth + Math.random() * quadrantWidth;
          y = Math.random() * quadrantHeight;
          break;
        case 2: // Bottom-left
          x = Math.random() * quadrantWidth;
          y = quadrantHeight + Math.random() * quadrantHeight;
          break;
        case 3: // Bottom-right
          x = quadrantWidth + Math.random() * quadrantWidth;
          y = quadrantHeight + Math.random() * quadrantHeight;
          break;
      }
      
      // Create food entity
      this.entityFactory.createFood(x, y);
    }
  }

  /**
   * Create a single food entity at a random position
   * @returns {Entity} - The created food entity
   */
  createFoodEntity() {
    // Instead of completely random position, divide the canvas into a grid
    // and select a random cell to place the food in
    const gridSize = 200; // Size of each grid cell
    const numGridX = Math.ceil(CANVAS_WIDTH / gridSize);
    const numGridY = Math.ceil(CANVAS_HEIGHT / gridSize);
    
    // Select a random grid cell
    const gridX = Math.floor(Math.random() * numGridX);
    const gridY = Math.floor(Math.random() * numGridY);
    
    // Calculate position within grid cell (with padding)
    const padding = gridSize * 0.1;
    const gridStartX = gridX * gridSize + padding;
    const gridStartY = gridY * gridSize + padding;
    const gridWidth = Math.min(gridSize - padding * 2, CANVAS_WIDTH - gridStartX);
    const gridHeight = Math.min(gridSize - padding * 2, CANVAS_HEIGHT - gridStartY);
    
    const pos = new Vector2(
      gridStartX + Math.random() * gridWidth,
      gridStartY + Math.random() * gridHeight
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
   * Enhanced to improve selection pressure, maintain diversity, and prevent premature convergence
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
    
    // Get minimum fitness value to handle negative fitness (can happen for penalty systems)
    const minFitness = Math.min(...organismEntities.map(e => e.getComponent(FitnessComponent).fitness));
    const fitnessOffset = minFitness < 0 ? Math.abs(minFitness) + 1 : 0;
    
    // Select top organisms for reproduction (using reduced selection ratio)
    const numSurvivors = Math.max(
      this.elitismCount + 1, 
      Math.floor(organismEntities.length * this.selectionRatio)
    );
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
    
    // Elitism: Preserve top organisms with low mutation
    for (let i = 0; i < Math.min(this.elitismCount, survivors.length); i++) {
      const eliteMutationRate = this.mutationRate * 0.2; // Lower mutation for elites
      newGeneration.push(this.reproduceOrganism(survivors[i], eliteMutationRate));
    }
    
    // Fill the rest with offspring from selected parents using varied selection strategies
    while (newGeneration.length < this.populationSize) {
      // Alternate between different selection strategies for better diversity
      let parent;
      
      // Every 3rd organism, use tournament selection
      if (newGeneration.length % 3 === 0) {
        parent = this.selectParentTournament(organismEntities);
      }
      // Every 3rd + 1 organism, use roulette wheel selection
      else if (newGeneration.length % 3 === 1) {
        parent = this.selectParentWeighted(survivors);
      }
      // Every 3rd + 2 organism, use random selection from top half (exploration)
      else {
        const randomIndex = Math.floor(Math.random() * survivors.length);
        parent = survivors[randomIndex];
      }
      
      // Occasionally use a completely random parent from any organism for extreme exploration
      if (Math.random() < 0.05 && organismEntities.length > survivors.length) {
        const randomIndex = survivors.length + Math.floor(
          Math.random() * (organismEntities.length - survivors.length)
        );
        parent = organismEntities[randomIndex < organismEntities.length ? randomIndex : 0];
      }
      
      // Apply higher mutation rate to lower-ranked parents to encourage diversity
      const parentIndex = organismEntities.indexOf(parent);
      const rankRatio = parentIndex / organismEntities.length; // 0 for best, 1 for worst
      const adjustedMutationRate = this.mutationRate * (1 + rankRatio); // Higher mutation for lower-ranked
      
      // Create offspring with adjusted mutation rate
      newGeneration.push(this.reproduceOrganism(parent, adjustedMutationRate));
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
   * Select a parent using tournament selection
   * This method picks N random organisms and selects the fittest among them
   * @param {Entity[]} organisms - The available organisms
   * @returns {Entity} - The selected parent organism
   */
  selectParentTournament(organisms) {
    if (organisms.length === 0) return null;
    
    // Select tournament size or maximum available organisms
    const tournamentSize = Math.min(this.tournamentSize, organisms.length);
    let bestOrganism = null;
    let bestFitness = -Infinity;
    
    // Run tournament
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * organisms.length);
      const organism = organisms[randomIndex];
      const fitness = organism.getComponent(FitnessComponent).fitness;
      
      if (fitness > bestFitness) {
        bestFitness = fitness;
        bestOrganism = organism;
      }
    }
    
    return bestOrganism;
  }

  /**
   * Select a parent using roulette wheel selection based on fitness
   * @param {Entity[]} organisms - The available parent organisms
   * @returns {Entity} - The selected parent organism
   */
  selectParentWeighted(organisms) {
    if (organisms.length === 0) return null;
    
    // Calculate minimum fitness to handle negative values
    const allFitness = organisms.map(org => org.getComponent(FitnessComponent).fitness);
    const minFitness = Math.min(0, ...allFitness);
    const fitnessOffset = minFitness < 0 ? Math.abs(minFitness) + 1 : 0;
    
    // Calculate total adjusted fitness with offset and scaling
    const totalFitness = organisms.reduce((sum, org) => {
      const rawFitness = org.getComponent(FitnessComponent).fitness;
      const adjustedFitness = Math.max(0.1, rawFitness + fitnessOffset);
      // Apply nonlinear scaling to increase selection pressure
      return sum + Math.pow(adjustedFitness, 1.5);
    }, 0);
    
    let selectionPoint = Math.random() * totalFitness;
    let runningTotal = 0;
    
    for (const organism of organisms) {
      const rawFitness = organism.getComponent(FitnessComponent).fitness;
      const adjustedFitness = Math.max(0.1, rawFitness + fitnessOffset);
      // Apply same nonlinear scaling
      const scaledFitness = Math.pow(adjustedFitness, 1.5);
      runningTotal += scaledFitness;
      
      if (runningTotal >= selectionPoint) {
        return organism;
      }
    }
    
    // Fallback, should rarely happen
    return organisms[organisms.length - 1];
  }

  /**
   * Create a child organism from a parent with mutations
   * Enhanced to create more varied offspring with different mutation strategies
   * @param {Entity} organismEntity - The parent organism entity
   * @param {number} mutationRate - Rate of genetic mutation
   * @returns {Entity} - The newly created child organism
   */
  reproduceOrganism(organismEntity, mutationRate) {
    const genetics = organismEntity.getComponent(GeneticComponent);
    
    // Choose a random position with better distribution
    const randomQuadrant = Math.floor(Math.random() * 4);
    const quadrantWidth = CANVAS_WIDTH / 2;
    const quadrantHeight = CANVAS_HEIGHT / 2;
    
    // Add some randomness to position to avoid clustering
    const variance = 0.2; // 20% variance within the quadrant
    
    let x, y;
    switch (randomQuadrant) {
      case 0: // Top-left
        x = (Math.random() * (1 - variance) + variance * Math.random()) * quadrantWidth;
        y = (Math.random() * (1 - variance) + variance * Math.random()) * quadrantHeight;
        break;
      case 1: // Top-right
        x = quadrantWidth + (Math.random() * (1 - variance) + variance * Math.random()) * quadrantWidth;
        y = (Math.random() * (1 - variance) + variance * Math.random()) * quadrantHeight;
        break;
      case 2: // Bottom-left
        x = (Math.random() * (1 - variance) + variance * Math.random()) * quadrantWidth;
        y = quadrantHeight + (Math.random() * (1 - variance) + variance * Math.random()) * quadrantHeight;
        break;
      case 3: // Bottom-right
        x = quadrantWidth + (Math.random() * (1 - variance) + variance * Math.random()) * quadrantWidth;
        y = quadrantHeight + (Math.random() * (1 - variance) + variance * Math.random()) * quadrantHeight;
        break;
    }
    
    const pos = new Vector2(x, y);
    
    // Mutate genes with potentially higher mutation rate based on context
    const childGenetics = genetics.mutate(mutationRate);
    
    // Number of joints can change more frequently (increased from 10% to 15-25%)
    const organism = organismEntity.getComponent(OrganismComponent);
    let childJointCount = organism.jointIds.length;
    
    // More aggressive joint count mutation
    if (Math.random() < this.jointMutationChance) {
      // Larger changes possible (+/- 2 joints)
      const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
      childJointCount += change;
      childJointCount = Math.max(MIN_JOINT_COUNT, Math.min(MAX_JOINT_COUNT, childJointCount));
    }
    
    // Create a completely new organism with the mutated genetics
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