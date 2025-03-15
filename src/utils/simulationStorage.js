// src/utils/simulationStorage.js
/**
 * Utilities for saving and loading simulation state
 */

const STORAGE_KEY = 'evolution-simulator-state';

/**
 * Save simulation state to localStorage
 * @param {Object} state - The simulation state to save
 */
export const saveSimulationState = (state) => {
  try {
    // Only save essential properties to reduce storage size
    const serializedState = JSON.stringify({
      timestamp: Date.now(),
      generation: state.generation,
      stats: state.stats,
      config: {
        population: state.population,
        foodAmount: state.foodAmount,
        mutationRate: state.mutationRate,
        speed: state.speed,
      }
      // We're intentionally not saving organism and food data to simplify
      // and reduce potential issues - we'll just recreate fresh organisms
    });
    
    localStorage.setItem(STORAGE_KEY, serializedState);
    return true;
  } catch (error) {
    console.error('Failed to save simulation state:', error);
    return false;
  }
};

/**
 * Load simulation state from localStorage with safety measures
 * @returns {Object|null} - The loaded simulation state or null if not found
 */
export const loadSimulationState = () => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (!serializedState) return null;
    
    const state = JSON.parse(serializedState);
    
    // Check if saved state is recent (within last 7 days)
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    if (!state.timestamp || now - state.timestamp > maxAge) {
      console.log('Saved state is too old, starting fresh');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    // Basic validation
    if (!state.config || typeof state.config !== 'object') {
      clearSimulationState();
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to load simulation state, clearing corrupted data:', error);
    clearSimulationState();
    return null;
  }
};

/**
 * Clear saved simulation state
 */
export const clearSimulationState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear simulation state:', error);
    return false;
  }
};

/**
 * Check if there is a saved simulation state
 * @returns {boolean}
 */
export const hasSavedState = () => {
  try {
    const state = localStorage.getItem(STORAGE_KEY);
    return !!state;
  } catch (error) {
    return false;
  }
};