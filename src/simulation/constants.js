/**
 * Simulation constants and settings
 * Updated for more effective evolution and larger simulation area
 */

// Canvas dimensions
export const CANVAS_WIDTH = 1600;  // Doubled from 800
export const CANVAS_HEIGHT = 1000; // Doubled from 500

// Viewport settings
export const DEFAULT_SCALE = 1.0;  // Initial zoom level
export const MIN_SCALE = 0.5;      // Minimum zoom level
export const MAX_SCALE = 2.0;      // Maximum zoom level

// Simulation settings
export const GENERATION_TIME = 120; // Increased from 45 to 120 seconds for better evolution
export const INITIAL_POPULATION = 40; // Increased for larger area
export const INITIAL_FOOD_AMOUNT = 100; // Increased for larger area
export const DEFAULT_MUTATION_RATE = 0.1;
export const DEFAULT_SIMULATION_SPEED = 1;

// Organism settings
export const MIN_JOINT_COUNT = 3;
export const MAX_JOINT_COUNT = 10; // Increased from 8 to 10 for more variation
export const DEFAULT_JOINT_COUNT = 5;
export const JOINT_RADIUS = 5;
export const JOINT_REST_LENGTH = 30;
export const JOINT_STIFFNESS = 2.5;  // Reduced from 3.0 for more controlled movement
export const JOINT_DAMPING = 0.97;   // Increased from 0.96 for more stable movement

// Food settings
export const FOOD_RADIUS = 4;
export const EATING_DISTANCE = 20; // Increased from 18 for easier food consumption
export const FOOD_VALUE = 15;      // Increased from 10 for faster fitness growth

// UI settings
export const MIN_POPULATION = 10;
export const MAX_POPULATION = 100; // Increased for larger area
export const MIN_FOOD_AMOUNT = 20;
export const MAX_FOOD_AMOUNT = 200; // Increased for larger area
export const MIN_MUTATION_RATE = 0.01;
export const MAX_MUTATION_RATE = 0.5;
export const MIN_SIMULATION_SPEED = 0.5;
export const MAX_SIMULATION_SPEED = 3;