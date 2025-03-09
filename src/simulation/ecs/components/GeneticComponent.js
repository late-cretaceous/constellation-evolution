// src/simulation/ecs/components/GeneticComponent.js
import { Component } from '../Component';

/**
 * Component that stores the genetic information of an organism
 * Simplified to represent binary states and patterns
 */
export class GeneticComponent extends Component {
  /**
   * Create a new genetic component with simple pattern-based parameters
   * @param {Object} params - Genetic parameters
   * @param {Array} params.jointPatterns - Patterns for joint states (0=down, 1=up)
   * @param {Array} params.limbPatterns - Patterns for limb states (0=contract, 1=extend)
   * @param {number} params.patternSpeed - Speed of pattern cycling
   * @param {number} params.bodyPlanSeed - Seed for generating body plan
   */
  constructor(params = null) {
    super();
    
    if (params) {
      this.jointPatterns = params.jointPatterns;
      this.limbPatterns = params.limbPatterns;
      this.patternSpeed = params.patternSpeed;
      this.bodyPlanSeed = params.bodyPlanSeed;
    } else {
      // Default: Create random patterns
      this.jointPatterns = this.createRandomPatterns(3);  // 3 different joint patterns
      this.limbPatterns = this.createRandomPatterns(2);   // 2 different limb patterns
      this.patternSpeed = 0.5 + Math.random();           // Pattern cycling speed
      this.bodyPlanSeed = Math.random();                 // Seed for body plan generation
    }
  }

  /**
   * Create random binary patterns for states
   * @param {number} count - Number of patterns to create
   * @returns {Array} - Array of binary pattern arrays
   */
  createRandomPatterns(count) {
    const patterns = [];
    
    for (let i = 0; i < count; i++) {
      // Create pattern of length 8-16 steps
      const patternLength = 8 + Math.floor(Math.random() * 9);
      const pattern = [];
      
      for (let j = 0; j < patternLength; j++) {
        // Binary state: 0 or 1
        pattern.push(Math.random() < 0.5 ? 0 : 1);
      }
      
      patterns.push(pattern);
    }
    
    return patterns;
  }

  /**
   * Create a mutated copy with small changes to patterns
   * @param {number} rate - Mutation rate
   * @returns {GeneticComponent} - A new genetic component with mutations
   */
  mutate(rate) {
    // Clone patterns
    const newJointPatterns = this.jointPatterns.map(pattern => [...pattern]);
    const newLimbPatterns = this.limbPatterns.map(pattern => [...pattern]);
    
    // Mutate joint patterns
    for (let i = 0; i < newJointPatterns.length; i++) {
      for (let j = 0; j < newJointPatterns[i].length; j++) {
        // Chance to flip a bit
        if (Math.random() < rate) {
          newJointPatterns[i][j] = 1 - newJointPatterns[i][j]; // Flip 0->1 or 1->0
        }
      }
      
      // Small chance to add/remove a step in the pattern
      if (Math.random() < rate * 0.5) {
        if (Math.random() < 0.5 && newJointPatterns[i].length > 4) {
          // Remove a random step
          const removeIndex = Math.floor(Math.random() * newJointPatterns[i].length);
          newJointPatterns[i].splice(removeIndex, 1);
        } else {
          // Add a random step
          const addIndex = Math.floor(Math.random() * newJointPatterns[i].length);
          const newValue = Math.random() < 0.5 ? 0 : 1;
          newJointPatterns[i].splice(addIndex, 0, newValue);
        }
      }
    }
    
    // Mutate limb patterns (same as joint patterns)
    for (let i = 0; i < newLimbPatterns.length; i++) {
      for (let j = 0; j < newLimbPatterns[i].length; j++) {
        if (Math.random() < rate) {
          newLimbPatterns[i][j] = 1 - newLimbPatterns[i][j];
        }
      }
      
      if (Math.random() < rate * 0.5) {
        if (Math.random() < 0.5 && newLimbPatterns[i].length > 4) {
          const removeIndex = Math.floor(Math.random() * newLimbPatterns[i].length);
          newLimbPatterns[i].splice(removeIndex, 1);
        } else {
          const addIndex = Math.floor(Math.random() * newLimbPatterns[i].length);
          const newValue = Math.random() < 0.5 ? 0 : 1;
          newLimbPatterns[i].splice(addIndex, 0, newValue);
        }
      }
    }
    
    // Mutate pattern speed
    let newPatternSpeed = this.patternSpeed + (Math.random() * 2 - 1) * rate;
    newPatternSpeed = Math.max(0.2, Math.min(2.0, newPatternSpeed)); // Clamp between 0.2-2.0
    
    // Mutate body plan seed (small changes)
    let newBodyPlanSeed = this.bodyPlanSeed + (Math.random() * 2 - 1) * rate * 0.2;
    newBodyPlanSeed = Math.max(0, Math.min(1, newBodyPlanSeed)); // Clamp between 0-1
    
    // Create new component with mutated values
    return new GeneticComponent({
      jointPatterns: newJointPatterns,
      limbPatterns: newLimbPatterns,
      patternSpeed: newPatternSpeed,
      bodyPlanSeed: newBodyPlanSeed
    });
  }
  
  /**
   * Get a joint state based on the pattern and current time
   * @param {number} jointIndex - Index of the joint
   * @param {number} simulationTime - Current simulation time
   * @returns {number} - Joint state (0=down, 1=up)
   */
  getJointState(jointIndex, simulationTime) {
    // Select a pattern based on joint index
    const patternIndex = jointIndex % this.jointPatterns.length;
    const pattern = this.jointPatterns[patternIndex];
    
    // Calculate position in pattern based on time and speed
    const position = Math.floor(simulationTime * this.patternSpeed * 2) % pattern.length;
    
    return pattern[position];
  }
  
  /**
   * Get a limb state based on the pattern and current time
   * @param {number} limbIndex - Index of the limb
   * @param {number} simulationTime - Current simulation time
   * @returns {number} - Limb state (0=contract, 1=extend)
   */
  getLimbState(limbIndex, simulationTime) {
    // Select a pattern based on limb index
    const patternIndex = limbIndex % this.limbPatterns.length;
    const pattern = this.limbPatterns[patternIndex];
    
    // Calculate position in pattern based on time and speed
    const position = Math.floor(simulationTime * this.patternSpeed * 2) % pattern.length;
    
    return pattern[position];
  }
}

export default GeneticComponent;