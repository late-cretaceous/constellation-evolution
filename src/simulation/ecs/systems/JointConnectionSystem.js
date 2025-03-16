// src/simulation/ecs/systems/JointConnectionSystem.js
import { System } from '../System';
import { JointComponent } from '../components/JointComponent';
import { PositionComponent } from '../components/PositionComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { Vector2 } from '../utils/Vector2';

/**
 * System that handles connections between joints with enhanced extend/contract behavior
 * Modified to produce more effective movement patterns
 */
export class JointConnectionSystem extends System {
  /**
   * Create a new joint connection system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    
    // Joint connection parameters - adjusted for more powerful movement
    this.extensionFactor = 1.7;    // Increased for stronger extension
    this.contractionFactor = 0.5; // Decreased for stronger contraction
    this.forceMultiplier = 2.0;    // Increased for stronger forces
    this.minRestLength = 15;       // Minimum rest length to prevent collapse
    this.adaptiveForces = true;    // Use adaptive forces based on distance
    
    // New parameters for more effective behavior
    this.maxStretchRatio = 2.0;    // Maximum stretch before additional force is applied
    this.minCompressionRatio = 0.4; // Minimum compression before additional force is applied
    this.progressiveStiffness = true; // Use higher stiffness for extreme stretching/compression
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
        let restLength = jointComponent.restLengths.get(connectedJointId) || 
                          jointComponent.defaultRestLength;
        
        // Apply adaptive extension/contraction based on current distance
        const currentDistance = jointPosition.position.distanceTo(connectedPosition.position);
        
        // Enhanced adaptive rest length calculation
        if (this.adaptiveForces) {
          // If joints are very far apart, increase the contraction force
          if (currentDistance > restLength * this.maxStretchRatio) {
            restLength = Math.max(restLength * 0.85, this.minRestLength); // More aggressive contraction
          }
          // If joints are very close, increase the extension force
          else if (currentDistance < restLength * this.minCompressionRatio) {
            restLength = restLength * 1.15; // More aggressive extension
          }
        }
        
        // Calculate spring force direction
        const direction = connectedPosition.position.subtract(jointPosition.position);
        const distance = Math.max(0.1, currentDistance);
        
        // Calculate spring force magnitude (F = k * Δx)
        const stretch = distance - restLength;
        
        // Enhanced force calculation with adaptive stiffness
        let stiffness = jointPhysics.stiffness;
        
        // Use progressive stiffness for more effective movements
        if (this.progressiveStiffness) {
          // Calculate ratio of current distance to rest length
          const distanceRatio = distance / restLength;
          
          // Apply higher stiffness for extreme stretching or compression
          if (distanceRatio > this.maxStretchRatio) {
            // Additional stiffness proportional to how far beyond maxStretchRatio
            const extraStiffness = (distanceRatio - this.maxStretchRatio) * 2.0; // Increased multiplier
            stiffness *= (1 + extraStiffness);
          } else if (distanceRatio < this.minCompressionRatio) {
            // Additional stiffness proportional to how far below minCompressionRatio
            const extraStiffness = (this.minCompressionRatio - distanceRatio) * 2.0; // Increased multiplier
            stiffness *= (1 + extraStiffness);
          }
        }
        
        // Calculate force with adapted stiffness and higher multiplier
        let forceMagnitude = stretch * stiffness * this.forceMultiplier;
        
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