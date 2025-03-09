// src/simulation/ecs/systems/JointConnectionSystem.js
import { System } from '../System';
import { JointComponent } from '../components/JointComponent';
import { PositionComponent } from '../components/PositionComponent';
import { PhysicsComponent } from '../components/PhysicsComponent';
import { Vector2 } from '../utils/Vector2';

/**
 * System that handles connections between joints with simple extend/contract behavior
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
   * Update joint connections with simple spring forces based on states
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
        // This changes based on whether the limb is extending or contracting
        const restLength = jointComponent.restLengths.get(connectedJointId) || 
                         jointComponent.defaultRestLength;
        
        // Calculate spring force direction
        const direction = connectedPosition.position.subtract(jointPosition.position);
        const distance = Math.max(0.1, jointPosition.position.distanceTo(connectedPosition.position));
        
        // Calculate spring force magnitude (F = k * Δx)
        const stretch = distance - restLength;
        const forceMagnitude = stretch * jointPhysics.stiffness;
        
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