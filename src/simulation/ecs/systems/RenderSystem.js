// src/simulation/ecs/systems/RenderSystem.js
import { System } from '../System';
import { RenderComponent } from '../components/RenderComponent';
import { PositionComponent } from '../components/PositionComponent';
import { JointComponent } from '../components/JointComponent';
import { OrganismComponent } from '../components/OrganismComponent';
import { FitnessComponent } from '../components/FitnessComponent';
import { FoodComponent } from '../components/FoodComponent';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants';

/**
 * System that handles rendering entities on the canvas with high-DPI support
 * and responsive scaling
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
    
    // Rendering configuration
    this.foodColor = '#ffff00';      // Bright yellow for food
    this.anchoredJointColor = '#ff3030'; // Brighter red for anchored joints
    this.movingJointColor = '#40ff40';   // Brighter green for moving joints
    this.connectionColor = '#ffffff';    // White for connections
    this.textColor = '#ffffff';          // White for fitness text
    this.jointCountColor = '#8AF';       // Blue for joint count display
    this.backgroundColor = '#000033';    // Dark blue background
    
    // Text configuration
    this.fitnessFontSize = 12;
    this.jointCountFontSize = 10;
    this.textFont = 'Arial';
    this.textStrokeWidth = 2;
    this.textStrokeColor = '#000000';    // Black for text outlines

    // Line rendering
    this.connectionLineWidth = 2;
  }

  /**
   * Render all entities on the canvas with improved visual quality
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    if (!this.ctx) return;
    
    // Get the simulation to display scaling factor
    const scale = this.getSimulationScale();
    
    // Cache canvas dimensions for calculations
    const canvasWidth = this.ctx.canvas.width / (this.ctx.pixelRatio || 1);
    const canvasHeight = this.ctx.canvas.height / (this.ctx.pixelRatio || 1);
    
    // Clear canvas with improved color
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Apply simulation to display scaling
    this.ctx.save();
    this.ctx.scale(scale, scale);
    
    // Draw food with improved rendering
    const foodEntities = this.world.getEntitiesWithComponent(FoodComponent);
    this.renderFoodEntities(foodEntities);
    
    // Draw organisms and joints with improved rendering
    const organismEntities = this.world.getEntitiesWithComponent(OrganismComponent);
    this.renderOrganisms(organismEntities);
    
    // Restore original transform
    this.ctx.restore();
  }

  /**
   * Get the simulation to display scaling factor
   * @returns {number} - The scaling factor
   */
  getSimulationScale() {
    if (this.ctx.simulationScale) {
      // Use the scale set by the canvas component
      return this.ctx.simulationScale;
    }
    
    // Fallback: calculate based on canvas size
    const canvasWidth = this.ctx.canvas.width / (this.ctx.pixelRatio || 1);
    return canvasWidth / CANVAS_WIDTH;
  }

  /**
   * Render food entities with improved visuals
   * @param {Entity[]} foodEntities - Array of food entities
   */
  renderFoodEntities(foodEntities) {
    for (const foodEntity of foodEntities) {
      const position = foodEntity.getComponent(PositionComponent);
      const render = foodEntity.getComponent(RenderComponent);
      
      this.ctx.beginPath();
      this.ctx.arc(position.position.x, position.position.y, render.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.foodColor;
      
      // Add a subtle glow effect to food
      const gradient = this.ctx.createRadialGradient(
        position.position.x, position.position.y, render.radius * 0.5,
        position.position.x, position.position.y, render.radius * 1.2
      );
      gradient.addColorStop(0, this.foodColor);
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      
      // Draw the glow
      this.ctx.save();
      this.ctx.globalAlpha = 0.4;
      this.ctx.beginPath();
      this.ctx.arc(position.position.x, position.position.y, render.radius * 1.5, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
      this.ctx.restore();
      
      // Draw the food
      this.ctx.beginPath();
      this.ctx.arc(position.position.x, position.position.y, render.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.foodColor;
      this.ctx.fill();
      this.ctx.closePath();
    }
  }

  /**
   * Render organisms with improved visuals
   * @param {Entity[]} organismEntities - Array of organism entities
   */
  renderOrganisms(organismEntities) {
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
      
      // Draw connections between joints with improved rendering
      this.renderJointConnections(jointEntities);
      
      // Draw joints with improved rendering
      this.renderJoints(jointEntities);
      
      // Draw fitness value above organism with improved text rendering
      this.renderOrganismText(centerX, centerY, fitness.fitness, organism.jointIds.length);
    }
  }

  /**
   * Render connections between joints with improved visuals
   * @param {Entity[]} jointEntities - Array of joint entities
   */
  renderJointConnections(jointEntities) {
    // Draw all connections first
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.connectionColor;
    this.ctx.lineWidth = this.connectionLineWidth;
    
    for (const jointEntity of jointEntities) {
      const joint = jointEntity.getComponent(JointComponent);
      const position = jointEntity.getComponent(PositionComponent);
      
      // Draw connections
      for (const connectedJointId of joint.connections) {
        const connectedEntity = this.world.getEntity(connectedJointId);
        if (!connectedEntity) continue;
        
        const connectedPosition = connectedEntity.getComponent(PositionComponent);
        
        this.ctx.moveTo(position.position.x, position.position.y);
        this.ctx.lineTo(connectedPosition.position.x, connectedPosition.position.y);
      }
    }
    
    this.ctx.stroke();
    this.ctx.closePath();
  }

  /**
   * Render joints with improved visuals
   * @param {Entity[]} jointEntities - Array of joint entities
   */
  renderJoints(jointEntities) {
    for (const jointEntity of jointEntities) {
      const joint = jointEntity.getComponent(JointComponent);
      const position = jointEntity.getComponent(PositionComponent);
      
      // Draw joint
      this.ctx.beginPath();
      this.ctx.arc(position.position.x, position.position.y, joint.radius, 0, Math.PI * 2);
      
      // Different colors for anchored vs. moving with subtle glow
      if (joint.isAnchored) {
        // Add subtle glow to anchored joints
        const gradient = this.ctx.createRadialGradient(
          position.position.x, position.position.y, joint.radius * 0.5,
          position.position.x, position.position.y, joint.radius * 1.2
        );
        gradient.addColorStop(0, this.anchoredJointColor);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        // Draw glow
        this.ctx.save();
        this.ctx.globalAlpha = 0.4;
        this.ctx.beginPath();
        this.ctx.arc(position.position.x, position.position.y, joint.radius * 1.3, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.restore();
        
        // Draw joint
        this.ctx.beginPath();
        this.ctx.arc(position.position.x, position.position.y, joint.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.anchoredJointColor;
      } else {
        // Add subtle glow to moving joints
        const gradient = this.ctx.createRadialGradient(
          position.position.x, position.position.y, joint.radius * 0.5,
          position.position.x, position.position.y, joint.radius * 1.2
        );
        gradient.addColorStop(0, this.movingJointColor);
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        
        // Draw glow
        this.ctx.save();
        this.ctx.globalAlpha = 0.4;
        this.ctx.beginPath();
        this.ctx.arc(position.position.x, position.position.y, joint.radius * 1.3, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.restore();
        
        // Draw joint
        this.ctx.beginPath();
        this.ctx.arc(position.position.x, position.position.y, joint.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.movingJointColor;
      }
      
      this.ctx.fill();
      this.ctx.closePath();
    }
  }

  /**
   * Render text for an organism with improved text rendering
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} fitness - Fitness value
   * @param {number} jointCount - Number of joints
   */
  renderOrganismText(x, y, fitness, jointCount) {
    // Draw fitness value above organism
    this.ctx.textAlign = 'center';
    this.ctx.font = `bold ${this.fitnessFontSize}px ${this.textFont}`;
    
    // Draw text shadow/outline for better readability
    this.ctx.strokeStyle = this.textStrokeColor;
    this.ctx.lineWidth = this.textStrokeWidth;
    this.ctx.strokeText(Math.round(fitness), x, y - 20);
    
    // Draw text
    this.ctx.fillStyle = this.textColor;
    this.ctx.fillText(Math.round(fitness), x, y - 20);
    
    // Draw joint count below organism
    this.ctx.font = `${this.jointCountFontSize}px ${this.textFont}`;
    
    // Draw text shadow/outline
    this.ctx.strokeStyle = this.textStrokeColor;
    this.ctx.lineWidth = this.textStrokeWidth;
    this.ctx.strokeText(`${jointCount} joints`, x, y + 20);
    
    // Draw text
    this.ctx.fillStyle = this.jointCountColor;
    this.ctx.fillText(`${jointCount} joints`, x, y + 20);
  }
}

export default RenderSystem;