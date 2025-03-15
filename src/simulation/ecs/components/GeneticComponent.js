// src/simulation/ecs/components/GeneticComponent.js
import { Component } from '../Component';

/**
 * Component that stores the genetic information of an organism
 * Enhanced with more expressive genetic parameters and stronger mutations
 */
export class GeneticComponent extends Component {
  /**
   * Create a new genetic component with enhanced pattern-based parameters
   * @param {Object} params - Genetic parameters
   * @param {Array} params.jointPatterns - Patterns for joint states (0=down, 1=up)
   * @param {Array} params.limbPatterns - Patterns for limb states (0=contract, 1=extend)
   * @param {number} params.patternSpeed - Speed of pattern cycling
   * @param {number} params.bodyPlanSeed - Seed for generating body plan
   * @param {number} params.morphologyFactor - Influences the morphology of the organism
   * @param {number} params.symmetryFactor - Controls symmetry in body plan
   * @param {number} params.phaseFactor - Controls phase timing between different patterns
   */
  constructor(params = null) {
    super();
    
    if (params) {
      this.jointPatterns = params.jointPatterns;
      this.limbPatterns = params.limbPatterns;
      this.patternSpeed = params.patternSpeed;
      this.bodyPlanSeed = params.bodyPlanSeed;
      this.morphologyFactor = params.morphologyFactor;
      this.symmetryFactor = params.symmetryFactor;
      this.phaseFactor = params.phaseFactor;
    } else {
      // Default: Create random patterns with more variation
      this.jointPatterns = this.createRandomPatterns(3);  // 3 different joint patterns
      this.limbPatterns = this.createRandomPatterns(2);   // 2 different limb patterns
      this.patternSpeed = 0.2 + Math.random() * 3.8;     // Wide range of speeds (0.2-4.0)
      this.bodyPlanSeed = Math.random();                 // Seed for body plan generation
      this.morphologyFactor = Math.random();             // Influences overall morphology
      this.symmetryFactor = Math.random();               // Controls symmetry in body plan
      this.phaseFactor = Math.random();                  // Controls phase timing
    }
  }

  /**
   * Create random binary patterns for states with improved variation
   * @param {number} count - Number of patterns to create
   * @returns {Array} - Array of binary pattern arrays
   */
  createRandomPatterns(count) {
    const patterns = [];
    
    for (let i = 0; i < count; i++) {
      // Create pattern of length 8-20 steps for more variety
      const patternLength = 8 + Math.floor(Math.random() * 13);
      const pattern = [];
      
      // Pattern generation strategies
      const strategyType = Math.random();
      
      if (strategyType < 0.3) {
        // Random binary pattern
        for (let j = 0; j < patternLength; j++) {
          pattern.push(Math.random() < 0.5 ? 0 : 1);
        }
      }
      else if (strategyType < 0.6) {
        // Alternating pattern with occasional skips
        let currentValue = Math.random() < 0.5 ? 0 : 1;
        for (let j = 0; j < patternLength; j++) {
          pattern.push(currentValue);
          if (Math.random() < 0.8) { // 80% chance to alternate
            currentValue = 1 - currentValue;
          }
        }
      }
      else if (strategyType < 0.8) {
        // Grouped pattern (runs of the same value)
        let currentValue = Math.random() < 0.5 ? 0 : 1;
        let groupLength = 1 + Math.floor(Math.random() * 3);
        
        for (let j = 0; j < patternLength; j++) {
          pattern.push(currentValue);
          groupLength--;
          
          if (groupLength <= 0) {
            currentValue = 1 - currentValue;
            groupLength = 1 + Math.floor(Math.random() * 3);
          }
        }
      }
      else {
        // Wave pattern (mostly 1s in the middle, mostly 0s at the ends, or vice versa)
        const inverted = Math.random() < 0.5;
        for (let j = 0; j < patternLength; j++) {
          const position = j / patternLength;
          const threshold = 0.5 - Math.abs(position - 0.5);  // Peaks in the middle
          const value = Math.random() < threshold ? 1 : 0;
          pattern.push(inverted ? 1 - value : value);
        }
      }
      
      patterns.push(pattern);
    }
    
    return patterns;
  }

