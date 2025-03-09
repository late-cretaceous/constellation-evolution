// src/simulation/ecs/systems/JointConnectionSystem.js
import { System } from '../System';
import { JointComponent } from '../components/JointComponent';
import { PositionComponent } from '../components/PositionComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { OrganismComponent } from '../components/OrganismComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { Vector2 } from '../utils/Vector2';

/**
 * System that handles connections between joints and the forces between them
 */
export class JointConnectionSystem extends System {
  /**
   * Create a new joint connection system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
  }

  /**
   * Update joint connections and calculate forces between connected joints
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // For each organism
    const organismEntities = this.world.getEntitiesWithComponent(OrganismComponent);
    
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      
      // Check if the organism has at least one anchored joint
      let hasAnchor = false;
      for (const jointId of organism.jointIds) {
        const jointEntity = this.world.getEntity(jointId);
        if (!jointEntity) continue;
        
        const joint = jointEntity.getComponent(JointComponent);
        if (joint.isAnchored) {
          hasAnchor = true;
          break;
        }
      }
      
      // Apply spring forces between connected joints
      for (const jointId of organism.jointIds) {
        const jointEntity = this.world.getEntity(jointId);
        if (!jointEntity) continue;
        
        const jointComponent = jointEntity.getComponent(JointComponent);
        if (jointComponent.isAnchored) continue; // Skip anchored joints
        
        const jointPosition = jointEntity.getComponent(PositionComponent);
        const jointPhysics = jointEntity.getComponent(PhysicsComponent);
        
        for (const connectedJointId of jointComponent.connections) {
          const connectedEntity = this.world.getEntity(connectedJointId);
          if (!connectedEntity) continue;
          
          const connectedPosition = connectedEntity.getComponent(PositionComponent);
          const connectedJoint = connectedEntity.getComponent(JointComponent);
          
          // Get rest length for this connection
          const restLength = jointComponent.restLengths.get(connectedJointId) || 
                             jointComponent.defaultRestLength;
          
          // Calculate spring force
          const direction = connectedPosition.position.subtract(jointPosition.position);
          const distance = Math.max(0.1, jointPosition.position.distanceTo(connectedPosition.position));
          const stretch = distance - restLength;
          
          // Hooke's law F = kx
          let springForce = direction.normalize().multiply(stretch * jointPhysics.stiffness);
          
          // If the connected joint is anchored, apply stronger force
          if (connectedJoint.isAnchored) {
            springForce = springForce.multiply(3);
          }
          
          // Apply the force
          jointPhysics.force = jointPhysics.force.add(springForce);
        }
        
        // If the organism has no anchors, greatly reduce movement ability
        if (!hasAnchor) {
          jointPhysics.force = jointPhysics.force.multiply(0.1);
          const velocity = jointEntity.getComponent(VelocityComponent);
          if (velocity) {
            velocity.velocity = velocity.velocity.multiply(0.8); // Extra damping when not anchored
          }
        }
      }
    }
  }
}

export default JointConnectionSystem;
