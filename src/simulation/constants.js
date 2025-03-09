/**
 * Simulation constants and settings
 * Simplified for deterministic behavior
 */

// Canvas dimensions
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;

// Simulation settings
export const GENERATION_TIME = 2500; // Simulation steps before new generation (increased to allow more movement)
export const INITIAL_POPULATION = 20;
export const INITIAL_FOOD_AMOUNT = 50;
export const DEFAULT_MUTATION_RATE = 0.1;
export const DEFAULT_SIMULATION_SPEED = 1;

// Organism settings
export const MIN_JOINT_COUNT = 3;
export const MAX_JOINT_COUNT = 8;
export const DEFAULT_JOINT_COUNT = 5;
export const JOINT_RADIUS = 5;
export const JOINT_REST_LENGTH = 30;
export const JOINT_STIFFNESS = 1.2;  // Increased stiffness of limb springs for more effective movement
export const JOINT_DAMPING = 0.98;   // Damping of joint movement

// Food settings
export const FOOD_RADIUS = 4;
export const EATING_DISTANCE = 15;
export const FOOD_VALUE = 10;

// UI settings
export const MIN_POPULATION = 5;
export const MAX_POPULATION = 50;
export const MIN_FOOD_AMOUNT = 10;
export const MAX_FOOD_AMOUNT = 100;
export const MIN_MUTATION_RATE = 0.01;
export const MAX_MUTATION_RATE = 0.5;
export const MIN_SIMULATION_SPEED = 0.5;
export const MAX_SIMULATION_SPEED = 3;