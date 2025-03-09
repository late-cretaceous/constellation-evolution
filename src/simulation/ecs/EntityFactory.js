// src/simulation/ecs/EntityFactory.js
import { PositionComponent } from './components/PositionComponent';
import { VelocityComponent } from './components/VelocityComponent';
import { PhysicsComponent } from './components/PhysicsComponent';
import { JointComponent } from './components/JointComponent';
import { OrganismComponent } from './components/OrganismComponent';
import { GeneticComponent } from './components/GeneticComponent';
import { RenderComponent } from './components/RenderComponent';
import { FitnessComponent } from './components/FitnessComponent';
import { FoodComponent } from './components/FoodComponent';
import { FOOD_RADIUS, JOINT_RADIUS } from '../constants';

/**
 * Factory class to simplify creation of common entities
 */
export class EntityFactory {
  /**
   * Create a new entity factory
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    this.world = world;
  }

  /**
   * Create a food entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {Entity} - The created food entity
   */
  createFood(x, y) {
    const foodEntity = this.world.createEntity();
    
    foodEntity.addComponent(new PositionComponent(x, y));
    foodEntity.addComponent(new FoodComponent());
    foodEntity.addComponent(new RenderComponent('food', '#ffff00', FOOD_RADIUS));
    
    return foodEntity;
  }

  /**
   * Create a joint entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} organismId - ID of the parent organism entity
   * @param {boolean} isAnchored - Whether the joint is anchored
   * @returns {Entity} - The created joint entity
   */
  createJoint(x, y, organismId, isAnchored = false) {
    const jointEntity = this.world.createEntity();
    
    jointEntity.addComponent(new PositionComponent(x, y));
    jointEntity.addComponent(new VelocityComponent());
    jointEntity.addComponent(new PhysicsComponent());
    
    const joint = new JointComponent(organismId);
    joint.isAnchored = isAnchored;
    jointEntity.addComponent(joint);
    
    jointEntity.addComponent(new RenderComponent('joint', '#ffffff', JOINT_RADIUS));
    
    return jointEntity;
  }

  /**
   * Create an organism entity with joints
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} numJoints - Number of joints to create
   * @param {GeneticComponent} geneticComponent - Optional genetic component to use
   * @returns {Entity} - The created organism entity
   */
  createOrganism(x, y, numJoints, geneticComponent = null) {
    const organismEntity = this.world.createEntity();
    const organism = new OrganismComponent();
    organismEntity.addComponent(organism);
    
    organismEntity.addComponent(new FitnessComponent());
    
    const genetics = geneticComponent || new GeneticComponent();
    organismEntity.addComponent(genetics);
    
    // Create the first joint at the organism's position
    const firstJointEntity = this.createJoint(x, y, organismEntity.id);
    organism.jointIds.push(firstJointEntity.id);
    
    // Create additional joints in a circular pattern
    const radius = 20;
    const jointEntities = [firstJointEntity];
    
    for (let i = 1; i < numJoints; i++) {
      const angle = (i / numJoints) * Math.PI * 2;
      const jointX = x + Math.cos(angle) * radius;
      const jointY = y + Math.sin(angle) * radius;
      
      const jointEntity = this.createJoint(jointX, jointY, organismEntity.id);
      organism.jointIds.push(jointEntity.id);
      jointEntities.push(jointEntity);
    }
    
    // Connect joints in a complete graph
    for (let i = 0; i < jointEntities.length; i++) {
      const jointA = jointEntities[i];
      const jointComponentA = jointA.getComponent(JointComponent);
      const positionA = jointA.getComponent(PositionComponent);
      
      for (let j = i + 1; j < jointEntities.length; j++) {
        const jointB = jointEntities[j];
        const jointComponentB = jointB.getComponent(JointComponent);
        const positionB = jointB.getComponent(PositionComponent);
        
        // Calculate rest length
        const restLength = positionA.position.distanceTo(positionB.position);
        
        // Add connections
        jointComponentA.connections.push(jointB.id);
        jointComponentA.restLengths.set(jointB.id, restLength);
        
        jointComponentB.connections.push(jointA.id);
        jointComponentB.restLengths.set(jointA.id, restLength);
      }
    }
    
    return organismEntity;
  }
}

export default EntityFactory;
