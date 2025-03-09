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
 * System that handles connections between joints and the forces between them
 */
export class JointConnectionSystem extends System {
  /**
   * Create a new joint connection system
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    super(world);
    this.organismMovementPhase = {}; // Phase for oscillatory movement per organism
    this.lastUpdateTime = performance.now() / 1000;
  }

  /**
   * Update joint connections and calculate forces between connected joints
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
      
      // Initialize movement phase if not already done
      if (!this.organismMovementPhase[organismEntity.id]) {
        this.organismMovementPhase[organismEntity.id] = Math.random() * Math.PI * 2;
      }
      
      // Update movement phase based on genetic frequency and elapsed time
      this.organismMovementPhase[organismEntity.id] += 
        elapsedTime * genetics.movementFrequency * Math.PI;
      
      // Calculate oscillatory values for this organism's movement
      const sinValue = Math.sin(this.organismMovementPhase[organismEntity.id]);
      const cosValue = Math.cos(this.organismMovementPhase[organismEntity.id]);
      
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
      
      // If no anchors, randomly anchor one joint (gives stability) - but with less probability
      if (!hasAnchor && organism.jointIds.length > 0 && Math.random() < 0.5) {
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
          }, Math.random() * 400 + 200); // Random time between 200ms and 600ms
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
        
        // Apply internal locomotion pattern forces based on genetics
        // This is the key to emergent movement - organisms don't directly sense food,
        // but develop movement patterns that happen to bring them to food
        
        // Add phase-based movement pattern
        const phaseForce = new Vector2(
          sinValue * genetics.movementMagnitude * 0.8,
          cosValue * genetics.movementMagnitude * 0.6
        );
        jointPhysics.force = jointPhysics.force.add(phaseForce);
        
        // Add rotational component based on genetics
        const rotationalForce = genetics.rotationalForce;
        const rotationVector = new Vector2(
          -cosValue * rotationalForce,
          sinValue * rotationalForce
        );
        jointPhysics.force = jointPhysics.force.add(rotationVector);
        
        // Add small random noise for variation in movement
        const randomForce = new Vector2(
          (Math.random() * 2 - 1) * 0.5,
          (Math.random() * 2 - 1) * 0.5
        );
        jointPhysics.force = jointPhysics.force.add(randomForce);
        
        // Handle spring forces between joints
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
          
          // Apply spring force (Hooke's law F = kx)
          let springForce = direction.normalize().multiply(stretch * jointPhysics.stiffness * 2.5);
          
          // If the connected joint is anchored, apply stronger force
          if (connectedJoint.isAnchored) {
            springForce = springForce.multiply(2.0);
          }
          
          // Apply the spring force
          jointPhysics.force = jointPhysics.force.add(springForce);
          
          // Apply perpendicular force for more interesting movement
          // This creates a torque-like effect making joints rotate around connections
          const perpStrength = genetics.rotationalForce * 0.6;
          if (perpStrength > 0) {
            const perpendicular = new Vector2(-direction.y, direction.x).normalize();
            jointPhysics.force = jointPhysics.force.add(
              perpendicular.multiply(perpStrength * sinValue)
            );
          }
        }
        
        // If the organism has no anchors, allow more movement
        if (!hasAnchor) {
          // Apply less damping for more movement
          if (jointVelocity) {
            jointVelocity.velocity = jointVelocity.velocity.multiply(0.98);
          }
          
          // Add stronger random force for exploration
          jointPhysics.force = jointPhysics.force.add(
            new Vector2(
              (Math.random() * 2 - 1) * genetics.movementMagnitude * 0.5,
              (Math.random() * 2 - 1) * genetics.movementMagnitude * 0.5
            )
          );
        }
      }
    }
  }
}

export default JointConnectionSystem;