// src/simulation/ecs/utils/Vector2.js

/**
 * A 2D vector implementation for physics calculations
 */
export class Vector2 {
  /**
   * Create a new 2D vector
   * @param {number} x - X component
   * @param {number} y - Y component
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  
  /**
   * Calculate distance to another vector
   * @param {Vector2} vector - The other vector
   * @returns {number} - Distance between vectors
   */
  distanceTo(vector) {
    const dx = this.x - vector.x;
    const dy = this.y - vector.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Add another vector to this one
   * @param {Vector2} vector - The vector to add
   * @returns {Vector2} - New vector representing the sum
   */
  add(vector) {
    return new Vector2(this.x + vector.x, this.y + vector.y);
  }
  
  /**
   * Subtract another vector from this one
   * @param {Vector2} vector - The vector to subtract
   * @returns {Vector2} - New vector representing the difference
   */
  subtract(vector) {
    return new Vector2(this.x - vector.x, this.y - vector.y);
  }
  
  /**
   * Multiply this vector by a scalar
   * @param {number} scalar - The scalar value
   * @returns {Vector2} - New scaled vector
   */
  multiply(scalar) {
    return new Vector2(this.x * scalar, this.y * scalar);
  }
  
  /**
   * Normalize this vector (make it unit length)
   * @returns {Vector2} - New normalized vector
   */
  normalize() {
    const magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
    if (magnitude === 0) return new Vector2(0, 0);
    return new Vector2(this.x / magnitude, this.y / magnitude);
  }

  /**
   * Create a copy of this vector
   * @returns {Vector2} - New vector with same values
   */
  clone() {
    return new Vector2(this.x, this.y);
  }
}

export default Vector2;
