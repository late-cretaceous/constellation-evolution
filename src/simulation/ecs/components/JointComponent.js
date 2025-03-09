// src/simulation/ecs/components/JointComponent.js
import { Component } from '../Component';
import { JOINT_RADIUS, JOINT_REST_LENGTH } from '../../constants';

/**
 * Component that defines an entity as a joint of an organism
 */
export class JointComponent extends Component {
  /**
   * Create a new joint component
   * @param {number} organismId - ID of the parent organism entity
   */
  constructor(organismId) {
    super();
    this.organismId = organismId;
    this.isAnchored = false;
    this.connections = []; // Array of connected joint entity IDs
    this.restLengths = new Map(); // Map of entity ID to rest length
    this.radius = JOINT_RADIUS;
    this.defaultRestLength = JOINT_REST_LENGTH;
  }
}

export default JointComponent;
