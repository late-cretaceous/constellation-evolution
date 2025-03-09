// src/simulation/ecs/systems/JointConnectionSystem.js
import { System } from '../System';
import { JointComponent } from '../components/JointComponent';
import { PositionComponent } from '../components/PositionComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { OrganismComponent } from '../components/OrganismComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { GeneticComponent } from '../components/GeneticComponent';
import { Vector2 } from '../utils/Vector2';

/**
 * System that handles connections between joints with wildly dynamic muscle-like behavior
 * Creates much more energetic and chaotic organism movement
 */
export class JointConnectionSystem extends System {
  /**
   * Create a new joint connection system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    this.lastUpdateTime = performance.now() / 1000;
    this.musclePhases = new Map(); // Track contraction phase for each connection
    this.muscleRates = new Map(); // Track contraction rate for each connection
    this.muscleStrengths = new Map(); // Track contraction strength for each connection
    this.muscleBehaviorTimers = new Map(); // Track behavior change timers
    this.muscleBehaviorTypes = new Map(); // Track current behavior type
    this.jointChaosLevels = new Map(); // Individual chaos level per joint
  }

  /**
   * Update joint connections with extremely dynamic muscle behavior
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    const currentTime = performance.now() / 1000;
    const elapsedTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;
    
    // For each organism
    const organismEntities = this.world.getEntitiesWithComponent(OrganismComponent);
    
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      const genetics = organismEntity.getComponent(GeneticComponent);
      
      // Process each joint
      for (const jointId of organism.jointIds) {
        const jointEntity = this.world.getEntity(jointId);
        if (!jointEntity) continue;
        
        // Initialize or update individual chaos level for this joint
        if (!this.jointChaosLevels.has(jointId)) {
          this.jointChaosLevels.set(jointId, {
            level: 0.5 + Math.random() * 2.5,
            timer: Math.random() * 2.0,
            // Add random offset to make joints behave independently
            offset: Math.random() * Math.PI * 2
          });
        }
        
        // Update individual chaos level
        const chaosData = this.jointChaosLevels.get(jointId);
        chaosData.timer -= elapsedTime;
        
        if (chaosData.timer <= 0) {
          // Change chaos level randomly - unique per joint
          chaosData.level = 0.5 + Math.random() * 2.5;
          // Set different timer for each joint
          chaosData.timer = 0.5 + Math.random() * 2.5; 
          // Add offset based on joint ID to prevent synchronization
          chaosData.timer += (jointId % 10) * 0.1;
        }
        
        // Individual chaos multiplier for this joint
        const jointChaosMultiplier = chaosData.level;
        
        const jointComponent = jointEntity.getComponent(JointComponent);
        if (jointComponent.isAnchored) continue; // Skip anchored joints
        
        const jointPosition = jointEntity.getComponent(PositionComponent);
        const jointPhysics = jointEntity.getComponent(PhysicsComponent);
        const jointVelocity = jointEntity.getComponent(VelocityComponent);
        
        // Apply dramatic random forces - much higher chance and magnitude
        if (Math.random() < 0.9) { // 90% chance to apply random force every frame
          let forceMagnitude;
          const forceDist = Math.random();
          
          if (forceDist < 0.6) {
            // 60% of the time: moderate force
            forceMagnitude = Math.random() * genetics.movementMagnitude * 5;
          } else if (forceDist < 0.9) {
            // 30% of the time: large force
            forceMagnitude = genetics.movementMagnitude * 5 + Math.random() * genetics.movementMagnitude * 10;
          } else {
            // 10% of the time: strong force (not extreme)
            forceMagnitude = genetics.movementMagnitude * 15 + Math.random() * genetics.movementMagnitude * 15;
          }
          
          // Apply joint-specific chaos multiplier
          forceMagnitude *= jointChaosMultiplier;
          
          // Direction of force is completely random
          jointPhysics.force = jointPhysics.force.add(new Vector2(
            (Math.random() * 2 - 1) * forceMagnitude,
            (Math.random() * 2 - 1) * forceMagnitude
          ));
        }
        
        // Occasionally apply VERY strong impulses - creating sudden "jumps" in movement
        if (Math.random() < 0.05) { // 5% chance per joint per frame
          const impulseMagnitude = 50 + Math.random() * 150; // Very strong impulse
          const impulseDirection = new Vector2(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
          ).normalize();
          
          jointVelocity.velocity = jointVelocity.velocity.add(
            impulseDirection.multiply(impulseMagnitude * jointChaosMultiplier)
          );
        }
        
        // Handle muscle-like contractions between joints with much more dynamic behavior
        for (const connectedJointId of jointComponent.connections) {
          const connectedEntity = this.world.getEntity(connectedJointId);
          if (!connectedEntity) continue;
          
          const connectedPosition = connectedEntity.getComponent(PositionComponent);
          const connectedPhysics = connectedEntity.getComponent(PhysicsComponent);
          
          // Generate a unique ID for this connection
          const connectionId = jointId < connectedJointId 
            ? `${jointId}-${connectedJointId}` 
            : `${connectedJointId}-${jointId}`;
          
          // Initialize or update muscle behavior
          this.updateMuscleBehavior(connectionId, elapsedTime);
          
          // Get base rest length for this connection
          const baseRestLength = jointComponent.restLengths.get(connectedJointId) || 
                               jointComponent.defaultRestLength;
          
          // Apply the current muscle behavior
          const behaviorType = this.muscleBehaviorTypes.get(connectionId) || 0;
          let contractionFactor;
          
          // Different muscle behaviors create different types of movement
          switch (behaviorType) {
            case 0: // Smooth sinusoidal oscillation
              const phase = this.musclePhases.get(connectionId);
              const strength = this.muscleStrengths.get(connectionId);
              contractionFactor = 1.0 + Math.sin(phase) * strength * 2.0;
              break;
              
            case 1: // Rapid pulsing (square wave)
              const pulsePhase = this.musclePhases.get(connectionId) % (2 * Math.PI);
              const pulseStrength = this.muscleStrengths.get(connectionId) * 3.0;
              contractionFactor = pulsePhase < Math.PI ? 1.0 - pulseStrength : 1.0 + pulseStrength;
              break;
              
            case 2: // Completely random contractions
              contractionFactor = 0.2 + Math.random() * 2.6; // 20% to 280% of base length
              break;
              
            case 3: // Sawtooth pattern - gradual extend, rapid contract
              const sawPhase = (this.musclePhases.get(connectionId) % (2 * Math.PI)) / (2 * Math.PI);
              const sawStrength = this.muscleStrengths.get(connectionId) * 3.0;
              contractionFactor = 1.0 + (sawStrength * sawPhase);
              break;
              
            case 4: // Extreme stretching behavior
              contractionFactor = 0.1 + Math.random() * 3.9; // 10% to 400% of base length
              break;
              
            default:
              contractionFactor = 1.0;
          }
          
          // Update muscle phase
          const rate = this.muscleRates.get(connectionId);
          const currentPhase = this.musclePhases.get(connectionId) || 0;
          this.musclePhases.set(connectionId, currentPhase + elapsedTime * rate * 5.0); // 5x faster
          
          // Calculate dynamic rest length with a reasonable limit
          const maxStretchFactor = 2.0; // Limit stretch to 2x the base rest length
          const limitedContractionFactor = Math.min(maxStretchFactor, contractionFactor * jointChaosMultiplier);
          const dynamicRestLength = baseRestLength * limitedContractionFactor;
          
          // Calculate spring force with dynamic rest length
          const direction = connectedPosition.position.subtract(jointPosition.position);
          const distance = Math.max(0.1, jointPosition.position.distanceTo(connectedPosition.position));
          
          // Add hard distance constraint to prevent extreme stretching
          const maxAllowedDistance = baseRestLength * 3.0; // Maximum 3x the base rest length
          
          if (distance > maxAllowedDistance) {
            // Apply instantaneous position correction
            const correction = direction.normalize().multiply(distance - maxAllowedDistance);
            // Move both joints toward each other to maintain the constraint
            if (!jointComponent.isAnchored) {
              jointPosition.position = jointPosition.position.add(correction.multiply(0.5));
            }
            
            const connectedJoint = connectedEntity.getComponent(JointComponent);
            if (!connectedJoint.isAnchored) {
              connectedPosition.position = connectedPosition.position.add(correction.multiply(-0.5));
            }
          }
          
          const stretch = distance - dynamicRestLength;
          
          // Randomized stiffness with safer limits
          const randomStiffness = jointPhysics.stiffness * (1.0 + Math.random() * 4.0) * jointChaosMultiplier;
          
          // Apply spring force
          const springForce = direction.normalize().multiply(stretch * randomStiffness);
          jointPhysics.force = jointPhysics.force.add(springForce);
          
          // Apply very strong rotational forces - creates spinning, flailing behavior
          if (Math.random() < 0.8) { // 80% chance per connection per frame
            const perpendicular = new Vector2(-direction.y, direction.x).normalize();
            const rotationMagnitude = (Math.random() * 2 - 1) * Math.random() * Math.abs(genetics.rotationalForce) * 10.0;
            jointPhysics.force = jointPhysics.force.add(
              perpendicular.multiply(rotationMagnitude * jointChaosMultiplier)
            );
          }
          
          // Occasionally apply extreme rapid oscillations ("vibration")
          if (Math.random() < 0.02) { // 2% chance per connection per frame
            const vibrationForce = 100 + Math.random() * 200;
            const vibrationDir = new Vector2(
              Math.random() * 2 - 1,
              Math.random() * 2 - 1
            ).normalize();
            
            jointPhysics.force = jointPhysics.force.add(vibrationDir.multiply(vibrationForce));
            
            // Apply opposite force to connected joint for action-reaction
            if (connectedPhysics) {
              connectedPhysics.force = connectedPhysics.force.add(vibrationDir.multiply(-vibrationForce));
            }
          }
        }
      }
      
      // Randomly anchor/un-anchor joints much more frequently
      // This creates a staggering, start-stop motion that's extremely dynamic
      for (let i = 0; i < organism.jointIds.length; i++) {
        if (Math.random() < 0.1) { // 10% chance per joint per frame
          const jointId = organism.jointIds[i];
          const jointEntity = this.world.getEntity(jointId);
          if (jointEntity) {
            const joint = jointEntity.getComponent(JointComponent);
            
            // Flip the anchor state
            joint.isAnchored = !joint.isAnchored;
            
            // Extremely short duration for rapid state changes
            setTimeout(() => {
              if (jointEntity && jointEntity.hasComponent(JointComponent)) {
                jointEntity.getComponent(JointComponent).isAnchored = !joint.isAnchored;
              }
            }, 20 + Math.random() * 80); // Very short: 20-100ms
          }
        }
      }
    }
  }
  
  /**
   * Initialize or update muscle behavior parameters
   * @param {string} connectionId - The unique connection ID
   * @param {number} elapsedTime - Time elapsed since last update
   */
  updateMuscleBehavior(connectionId, elapsedTime) {
    // Initialize if not yet set
    if (!this.musclePhases.has(connectionId)) {
      this.initializeMuscleBehavior(connectionId);
    }
    
    // Check for behavior change
    let behaviorTimer = this.muscleBehaviorTimers.get(connectionId) || 0;
    behaviorTimer -= elapsedTime;
    
    if (behaviorTimer <= 0) {
      // Change behavior type
      this.muscleBehaviorTypes.set(connectionId, Math.floor(Math.random() * 5)); // 5 behavior types
      
      // Set new behavior parameters
      this.muscleRates.set(connectionId, 0.5 + Math.random() * 9.5); // Much faster rates: 0.5-10.0
      this.muscleStrengths.set(connectionId, 0.2 + Math.random() * 0.8); // 20-100% contraction
      
      // Set new timer (very short for rapid behavior changes)
      behaviorTimer = 0.1 + Math.random() * 1.9; // 0.1-2 seconds
    }
    
    this.muscleBehaviorTimers.set(connectionId, behaviorTimer);
  }
  
  /**
   * Initialize muscle behavior for a new connection
   * @param {string} connectionId - The unique connection ID
   */
  initializeMuscleBehavior(connectionId) {
    this.musclePhases.set(connectionId, Math.random() * Math.PI * 2);
    this.muscleRates.set(connectionId, 0.5 + Math.random() * 9.5); // 0.5-10.0
    this.muscleStrengths.set(connectionId, 0.2 + Math.random() * 0.8); // 20-100% contraction
    this.muscleBehaviorTypes.set(connectionId, Math.floor(Math.random() * 5)); // 5 behavior types
    this.muscleBehaviorTimers.set(connectionId, 0.1 + Math.random() * 1.9); // 0.1-2 seconds
  }
}

export default JointConnectionSystem;