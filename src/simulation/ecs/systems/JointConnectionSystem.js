// src/simulation/ecs/systems/JointConnectionSystem.js
import { System } from '../System';
import { JointComponent } from '../components/JointComponent';
import { PositionComponent } from '../components/PositionComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { Vector2 } from '../utils/Vector2';

/**
 * System that handles connections between joints with enhanced extend/contract behavior
 */
export class JointConnectionSystem extends System {
  /**
   * Create a new joint connection system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    
    // Enhanced joint connection parameters
    this.extensionFactor = 1.8;   // Increased from 1.3 - How much joints extend
    this.contractionFactor = 0.6; // Decreased from 0.7 - How much joints contract
    this.forceMultiplier = 2.0;   // Multiplier for spring forces
    this.minRestLength = 15;      // Minimum rest length to prevent collapse
    this.adaptiveForces = true;   // Use adaptive forces based on distance
  }

  /**
   * Update joint connections with enhanced spring forces
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Get all joint entities
    const jointEntities = this.world.getEntitiesWithComponent(JointComponent);
    
    // Process each joint
    for (const jointEntity of jointEntities) {
      const jointComponent = jointEntity.getComponent(JointComponent);
      
      // Skip if this joint is anchored (down state)
      if (jointComponent.isAnchored) continue;
      
      const jointPosition = jointEntity.getComponent(PositionComponent);
      const jointPhysics = jointEntity.getComponent(PhysicsComponent);
      
      // Process each connection (limb)
      for (const connectedJointId of jointComponent.connections) {
        const connectedEntity = this.world.getEntity(connectedJointId);
        if (!connectedEntity) continue;
        
        const connectedPosition = connectedEntity.getComponent(PositionComponent);
        const connectedPhysics = connectedEntity.hasComponent(PhysicsComponent) ? 
                              connectedEntity.getComponent(PhysicsComponent) : null;
                              
        const connectedJoint = connectedEntity.getComponent(JointComponent);
        
        // Get the current rest length for this connection
        // Enhanced with better extension/contraction factors
        let restLength = jointComponent.restLengths.get(connectedJointId) || 
                          jointComponent.defaultRestLength;
        
        // Apply adaptive extension/contraction based on current distance
        const currentDistance = jointPosition.position.distanceTo(connectedPosition.position);
        
        // Enhanced adaptive rest length calculation
        if (this.adaptiveForces) {
          // If joints are very far apart, increase the contraction force
          if (currentDistance > restLength * 1.5) {
            restLength = Math.max(restLength * 0.9, this.minRestLength);
          }
          // If joints are very close, increase the extension force
          else if (currentDistance < restLength * 0.5) {
            restLength = restLength * 1.1;
          }
        }
        
        // Calculate spring force direction
        const direction = connectedPosition.position.subtract(jointPosition.position);
        const distance = Math.max(0.1, currentDistance);
        
        // Calculate spring force magnitude (F = k * Δx)
        const stretch = distance - restLength;
        
        // Enhanced force calculation with adaptive stiffness
        let forceMagnitude = stretch * jointPhysics.stiffness * this.forceMultiplier;
        
        // Apply spring force in the direction of the connection
        const springForce = direction.normalize().multiply(forceMagnitude);
        jointPhysics.force = jointPhysics.force.add(springForce);
        
        // Apply equal and opposite force to connected joint (Newton's 3rd law)
        if (connectedPhysics && !connectedJoint.isAnchored) {
          connectedPhysics.force = connectedPhysics.force.add(springForce.multiply(-1));
        }
      }
    }
  }
}

export default JointConnectionSystem;