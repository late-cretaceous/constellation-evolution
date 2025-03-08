import Vector2 from './Vector2';
import Joint from './Joint';
import Gene from './Gene';
import { 
  EATING_DISTANCE, 
  FOOD_VALUE, 
  MIN_JOINT_COUNT, 
  MAX_JOINT_COUNT,
  DEFAULT_JOINT_COUNT
} from '../constants';

/**
 * Represents an organism composed of multiple joints
 */
export class Organism {
  /**
   * Create a new organism
   * @param {Vector2} position - Center position
   * @param {number} numJoints - Number of joints (optional)
   * @param {Gene} gene - Genetic information (optional)
   */
  constructor(position, numJoints = DEFAULT_JOINT_COUNT, gene = null) {
    this.position = position;
    this.joints = [];
    this.fitness = 0;
    this.foodEaten = 0;
    
    // Create or copy gene
    this.gene = gene || new Gene();
    
    // Create joints in a connected structure
    this.createJoints(numJoints);
  }
  
  /**
   * Create joints in a circular pattern around the center
   * @param {number} numJoints - Number of joints to create
   */
  createJoints(numJoints) {
    // Create the first joint at the organism's position
    const firstJoint = new Joint(
      new Vector2(this.position.x, this.position.y),
      this.gene,
      this
    );
    this.joints.push(firstJoint);
    
    // Create additional joints in a circular pattern
    const radius = 20;
    for (let i = 1; i < numJoints; i++) {
      const angle = (i / numJoints) * Math.PI * 2;
      const jointPos = new Vector2(
        this.position.x + Math.cos(angle) * radius,
        this.position.y + Math.sin(angle) * radius
      );
      
      const newJoint = new Joint(jointPos, this.gene, this);
      this.joints.push(newJoint);
    }
    
    // Connect joints in a complete graph
    for (let i = 0; i < this.joints.length; i++) {
      for (let j = i + 1; j < this.joints.length; j++) {
        this.joints[i].addConnection(this.joints[j]);
        this.joints[j].addConnection(this.joints[i]);
      }
    }
  }
  
  /**
   * Update the organism's state
   * @param {Array} foods - Array of food objects
   */
  update(foods) {
    // Update all joints
    for (const joint of this.joints) {
      joint.update(foods);
    }
    
    // Check for food consumption
    this.checkFoodConsumption(foods);
    
    // Update organism position (average of joints)
    let centerX = 0;
    let centerY = 0;
    for (const joint of this.joints) {
      centerX += joint.position.x;
      centerY += joint.position.y;
    }
    this.position = new Vector2(
      centerX / this.joints.length,
      centerY / this.joints.length
    );
  }
  
  /**
   * Check if the organism can consume any nearby food
   * @param {Array} foods - Array of food objects
   */
  checkFoodConsumption(foods) {
    for (let i = foods.length - 1; i >= 0; i--) {
      const food = foods[i];
      
      // If any joint is close to food, eat it
      for (const joint of this.joints) {
        if (joint.position.distanceTo(food.position) < EATING_DISTANCE) {
          this.fitness += FOOD_VALUE;
          this.foodEaten++;
          foods.splice(i, 1);
          break;
        }
      }
    }
  }
  
  /**
   * Draw the organism on the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  draw(ctx) {
    // Draw joints and connections
    for (const joint of this.joints) {
      joint.draw(ctx);
    }
    
    // Draw fitness value above organism
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '10px Arial';
    ctx.fillText(this.fitness, this.position.x, this.position.y - 20);
    
    // Draw joint count below organism
    ctx.fillStyle = '#8AF';
    ctx.fillText(this.joints.length + " joints", this.position.x, this.position.y + 20);
  }
  
  /**
   * Create a child organism with possibly mutated genes
   * @param {number} mutationRate - Rate of mutation
   * @returns {Organism} - A new child organism
   */
  reproduce(mutationRate) {
    const childPos = new Vector2(
      this.position.x + (Math.random() * 40 - 20),
      this.position.y + (Math.random() * 40 - 20)
    );
    
    // Mutate genes
    const childGene = this.gene.mutate(mutationRate);
    
    // Number of joints can sometimes change
    let childJointCount = this.joints.length;
    if (Math.random() < 0.1) {
      childJointCount += Math.floor(Math.random() * 3) - 1;
      childJointCount = Math.max(MIN_JOINT_COUNT, Math.min(MAX_JOINT_COUNT, childJointCount));
    }
    
    return new Organism(childPos, childJointCount, childGene);
  }
}

export default Organism;
