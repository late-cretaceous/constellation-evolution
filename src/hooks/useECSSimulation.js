// src/hooks/useECSSimulation.js
import { useState, useRef, useEffect } from 'react';
import { World } from '../simulation/ecs/World';
import { EntityFactory } from '../simulation/ecs/EntityFactory';
import { PhysicsSystem } from '../simulation/ecs/systems/PhysicsSystem';
import { JointConnectionSystem } from '../simulation/ecs/systems/JointConnectionSystem';
import { FoodSystem } from '../simulation/ecs/systems/FoodSystem';
import { StateSystem } from '../simulation/ecs/systems/StateSystem';
import { RenderSystem } from '../simulation/ecs/systems/RenderSystem';
import { EvolutionSystem } from '../simulation/ecs/systems/EvolutionSystem';
import { PositionComponent } from '../simulation/ecs/components/PositionComponent';
import { OrganismComponent } from '../simulation/ecs/components/OrganismComponent';
import { FoodComponent } from '../simulation/ecs/components/FoodComponent';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GENERATION_TIME,
  INITIAL_POPULATION,
  INITIAL_FOOD_AMOUNT,
  DEFAULT_MUTATION_RATE,
  DEFAULT_SIMULATION_SPEED
} from '../simulation/constants';

/**
 * Custom hook to manage the evolution simulation using ECS architecture
 * Enhanced with better configuration options and entity position tracking
 * @param {React.RefObject} canvasRef - Reference to the canvas element
 * @returns {Object} - Simulation state and control functions
 */
