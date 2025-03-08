import Vector2 from './Vector2';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  JOINT_RADIUS,
  JOINT_REST_LENGTH,
  JOINT_STIFFNESS,
  JOINT_DAMPING
} from '../constants';

/**
 * Represents a single joint in an organism
 * Can be anchored (fixed) or moving
 */
export class Joint {
  /**
   * Create a new Joint
   * @param {Vector2} position - Initial position
   * @param {Gene} gene - Reference to genetic information
   * @param {Organism} parentOrganism - Reference to parent organism
   */
  constructor(position, gene, parentOrganism) {
    this.position = position;
    this.velocity = new Vector2(0, 0);
    this.force = new Vector2(0, 0);
    this.isAnchored = false;
    this.gene = gene;
    this.organism = parentOrganism;
    this.mass = 1;
    this.connections = [];
    this.restLength = JOINT_REST_LENGTH;
    this.stiffness = JOINT_STIFFNESS;
    this.damping = JOINT_DAMPING;
  }
  
  /**
   * Add a connection to another joint
   * @param {Joint} joint - The joint to connect to
   */
  addConnection(joint) {
    if (!this.connections.includes(joint)) {
      this.connections.push(joint);
      // Store the rest length for this connection
      this.restLength = this.position.distanceTo(joint.position);
    }
  }
  
  /**
   * Update joint physics and state
   * @param {Array} foods - Array of food objects in the simulation
   */
  update(foods) {
    // First determine state based on nearby food
    this.determineState(foods);
    
    // If anchored, don't move
    if (this.isAnchored) {
      this.velocity = new Vector2(0, 0);
      return;
    }
    
    // Reset force
    this.force = new Vector2(0, 0);
    
    // Check if the organism has at least one anchored joint
    const hasAnchor = this.organism.joints.some(joint => joint.isAnchored);
    
    // Apply spring forces from connections
    for (const connectedJoint of this.connections) {
      const direction = connectedJoint.position.subtract(this.position);
      const distance = Math.max(0.1, this.position.distanceTo(connectedJoint.position));
      const stretch = distance - this.restLength;
      
      // Hooke's law F = kx
      let springForce = direction.normalize().multiply(stretch * this.stiffness);
      
      // If the connected joint is anchored, apply stronger force (pulling toward anchor)
      if (connectedJoint.isAnchored) {
        springForce = springForce.multiply(3);
      }
      
      this.force = this.force.add(springForce);
    }
    
    // If the organism has no anchors, greatly reduce movement ability
    if (!hasAnchor) {
      this.force = this.force.multiply(0.1);
      this.velocity = this.velocity.multiply(0.8); // Extra damping when not anchored
    }
    
    // Apply force based on mass (F = ma)
    const acceleration = this.force.multiply(1 / this.mass);
    
    // Update velocity with acceleration
    this.velocity = this.velocity.add(acceleration);
    
    // Apply damping
    this.velocity = this.velocity.multiply(this.damping);
    
    // Update position
    this.position = this.position.add(this.velocity);
    
    // Boundary checks
    if (this.position.x < 0) {
      this.position.x = 0;
      this.velocity.x *= -0.5;
    }
    if (this.position.x > CANVAS_WIDTH) {
      this.position.x = CANVAS_WIDTH;
      this.velocity.x *= -0.5;
    }
    if (this.position.y < 0) {
      this.position.y = 0;
      this.velocity.y *= -0.5;
    }
    if (this.position.y > CANVAS_HEIGHT) {
      this.position.y = CANVAS_HEIGHT;
      this.velocity.y *= -0.5;
    }
  }
  
  /**
   * Determine if this joint should be anchored based on nearby food
   * @param {Array} foods - Array of food objects in the simulation
   */
  determineState(foods) {
    // Find the closest food
    let closestFoodDistance = Number.MAX_VALUE;
    let closestFood = null;
    
    for (const food of foods) {
      const distance = this.position.distanceTo(food.position);
      if (distance < closestFoodDistance) {
        closestFoodDistance = distance;
        closestFood = food;
      }
    }
    
    // Check current anchor ratio in the organism
    const anchoredJoints = this.organism.joints.filter(j => j.isAnchored).length;
    const totalJoints = this.organism.joints.length;
    const currentAnchorRatio = anchoredJoints / totalJoints;
    
    // If there's food within sensor range
    if (closestFood && closestFoodDistance < this.gene.sensorDistance) {
      // Calculate normalized distance (1.0 when at sensor edge, 0.0 when at food)
      const normalizedDistance = closestFoodDistance / this.gene.sensorDistance;
      
      // Check thresholds to determine state
      if (normalizedDistance < this.gene.anchorThreshold) {
        // Very close to food - anchor
        this.isAnchored = true;
      } else if (normalizedDistance < this.gene.moveThreshold) {
        // Moderately close - move toward food, but ensure we maintain minimum anchors
        if (currentAnchorRatio < this.gene.anchorRatio && Math.random() < 0.7) {
          this.isAnchored = true; // Become an anchor to maintain ratio
        } else {
          this.isAnchored = false;
          
          // Add force toward food
          const directionToFood = closestFood.position.subtract(this.position).normalize();
          this.force = this.force.add(directionToFood.multiply(0.1));
        }
      } else {
        // Far from food but still in sensor range
        // Make anchor decision based on current ratio
        this.isAnchored = (currentAnchorRatio < this.gene.anchorRatio);
      }
    } else {
      // No food in range - default behavior
      // Some joints should still be anchored based on gene
      if (currentAnchorRatio < this.gene.anchorRatio) {
        this.isAnchored = true;
      } else {
        this.isAnchored = false;
      }
    }
  }
  
  /**
   * Draw the joint on the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  draw(ctx) {
    // Draw joint
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, JOINT_RADIUS, 0, Math.PI * 2);
    
    // Different colors for anchored vs. moving
    if (this.isAnchored) {
      ctx.fillStyle = '#ff0000'; // Red for anchored
    } else {
      ctx.fillStyle = '#00ff00'; // Green for moving
    }
    ctx.fill();
    ctx.closePath();
    
    // Draw connections
    ctx.beginPath();
    for (const connectedJoint of this.connections) {
      ctx.moveTo(this.position.x, this.position.y);
      ctx.lineTo(connectedJoint.position.x, connectedJoint.position.y);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  }
}

export default Joint;
