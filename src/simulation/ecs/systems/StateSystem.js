// src/simulation/ecs/systems/StateSystem.js
import { System } from '../System';
import { JointComponent } from '../components/JointComponent';
import { OrganismComponent } from '../components/OrganismComponent';
import { PositionComponent } from '../components/PositionComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { GeneticComponent } from '../components/GeneticComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { FoodComponent } from '../components/FoodComponent';
import { Vector2 } from '../utils/Vector2';

/**
 * System that determines joint states with extreme randomness
 * Creates wildly unpredictable behavior patterns
 */
export class StateSystem extends System {
  /**
   * Create a new state system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    this.stateChangeTimer = {}; // Track timers for state changes by joint ID
    this.simulationTime = 0;
    this.organismBehaviorModes = new Map(); // Individual behavior mode per organism
  }

  /**
   * Update states of joints with extreme randomness
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Update simulation time
    this.simulationTime += deltaTime;
    
    // Get all joint entities
    const jointEntities = this.world.getEntitiesWithComponent(JointComponent);
    
    // Get all food entities
    const foodEntities = this.world.getEntitiesWithComponent(FoodComponent);
    
    // Get all organisms and update their individual behavior modes
    const organismEntities = this.world.getEntitiesWithComponent(OrganismComponent);
    for (const organismEntity of organismEntities) {
      // Initialize or update organism behavior mode
      if (!this.organismBehaviorModes.has(organismEntity.id)) {
        this.organismBehaviorModes.set(organismEntity.id, {
          mode: Math.floor(Math.random() * 5), // 5 behavior modes
          timer: Math.random() * 3.0, // Random initial timer
          // Offset based on ID to prevent synchronization
          offset: (organismEntity.id % 20) * 0.1
        });
      }
      
      // Update behavior mode timer
      const behaviorData = this.organismBehaviorModes.get(organismEntity.id);
      behaviorData.timer -= deltaTime;
      
      // Change behavior mode when timer expires
      if (behaviorData.timer <= 0) {
        // Set a new random behavior mode
        behaviorData.mode = Math.floor(Math.random() * 5);
        // Set a new random timer with offset to prevent synchronization
        behaviorData.timer = 1.0 + Math.random() * 3.0 + behaviorData.offset;
      }
    }
    
    // For each joint, determine state based on its organism's behavior mode
    for (const jointEntity of jointEntities) {
      const joint = jointEntity.getComponent(JointComponent);
      
      // Skip joints that are in a timer state change
      if (this.stateChangeTimer[jointEntity.id]) continue;
      
      const position = jointEntity.getComponent(PositionComponent);
      const velocity = jointEntity.hasComponent(VelocityComponent) ? 
                     jointEntity.getComponent(VelocityComponent) : null;
      
      // Get the organism this joint belongs to
      const organismEntity = this.world.getEntity(joint.organismId);
      if (!organismEntity) continue;
      
      const genetics = organismEntity.getComponent(GeneticComponent);
      
      // Get this organism's behavior mode
      const behaviorData = this.organismBehaviorModes.get(organismEntity.id);
      const behaviorMode = behaviorData ? behaviorData.mode : 0;
      
      // Find the closest food - basic sensing capability
      let closestFoodDistance = Number.MAX_VALUE;
      let closestFoodPosition = null;
      
      for (const foodEntity of foodEntities) {
        const foodPosition = foodEntity.getComponent(PositionComponent);
        const distance = position.position.distanceTo(foodPosition.position);
        
        // Much larger sensor range - up to 3x genetic parameter
        const effectiveSensorDistance = genetics.sensorDistance * (1 + Math.random() * 2);
        
        if (distance < effectiveSensorDistance && distance < closestFoodDistance) {
          closestFoodDistance = distance;
          closestFoodPosition = foodPosition.position;
        }
      }
      
      // Apply organism's individual behavior mode patterns
      let shouldAnchor = false;
      let forceMultiplier = 1.0;
      let stateDuration = 50 + Math.random() * 150; // Very short duration: 50-200ms
      
      // Add uniqueness to each joint within organism by using joint ID
      const jointUniquenessFactor = 0.5 + (jointEntity.id % 10) * 0.05;
      
      switch (behaviorMode) {
        case 0: // Extreme chaos - highly random with no pattern
          // Vary behavior slightly per joint within organism
          shouldAnchor = Math.random() < 0.3 * jointUniquenessFactor; // Varied chance to anchor
          forceMultiplier = (1 + Math.random() * 9) * jointUniquenessFactor; // Varied force
          stateDuration = (10 + Math.random() * 90) * jointUniquenessFactor; // Varied duration
          break;
          
        case 1: // Frenetic movement - almost no anchoring, high force
          // Vary behavior by joint ID to prevent synchronization
          shouldAnchor = Math.random() < 0.1 * jointUniquenessFactor;
          forceMultiplier = (3 + Math.random() * 7) * jointUniquenessFactor;
          stateDuration = (30 + Math.random() * 70) * jointUniquenessFactor;
          break;
          
        case 2: // Staccato - rapid anchor/unanchor cycling
          // Vary by joint within organism
          shouldAnchor = Math.random() < 0.5 * jointUniquenessFactor;
          forceMultiplier = (2 + Math.random() * 5) * jointUniquenessFactor;
          // Add unique timing based on joint ID
          stateDuration = (10 + Math.random() * 40) * (0.8 + (jointEntity.id % 5) * 0.1);
          break;
          
        case 3: // Reactivity to food
          if (closestFoodPosition) {
            // React to food with varied behavior per joint
            shouldAnchor = Math.random() < 0.2 * jointUniquenessFactor;
            forceMultiplier = (5 + Math.random() * 10) * jointUniquenessFactor;
            // Unique duration per joint
            stateDuration = (20 + Math.random() * 80) * (0.7 + (jointEntity.id % 10) * 0.05);
          } else {
            // No food - mostly anchor, but varied per joint
            shouldAnchor = Math.random() < 0.7 * jointUniquenessFactor;
            forceMultiplier = (1 + Math.random() * 3) * jointUniquenessFactor;
            stateDuration = (50 + Math.random() * 150) * (0.8 + (jointEntity.id % 5) * 0.1);
          }
          break;
          
        case 4: // Spastic behavior - alternating behavior
          // Individual behavior per joint
          shouldAnchor = Math.random() < 0.4 * jointUniquenessFactor;
          // Different force ranges for different joints
          if (jointEntity.id % 3 === 0) {
            forceMultiplier = (1 + Math.random() * 3) * jointUniquenessFactor;
          } else if (jointEntity.id % 3 === 1) {
            forceMultiplier = (3 + Math.random() * 5) * jointUniquenessFactor;
          } else {
            forceMultiplier = (7 + Math.random() * 8) * jointUniquenessFactor;
          }
          // Unique duration based on joint ID
          stateDuration = (5 + Math.random() * 45) * (0.7 + (jointEntity.id % 20) * 0.02);
          break;
          
        default:
          // Default behavior if mode is invalid
          shouldAnchor = Math.random() < 0.5;
          forceMultiplier = 1.0;
          stateDuration = 50 + Math.random() * 100;
          break;
      }
      
      // Individual duration based on joint ID to prevent synchronization
      stateDuration *= (0.8 + (jointEntity.id % 15) * 0.03);
      
      // Add additional randomization in timing
      if (Math.random() < 0.3) {
        stateDuration *= 0.5 + Math.random(); // 50-150% of original duration
      }
      
      // Apply random force if we have physics
      if (jointEntity.hasComponent(PhysicsComponent) && !shouldAnchor) {
        const physics = jointEntity.getComponent(PhysicsComponent);
        
        // Direction choice highly randomized
        let moveDirection;
        
        if (closestFoodPosition && Math.random() < 0.5) {
          // Direction to/from food
          const directionToFood = closestFoodPosition.subtract(position.position).normalize();
          
          // 50% chance to move toward food, 50% chance to flee
          if (Math.random() < 0.5) {
            moveDirection = directionToFood;
          } else {
            moveDirection = directionToFood.multiply(-1);
          }
        } else {
          // Completely random direction
          moveDirection = new Vector2(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
          ).normalize();
        }
        
        // Apply force with random magnitude but more reasonable limits
        let forceMagnitude;
        const randValue = Math.random();
        
        if (randValue < 0.6) {
          // 60% chance: moderate force
          forceMagnitude = Math.random() * 10 * forceMultiplier;
        } else if (randValue < 0.9) {
          // 30% chance: large force
          forceMagnitude = 10 + Math.random() * 20 * forceMultiplier;
        } else {
          // 10% chance: very strong force (but not extreme)
          forceMagnitude = 30 + Math.random() * 40 * forceMultiplier;
        }
        
        physics.force = physics.force.add(moveDirection.multiply(forceMagnitude));
        
        // Occasional instant velocity change (teleport effect)
        if (velocity && Math.random() < 0.05) { // 5% chance
          velocity.velocity = new Vector2(
            (Math.random() * 2 - 1) * 100,
            (Math.random() * 2 - 1) * 100
          );
        }
      }
      
      // Change state
      this.temporaryStateChange(jointEntity, shouldAnchor, stateDuration);
    }
  }
  
  /**
   * Change a joint's state temporarily with extreme randomness
   * @param {Entity} jointEntity - The joint entity
   * @param {boolean} anchorState - Whether to anchor the joint
   * @param {number} duration - Duration of the state change in milliseconds
   */
  temporaryStateChange(jointEntity, anchorState, duration) {
    const joint = jointEntity.getComponent(JointComponent);
    
    // Much reduced chance to ignore the state change
    if (Math.random() < 0.05) { // 5% chance to ignore
      return;
    }
    
    // 10% chance to do the opposite of what was decided
    if (Math.random() < 0.1) {
      anchorState = !anchorState;
    }
    
    // Change the state
    joint.isAnchored = anchorState;
    
    // Set a timer to change back
    this.stateChangeTimer[jointEntity.id] = true;
    
    setTimeout(() => {
      if (this.world.getEntity(jointEntity.id)) {
        delete this.stateChangeTimer[jointEntity.id];
      }
    }, duration);
  }
}

export default StateSystem;