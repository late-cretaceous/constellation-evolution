import { useState, useRef, useEffect } from 'react';
import Vector2 from '../simulation/models/Vector2';
import Organism from '../simulation/models/Organism';
import Food from '../simulation/models/Food';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GENERATION_TIME,
  INITIAL_POPULATION,
  INITIAL_FOOD_AMOUNT,
  DEFAULT_MUTATION_RATE,
  DEFAULT_SIMULATION_SPEED,
  MIN_JOINT_COUNT,
  MAX_JOINT_COUNT
} from '../simulation/constants';

/**
 * Custom hook to manage the evolution simulation
 * @param {React.RefObject} canvasRef - Reference to the canvas element
 * @returns {Object} - Simulation state and control functions
 */
export function useSimulation(canvasRef) {
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
    let animationFrameId;
    let organisms = [];
    let foods = [];
    let timer = 0;
    let simulationSpeed = speedRef.current;
    
    // Initialize organisms
    const initializeOrganisms = () => {
      const newOrganisms = [];
      for (let i = 0; i < populationRef.current; i++) {
        const pos = new Vector2(
          Math.random() * CANVAS_WIDTH,
          Math.random() * CANVAS_HEIGHT
        );
        // Randomize starting joint count between 3-7
        const jointCount = MIN_JOINT_COUNT + Math.floor(Math.random() * (MAX_JOINT_COUNT - MIN_JOINT_COUNT + 1));
        newOrganisms.push(new Organism(pos, jointCount));
      }
      return newOrganisms;
    };
    
    // Initialize food
    const initializeFood = () => {
      const newFoods = [];
      for (let i = 0; i < foodAmountRef.current; i++) {
        const pos = new Vector2(
          Math.random() * CANVAS_WIDTH,
          Math.random() * CANVAS_HEIGHT
        );
        newFoods.push(new Food(pos));
      }
      return newFoods;
    };
    
    // Create a new generation based on fitness
    const createNewGeneration = () => {
      // Sort by fitness
      organisms.sort((a, b) => b.fitness - a.fitness);
      
      // Calculate fitness stats
      const best = organisms[0].fitness;
      let sum = 0;
      for (const org of organisms) {
        sum += org.fitness;
      }
      const avg = sum / organisms.length;
      
      // Calculate joint count stats
      let minCount = Infinity;
      let maxCount = 0;
      let totalJoints = 0;
      
      for (const org of organisms) {
        const jointCount = org.joints.length;
        minCount = Math.min(minCount, jointCount);
        maxCount = Math.max(maxCount, jointCount);
        totalJoints += jointCount;
      }
      
      const avgCount = totalJoints / organisms.length;
      
      // Update stats
      setStats({
        bestFitness: best,
        averageFitness: avg.toFixed(1),
        minJoints: minCount,
        maxJoints: maxCount,
        avgJoints: avgCount.toFixed(1)
      });
      
      // Keep track of generation number
      setGeneration(prev => prev + 1);
      
      // Select top 50% to reproduce
      const survivors = organisms.slice(0, Math.floor(organisms.length / 2));
      
      // Create new generation with mutation
      const newGeneration = [];
      
      // Elite - copy the best organism directly
      newGeneration.push(organisms[0]);
      
      // Fill the rest with children of survivors
      while (newGeneration.length < populationRef.current) {
        const parent = survivors[Math.floor(Math.random() * survivors.length)];
        newGeneration.push(parent.reproduce(mutationRateRef.current));
      }
      
      return newGeneration;
    };
    
    // Main simulation loop
    const simulate = () => {
      // Clear canvas
      ctx.fillStyle = '#000033';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Check if we need to restart simulation
      if (needsRestart) {
        organisms = initializeOrganisms();
        foods = initializeFood();
        timer = 0;
        setNeedsRestart(false);
      }
      
      // Update food if needed
      if (foods.length < foodAmountRef.current / 2) {
        for (let i = 0; i < Math.floor(foodAmountRef.current / 10); i++) {
          const pos = new Vector2(
            Math.random() * CANVAS_WIDTH,
            Math.random() * CANVAS_HEIGHT
          );
          foods.push(new Food(pos));
        }
      }
      
      // Update and draw food
      for (const food of foods) {
        food.draw(ctx);
      }
      
      // Update simulation speed
      simulationSpeed = speedRef.current;
      
      // Update and draw organisms
      for (const organism of organisms) {
        organism.update(foods);
        organism.draw(ctx);
      }
      
      // Increment timer
      timer += simulationSpeed;
      
      // Check for generation end
      if (timer >= GENERATION_TIME || foods.length === 0) {
        organisms = createNewGeneration();
        foods = initializeFood();
        timer = 0;
      }
      
      // Loop animation if running
      if (isRunning) {
        animationFrameId = requestAnimationFrame(simulate);
      }
    };
    
    // Initialize simulation
    organisms = initializeOrganisms();
    foods = initializeFood();
    
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
    setGeneration(0);
    setStats({
      bestFitness: 0,
      averageFitness: 0,
      minJoints: 0,
      maxJoints: 0,
      avgJoints: 0
    });
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

export default useSimulation;
