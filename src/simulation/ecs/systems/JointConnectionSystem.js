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
 * System that handles connections between joints with muscle-like contractions
 * Allows for more dynamic and frenetic movement patterns
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
  }

  /**
   * Update joint connections with muscle-like contractions
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
        
        const jointComponent = jointEntity.getComponent(JointComponent);
        if (jointComponent.isAnchored) continue; // Skip anchored joints
        
        const jointPosition = jointEntity.getComponent(PositionComponent);
        const jointPhysics = jointEntity.getComponent(PhysicsComponent);
        
        // Add random forces with higher magnitude potential
        // Some organisms can move MUCH more vigorously
        if (Math.random() < 0.7) { // 70% chance to apply random force
          const forceMagnitude = Math.random() * Math.random() * genetics.movementMagnitude * 5.0; // Up to 5x stronger
          jointPhysics.force = jointPhysics.force.add(new Vector2(
            (Math.random() * 2 - 1) * forceMagnitude,
            (Math.random() * 2 - 1) * forceMagnitude
          ));
        }
        
        // Handle muscle-like contractions between joints
        for (const connectedJointId of jointComponent.connections) {
          const connectedEntity = this.world.getEntity(connectedJointId);
          if (!connectedEntity) continue;
          
          const connectedPosition = connectedEntity.getComponent(PositionComponent);
          
          // Generate a unique ID for this connection
          const connectionId = jointId < connectedJointId 
            ? `${jointId}-${connectedJointId}` 
            : `${connectedJointId}-${jointId}`;
          
          // Initialize muscle parameters if they don't exist
          if (!this.musclePhases.has(connectionId)) {
            this.musclePhases.set(connectionId, Math.random() * Math.PI * 2);
            
            // Some connections change length quickly, others slowly
            this.muscleRates.set(connectionId, 0.1 + Math.random() * 5.0); // Much wider range of rates
            
            // Some connections barely change, others dramatically
            this.muscleStrengths.set(connectionId, Math.random() * Math.random() * 0.8); // Up to 80% change
          }
          
          // Get base rest length for this connection
          const baseRestLength = jointComponent.restLengths.get(connectedJointId) || 
                               jointComponent.defaultRestLength;
          
          // Update muscle phase
          const phase = this.musclePhases.get(connectionId);
          const rate = this.muscleRates.get(connectionId);
          this.musclePhases.set(connectionId, phase + elapsedTime * rate);
          
          // Calculate muscle contraction factor
          // Some muscles will contract completely randomly
          let contractionFactor;
          
          // 30% chance of completely random contraction
          if (Math.random() < 0.3) {
            contractionFactor = 0.5 + Math.random(); // 50-150% of base length
          } else {
            // Otherwise use oscillating contraction (sine wave)
            const strength = this.muscleStrengths.get(connectionId);
            contractionFactor = 1.0 + Math.sin(this.musclePhases.get(connectionId)) * strength;
          }
          
          // Calculate dynamic rest length
          const dynamicRestLength = baseRestLength * contractionFactor;
          
          // Calculate spring force with dynamic rest length
          const direction = connectedPosition.position.subtract(jointPosition.position);
          const distance = Math.max(0.1, jointPosition.position.distanceTo(connectedPosition.position));
          const stretch = distance - dynamicRestLength;
          
          // Random spring stiffness - higher values for more frenetic movement
          const randomStiffness = jointPhysics.stiffness * (0.2 + Math.random() * 2.0);
          
          // Apply spring force
          const springForce = direction.normalize().multiply(stretch * randomStiffness);
          jointPhysics.force = jointPhysics.force.add(springForce);
          
          // 50% chance of adding rotational force
          if (Math.random() < 0.5) {
            const perpendicular = new Vector2(-direction.y, direction.x).normalize();
            const perpForce = (Math.random() * 2 - 1) * Math.random() * genetics.rotationalForce * 3.0; // Stronger rotation
            jointPhysics.force = jointPhysics.force.add(
              perpendicular.multiply(perpForce)
            );
          }
          
          // Occasionally apply a strong impulse for more dynamic movement
          // This creates sudden jerks and twitches
          if (Math.random() < 0.03) { // 3% chance per connection per update
            const impulseMagnitude = Math.random() * 30.0; // Strong impulse
            const impulseDirection = new Vector2(
              Math.random() * 2 - 1,
              Math.random() * 2 - 1
            ).normalize();
            
            jointPhysics.force = jointPhysics.force.add(
              impulseDirection.multiply(impulseMagnitude)
            );
          }
        }
      }
      
      // Randomly anchor/un-anchor joints occasionally
      if (Math.random() < 0.03) { // 3% chance per update per organism
        const randomJointIndex = Math.floor(Math.random() * organism.jointIds.length);
        if (randomJointIndex < organism.jointIds.length) {
          const randomJointId = organism.jointIds[randomJointIndex];
          const jointEntity = this.world.getEntity(randomJointId);
          if (jointEntity) {
            const joint = jointEntity.getComponent(JointComponent);
            // Flip the anchor state
            joint.isAnchored = !joint.isAnchored;
            
            // Shorter temporary change for more dynamic behavior
            setTimeout(() => {
              if (jointEntity && jointEntity.hasComponent(JointComponent)) {
                jointEntity.getComponent(JointComponent).isAnchored = !joint.isAnchored;
              }
            }, 50 + Math.random() * 200); // Much shorter: 50-250ms
          }
        }
      }
    }
  }
}

export default JointConnectionSystem;