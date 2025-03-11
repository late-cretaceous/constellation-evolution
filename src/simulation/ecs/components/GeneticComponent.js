// src/simulation/ecs/components/GeneticComponent.js
import { Component } from '../Component';

/**
 * Component that stores the genetic information of an organism
 * Enhanced with more expressive genetic parameters
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
   * @param {number} rate - Mutation rate
   * @returns {GeneticComponent} - A new genetic component with mutations
   */
  mutate(rate) {
    // Clone patterns
    const newJointPatterns = this.jointPatterns.map(pattern => [...pattern]);
    const newLimbPatterns = this.limbPatterns.map(pattern => [...pattern]);
    
    // Mutation strategies for patterns
    const patternStrategy = Math.random();
    
    if (patternStrategy < 0.7) {
      // Standard mutation: bit flips and small changes
      this.standardPatternMutation(newJointPatterns, rate);
      this.standardPatternMutation(newLimbPatterns, rate);
    }
    else if (patternStrategy < 0.85) {
      // Pattern reversal: chance to reverse an entire pattern
      this.reversalPatternMutation(newJointPatterns, rate);
      this.standardPatternMutation(newLimbPatterns, rate);
    }
    else {
      // Pattern crossover: shuffle segments between patterns
      this.crossoverPatternMutation(newJointPatterns, rate);
      this.standardPatternMutation(newLimbPatterns, rate);
    }
    
    // Mutate continuous parameters
    let newPatternSpeed = this.patternSpeed + (Math.random() * 2 - 1) * rate * 2.0;
    newPatternSpeed = Math.max(0.2, Math.min(4.0, newPatternSpeed)); // Clamp between 0.2-4.0
    
    let newBodyPlanSeed = this.bodyPlanSeed + (Math.random() * 2 - 1) * rate * 0.3;
    newBodyPlanSeed = Math.max(0, Math.min(1, newBodyPlanSeed)); // Clamp between 0-1
    
    let newMorphologyFactor = this.morphologyFactor + (Math.random() * 2 - 1) * rate * 0.3;
    newMorphologyFactor = Math.max(0, Math.min(1, newMorphologyFactor));
    
    let newSymmetryFactor = this.symmetryFactor + (Math.random() * 2 - 1) * rate * 0.3;
    newSymmetryFactor = Math.max(0, Math.min(1, newSymmetryFactor));
    
    let newPhaseFactor = this.phaseFactor + (Math.random() * 2 - 1) * rate * 0.3;
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
   * Standard mutation: flip bits and adjust pattern length
   * @private
   */
  standardPatternMutation(patterns, rate) {
    for (let i = 0; i < patterns.length; i++) {
      // Bit flip mutations
      for (let j = 0; j < patterns[i].length; j++) {
        // Chance to flip a bit
        if (Math.random() < rate) {
          patterns[i][j] = 1 - patterns[i][j]; // Flip 0->1 or 1->0
        }
      }
      
      // Pattern length mutations
      if (Math.random() < rate * 0.5) {
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
   * Reversal mutation: reverse an entire pattern
   * @private
   */
  reversalPatternMutation(patterns, rate) {
    for (let i = 0; i < patterns.length; i++) {
      // Chance to reverse the entire pattern
      if (Math.random() < rate * 0.7) {
        patterns[i].reverse();
      } else {
        // Otherwise do standard mutation
        this.standardPatternMutation([patterns[i]], rate);
      }
    }
  }
  
  /**
   * Crossover mutation: shuffle segments between patterns
   * @private
   */
  crossoverPatternMutation(patterns, rate) {
    if (patterns.length < 2) {
      this.standardPatternMutation(patterns, rate);
      return;
    }
    
    // Select two random patterns to cross
    const index1 = Math.floor(Math.random() * patterns.length);
    let index2 = Math.floor(Math.random() * patterns.length);
    while (index2 === index1) {
      index2 = Math.floor(Math.random() * patterns.length);
    }
    
    // Only do crossover with some probability
    if (Math.random() < rate * 2) {
      // Select crossover points
      const pattern1 = patterns[index1];
      const pattern2 = patterns[index2];
      
      const crossPoint1 = Math.floor(Math.random() * pattern1.length);
      const crossPoint2 = Math.floor(Math.random() * pattern2.length);
      
      // Create new patterns after crossover
      const newPattern1 = [
        ...pattern1.slice(0, crossPoint1),
        ...pattern2.slice(crossPoint2)
      ];
      
      const newPattern2 = [
        ...pattern2.slice(0, crossPoint2),
        ...pattern1.slice(crossPoint1)
      ];
      
      // Replace with crossed patterns
      patterns[index1] = newPattern1;
      patterns[index2] = newPattern2;
    } else {
      // Otherwise do standard mutation
      this.standardPatternMutation(patterns, rate);
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