  /**
   * Create a mutated copy with enhanced mutation capability
   * Enhanced to create more significant changes between generations
   * @param {number} rate - Mutation rate
   * @returns {GeneticComponent} - A new genetic component with mutations
   */
  mutate(rate) {
    // Clone patterns
    const newJointPatterns = this.jointPatterns.map(pattern => [...pattern]);
    const newLimbPatterns = this.limbPatterns.map(pattern => [...pattern]);
    
    // Enhanced mutation approach with various strategies
    const mutationStrategy = Math.random();
    
    // Normal bit-flip mutations (70% probability)
    if (mutationStrategy < 0.70) {
      this.applyBitFlipMutations(newJointPatterns, rate * 1.5); // Increased mutation magnitude
      this.applyBitFlipMutations(newLimbPatterns, rate * 1.5);
    }
    // Pattern reversal (10% probability)
    else if (mutationStrategy < 0.80) {
      this.applyPatternReversal(newJointPatterns, rate * 2);
      this.applyBitFlipMutations(newLimbPatterns, rate);
    }
    // Pattern shift (10% probability)
    else if (mutationStrategy < 0.90) {
      this.applyPatternShift(newJointPatterns, rate * 2);
      this.applyPatternShift(newLimbPatterns, rate * 2);
    }
    // Complete pattern replacement (10% probability)
    else {
      this.applyPatternReplacement(newJointPatterns, rate * 3);
      this.applyBitFlipMutations(newLimbPatterns, rate);
    }
    
    // Mutate continuous parameters with enhanced changes
    // Increased range of variation for more visible differences
    
    // For patternSpeed, use a more aggressive mutation approach
    let newPatternSpeed;
    if (Math.random() < rate * 2) {
      // Occasional large change (25% chance at baseline rate)
      newPatternSpeed = 0.2 + Math.random() * 3.8; // Complete re-roll
    } else {
      // Normal gradual change
      const change = (Math.random() * 2 - 1) * rate * 3.0; // Larger changes
      newPatternSpeed = this.patternSpeed + change;
    }
    // Ensure within bounds
    newPatternSpeed = Math.max(0.2, Math.min(4.0, newPatternSpeed));
    
    // For bodyPlanSeed, more significant changes to body plan
    let newBodyPlanSeed;
    if (Math.random() < rate * 1.5) {
      // Occasional complete re-roll (15% chance at baseline rate)
      newBodyPlanSeed = Math.random();
    } else {
      // Normal gradual change
      const change = (Math.random() * 2 - 1) * rate * 0.5; // Larger changes
      newBodyPlanSeed = this.bodyPlanSeed + change;
    }
    // Ensure within bounds
    newBodyPlanSeed = Math.max(0, Math.min(1, newBodyPlanSeed));
    
    // Similarly for other parameters, allow for more significant changes
    let newMorphologyFactor = this.morphologyFactor + (Math.random() * 2 - 1) * rate * 0.5;
    newMorphologyFactor = Math.max(0, Math.min(1, newMorphologyFactor));
    
    let newSymmetryFactor = this.symmetryFactor + (Math.random() * 2 - 1) * rate * 0.5;
    newSymmetryFactor = Math.max(0, Math.min(1, newSymmetryFactor));
    
    let newPhaseFactor = this.phaseFactor + (Math.random() * 2 - 1) * rate * 0.5;
    newPhaseFactor = Math.max(0, Math.min(1, newPhaseFactor));
    
    // Create new component with mutated values
    return new GeneticComponent({
      jointPatterns: newJointPatterns,
      limbPatterns: newLimbPatterns,
      patternSpeed: newPatternSpeed,
      bodyPlanSeed: newBodyPlanSeed,
      morphologyFactor: newMorphologyFactor,
      symmetryFactor: newSymmetryFactor,
      phaseFactor: newPhaseFactor
    });
  }
  
