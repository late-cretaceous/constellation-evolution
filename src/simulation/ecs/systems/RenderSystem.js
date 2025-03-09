// src/simulation/ecs/systems/RenderSystem.js
import { System } from '../System';
import { RenderComponent } from '../components/RenderComponent';
import { PositionComponent } from '../components/PositionComponent';
import { JointComponent } from '../components/JointComponent';
import { OrganismComponent } from '../components/OrganismComponent';
import { FitnessComponent } from '../components/FitnessComponent';
import { FoodComponent } from '../components/FoodComponent';

/**
 * System that handles rendering entities on the canvas
 */
export class RenderSystem extends System {
  /**
   * Create a new render system
   * @param {World} world - Reference to the world
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  constructor(world, ctx) {
    super(world);
    this.ctx = ctx;
  }

  /**
   * Render all entities on the canvas
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.fillStyle = '#000033';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Draw food
    const foodEntities = this.world.getEntitiesWithComponent(FoodComponent);
    for (const foodEntity of foodEntities) {
      const position = foodEntity.getComponent(PositionComponent);
      const render = foodEntity.getComponent(RenderComponent);
      
      this.ctx.beginPath();
      this.ctx.arc(position.position.x, position.position.y, render.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = render.color;
      this.ctx.fill();
      this.ctx.closePath();
    }
    
    // Draw organisms and joints
    const organismEntities = this.world.getEntitiesWithComponent(OrganismComponent);
    
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      const fitness = organismEntity.getComponent(FitnessComponent);
      
      // Calculate organism center position (average of joint positions)
      let centerX = 0;
      let centerY = 0;
      const jointEntities = [];
      
      for (const jointId of organism.jointIds) {
        const jointEntity = this.world.getEntity(jointId);
        if (!jointEntity) continue;
        
        jointEntities.push(jointEntity);
        const position = jointEntity.getComponent(PositionComponent);
        centerX += position.position.x;
        centerY += position.position.y;
      }
      
      if (jointEntities.length === 0) continue;
      
      centerX /= jointEntities.length;
      centerY /= jointEntities.length;
      
      // Draw connections between joints
      for (const jointEntity of jointEntities) {
        const joint = jointEntity.getComponent(JointComponent);
        const position = jointEntity.getComponent(PositionComponent);
        
        // Draw connections
        this.ctx.beginPath();
        for (const connectedJointId of joint.connections) {
          const connectedEntity = this.world.getEntity(connectedJointId);
          if (!connectedEntity) continue;
          
          const connectedPosition = connectedEntity.getComponent(PositionComponent);
          
          this.ctx.moveTo(position.position.x, position.position.y);
          this.ctx.lineTo(connectedPosition.position.x, connectedPosition.position.y);
        }
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.closePath();
        
        // Draw joint
        this.ctx.beginPath();
        this.ctx.arc(position.position.x, position.position.y, joint.radius, 0, Math.PI * 2);
        
        // Different colors for anchored vs. moving
        if (joint.isAnchored) {
          this.ctx.fillStyle = '#ff0000'; // Red for anchored
        } else {
          this.ctx.fillStyle = '#00ff00'; // Green for moving
        }
        this.ctx.fill();
        this.ctx.closePath();
      }
      
      // Draw fitness value above organism
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = 'center';
      this.ctx.font = '10px Arial';
      this.ctx.fillText(fitness.fitness, centerX, centerY - 20);
      
      // Draw joint count below organism
      this.ctx.fillStyle = '#8AF';
      this.ctx.fillText(organism.jointIds.length + " joints", centerX, centerY + 20);
    }
  }
}

export default RenderSystem;