export function useECSSimulation(canvasRef) {
  // State management for UI
  const [isRunning, setIsRunning] = useState(true);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(INITIAL_POPULATION);
  const [foodAmount, setFoodAmount] = useState(INITIAL_FOOD_AMOUNT);
  const [mutationRate, setMutationRate] = useState(DEFAULT_MUTATION_RATE);
  const [speed, setSpeed] = useState(DEFAULT_SIMULATION_SPEED);
  const [stats, setStats] = useState({
    bestFitness: 0,
    averageFitness: 0,
    minJoints: 0,
    maxJoints: 0,
    avgJoints: 0
  });
  const [needsRestart, setNeedsRestart] = useState(false);
  
  // Entity position tracking for minimap
  const [organismPositions, setOrganismPositions] = useState([]);
  const [foodPositions, setFoodPositions] = useState([]);
  
  // Refs to hold current values without triggering re-renders
  const populationRef = useRef(population);
  const foodAmountRef = useRef(foodAmount);
  const mutationRateRef = useRef(mutationRate);
  const speedRef = useRef(speed);
  const worldRef = useRef(null);
  const evolutionSystemRef = useRef(null);
  const renderSystemRef = useRef(null);
  const foodSystemRef = useRef(null);
  const generationTimeoutRef = useRef(null);
  
  // Update refs when state changes
  useEffect(() => {
    populationRef.current = population;
  }, [population]);
  
  useEffect(() => {
    foodAmountRef.current = foodAmount;
  }, [foodAmount]);
  
  useEffect(() => {
    mutationRateRef.current = mutationRate;
  }, [mutationRate]);
  
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  
  /**
   * Updates entity positions for the minimap
   */
  const updateEntityPositions = () => {
    if (!worldRef.current) return;
    
    // Get organism positions - calculate center of each organism
    const organismEntities = worldRef.current.getEntitiesWithComponent(OrganismComponent);
    const newOrganismPositions = [];
    
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      let totalX = 0;
      let totalY = 0;
      let validJointCount = 0;
      
      // Calculate center position from all joints
      for (const jointId of organism.jointIds) {
        const jointEntity = worldRef.current.getEntity(jointId);
        if (!jointEntity) continue;
        
        const position = jointEntity.getComponent(PositionComponent);
        if (position) {
          totalX += position.position.x;
          totalY += position.position.y;
          validJointCount++;
        }
      }
      
      // Only add if we have valid joints
      if (validJointCount > 0) {
        newOrganismPositions.push({
          x: totalX / validJointCount,
          y: totalY / validJointCount
        });
      }
    }
    
    // Get food positions
    const foodEntities = worldRef.current.getEntitiesWithComponent(FoodComponent);
    const newFoodPositions = [];
    
    for (const foodEntity of foodEntities) {
      const position = foodEntity.getComponent(PositionComponent);
      if (position) {
        newFoodPositions.push({
          x: position.position.x,
          y: position.position.y
        });
      }
    }
    
    // Update state
    setOrganismPositions(newOrganismPositions);
    setFoodPositions(newFoodPositions);
  };
  
  // Main simulation effect
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Initialize ECS world and systems
    const world = new World();
    worldRef.current = world;
    
    const entityFactory = new EntityFactory(world);
    
    // Create systems
    const physicsSystem = new PhysicsSystem(world);
    const jointConnectionSystem = new JointConnectionSystem(world);
    const foodSystem = new FoodSystem(world);
    const stateSystem = new StateSystem(world);
    const renderSystem = new RenderSystem(world, ctx);
    const evolutionSystem = new EvolutionSystem(
      world,
      entityFactory,
      foodAmountRef.current,
      populationRef.current,
      mutationRateRef.current
    );
    
    // Store references to systems we need to access later
    evolutionSystemRef.current = evolutionSystem;
    renderSystemRef.current = renderSystem;
    foodSystemRef.current = foodSystem;
    
    // Add systems to world in specific order for proper processing
    world.addSystem(stateSystem)         // First determine joint states
         .addSystem(jointConnectionSystem) // Then handle joint connections
         .addSystem(physicsSystem)       // Then apply physics forces
         .addSystem(foodSystem)          // Then check for food consumption
         .addSystem(renderSystem);       // Finally render everything
    
    // Initialize the first generation
    evolutionSystem.initializeGeneration();
    
    let animationFrameId;
    let lastTime = performance.now();
    let generationStartTime = performance.now() / 1000; // Track actual generation start time
    let frameCount = 0;
    let generationEndCounter = 0; // Counter for generations that seem stuck
    let totalFoodEaten = 0; // Track total food eaten in this generation
    let minimapUpdateTimer = 0; // Timer for minimap updates
    
    // Clear any existing timeout for generation
    if (generationTimeoutRef.current) {
      clearTimeout(generationTimeoutRef.current);
    }
    
    // Main simulation loop
    const simulate = (currentTime) => {
      // Calculate delta time
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 0.1s to prevent huge jumps
      lastTime = currentTime;
      
      // Check if we need to restart simulation
      if (needsRestart) {
        // Update evolution system parameters
        evolutionSystem.setParams(foodAmountRef.current, populationRef.current, mutationRateRef.current);
        evolutionSystem.initializeGeneration();
        generationStartTime = performance.now() / 1000;
        frameCount = 0;
        generationEndCounter = 0;
        totalFoodEaten = 0;
        setGeneration(0);
        setStats({
          bestFitness: 0,
          averageFitness: 0,
          minJoints: 0,
          maxJoints: 0,
          avgJoints: 0
        });
        setNeedsRestart(false);
        
        // Update minimap immediately after restart
        updateEntityPositions();
      }
      
      // Replenish food at a rate proportional to population size
      // This helps ensure there's always available food for larger populations
      const foodEntities = world.getEntitiesWithComponent('FoodComponent');
      const foodThreshold = Math.max(foodAmountRef.current * 0.7, populationRef.current * 1.5);
      
      if (foodEntities.length < foodThreshold) {
        // Replenish more food for larger populations and less food when enough exists
        const replenishAmount = Math.min(
          Math.max(1, Math.floor(populationRef.current * 0.2)), 
          Math.floor(foodAmountRef.current * 0.05)
        );
        evolutionSystem.replenishFood(replenishAmount);
      }
      
      // Update world with current simulation speed
      const updatedSpeed = speedRef.current * deltaTime;
      world.update(updatedSpeed);
      
      // Increment frame counter
      frameCount++;
      
      // Track food eaten this frame
      totalFoodEaten += foodSystemRef.current.foodsEaten;
      
      // Count frames where nothing happens (no food eaten)
      if (foodSystemRef.current.foodsEaten === 0 && frameCount > 500) {
        generationEndCounter++;
      } else if (foodSystemRef.current.foodsEaten > 0) {
        generationEndCounter = 0; // Reset counter if food was eaten
      }
      
      // Update minimap positions at a reduced rate (every 10 frames)
      minimapUpdateTimer += deltaTime;
      if (minimapUpdateTimer >= 0.2) { // Update every 0.2 seconds
        updateEntityPositions();
        minimapUpdateTimer = 0;
      }
      
      // Check for generation end conditions - use actual elapsed time
      const currentRealTime = performance.now() / 1000;
      const elapsedRealTime = currentRealTime - generationStartTime;
      
      let shouldEndGeneration = 
        elapsedRealTime >= GENERATION_TIME || // Time-based termination
        foodEntities.length === 0 ||          // All food consumed
        totalFoodEaten >= foodAmountRef.current * 1.5 || // Enough food eaten
        frameCount >= 200000 ||               // Extremely high frame count
        generationEndCounter >= 1000;         // Stuck with no progress
        
      if (shouldEndGeneration) {
        const nextGenStats = evolutionSystemRef.current.createNextGeneration();
        setStats(nextGenStats);
        setGeneration(prev => prev + 1);
        generationStartTime = performance.now() / 1000;
        frameCount = 0;
        generationEndCounter = 0;
        totalFoodEaten = 0;
        
        // Update minimap after generation change
        updateEntityPositions();
      }
      
      // Set a backup timeout to ensure generation doesn't run indefinitely
      // This is a safety mechanism in case the animation frame gets stuck
      clearTimeout(generationTimeoutRef.current);
      generationTimeoutRef.current = setTimeout(() => {
        if (elapsedRealTime >= GENERATION_TIME * 1.5) {
          const nextGenStats = evolutionSystemRef.current.createNextGeneration();
          setStats(nextGenStats);
          setGeneration(prev => prev + 1);
          generationStartTime = performance.now() / 1000;
          frameCount = 0;
          generationEndCounter = 0;
          totalFoodEaten = 0;
          
          // Update minimap after generation change
          updateEntityPositions();
        }
      }, GENERATION_TIME * 1000);
      
      // Loop animation if running
      if (isRunning) {
        animationFrameId = requestAnimationFrame(simulate);
      }
    };
    
    // Start the simulation loop
    if (isRunning) {
      animationFrameId = requestAnimationFrame(simulate);
    }
    
    // Initial entity positions update
    updateEntityPositions();
    
    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    };
  }, [isRunning, needsRestart]);
  
  /**
   * Toggle the simulation on/off
   */
  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };
  
  /**
   * Restart the simulation with current settings
   */
  const restartSimulation = () => {
    setNeedsRestart(true);
  };
  
  return {
    // State
    isRunning,
    generation,
    population,
    foodAmount,
    mutationRate,
    speed,
    stats,
    
    // Entity positions for minimap
    organismPositions,
    foodPositions,
    
    // Setters
    setPopulation,
    setFoodAmount,
    setMutationRate,
    setSpeed,
    
    // Actions
    toggleSimulation,
    restartSimulation
  };
}

export default useECSSimulation;