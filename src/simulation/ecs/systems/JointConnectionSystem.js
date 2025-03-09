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
      
      // If no anchors, randomly anchor one joint (gives stability) - lower probability
      if (!hasAnchor && organism.jointIds.length > 0 && Math.random() < 0.7) { // Reduced from always anchoring
        const randomIndex = Math.floor(Math.random() * organism.jointIds.length);
        const randomJointId = organism.jointIds[randomIndex];
        const jointEntity = this.world.getEntity(randomJointId);
        if (jointEntity) {
          const joint = jointEntity.getComponent(JointComponent);
          joint.isAnchored = true;
          hasAnchor = true;
          
          // Temporary anchor - will release after some time
          setTimeout(() => {
            if (jointEntity && jointEntity.hasComponent(JointComponent)) {
              jointEntity.getComponent(JointComponent).isAnchored = false;
            }
          }, Math.random() * 500 + 300); // Random time between 300ms and 800ms
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
        const jointVelocity = jointEntity.getComponent(VelocityComponent);
        
        // Add significant movement force to each joint for more animation
        jointPhysics.force = jointPhysics.force.add(
          new Vector2(
            (Math.random() * 2 - 1) * 1.5, // Greatly increased from 0.5
            (Math.random() * 2 - 1) * 1.5
          )
        );
        
        // Add rotational tendency for more interesting movement
        // This creates a torque-like effect making joints rotate around connections
        let rotationForce = 0;
        if (jointComponent.connections.length > 0) {
          rotationForce = (Math.random() * 2 - 1) * 2.0; // Random rotational force
        }
        
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
          
          // Apply much stronger spring force (Hooke's law F = kx)
          let springForce = direction.normalize().multiply(stretch * jointPhysics.stiffness * 3.0); // Much stronger springs
          
          // If the connected joint is anchored, apply stronger force
          if (connectedJoint.isAnchored) {
            springForce = springForce.multiply(2.5); // Even stronger for anchored joints
          }
          
          // Apply the spring force
          jointPhysics.force = jointPhysics.force.add(springForce);
          
          // Apply rotational force (perpendicular to connection direction)
          // This creates the swinging/rotation behavior
          if (rotationForce !== 0) {
            const perpendicular = new Vector2(-direction.y, direction.x).normalize();
            jointPhysics.force = jointPhysics.force.add(
              perpendicular.multiply(rotationForce)
            );
          }
        }
        
        // If the organism has no anchors, allow more movement to encourage finding stability
        if (!hasAnchor) {
          // Less reduction in force for more movement
          jointPhysics.force = jointPhysics.force.multiply(1.0); // No reduction (was 0.8)
          
          // Add stronger random directional force for movement
          jointPhysics.force = jointPhysics.force.add(
            new Vector2(
              (Math.random() * 2 - 1) * 2.0,
              (Math.random() * 2 - 1) * 2.0
            ).normalize().multiply(1.5) // Much stronger random motion
          );
          
          // Apply almost no damping
          if (jointVelocity) {
            jointVelocity.velocity = jointVelocity.velocity.multiply(0.99); // Almost no damping (was 0.95)
          }
        }
      }
    }
  }
}

export default JointConnectionSystem;