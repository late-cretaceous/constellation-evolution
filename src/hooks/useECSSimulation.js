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
  
  // Refs to hold current values without triggering re-renders
  const populationRef = useRef(population);
  const foodAmountRef = useRef(foodAmount);
  const mutationRateRef = useRef(mutationRate);
  const speedRef = useRef(speed);
  const worldRef = useRef(null);
  const evolutionSystemRef = useRef(null);
  const renderSystemRef = useRef(null);
  const foodSystemRef = useRef(null);
  
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
        setGeneration(0);
        setStats({
          bestFitness: 0,
          averageFitness: 0,
          minJoints: 0,
          maxJoints: 0,
          avgJoints: 0
        });
        setNeedsRestart(false);
      }
      
      // Always replenish some food to keep the simulation moving
      const foodEntities = world.getEntitiesWithComponent('FoodComponent');
      if (foodEntities.length < foodAmountRef.current * 0.8) {
        evolutionSystem.replenishFood(Math.max(1, Math.floor(foodAmountRef.current * 0.1)));
      }
      
      // Update world with current simulation speed
      const updatedSpeed = speedRef.current * deltaTime;
      world.update(updatedSpeed);
      
      // Increment frame counter
      frameCount++;
      
      // Count frames where nothing happens (no food eaten)
      if (foodSystemRef.current.foodsEaten === 0 && frameCount > 500) {
        generationEndCounter++;
      } else {
        generationEndCounter = 0; // Reset counter if food was eaten
      }
      
      // Check for generation end conditions - use actual elapsed time
      const currentRealTime = performance.now() / 1000;
      const elapsedRealTime = currentRealTime - generationStartTime;
      
      let shouldEndGeneration = 
        elapsedRealTime >= GENERATION_TIME || // Use constant for generation duration in seconds
        foodEntities.length === 0 || 
        frameCount >= 100000 ||  // Extremely high to avoid frame-based termination
        generationEndCounter >= 1000; // Only used when stuck with no progress
        
      if (shouldEndGeneration) {
        const nextGenStats = evolutionSystem.createNextGeneration();
        setStats(nextGenStats);
        setGeneration(prev => prev + 1);
        generationStartTime = performance.now() / 1000;
        frameCount = 0;
        generationEndCounter = 0;
      }
      
      // Loop animation if running
      if (isRunning) {
        animationFrameId = requestAnimationFrame(simulate);
      }
    };
    
    // Start the simulation loop
    if (isRunning) {
      animationFrameId = requestAnimationFrame(simulate);
    }
    
    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
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