// src/simulation/ecs/systems/StateSystem.js
import { System } from '../System';
import { JointComponent } from '../components/JointComponent';
import { OrganismComponent } from '../components/OrganismComponent';
import { GeneticComponent } from '../components/GeneticComponent';

/**
 * System that determines joint states based on genetics
 * Enhanced with more dynamic state transitions
 */
export class StateSystem extends System {
  /**
   * Create a new state system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    this.simulationTime = 0;
    
    // Enhanced limb state parameters
    this.extensionMaxFactor = 1.8;   // Maximum extension (increased from 1.3)
    this.contractionMinFactor = 0.5; // Minimum contraction (decreased from 0.7)
    
    // Dynamic parameters that change how organisms move
    this.useAdaptivePatterns = true;   // Adjust patterns based on success
    this.useSmoothTransitions = true;  // Smooth transitions between states
    this.lastStateMap = new Map();     // Track previous states for smooth transitions
    this.transitionProgress = new Map(); // Track transition progress
  }

  /**
   * Update states of joints based on genetic patterns with enhanced dynamics
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Update simulation time
    this.simulationTime += deltaTime;
    
    // Process each organism
    const organismEntities = this.world.getEntitiesWithComponent(OrganismComponent);
    
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      const genetics = organismEntity.getComponent(GeneticComponent);
      
      // Update each joint state
      for (let i = 0; i < organism.jointIds.length; i++) {
        const jointId = organism.jointIds[i];
        const jointEntity = this.world.getEntity(jointId);
        
        if (!jointEntity) continue;
        
        const jointComponent = jointEntity.getComponent(JointComponent);
        
        // Determine joint state (up/down) based on genetic pattern
        const jointState = genetics.getJointState(i, this.simulationTime);
        
        // Generate a unique ID for this joint for state tracking
        const jointStateId = `${organismEntity.id}-${jointId}-joint`;
        
        // Get previous state or initialize if not present
        const prevJointState = this.lastStateMap.get(jointStateId) ?? jointState;
        
        // Handle smooth transitions if enabled
        let effectiveJointState = jointState;
        if (this.useSmoothTransitions && prevJointState !== jointState) {
          // Track the transition progress
          let progress = this.transitionProgress.get(jointStateId) || 0;
          progress += deltaTime * 10; // Control transition speed
          
          if (progress >= 1) {
            // Transition complete
            this.transitionProgress.delete(jointStateId);
            effectiveJointState = jointState;
          } else {
            // Blend between states during transition
            this.transitionProgress.set(jointStateId, progress);
            
            // For joint states, we'll round to nearest since we need a binary value
            effectiveJointState = Math.round(prevJointState * (1 - progress) + jointState * progress);
          }
        }
        
        // Set joint state (0=down/anchored, 1=up/mobile)
        jointComponent.isAnchored = (effectiveJointState === 0);
        
        // Store this state for next frame
        this.lastStateMap.set(jointStateId, jointState);
        
        // Update each connection (limb) state
        for (let j = 0; j < jointComponent.connections.length; j++) {
          const connectedJointId = jointComponent.connections[j];
          
          // Create a unique limb index based on the two joint IDs
          const limbIndex = Math.min(jointId, connectedJointId) * 1000 + Math.max(jointId, connectedJointId);
          
          // Get limb state (extend/contract) based on genetic pattern
          const limbState = genetics.getLimbState(limbIndex % 1000, this.simulationTime);
          
          // Generate a unique ID for this limb for state tracking
          const limbStateId = `${organismEntity.id}-${limbIndex}-limb`;
          
          // Get previous state or initialize if not present
          const prevLimbState = this.lastStateMap.get(limbStateId) ?? limbState;
          
          // Handle smooth transitions if enabled
          let effectiveLimbState = limbState;
          if (this.useSmoothTransitions && prevLimbState !== limbState) {
            // Track the transition progress
            let progress = this.transitionProgress.get(limbStateId) || 0;
            progress += deltaTime * 8; // Control transition speed
            
            if (progress >= 1) {
              // Transition complete
              this.transitionProgress.delete(limbStateId);
              effectiveLimbState = limbState;
            } else {
              // Blend between states during transition
              this.transitionProgress.set(limbStateId, progress);
              effectiveLimbState = prevLimbState * (1 - progress) + limbState * progress;
            }
          }
          
          // Calculate limb length based on state
          // Base rest length defined in JointComponent
          const baseLength = jointComponent.defaultRestLength;
          
          // Enhanced extension factor range for more dynamic movement
          // Binary limbState (0=contracted, 1=extended) is now transformed into a continuous factor
          const extensionFactor = limbState === 0 ? 
                                this.contractionMinFactor : 
                                this.extensionMaxFactor;
                                
          // For smooth transitions, we blend the extension factors
          const effectiveExtensionFactor = this.useSmoothTransitions ?
                                         (effectiveLimbState === 0 ? this.contractionMinFactor : this.extensionMaxFactor) :
                                         extensionFactor;
          
          // Set the rest length for this connection
          jointComponent.restLengths.set(connectedJointId, baseLength * effectiveExtensionFactor);
          
          // Update the corresponding connection in the connected joint too
          const connectedEntity = this.world.getEntity(connectedJointId);
          if (connectedEntity && connectedEntity.hasComponent(JointComponent)) {
            const connectedJoint = connectedEntity.getComponent(JointComponent);
            connectedJoint.restLengths.set(jointId, baseLength * effectiveExtensionFactor);
          }
          
          // Store this state for next frame
          this.lastStateMap.set(limbStateId, limbState);
        }
      }
    }
  }
}

export default StateSystem;