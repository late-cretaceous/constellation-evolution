import { FOOD_RADIUS } from '../constants';

/**
 * Represents a food item in the simulation
 */
export class Food {
  /**
   * Create a new food item
   * @param {Vector2} position - Position of the food
   */
  constructor(position) {
    this.position = position;
  }
  
  /**
   * Draw the food on the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, FOOD_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#ffff00'; // Yellow for food
    ctx.fill();
    ctx.closePath();
  }
}

export default Food;
