// src/simulation/ecs/systems/StateSystem.js
import { System } from '../System';
import { JointComponent } from '../components/JointComponent';
import { OrganismComponent } from '../components/OrganismComponent';
import { PositionComponent } from '../components/PositionComponent';
import { GeneticComponent } from '../components/GeneticComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { FoodComponent } from '../components/FoodComponent';
import { Vector2 } from '../utils/Vector2';

/**
 * System that determines the state of joints (anchored or moving)
 * based on genetic information and food proximity
 */
export class StateSystem extends System {
  /**
   * Create a new state system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    this.stateChangeTimer = {}; // Track timers for state changes by joint ID
    this.organismTimeOffset = {}; // Random offset for movement patterns per organism
    this.organismDirection = {}; // Current movement direction per organism
    this.simulationTime = 0;
  }

  /**
   * Update states of all joints based on genetics and environment
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Update simulation time
    this.simulationTime += deltaTime;
    
    // Get all joint entities
    const jointEntities = this.world.getEntitiesWithComponent(JointComponent);
    
    // Get all food entities
    const foodEntities = this.world.getEntitiesWithComponent(FoodComponent);
    
    // For each joint, determine whether it should be anchored based on genes and food proximity
    for (const jointEntity of jointEntities) {
      const joint = jointEntity.getComponent(JointComponent);
      
      // Skip joints that are in a timer state change
      if (this.stateChangeTimer[jointEntity.id]) continue;
      
      const position = jointEntity.getComponent(PositionComponent);
      
      // Get the organism this joint belongs to
      const organismEntity = this.world.getEntity(joint.organismId);
      if (!organismEntity) continue;
      
      const organism = organismEntity.getComponent(OrganismComponent);
      const genetics = organismEntity.getComponent(GeneticComponent);
      
      // Initialize time offset and direction for this organism if not already done
      if (!this.organismTimeOffset[organismEntity.id]) {
        this.organismTimeOffset[organismEntity.id] = Math.random() * 10000;
        this.organismDirection[organismEntity.id] = new Vector2(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        ).normalize();
      }
      
      // Get time offset for this organism's movement pattern
      const timeOffset = this.organismTimeOffset[organismEntity.id];
      const currentMovementTime = (this.simulationTime + timeOffset) * genetics.movementFrequency;
      
      // Find the closest food
      let closestFoodDistance = Number.MAX_VALUE;
      let closestFoodPosition = null;
      
      for (const foodEntity of foodEntities) {
        const foodPosition = foodEntity.getComponent(PositionComponent);
        const distance = position.position.distanceTo(foodPosition.position);
        
        // All organisms can detect food within sensor range
        if (distance < genetics.sensorDistance && distance < closestFoodDistance) {
          closestFoodDistance = distance;
          closestFoodPosition = foodPosition.position;
        }
      }
      
      // Check current anchor ratio in the organism
      let anchoredJoints = 0;
      for (const jointId of organism.jointIds) {
        const otherJointEntity = this.world.getEntity(jointId);
        if (otherJointEntity && otherJointEntity.getComponent(JointComponent).isAnchored) {
          anchoredJoints++;
        }
      }
      
      const totalJoints = organism.jointIds.length;
      const currentAnchorRatio = anchoredJoints / totalJoints;
      
      // If there's food within sensor range
      if (closestFoodPosition && closestFoodDistance < genetics.sensorDistance) {
        // Calculate normalized distance (1.0 when at sensor edge, 0.0 when at food)
        const normalizedDistance = closestFoodDistance / genetics.sensorDistance;
        
        // Add a random component for non-deterministic behavior
        const randomFactor = Math.random() * 0.3;
        
        // Check thresholds to determine state
        if (normalizedDistance < genetics.anchorThreshold - randomFactor) {
          // Very close to food - anchor briefly
          this.temporaryStateChange(jointEntity, true, 150 + Math.random() * 200);
          
          if (jointEntity.hasComponent(PhysicsComponent)) {
            const physics = jointEntity.getComponent(PhysicsComponent);
            
            // Get direction to food
            const directionToFood = closestFoodPosition.subtract(position.position).normalize();
            
            // Apply force toward food based on movementBias (genetics determines how directly it moves toward food)
            physics.force = physics.force.add(directionToFood.multiply(genetics.movementBias));
            
            // Apply random movement based on pattern (1.0 - bias ratio determines randomness)
            this.applyMovementPattern(physics, currentMovementTime, genetics, 1.0 - (genetics.movementBias / 3.0));
          }
        } else if (normalizedDistance < genetics.moveThreshold) {
          // Moderately close to food - mostly movement with occasional anchoring
          if (currentAnchorRatio < genetics.anchorRatio && Math.random() < 0.3) {
            this.temporaryStateChange(jointEntity, true, 100 + Math.random() * 150);
          } else {
            this.temporaryStateChange(jointEntity, false, 200 + Math.random() * 200);
            
            if (jointEntity.hasComponent(PhysicsComponent)) {
              const physics = jointEntity.getComponent(PhysicsComponent);
              
              // Get direction to food
              const directionToFood = closestFoodPosition.subtract(position.position).normalize();
              
              // Apply weaker force toward food based on movementBias
              physics.force = physics.force.add(directionToFood.multiply(genetics.movementBias * 0.7));
              
              // Apply significant random movement pattern
              this.applyMovementPattern(physics, currentMovementTime, genetics, 1.0 - (genetics.movementBias / 4.0));
            }
          }
        } else {
          // Food is detectable but far away - mostly movement with pattern
          if (Math.random() < 0.2 && currentAnchorRatio < genetics.anchorRatio) {
            this.temporaryStateChange(jointEntity, true, 50 + Math.random() * 100);
          } else {
            this.temporaryStateChange(jointEntity, false, 200 + Math.random() * 300);
            
            if (jointEntity.hasComponent(PhysicsComponent)) {
              const physics = jointEntity.getComponent(PhysicsComponent);
              
              // Get direction to food
              const directionToFood = closestFoodPosition.subtract(position.position).normalize();
              
              // Apply weak force toward food based on movementBias
              physics.force = physics.force.add(directionToFood.multiply(genetics.movementBias * 0.5));
              
              // Apply strong pattern movement
              this.applyMovementPattern(physics, currentMovementTime, genetics, 1.0 - (genetics.movementBias / 5.0));
            }
          }
        }
      } else {
        // No food in sensor range - pure pattern movement (genetic)
        if (currentAnchorRatio < genetics.anchorRatio && Math.random() < 0.25) {
          // Occasionally anchor for stability
          this.temporaryStateChange(jointEntity, true, 100 + Math.random() * 100);
        } else {
          // Mostly movement with pattern
          this.temporaryStateChange(jointEntity, false, 300 + Math.random() * 300);
          
          // Apply movement based on genetic pattern only
          if (jointEntity.hasComponent(PhysicsComponent)) {
            const physics = jointEntity.getComponent(PhysicsComponent);
            
            // Apply pure pattern movement
            this.applyMovementPattern(physics, currentMovementTime, genetics, 1.0);
          }
        }
      }
    }
  }
  
  /**
   * Apply movement pattern based on genetic parameters
   * @param {PhysicsComponent} physics - The physics component to apply force to
   * @param {number} currentTime - Current oscillation time
   * @param {GeneticComponent} genetics - Genetic parameters
   * @param {number} patternStrength - Strength of pattern vs directed movement (0-1)
   */
  applyMovementPattern(physics, currentTime, genetics, patternStrength) {
    // Calculate pattern values based on time and genetics
    const sinValue = Math.sin(currentTime);
    const cosValue = Math.cos(currentTime);
    const sinValue2 = Math.sin(currentTime * 1.7); // Secondary frequency
    
    // Apply multi-frequency pattern for more complex movement
    const patternMagnitude = genetics.movementMagnitude * patternStrength;
    
    // Create a directional force that changes over time in a pattern
    const dirX = sinValue * patternMagnitude + sinValue2 * patternMagnitude * 0.5;
    const dirY = cosValue * patternMagnitude;
    
    // Add rotational component
    const rotationX = -cosValue * genetics.rotationalForce * patternStrength;
    const rotationY = sinValue * genetics.rotationalForce * patternStrength;
    
    // Add the patterned force
    physics.force = physics.force.add(new Vector2(dirX, dirY));
    physics.force = physics.force.add(new Vector2(rotationX, rotationY));
    
    // Add small random component for variation
    physics.force = physics.force.add(
      new Vector2(
        (Math.random() * 2 - 1) * 0.5,
        (Math.random() * 2 - 1) * 0.5
      )
    );
  }
  
  /**
   * Change a joint's state temporarily and set a timer to revert
   * @param {Entity} jointEntity - The joint entity
   * @param {boolean} anchorState - Whether to anchor the joint
   * @param {number} duration - Duration of the state change in milliseconds
   */
  temporaryStateChange(jointEntity, anchorState, duration) {
    const joint = jointEntity.getComponent(JointComponent);
    
    // Skip if already in the desired state
    if (joint.isAnchored === anchorState) return;
    
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