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
 * Enhanced with viewport support for scrolling and zooming
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
    
    // Viewport culling parameters
    this.cullingEnabled = true;        // Enable viewport culling for performance
    this.cullingPadding = 100;         // Padding around viewport for culling
  }

  /**
   * Render all entities on the canvas with improved visual quality and viewport support
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    if (!this.ctx) return;
    
    // Get viewport info from context
    const viewportOffset = this.ctx.viewportOffset || { x: 0, y: 0 };
    const viewportScale = this.ctx.viewportScale || 1;
    const pixelRatio = this.ctx.pixelRatio || 1;
    
    // Cache canvas dimensions for calculations
    const canvasWidth = this.ctx.canvas.width / pixelRatio;
    const canvasHeight = this.ctx.canvas.height / pixelRatio;
    
    // Calculate viewport bounds for culling
    const viewportBounds = {
      left: -viewportOffset.x / viewportScale - this.cullingPadding,
      top: -viewportOffset.y / viewportScale - this.cullingPadding,
      right: (-viewportOffset.x + canvasWidth) / viewportScale + this.cullingPadding,
      bottom: (-viewportOffset.y + canvasHeight) / viewportScale + this.cullingPadding
    };
    
    // Draw simulation boundaries
    this.renderSimulationBoundaries();
    
    // Clear canvas with improved color - this is now done with a filled rect covering the entire simulation area
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw food with improved rendering
    const foodEntities = this.world.getEntitiesWithComponent(FoodComponent);
    this.renderFoodEntities(foodEntities, viewportBounds);
    
    // Draw organisms and joints with improved rendering
    const organismEntities = this.world.getEntitiesWithComponent(OrganismComponent);
    this.renderOrganisms(organismEntities, viewportBounds);
    
    // Draw mini-map if enabled
    this.renderMiniMap(organismEntities, foodEntities, viewportBounds, canvasWidth, canvasHeight);
  }
  
  /**
   * Render simulation boundaries to show the limits of the simulation area
   */
  renderSimulationBoundaries() {
    // Draw a border around the simulation area
    this.ctx.strokeStyle = 'rgba(100, 100, 255, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid lines
    this.ctx.strokeStyle = 'rgba(50, 50, 150, 0.2)';
    this.ctx.lineWidth = 1;
    
    // Vertical grid lines
    const gridSpacing = 200; // Space between grid lines
    for (let x = gridSpacing; x < CANVAS_WIDTH; x += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CANVAS_HEIGHT);
      this.ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = gridSpacing; y < CANVAS_HEIGHT; y += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CANVAS_WIDTH, y);
      this.ctx.stroke();
    }
  }
  
  /**
   * Check if an entity is within the viewport bounds (with padding)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} bounds - Viewport bounds
   * @param {number} radius - Entity radius for padding
   * @returns {boolean} - True if entity is visible
   */
  isEntityVisible(x, y, bounds, radius = 0) {
    if (!this.cullingEnabled) return true;
    
    return (
      x + radius >= bounds.left &&
      x - radius <= bounds.right &&
      y + radius >= bounds.top &&
      y - radius <= bounds.bottom
    );
  }
  
  /**
   * Render a mini-map in the corner of the screen
   * @param {Entity[]} organismEntities - Organism entities
   * @param {Entity[]} foodEntities - Food entities
   * @param {Object} viewportBounds - Current viewport bounds
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  renderMiniMap(organismEntities, foodEntities, viewportBounds, canvasWidth, canvasHeight) {
    // Minimap should be at most 15% of the smaller dimension
    const maxSize = Math.min(canvasWidth, canvasHeight) * 0.15;
    const mapSize = Math.min(150, maxSize);
    const mapMargin = 10;
    
    // Position in the bottom-right corner
    const mapX = canvasWidth - mapSize - mapMargin;
    const mapY = canvasHeight - mapSize - mapMargin;
    
    // Calculate map scale to fit the entire simulation area
    const mapScale = mapSize / Math.max(CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Save context state
    this.ctx.save();
    
    // Reset transform to draw in screen space
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Draw mini-map background with transparency
    this.ctx.fillStyle = 'rgba(0, 0, 20, 0.7)';
    this.ctx.strokeStyle = 'rgba(100, 100, 255, 0.7)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.rect(mapX, mapY, mapSize, mapSize);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Draw simulation area outline
    this.ctx.strokeStyle = 'rgba(80, 80, 255, 0.8)';
    this.ctx.lineWidth = 0.5;
    this.ctx.strokeRect(
      mapX, 
      mapY, 
      CANVAS_WIDTH * mapScale, 
      CANVAS_HEIGHT * mapScale
    );
    
    // Draw current viewport area
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      mapX + (viewportBounds.left + this.cullingPadding) * mapScale,
      mapY + (viewportBounds.top + this.cullingPadding) * mapScale,
      (viewportBounds.right - viewportBounds.left - this.cullingPadding * 2) * mapScale,
      (viewportBounds.bottom - viewportBounds.top - this.cullingPadding * 2) * mapScale
    );
    
    // Draw organisms as tiny dots
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      let centerX = 0;
      let centerY = 0;
      let count = 0;
      
      for (const jointId of organism.jointIds) {
        const jointEntity = this.world.getEntity(jointId);
        if (!jointEntity) continue;
        
        const position = jointEntity.getComponent(PositionComponent);
        centerX += position.position.x;
        centerY += position.position.y;
        count++;
      }
      
      if (count > 0) {
        centerX /= count;
        centerY /= count;
        
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(
          mapX + centerX * mapScale, 
          mapY + centerY * mapScale, 
          1.5, 0, Math.PI * 2
        );
        this.ctx.fill();
      }
    }
    
    // Draw food as tiny yellow dots
    for (const foodEntity of foodEntities) {
      const position = foodEntity.getComponent(PositionComponent);
      
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      this.ctx.beginPath();
      this.ctx.arc(
        mapX + position.position.x * mapScale, 
        mapY + position.position.y * mapScale, 
        0.8, 0, Math.PI * 2
      );
      this.ctx.fill();
    }
    
    // Add label to the minimap
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = '8px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Map', mapX + mapSize - 4, mapY + 10);
    
    // Restore context state
    this.ctx.restore();
  }

  /**
   * Render food entities with improved visuals and viewport culling
   * @param {Entity[]} foodEntities - Array of food entities
   * @param {Object} viewportBounds - Viewport bounds for culling
   */
  renderFoodEntities(foodEntities, viewportBounds) {
    for (const foodEntity of foodEntities) {
      const position = foodEntity.getComponent(PositionComponent);
      const render = foodEntity.getComponent(RenderComponent);
      
      // Skip if outside viewport bounds
      if (!this.isEntityVisible(position.position.x, position.position.y, viewportBounds, render.radius * 2)) {
        continue;
      }
      
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
   * Render organisms with improved visuals and viewport culling
   * @param {Entity[]} organismEntities - Array of organism entities
   * @param {Object} viewportBounds - Viewport bounds for culling
   */
  renderOrganisms(organismEntities, viewportBounds) {
    for (const organismEntity of organismEntities) {
      const organism = organismEntity.getComponent(OrganismComponent);
      const fitness = organismEntity.getComponent(FitnessComponent);
      
      // Calculate organism center position (average of joint positions)
      let centerX = 0;
      let centerY = 0;
      let totalRadius = 0;
      const jointEntities = [];
      
      for (const jointId of organism.jointIds) {
        const jointEntity = this.world.getEntity(jointId);
        if (!jointEntity) continue;
        
        jointEntities.push(jointEntity);
        const position = jointEntity.getComponent(PositionComponent);
        const joint = jointEntity.getComponent(JointComponent);
        
        centerX += position.position.x;
        centerY += position.position.y;
        totalRadius = Math.max(totalRadius, joint.radius);
      }
      
      if (jointEntities.length === 0) continue;
      
      centerX /= jointEntities.length;
      centerY /= jointEntities.length;
      
      // Estimate organism bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      for (const jointEntity of jointEntities) {
        const position = jointEntity.getComponent(PositionComponent);
        minX = Math.min(minX, position.position.x);
        minY = Math.min(minY, position.position.y);
        maxX = Math.max(maxX, position.position.x);
        maxY = Math.max(maxY, position.position.y);
      }
      
      // Calculate organism radius for culling
      const organismRadius = Math.max(
        maxX - minX,
        maxY - minY
      ) / 2 + totalRadius;
      
      // Skip if entire organism is outside viewport
      if (!this.isEntityVisible(centerX, centerY, viewportBounds, organismRadius)) {
        continue;
      }
      
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
    // Calculate text scale based on viewport zoom
    const scale = this.ctx.viewportScale || 1;
    const scaledFontSize = Math.max(8, Math.min(this.fitnessFontSize, this.fitnessFontSize / scale));
    const scaledStrokeWidth = Math.max(0.5, Math.min(this.textStrokeWidth, this.textStrokeWidth / scale));
    
    // Draw fitness value above organism
    this.ctx.textAlign = 'center';
    this.ctx.font = `bold ${scaledFontSize}px ${this.textFont}`;
    
    // Draw text shadow/outline for better readability
    this.ctx.strokeStyle = this.textStrokeColor;
    this.ctx.lineWidth = scaledStrokeWidth;
    this.ctx.strokeText(Math.round(fitness), x, y - 20);
    
    // Draw text
    this.ctx.fillStyle = this.textColor;
    this.ctx.fillText(Math.round(fitness), x, y - 20);
    
    // Draw joint count below organism
    this.ctx.font = `${scaledFontSize * 0.8}px ${this.textFont}`;
    
    // Draw text shadow/outline
    this.ctx.strokeStyle = this.textStrokeColor;
    this.ctx.lineWidth = scaledStrokeWidth;
    this.ctx.strokeText(`${jointCount} joints`, x, y + 20);
    
    // Draw text
    this.ctx.fillStyle = this.jointCountColor;
    this.ctx.fillText(`${jointCount} joints`, x, y + 20);
  }
}

export default RenderSystem;