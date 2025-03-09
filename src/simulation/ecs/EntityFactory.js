// src/simulation/ecs/EntityFactory.js
import { PositionComponent } from "./components/PositionComponent";
import { VelocityComponent } from "./components/VelocityComponent";
import { PhysicsComponent } from "./components/PhysicsComponent";
import { JointComponent } from "./components/JointComponent";
import { OrganismComponent } from "./components/OrganismComponent";
import { GeneticComponent } from "./components/GeneticComponent";
import { RenderComponent } from "./components/RenderComponent";
import { FitnessComponent } from "./components/FitnessComponent";
import { FoodComponent } from "./components/FoodComponent";
import { FOOD_RADIUS, JOINT_RADIUS } from "../constants";
import { Vector2 } from "./utils/Vector2";

/**
 * Factory class to simplify creation of common entities
 * Updated to use deterministic body plans from genetic seeds
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
    foodEntity.addComponent(
      new RenderComponent("food", "#ffff00", FOOD_RADIUS)
    );

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

    jointEntity.addComponent(
      new RenderComponent("joint", "#ffffff", JOINT_RADIUS)
    );

    return jointEntity;
  }

  /**
   * Create an organism entity with a body plan derived from genetic seed
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} numJoints - Number of joints to create
   * @param {GeneticComponent} geneticComponent - Genetic component to use
   * @returns {Entity} - The created organism entity
   */
  createOrganism(x, y, numJoints, geneticComponent = null) {
    const organismEntity = this.world.createEntity();
    const organism = new OrganismComponent();
    organismEntity.addComponent(organism);
    organismEntity.addComponent(new FitnessComponent());

    // Use provided genetics or create new
    const genetics = geneticComponent || new GeneticComponent();
    organismEntity.addComponent(genetics);

    // Generate body plan based on genetic seed
    this.generateBodyPlan(x, y, numJoints, organismEntity, organism, genetics);

    return organismEntity;
  }

  /**
   * Generate a body plan based on genetic seed
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} numJoints - Number of joints to create
   * @param {Entity} organismEntity - The organism entity
   * @param {OrganismComponent} organism - The organism component
   * @param {GeneticComponent} genetics - The genetic component
   */
  generateBodyPlan(x, y, numJoints, organismEntity, organism, genetics) {
    // Use genetic seed to determine body plan type
    // This creates deterministic body plans for each genetic seed
    const seed = genetics.bodyPlanSeed;
    
    if (seed < 0.33) {
      this.createRadialBodyPlan(x, y, numJoints, organismEntity, organism);
    } else if (seed < 0.66) {
      this.createChainBodyPlan(x, y, numJoints, organismEntity, organism);
    } else {
      this.createTreeBodyPlan(x, y, numJoints, organismEntity, organism);
    }
  }

  /**
   * Create a radial body plan (joints in a circle around a center)
   * @private
   */
  createRadialBodyPlan(x, y, numJoints, organismEntity, organism) {
    // Create center joint
    const centerJoint = this.createJoint(x, y, organismEntity.id);
    organism.jointIds.push(centerJoint.id);
    
    // Create outer joints in a circle
    const radius = 30;
    const outerJoints = [];
    
    for (let i = 0; i < numJoints - 1; i++) {
      const angle = (i / (numJoints - 1)) * Math.PI * 2;
      const jointX = x + Math.cos(angle) * radius;
      const jointY = y + Math.sin(angle) * radius;
      
      const jointEntity = this.createJoint(jointX, jointY, organismEntity.id);
      organism.jointIds.push(jointEntity.id);
      outerJoints.push(jointEntity);
    }
    
    // Connect outer joints to center
    for (const outerJoint of outerJoints) {
      this.connectJoints(centerJoint, outerJoint);
    }
    
    // Connect adjacent outer joints
    for (let i = 0; i < outerJoints.length; i++) {
      const nextIndex = (i + 1) % outerJoints.length;
      this.connectJoints(outerJoints[i], outerJoints[nextIndex]);
    }
  }

  /**
   * Create a chain body plan (joints in a line)
   * @private
   */
  createChainBodyPlan(x, y, numJoints, organismEntity, organism) {
    const jointEntities = [];
    const spacing = 25;
    
    // Create joints in a line
    for (let i = 0; i < numJoints; i++) {
      const jointX = x + (i * spacing);
      const jointY = y;
      
      const jointEntity = this.createJoint(jointX, jointY, organismEntity.id);
      organism.jointIds.push(jointEntity.id);
      jointEntities.push(jointEntity);
    }
    
    // Connect adjacent joints
    for (let i = 0; i < jointEntities.length - 1; i++) {
      this.connectJoints(jointEntities[i], jointEntities[i + 1]);
    }
  }

  /**
   * Create a tree body plan (branching structure)
   * @private
   */
  createTreeBodyPlan(x, y, numJoints, organismEntity, organism) {
    // Start with a trunk (central line)
    const trunkLength = Math.min(Math.floor(numJoints / 2), 4);
    const jointEntities = [];
    const spacing = 25;
    
    // Create trunk joints
    for (let i = 0; i < trunkLength; i++) {
      const jointX = x;
      const jointY = y + (i * spacing);
      
      const jointEntity = this.createJoint(jointX, jointY, organismEntity.id);
      organism.jointIds.push(jointEntity.id);
      jointEntities.push(jointEntity);
    }
    
    // Connect trunk joints
    for (let i = 0; i < trunkLength - 1; i++) {
      this.connectJoints(jointEntities[i], jointEntities[i + 1]);
    }
    
    // Add branches
    const remainingJoints = numJoints - trunkLength;
    let branchJointCount = 0;
    
    // Create branches from each trunk joint except the top one
    for (let i = 0; i < trunkLength - 1 && branchJointCount < remainingJoints; i++) {
      // Branch left
      if (branchJointCount < remainingJoints) {
        const branchX = x - spacing;
        const branchY = y + (i * spacing);
        
        const branchJoint = this.createJoint(branchX, branchY, organismEntity.id);
        organism.jointIds.push(branchJoint.id);
        jointEntities.push(branchJoint);
        
        // Connect to trunk
        this.connectJoints(jointEntities[i], branchJoint);
        branchJointCount++;
      }
      
      // Branch right
      if (branchJointCount < remainingJoints) {
        const branchX = x + spacing;
        const branchY = y + (i * spacing);
        
        const branchJoint = this.createJoint(branchX, branchY, organismEntity.id);
        organism.jointIds.push(branchJoint.id);
        jointEntities.push(branchJoint);
        
        // Connect to trunk
        this.connectJoints(jointEntities[i], branchJoint);
        branchJointCount++;
      }
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
    const distance = positionA.position.distanceTo(positionB.position);
    const restLength = distance; // Default rest length is the initial distance

    // Add connections
    jointComponentA.connections.push(jointEntityB.id);
    jointComponentA.restLengths.set(jointEntityB.id, restLength);

    jointComponentB.connections.push(jointEntityA.id);
    jointComponentB.restLengths.set(jointEntityA.id, restLength);
  }
}

export default EntityFactory;