// src/simulation/ecs/systems/StateSystem.js
import { System } from '../System';
import { JointComponent } from '../components/JointComponent';
import { OrganismComponent } from '../components/OrganismComponent';
import { GeneticComponent } from '../components/GeneticComponent';

/**
 * System that determines joint states based on genetics
 * Simplified to use deterministic binary states
 */
export class StateSystem extends System {
  /**
   * Create a new state system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    this.simulationTime = 0;
  }

  /**
   * Update states of joints based on genetic patterns
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
        
        // Set joint state (0=down/anchored, 1=up/mobile)
        jointComponent.isAnchored = (jointState === 0);
        
        // Update each connection (limb) state
        for (let j = 0; j < jointComponent.connections.length; j++) {
          const connectedJointId = jointComponent.connections[j];
          
          // Create a unique limb index based on the two joint IDs
          // This ensures each limb has a consistent index regardless of which joint we're processing
          const limbIndex = Math.min(jointId, connectedJointId) * 1000 + Math.max(jointId, connectedJointId);
          
          // Get limb state (extend/contract) based on genetic pattern
          const limbState = genetics.getLimbState(limbIndex % 1000, this.simulationTime);
          
          // Calculate limb length based on state
          // Base rest length defined in JointComponent
          const baseLength = jointComponent.defaultRestLength;
          
          // Determine current extension factor (0=contracted, 1=extended)
          // Contract to 70% of base length, extend to 130% of base length
          const extensionFactor = limbState === 0 ? 0.7 : 1.3;
          
          // Set the rest length for this connection
          jointComponent.restLengths.set(connectedJointId, baseLength * extensionFactor);
          
          // Update the corresponding connection in the connected joint too
          const connectedEntity = this.world.getEntity(connectedJointId);
          if (connectedEntity && connectedEntity.hasComponent(JointComponent)) {
            const connectedJoint = connectedEntity.getComponent(JointComponent);
            connectedJoint.restLengths.set(jointId, baseLength * extensionFactor);
          }
        }
      }
    }
  }
}

export default StateSystem;