// src/simulation/ecs/components/PhysicsComponent.js
import { Component } from '../Component';
import { Vector2 } from '../utils/Vector2';
import { JOINT_STIFFNESS, JOINT_DAMPING } from '../../constants';

/**
 * Component that stores physics-related properties of an entity
 */
export class PhysicsComponent extends Component {
  /**
   * Create a new physics component
   * @param {number} mass - Mass of the entity
   */
  constructor(mass = 1) {
    super();
    this.force = new Vector2(0, 0);
    this.mass = mass;
    this.stiffness = JOINT_STIFFNESS;
    this.damping = JOINT_DAMPING;
  }
}

export default PhysicsComponent;
