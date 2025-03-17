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
  MAX_JOINT_COUNT,
  FOOD_RADIUS
} from '../../constants';

/**
 * System that handles organism reproduction and evolution
 * Updated with improved selection pressure and genetic diversity,
 * with optimized food distribution to better facilitate evolution
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
    
    // Evolution parameters - adjusted for better selection and diversity
    this.selectionRatio = 0.35;     // Reduced from 0.4 to increase selection pressure
    this.elitismCount = 3;          // Increased from 2 to preserve success better
    this.tournamentSize = 4;        // Increased from 3 for stronger selection
    this.jointMutationChance = 0.18; // Increased from 0.15 for more body plan diversity
    
    // Food clustering parameters
    this.useFoodClustering = true;  // Use clustered food for better evolution
    this.foodClusterCount = 5;      // Number of food clusters
    this.foodClusterRadius = 200;   // Size of each food cluster
    
    // Food placement parameters (new)
    this.minFoodDistanceFromOrganism = 50;  // Minimum distance food must be from any organism
    this.maxPlacementAttempts = 10;         // Maximum number of attempts to place food
  }

  /**
   * Update not used for this system, as it's called externally to start a new generation
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
   * Initialize food with improved clustering to facilitate evolution
   */
  initializeFood() {
    // Determine whether to use clustered or quadrant-based distribution
    if (this.useFoodClustering) {
      // Create clustered food distribution
      this.initializeClusteredFood();
    } else {
      // Use quadrant distribution (original approach)
      this.initializeQuadrantFood();
    }
  }
  
  /**
   * Check if a position is too close to any organism
   * @private
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} minDistance - Minimum allowed distance
   * @returns {boolean} - True if position is too close to an organism
   */
  isPositionNearOrganisms(x, y, minDistance) {
    // Get all organisms
    const organismEntities = this.world.getEntitiesWithComponent(OrganismComponent);
    
    // For each organism, check if any of its joints are too close to the position
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      
      // Check each joint
      for (const jointId of organism.jointIds) {
        const jointEntity = this.world.getEntity(jointId);
        if (!jointEntity) continue;
        
        const position = jointEntity.getComponent(PositionComponent);
        const distance = Math.sqrt(
          Math.pow(position.position.x - x, 2) +
          Math.pow(position.position.y - y, 2)
        );
        
        // If too close, return true
        if (distance < minDistance) {
          return true;
        }
      }
    }
    
    // Not too close to any organism
    return false;
  }
  
  /**
   * Get organism positions for checking proximity
   * @private
   * @returns {Array<{x: number, y: number, radius: number}>} - Array of organism positions
   */
  getOrganismPositions() {
    const positions = [];
    const organismEntities = this.world.getEntitiesWithComponent(OrganismComponent);
    
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      
      // Calculate center position and bounding radius
      let totalX = 0;
      let totalY = 0;
      let jointCount = 0;
      let maxRadius = 0;
      
      for (const jointId of organism.jointIds) {
        const jointEntity = this.world.getEntity(jointId);
        if (!jointEntity) continue;
        
        const position = jointEntity.getComponent(PositionComponent);
        totalX += position.position.x;
        totalY += position.position.y;
        jointCount++;
      }
      
      if (jointCount > 0) {
        const centerX = totalX / jointCount;
        const centerY = totalY / jointCount;
        
        // Calculate maximum distance from center to any joint (plus joint radius)
        for (const jointId of organism.jointIds) {
          const jointEntity = this.world.getEntity(jointId);
          if (!jointEntity) continue;
          
          const position = jointEntity.getComponent(PositionComponent);
          const dx = position.position.x - centerX;
          const dy = position.position.y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy) + FOOD_RADIUS * 2;
          
          maxRadius = Math.max(maxRadius, distance);
        }
        
        positions.push({
          x: centerX,
          y: centerY,
          radius: Math.max(this.minFoodDistanceFromOrganism, maxRadius)
        });
      }
    }
    
    return positions;
  }
  
  /**
   * Initialize food using quadrant-based distribution
   * @private
   */
  initializeQuadrantFood() {
    // Cache organism positions for efficient checking
    const organismPositions = this.getOrganismPositions();
    
    // Use quadrants to distribute food relatively evenly
    const quadrantWidth = CANVAS_WIDTH / 2;
    const quadrantHeight = CANVAS_HEIGHT / 2;
    
    // Keep track of successful placements
    let successfulPlacements = 0;
    let totalAttempts = 0;
    const maxTotalAttempts = this.foodAmount * 3; // Cap total attempts
    
    // Distribute food among quadrants
    while (successfulPlacements < this.foodAmount && totalAttempts < maxTotalAttempts) {
      totalAttempts++;
      
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
        default:
          x = Math.random() * CANVAS_WIDTH;
          y = Math.random() * CANVAS_HEIGHT;
      }
      
      // Check if position is far enough from organisms
      let isTooClose = false;
      
      for (const pos of organismPositions) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < pos.radius) {
          isTooClose = true;
          break;
        }
      }
      
      // If position is acceptable, create food
      if (!isTooClose) {
        this.entityFactory.createFood(x, y);
        successfulPlacements++;
      }
    }
    
    // If we couldn't place all food, just place the remaining food randomly
    // This prevents getting stuck if the world is too crowded
    if (successfulPlacements < this.foodAmount) {
      const remaining = this.foodAmount - successfulPlacements;
      for (let i = 0; i < remaining; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        this.entityFactory.createFood(x, y);
      }
    }
  }
  
  /**
   * Initialize food using clustering to create more meaningful resource distribution
   * @private
   */
  initializeClusteredFood() {
    // Cache organism positions for efficient checking
    const organismPositions = this.getOrganismPositions();
    
    // Calculate padding from edges
    const padding = 100;
    
    // Create cluster centers with reasonable spacing, ensuring they're not too close to organisms
    const clusters = [];
    let clusterAttempts = 0;
    const maxClusterAttempts = this.foodClusterCount * 5;
    
    while (clusters.length < this.foodClusterCount && clusterAttempts < maxClusterAttempts) {
      clusterAttempts++;
      
      // Generate potential cluster center
      const centerX = padding + Math.random() * (CANVAS_WIDTH - padding * 2);
      const centerY = padding + Math.random() * (CANVAS_HEIGHT - padding * 2);
      
      // Check if too close to organisms or other clusters
      let isTooClose = false;
      
      // Check proximity to organisms
      for (const pos of organismPositions) {
        const dx = centerX - pos.x;
        const dy = centerY - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Allow closer proximity to organisms for clusters, but still maintain some distance
        if (distance < pos.radius * 0.7) {
          isTooClose = true;
          break;
        }
      }
      
      // Also check proximity to existing clusters (to avoid overlapping)
      if (!isTooClose) {
        for (const cluster of clusters) {
          const dx = centerX - cluster.x;
          const dy = centerY - cluster.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < this.foodClusterRadius * 1.5) {
            isTooClose = true;
            break;
          }
        }
      }
      
      // If position is acceptable, add cluster
      if (!isTooClose) {
        clusters.push({ x: centerX, y: centerY });
      }
    }
    
    // If we couldn't create enough clusters, just make random ones
    while (clusters.length < this.foodClusterCount) {
      clusters.push({
        x: padding + Math.random() * (CANVAS_WIDTH - padding * 2),
        y: padding + Math.random() * (CANVAS_HEIGHT - padding * 2)
      });
    }
    
    // Add some completely random food (30% of total)
    const randomFoodCount = Math.floor(this.foodAmount * 0.3);
    let randomFoodPlaced = 0;
    let randomAttempts = 0;
    const maxRandomAttempts = randomFoodCount * 3;
    
    while (randomFoodPlaced < randomFoodCount && randomAttempts < maxRandomAttempts) {
      randomAttempts++;
      
      const x = padding + Math.random() * (CANVAS_WIDTH - padding * 2);
      const y = padding + Math.random() * (CANVAS_HEIGHT - padding * 2);
      
      // Check if too close to organisms
      let isTooClose = false;
      for (const pos of organismPositions) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < pos.radius) {
          isTooClose = true;
          break;
        }
      }
      
      // If position is acceptable, create food
      if (!isTooClose) {
        this.entityFactory.createFood(x, y);
        randomFoodPlaced++;
      }
    }
    
    // Place remaining random food without checking distance if we couldn't place enough
    if (randomFoodPlaced < randomFoodCount) {
      const remaining = randomFoodCount - randomFoodPlaced;
      for (let i = 0; i < remaining; i++) {
        const x = padding + Math.random() * (CANVAS_WIDTH - padding * 2);
        const y = padding + Math.random() * (CANVAS_HEIGHT - padding * 2);
        this.entityFactory.createFood(x, y);
      }
    }
    
    // Distribute remaining food among clusters
    const clusterFoodCount = this.foodAmount - randomFoodCount;
    const foodPerCluster = Math.floor(clusterFoodCount / clusters.length);
    
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      let clusterFoodToAdd = foodPerCluster;
      
      // Add one more to last cluster if there's remainder
      if (i === clusters.length - 1) {
        clusterFoodToAdd += clusterFoodCount % clusters.length;
      }
      
      // Create food around this cluster
      let clusterFoodPlaced = 0;
      let clusterAttempts = 0;
      const maxClusterFoodAttempts = clusterFoodToAdd * 3;
      
      while (clusterFoodPlaced < clusterFoodToAdd && clusterAttempts < maxClusterFoodAttempts) {
        clusterAttempts++;
        
        // Random angle and distance from cluster center
        const angle = Math.random() * Math.PI * 2;
        // Use square root for more uniform distribution within circle
        const distance = Math.sqrt(Math.random()) * this.foodClusterRadius;
        
        const x = cluster.x + Math.cos(angle) * distance;
        const y = cluster.y + Math.sin(angle) * distance;
        
        // Ensure within canvas bounds
        const validX = Math.max(padding, Math.min(CANVAS_WIDTH - padding, x));
        const validY = Math.max(padding, Math.min(CANVAS_HEIGHT - padding, y));
        
        // Check if too close to organisms
        let isTooClose = false;
        for (const pos of organismPositions) {
          const dx = validX - pos.x;
          const dy = validY - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < pos.radius) {
            isTooClose = true;
            break;
          }
        }
        
        // If position is acceptable, create food
        if (!isTooClose) {
          this.entityFactory.createFood(validX, validY);
          clusterFoodPlaced++;
        }
      }
      
      // If we couldn't place all food for this cluster, place the remaining randomly in the cluster area
      if (clusterFoodPlaced < clusterFoodToAdd) {
        const remaining = clusterFoodToAdd - clusterFoodPlaced;
        for (let j = 0; j < remaining; j++) {
          // Random position within cluster radius
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.sqrt(Math.random()) * this.foodClusterRadius;
          
          const x = cluster.x + Math.cos(angle) * distance;
          const y = cluster.y + Math.sin(angle) * distance;
          
          // Ensure within canvas bounds
          const validX = Math.max(padding, Math.min(CANVAS_WIDTH - padding, x));
          const validY = Math.max(padding, Math.min(CANVAS_HEIGHT - padding, y));
          
          this.entityFactory.createFood(validX, validY);
        }
      }
    }
  }

  /**
   * Create a single food entity at a random position
   * @returns {Entity} - The created food entity
   */
  createFoodEntity() {
    // Cache organism positions for efficient checking
    const organismPositions = this.getOrganismPositions();
    
    // Instead of completely random position, divide the canvas into a grid
    // and select a random cell to place the food in
    const gridSize = 200; // Size of each grid cell
    const numGridX = Math.ceil(CANVAS_WIDTH / gridSize);
    const numGridY = Math.ceil(CANVAS_HEIGHT / gridSize);
    
    // Try several times to find a suitable position
    for (let attempts = 0; attempts < this.maxPlacementAttempts; attempts++) {
      // Select a random grid cell
      const gridX = Math.floor(Math.random() * numGridX);
      const gridY = Math.floor(Math.random() * numGridY);
      
      // Calculate position within grid cell (with padding)
      const padding = gridSize * 0.1;
      const gridStartX = gridX * gridSize + padding;
      const gridStartY = gridY * gridSize + padding;
      const gridWidth = Math.min(gridSize - padding * 2, CANVAS_WIDTH - gridStartX);
      const gridHeight = Math.min(gridSize - padding * 2, CANVAS_HEIGHT - gridStartY);
      
      const x = gridStartX + Math.random() * gridWidth;
      const y = gridStartY + Math.random() * gridHeight;
      
      // Check if position is far enough from organisms
      let isTooClose = false;
      
      for (const pos of organismPositions) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < pos.radius) {
          isTooClose = true;
          break;
        }
      }
      
      // If position is acceptable, create food
      if (!isTooClose) {
        return this.entityFactory.createFood(x, y);
      }
    }
    
    // If we tried too many times without success, just place food randomly
    // This prevents getting stuck if the world is too crowded
    const x = Math.random() * CANVAS_WIDTH;
    const y = Math.random() * CANVAS_HEIGHT;
    
    return this.entityFactory.createFood(x, y);
  }

  /**
   * Replenish food in the simulation
   * @param {number} amount - Amount of food to add
   */
  replenishFood(amount) {
    const foodEntities = this.world.getEntitiesWithComponent(FoodComponent);
    const currentFoodCount = foodEntities.length;
    const foodToAdd = Math.min(amount, this.foodAmount - currentFoodCount);
    
    // Cache organism positions for efficient checking
    const organismPositions = this.getOrganismPositions();
    
    // If using clustering, try to add food near existing food
    if (this.useFoodClustering && foodEntities.length > 0) {
      for (let i = 0; i < foodToAdd; i++) {
        if (Math.random() < 0.7 && foodEntities.length > 0) {
          // Try several times to place food near existing food
          let placed = false;
          
          for (let attempts = 0; attempts < this.maxPlacementAttempts; attempts++) {
            // Select a random existing food
            const randomFoodIndex = Math.floor(Math.random() * foodEntities.length);
            const existingFood = foodEntities[randomFoodIndex];
            const foodPos = existingFood.getComponent(PositionComponent);
            
            // Create new food nearby
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 70; // Between 30-100 units away
            
            const x = foodPos.position.x + Math.cos(angle) * distance;
            const y = foodPos.position.y + Math.sin(angle) * distance;
            
            // Ensure within canvas bounds
            const validX = Math.max(10, Math.min(CANVAS_WIDTH - 10, x));
            const validY = Math.max(10, Math.min(CANVAS_HEIGHT - 10, y));
            
            // Check if position is far enough from organisms
            let isTooClose = false;
            
            for (const pos of organismPositions) {
              const dx = validX - pos.x;
              const dy = validY - pos.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < pos.radius) {
                isTooClose = true;
                break;
              }
            }
            
            // If position is acceptable, create food
            if (!isTooClose) {
              this.entityFactory.createFood(validX, validY);
              placed = true;
              break;
            }
          }
          
          // If we couldn't place food near existing food, create it with the normal method
          if (!placed) {
            this.createFoodEntity();
          }
        } else {
          // Create completely random food
          this.createFoodEntity();
        }
      }
    } else {
      // Add food with normal distribution
      for (let i = 0; i < foodToAdd; i++) {
        this.createFoodEntity();
      }
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
      if (Math.random() < 0.08 && organismEntities.length > survivors.length) {
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
      averageFitness: Number((totalFitness / organismEntities.length).toFixed(1)),
      minJoints: minJoints,
      maxJoints: maxJoints,
      avgJoints: Number((totalJoints / organismEntities.length).toFixed(1))
    };
    
    return this.stats;
  }
}

export default EvolutionSystem;