  /**
   * Apply bit-flip mutations to patterns
   * @private
   * @param {Array} patterns - Array of patterns to mutate
   * @param {number} rate - Mutation rate
   */
  applyBitFlipMutations(patterns, rate) {
    for (let i = 0; i < patterns.length; i++) {
      // Enhanced bit flip mutations with increased frequency
      for (let j = 0; j < patterns[i].length; j++) {
        // Increased chance to flip a bit
        if (Math.random() < rate * 1.2) {
          patterns[i][j] = 1 - patterns[i][j]; // Flip 0->1 or 1->0
        }
      }
      
      // More frequent length mutations
      if (Math.random() < rate * 0.8) {
        if (Math.random() < 0.5 && patterns[i].length > 4) {
          // Remove a random step
          const removeIndex = Math.floor(Math.random() * patterns[i].length);
          patterns[i].splice(removeIndex, 1);
        } else if (patterns[i].length < 24) {
          // Add a random step
          const addIndex = Math.floor(Math.random() * patterns[i].length);
          const newValue = Math.random() < 0.5 ? 0 : 1;
          patterns[i].splice(addIndex, 0, newValue);
        }
      }
    }
  }
  
  /**
   * Apply pattern reversal mutation
   * @private
   * @param {Array} patterns - Array of patterns to mutate
   * @param {number} rate - Mutation rate
   */
  applyPatternReversal(patterns, rate) {
    for (let i = 0; i < patterns.length; i++) {
      // Reverse entire pattern with higher probability
      if (Math.random() < rate) {
        patterns[i].reverse();
      } else {
        // Otherwise do standard bit-flip mutation
        this.applyBitFlipMutations([patterns[i]], rate);
      }
    }
  }
  
  /**
   * Apply pattern shift mutation (rotate pattern values)
   * @private
   * @param {Array} patterns - Array of patterns to mutate
   * @param {number} rate - Mutation rate
   */
  applyPatternShift(patterns, rate) {
    for (let i = 0; i < patterns.length; i++) {
      if (Math.random() < rate && patterns[i].length > 1) {
        // Determine amount to shift (1 to half the pattern length)
        const maxShift = Math.max(1, Math.floor(patterns[i].length / 2));
        const shiftAmount = 1 + Math.floor(Math.random() * maxShift);
        
        // Shift the pattern (rotate array)
        const shiftRight = Math.random() < 0.5;
        if (shiftRight) {
          for (let j = 0; j < shiftAmount; j++) {
            patterns[i].unshift(patterns[i].pop());
          }
        } else {
          for (let j = 0; j < shiftAmount; j++) {
            patterns[i].push(patterns[i].shift());
          }
        }
      } else {
        // Otherwise do standard bit-flip mutation
        this.applyBitFlipMutations([patterns[i]], rate * 0.5);
      }
    }
  }
  
  /**
   * Apply complete pattern replacement
   * @private
   * @param {Array} patterns - Array of patterns to mutate
   * @param {number} rate - Mutation rate
   */
  applyPatternReplacement(patterns, rate) {
    for (let i = 0; i < patterns.length; i++) {
      if (Math.random() < rate) {
        // Generate entirely new pattern
        const newPattern = this.createRandomPatterns(1)[0];
        patterns[i] = newPattern;
      } else {
        // Otherwise do standard bit-flip mutation with low rate
        this.applyBitFlipMutations([patterns[i]], rate * 0.3);
      }
    }
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
    
    // Apply phase offset based on joint index and phase factor
    const phaseOffset = this.phaseFactor * jointIndex * 0.2;
    
    // Calculate position in pattern based on time, speed, and phase
    const adjustedTime = simulationTime + phaseOffset;
    const position = Math.floor(adjustedTime * this.patternSpeed * 2) % pattern.length;
    
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
    
    // Apply phase offset based on limb index and phase factor
    const phaseOffset = this.phaseFactor * limbIndex * 0.2;
    
    // Calculate position in pattern based on time, speed, and phase
    const adjustedTime = simulationTime + phaseOffset;
    const position = Math.floor(adjustedTime * this.patternSpeed * 2) % pattern.length;
    
    return pattern[position];
  }
}

export default GeneticComponent;