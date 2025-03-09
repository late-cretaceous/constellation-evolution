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
    
    // Create joints
    const jointEntities = [];
    
    // Create different organism structures based on the number of joints
    if (numJoints <= 3) {
      // Triangle structure for small organisms
      this.createTriangleStructure(x, y, organismEntity, organism, jointEntities);
    } else if (numJoints <= 5) {
      // Star structure for medium organisms
      this.createStarStructure(x, y, organismEntity, organism, jointEntities, numJoints);
    } else {
      // Chain + branches structure for larger organisms
      this.createChainStructure(x, y, organismEntity, organism, jointEntities, numJoints);
    }
    
    return organismEntity;
  }
  
  /**
   * Create a triangular organism structure
   * @private
   */
  createTriangleStructure(x, y, organismEntity, organism, jointEntities) {
    // Create center joint
    const centerJoint = this.createJoint(x, y, organismEntity.id);
    organism.jointIds.push(centerJoint.id);
    jointEntities.push(centerJoint);
    
    // Create two more joints in a triangle
    const radius = 25;
    for (let i = 0; i < 2; i++) {
      const angle = (i / 2) * Math.PI * 2;
      const jointX = x + Math.cos(angle) * radius;
      const jointY = y + Math.sin(angle) * radius;
      
      const jointEntity = this.createJoint(jointX, jointY, organismEntity.id);
      organism.jointIds.push(jointEntity.id);
      jointEntities.push(jointEntity);
    }
    
    // Connect joints in a triangle
    this.connectJoints(jointEntities[0], jointEntities[1]);
    this.connectJoints(jointEntities[1], jointEntities[2]);
    this.connectJoints(jointEntities[2], jointEntities[0]);
  }
  
  /**
   * Create a star-shaped organism structure
   * @private
   */
  createStarStructure(x, y, organismEntity, organism, jointEntities, numJoints) {
    // Create center joint
    const centerJoint = this.createJoint(x, y, organismEntity.id);
    organism.jointIds.push(centerJoint.id);
    jointEntities.push(centerJoint);
    
    // Create outer joints in a circle
    const radius = 25;
    for (let i = 0; i < numJoints - 1; i++) {
      const angle = (i / (numJoints - 1)) * Math.PI * 2;
      const jointX = x + Math.cos(angle) * radius;
      const jointY = y + Math.sin(angle) * radius;
      
      const jointEntity = this.createJoint(jointX, jointY, organismEntity.id);
      organism.jointIds.push(jointEntity.id);
      jointEntities.push(jointEntity);
    }
    
    // Connect outer joints to center joint
    for (let i = 1; i < jointEntities.length; i++) {
      this.connectJoints(centerJoint, jointEntities[i]);
    }
    
    // Connect some outer joints to each other (not all, to avoid rigid structure)
    for (let i = 1; i < jointEntities.length; i++) {
      const nextIndex = (i % (jointEntities.length - 1)) + 1;
      this.connectJoints(jointEntities[i], jointEntities[nextIndex]);
    }
  }
  
  /**
   * Create a chain-based organism structure with branches
   * @private
   */
  createChainStructure(x, y, organismEntity, organism, jointEntities, numJoints) {
    // Create a backbone chain
    const chainLength = Math.min(5, numJoints - 1);
    const spacing = 20;
    
    // Create first joint
    const firstJoint = this.createJoint(x, y, organismEntity.id);
    organism.jointIds.push(firstJoint.id);
    jointEntities.push(firstJoint);
    
    // Create the chain
    let prevJoint = firstJoint;
    for (let i = 0; i < chainLength; i++) {
      const jointX = x + (i + 1) * spacing;
      const jointY = y;
      
      const jointEntity = this.createJoint(jointX, jointY, organismEntity.id);
      organism.jointIds.push(jointEntity.id);
      jointEntities.push(jointEntity);
      
      // Connect to previous joint
      this.connectJoints(prevJoint, jointEntity);
      prevJoint = jointEntity;
    }
    
    // Add branches if we have more joints to allocate
    let remainingJoints = numJoints - jointEntities.length;
    let branchIndex = 0;
    
    while (remainingJoints > 0 && branchIndex < chainLength) {
      // Choose a joint from the backbone to branch from
      const baseJoint = jointEntities[branchIndex + 1]; // Skip the first joint
      
      // Create a branch joint
      const angle = Math.PI / 2; // Branch upward
      const branchX = x + (branchIndex + 1) * spacing;
      const branchY = y - spacing;
      
      const branchJoint = this.createJoint(branchX, branchY, organismEntity.id);
      organism.jointIds.push(branchJoint.id);
      jointEntities.push(branchJoint);
      
      // Connect to base joint
      this.connectJoints(baseJoint, branchJoint);
      
      remainingJoints--;
      branchIndex += 2; // Skip a joint for the next branch
    }
    
    // If we still have joints to allocate, add them as a second level of branches
    branchIndex = 0;
    while (remainingJoints > 0 && branchIndex < jointEntities.length - chainLength - 1) {
      const baseJoint = jointEntities[chainLength + 1 + branchIndex];
      
      // Create a second-level branch
      const branchX = baseJoint.getComponent(PositionComponent).position.x;
      const branchY = baseJoint.getComponent(PositionComponent).position.y - spacing;
      
      const branchJoint = this.createJoint(branchX, branchY, organismEntity.id);
      organism.jointIds.push(branchJoint.id);
      jointEntities.push(branchJoint);
      
      // Connect to base joint
      this.connectJoints(baseJoint, branchJoint);
      
      remainingJoints--;
      branchIndex++;
    }
  }
  
  /**
   * Helper method to connect two joints
   * @private
   */
  connectJoints(jointEntityA, jointEntityB) {
    const jointComponentA = jointEntityA.getComponent(JointComponent);
    const jointComponentB = jointEntityB.getComponent(JointComponent);
    const positionA = jointEntityA.getComponent(PositionComponent);
    const positionB = jointEntityB.getComponent(PositionComponent);
    
    // Calculate rest length
    const restLength = positionA.position.distanceTo(positionB.position);
    
    // Add connections
    jointComponentA.connections.push(jointEntityB.id);
    jointComponentA.restLengths.set(jointEntityB.id, restLength);
    
    jointComponentB.connections.push(jointEntityA.id);
    jointComponentB.restLengths.set(jointEntityA.id, restLength);
  }
}

export default EntityFactory;