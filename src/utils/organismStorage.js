// src/utils/organismStorage.js
/**
 * Utilities for saving and loading organisms from local storage
 */

// Storage key for organism library
const STORAGE_KEY = 'evolution-simulator-organisms';

/**
 * Generate a unique ID for an organism
 * @returns {string} A unique ID
 */
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

/**
 * Save an organism to the library
 * 
 * @param {Object} organismData - The organism data to save
 * @param {string} name - Name for the organism
 * @param {string} notes - Optional notes about the organism
 * @returns {Object} - The saved organism with metadata
 */
export const saveOrganismToLibrary = async (organismData, name, notes = '') => {
  try {
    // Generate a unique ID for this organism
    const id = generateUniqueId();
    
    // Create organism record with metadata
    const organism = {
      id,
      name: name || `Organism ${id.substr(0, 5)}`,
      data: organismData,
      notes: notes || '',
      savedAt: Date.now(),
      generation: organismData.generation || 0
    };
    
    // Load existing organisms
    const organisms = await loadOrganismsFromLibrary();
    
    // Add new organism
    organisms.push(organism);
    
    // Save back to storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(organisms));
    
    return organism;
  } catch (error) {
    console.error('Failed to save organism to library:', error);
    return null;
  }
};

/**
 * Load all organisms from the library
 * 
 * @returns {Array} - Array of organism objects
 */
export const loadOrganismsFromLibrary = async () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const organisms = JSON.parse(data);
    
    // Ensure it's an array
    if (!Array.isArray(organisms)) return [];
    
    // Validate each organism and filter out invalid ones
    return organisms.filter(organism => {
      return (
        organism &&
        organism.id &&
        organism.data &&
        typeof organism.data === 'object'
      );
    });
  } catch (error) {
    console.error('Failed to load organisms from library:', error);
    return [];
  }
};

/**
 * Get a specific organism from the library by ID
 * 
 * @param {string} id - The organism ID
 * @returns {Object|null} - The organism or null if not found
 */
export const getOrganismFromLibrary = async (id) => {
  try {
    const organisms = await loadOrganismsFromLibrary();
    return organisms.find(organism => organism.id === id) || null;
  } catch (error) {
    console.error('Failed to get organism from library:', error);
    return null;
  }
};

/**
 * Update an existing organism in the library
 * 
 * @param {string} id - The organism ID
 * @param {Object} updates - The fields to update
 * @returns {boolean} - Success status
 */
export const updateOrganismInLibrary = async (id, updates) => {
  try {
    const organisms = await loadOrganismsFromLibrary();
    const index = organisms.findIndex(organism => organism.id === id);
    
    if (index === -1) return false;
    
    // Update fields
    organisms[index] = {
      ...organisms[index],
      ...updates,
      // Don't overwrite these fields
      id: organisms[index].id,
      data: updates.data || organisms[index].data,
      savedAt: updates.savedAt || organisms[index].savedAt
    };
    
    // Save back to storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(organisms));
    
    return true;
  } catch (error) {
    console.error('Failed to update organism in library:', error);
    return false;
  }
};

/**
 * Delete an organism from the library
 * 
 * @param {string} id - The organism ID to delete
 * @returns {boolean} - Success status
 */
export const deleteOrganismFromLibrary = async (id) => {
  try {
    const organisms = await loadOrganismsFromLibrary();
    const filteredOrganisms = organisms.filter(organism => organism.id !== id);
    
    // Save back to storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredOrganisms));
    
    return true;
  } catch (error) {
    console.error('Failed to delete organism from library:', error);
    return false;
  }
};

/**
 * Check if the library has any saved organisms
 * 
 * @returns {boolean} - True if there are saved organisms
 */
export const hasOrganismsInLibrary = async () => {
  try {
    const organisms = await loadOrganismsFromLibrary();
    return organisms.length > 0;
  } catch (error) {
    console.error('Failed to check if library has organisms:', error);
    return false;
  }
};

/**
 * Clear all organisms from the library
 * 
 * @returns {boolean} - Success status
 */
export const clearOrganismLibrary = async () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear organism library:', error);
    return false;
  }
};
