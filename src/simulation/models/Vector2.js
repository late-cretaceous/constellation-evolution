/**
 * A 2D vector implementation for physics calculations
 */
export class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  
  distanceTo(vector) {
    const dx = this.x - vector.x;
    const dy = this.y - vector.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  add(vector) {
    return new Vector2(this.x + vector.x, this.y + vector.y);
  }
  
  subtract(vector) {
    return new Vector2(this.x - vector.x, this.y - vector.y);
  }
  
  multiply(scalar) {
    return new Vector2(this.x * scalar, this.y * scalar);
  }
  
  normalize() {
    const magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
    if (magnitude === 0) return new Vector2(0, 0);
    return new Vector2(this.x / magnitude, this.y / magnitude);
  }
}

export default Vector2;
