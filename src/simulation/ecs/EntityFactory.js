// src/simulation/ecs/EntityFactory.js
import { PositionComponent } from "./components/PositionComponent";
import { VelocityComponent } from "./components/VelocityComponent";
import { PhysicsComponent } from "./components/PhysicsComponent";
import { JointComponent } from "./components/JointComponent";
import { OrganismComponent } from "./components/OrganismComponent";
import { GeneticComponent } from "./components/GeneticComponent";
import { RenderComponent } from "./components/RenderComponent";
import { FitnessComponent } from "./components/FitnessComponent";
import { FoodComponent } from "./components/FoodComponent";
import { FOOD_RADIUS, JOINT_RADIUS } from "../constants";
import { Vector2 } from "./utils/Vector2";

/**
 * Factory class to simplify creation of common entities
 * Updated with procedural body plan generation
 */
export class EntityFactory {
  /**
   * Create a new entity factory
   * @param {World} world - Reference to the world
   */
  constructor(world) {
    this.world = world;
  }

  /**
   * Create a food entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {Entity} - The created food entity
   */
  createFood(x, y) {
    const foodEntity = this.world.createEntity();

    foodEntity.addComponent(new PositionComponent(x, y));
    foodEntity.addComponent(new FoodComponent());
    foodEntity.addComponent(
      new RenderComponent("food", "#ffff00", FOOD_RADIUS)
    );

    return foodEntity;
  }

  /**
   * Create a joint entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} organismId - ID of the parent organism entity
   * @param {boolean} isAnchored - Whether the joint is anchored
   * @returns {Entity} - The created joint entity
   */
  createJoint(x, y, organismId, isAnchored = false) {
    const jointEntity = this.world.createEntity();

    jointEntity.addComponent(new PositionComponent(x, y));
    jointEntity.addComponent(new VelocityComponent());
    jointEntity.addComponent(new PhysicsComponent());

    const joint = new JointComponent(organismId);
    joint.isAnchored = isAnchored;
    jointEntity.addComponent(joint);

    jointEntity.addComponent(
      new RenderComponent("joint", "#ffffff", JOINT_RADIUS)
    );

    return jointEntity;
  }

  /**
   * Create an organism entity with a procedural body plan derived from genetic seed
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} numJoints - Number of joints to create
   * @param {GeneticComponent} geneticComponent - Genetic component to use
   * @returns {Entity} - The created organism entity
   */
  createOrganism(x, y, numJoints, geneticComponent = null) {
    const organismEntity = this.world.createEntity();
    const organism = new OrganismComponent();
    organismEntity.addComponent(organism);
    organismEntity.addComponent(new FitnessComponent());

    // Use provided genetics or create new
    const genetics = geneticComponent || new GeneticComponent();
    organismEntity.addComponent(genetics);

    // Generate procedural body plan based on genetic seed
    this.generateProceduralBodyPlan(x, y, numJoints, organismEntity, organism, genetics);

    return organismEntity;
  }

  /**
   * Generate a procedural body plan based on genetic seed
   * This creates a wide variety of body structures through algorithmic generation
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} numJoints - Number of joints to create
   * @param {Entity} organismEntity - The organism entity
   * @param {OrganismComponent} organism - The organism component
   * @param {GeneticComponent} genetics - The genetic component
   */
  generateProceduralBodyPlan(x, y, numJoints, organismEntity, organism, genetics) {
    // Extract genetic parameters to influence body plan generation
    const seed = genetics.bodyPlanSeed;
    
    // Derive body plan parameters from seed
    // These parameters control the procedural generation behavior
    const params = {
      // Primary topology type (influences general structure)
      topologyType: seed * 3.6, // Value from 0 to 3.6 (creates distinct types with some overlap)
      
      // How many branches can form from a single joint
      maxBranchingFactor: 1 + Math.floor(seed * 3), // 1-3
      
      // Probability of creating a branch at each opportunity
      branchingProbability: 0.3 + seed * 0.6, // 0.3-0.9
      
      // How likely the structure is to form cyclic connections
      cycleProbability: seed * 0.7, // 0-0.7
      
      // How far apart joints are placed
      jointSpacing: 20 + seed * 20, // 20-40 pixels
      
      // Probability that a joint will be anchored (not mobile)
      anchorProbability: 0.1 + seed * 0.15, // 0.1-0.25
      
      // How much symmetry is enforced in the structure (0-1)
      symmetryFactor: seed * 0.8, // 0-0.8
      
      // How much the structure is compressed/elongated
      compressionFactor: 0.8 + seed * 0.4, // 0.8-1.2
    };
    
    // Create array to store joint entities for the organism
    const jointEntities = [];
    
    // Start with a central core joint
    const coreJoint = this.createJoint(x, y, organismEntity.id, Math.random() < params.anchorProbability);
    organism.jointIds.push(coreJoint.id);
    jointEntities.push(coreJoint);
    
    // Initialize a set to track potential connection points
    const openConnections = new Set();
    openConnections.add(0); // Add the core joint index
    
    // Keep track of joint positions for collision avoidance
    const jointPositions = [new Vector2(x, y)];
    
    // Building algorithm: create joints until we reach the desired number
    while (jointEntities.length < numJoints && openConnections.size > 0) {
      // Select a joint to branch from
      const openConnectionsArray = Array.from(openConnections);
      const sourceIndex = this.selectSourceJoint(openConnectionsArray, jointEntities, params);
      const sourceJoint = jointEntities[sourceIndex];
      const sourcePos = jointPositions[sourceIndex];
      
      // Determine how many branches to create from this joint
      const maxBranches = Math.min(
        params.maxBranchingFactor,
        numJoints - jointEntities.length
      );
      
      let branchesCreated = 0;
      const branchCount = this.determineBranchCount(maxBranches, params);
      
      for (let i = 0; i < branchCount; i++) {
        if (jointEntities.length >= numJoints) break;
        
        // Determine the position of the new joint
        const newJointPos = this.calculateNewJointPosition(
          sourcePos, 
          jointPositions,
          params,
          jointEntities.length,
          numJoints
        );
        
        // Create the new joint
        const isAnchored = Math.random() < params.anchorProbability;
        const newJoint = this.createJoint(
          newJointPos.x, 
          newJointPos.y, 
          organismEntity.id, 
          isAnchored
        );
        
        // Add the joint to the organism
        organism.jointIds.push(newJoint.id);
        const newJointIndex = jointEntities.length;
        jointEntities.push(newJoint);
        jointPositions.push(newJointPos);
        
        // Connect to source joint
        this.connectJoints(sourceJoint, newJoint);
        
        // Add as an open connection for future branching
        // Skip if it's anchored, as we don't want too many branches from anchored joints
        if (!isAnchored || Math.random() < 0.3) {
          openConnections.add(newJointIndex);
        }
        
        branchesCreated++;
        
        // Add some cycles to create more complex structures
        if (params.topologyType > 1.5 && Math.random() < params.cycleProbability) {
          this.createCycleConnection(newJoint, jointEntities, jointPositions, newJointIndex);
        }
      }
      
      // Remove source from open connections if it has reached its branching limit
      if (branchesCreated >= maxBranches || Math.random() > params.branchingProbability) {
        openConnections.delete(sourceIndex);
      }
    }
    
    // Ensure at least one connection between distant joints for more complex structures
    if (params.topologyType > 2.0 && jointEntities.length > 4) {
      this.createDistantConnection(jointEntities, jointPositions, params);
    }
    
    // Make sure we have at least one anchored joint for stability
    let hasAnchor = false;
    for (const joint of jointEntities) {
      if (joint.getComponent(JointComponent).isAnchored) {
        hasAnchor = true;
        break;
      }
    }
    
    if (!hasAnchor && jointEntities.length > 0) {
      // Force one joint to be anchored
      const randomIndex = Math.floor(Math.random() * jointEntities.length);
      jointEntities[randomIndex].getComponent(JointComponent).isAnchored = true;
    }
  }
  
  /**
   * Select a source joint to branch from
   * @private
   */
  selectSourceJoint(openConnections, jointEntities, params) {
    // Various selection strategies based on topology type
    if (params.topologyType < 1.2) {
      // Linear/chain preference: tend to select newest joints
      return openConnections[openConnections.length - 1];
    } else if (params.topologyType < 2.4) {
      // Radial/tree preference: balance between old and new joints
      const preferOlder = Math.random() < 0.4;
      if (preferOlder) {
        return openConnections[0];
      } else {
        const randomIndex = Math.floor(Math.random() * openConnections.length);
        return openConnections[randomIndex];
      }
    } else {
      // Complex network preference: completely random selection
      const randomIndex = Math.floor(Math.random() * openConnections.length);
      return openConnections[randomIndex];
    }
  }
  
  /**
   * Determine the number of branches to create from a joint
   * @private
   */
  determineBranchCount(maxBranches, params) {
    // For simpler structures (chains, simple trees)
    if (params.topologyType < 1.8) {
      return Math.random() < params.branchingProbability ? 1 : 0;
    } 
    // For medium complexity (branched trees, simple networks)
    else if (params.topologyType < 2.8) {
      const baseBranches = Math.random() < params.branchingProbability ? 1 : 0;
      const extraBranch = Math.random() < params.branchingProbability * 0.7 ? 1 : 0;
      return Math.min(baseBranches + extraBranch, maxBranches);
    }
    // For complex structures (networks, webs)
    else {
      // Use a weighted probability to sometimes create multiple branches
      let branchCount = 0;
      let prob = params.branchingProbability;
      
      while (branchCount < maxBranches && Math.random() < prob) {
        branchCount++;
        prob *= 0.7; // Decreasing probability for each additional branch
      }
      
      return branchCount;
    }
  }
  
  /**
   * Calculate position for a new joint
   * @private
   */
  calculateNewJointPosition(sourcePos, allPositions, params, currentIndex, totalJoints) {
    // Different placement strategies based on topology type
    let angle, distance;
    
    if (params.topologyType < 1.2) {
      // Linear/chain: mostly straight lines with small deviations
      const progressRatio = currentIndex / totalJoints;
      angle = progressRatio * Math.PI * 2; // Full circle over the whole organism
      distance = params.jointSpacing;
    } 
    else if (params.topologyType < 2.4) {
      // Radial/tree: branches in various directions
      if (params.symmetryFactor > 0.5) {
        // More symmetric branching
        const symmetryCount = 2 + Math.floor(params.symmetryFactor * 6);
        angle = (currentIndex % symmetryCount) * (Math.PI * 2 / symmetryCount);
      } else {
        // More random branching
        angle = Math.random() * Math.PI * 2;
      }
      distance = params.jointSpacing * params.compressionFactor;
    } 
    else {
      // Complex network: more random placement with some structure
      if (Math.random() < params.symmetryFactor) {
        // Symmetric placement
        const baseAngle = Math.PI * 2 * (currentIndex / totalJoints);
        angle = baseAngle + (Math.random() * 0.5 - 0.25); // Small random deviation
      } else {
        // Random placement
        angle = Math.random() * Math.PI * 2;
      }
      
      // Variable distances for more complex structures
      const variability = 0.5 + (params.topologyType - 2.4) * 0.5;
      distance = params.jointSpacing * (1 - variability + Math.random() * variability * 2);
    }
    
    // Calculate base position
    let newX = sourcePos.x + Math.cos(angle) * distance;
    let newY = sourcePos.y + Math.sin(angle) * distance;
    
    // Avoid collision with existing joints
    // Simple collision avoidance by checking distance to other joints
    let attempts = 0;
    const minDistance = params.jointSpacing * 0.7;
    
    while (attempts < 5) {
      let collision = false;
      
      for (const pos of allPositions) {
        const dist = Math.sqrt(
          Math.pow(newX - pos.x, 2) + Math.pow(newY - pos.y, 2)
        );
        
        if (dist < minDistance) {
          collision = true;
          break;
        }
      }
      
      if (!collision) break;
      
      // Adjust position slightly and try again
      angle += Math.PI / 4;
      newX = sourcePos.x + Math.cos(angle) * distance;
      newY = sourcePos.y + Math.sin(angle) * distance;
      
      attempts++;
    }
    
    return new Vector2(newX, newY);
  }
  
  /**
   * Create a cycle connection to form loops in the structure
   * @private
   */
  createCycleConnection(newJoint, jointEntities, jointPositions, newJointIndex) {
    if (jointEntities.length < 4) return; // Need at least a few joints
    
    // Find candidate joints for cycle connection
    // Exclude the most recent joints to avoid tiny cycles
    const candidates = [];
    
    for (let i = 0; i < jointEntities.length - 3; i++) {
      // Skip if it's already connected to the new joint
      const joint = jointEntities[i];
      const connections = joint.getComponent(JointComponent).connections;
      if (connections.includes(newJoint.id)) continue;
      
      // Calculate distance
      const dist = Math.sqrt(
        Math.pow(jointPositions[i].x - jointPositions[newJointIndex].x, 2) + 
        Math.pow(jointPositions[i].y - jointPositions[newJointIndex].y, 2)
      );
      
      // Only consider joints that are reasonably close
      if (dist < 80 && dist > 20) {
        candidates.push(i);
      }
    }
    
    // Randomly select one of the candidates
    if (candidates.length > 0) {
      const targetIndex = candidates[Math.floor(Math.random() * candidates.length)];
      this.connectJoints(newJoint, jointEntities[targetIndex]);
    }
  }
  
  /**
   * Create a connection between distant parts of the organism for complex structures
   * @private
   */
  createDistantConnection(jointEntities, jointPositions, params) {
    if (jointEntities.length < 5) return;
    
    // Only create distant connections for complex structures
    if (params.topologyType < 2.0 || Math.random() > params.cycleProbability) return;
    
    // Find two distant joints that aren't directly connected
    let bestDistance = 0;
    let sourceIndex = -1;
    let targetIndex = -1;
    
    // Try a few random pairs
    for (let attempt = 0; attempt < 5; attempt++) {
      const i = Math.floor(Math.random() * jointEntities.length);
      const j = Math.floor(Math.random() * jointEntities.length);
      
      // Skip if same joint or already connected
      if (i === j) continue;
      
      const jointA = jointEntities[i];
      const jointB = jointEntities[j];
      const connections = jointA.getComponent(JointComponent).connections;
      
      if (connections.includes(jointB.id)) continue;
      
      // Calculate distance
      const dist = Math.sqrt(
        Math.pow(jointPositions[i].x - jointPositions[j].x, 2) + 
        Math.pow(jointPositions[i].y - jointPositions[j].y, 2)
      );
      
      // Keep track of the most distant pair
      if (dist > bestDistance) {
        bestDistance = dist;
        sourceIndex = i;
        targetIndex = j;
      }
    }
    
    // Connect the distant pair if found
    if (sourceIndex >= 0 && targetIndex >= 0) {
      this.connectJoints(jointEntities[sourceIndex], jointEntities[targetIndex]);
    }
  }

  /**
   * Helper method to connect two joints
   * @private
   */
  connectJoints(jointEntityA, jointEntityB) {
    const jointComponentA = jointEntityA.getComponent(JointComponent);
    const jointComponentB = jointEntityB.getComponent(JointComponent);
    const positionA = jointEntityA.getComponent(PositionComponent);
    const positionB = jointEntityB.getComponent(PositionComponent);

    // Calculate rest length
    const distance = positionA.position.distanceTo(positionB.position);
    const restLength = distance; // Default rest length is the initial distance

    // Add connections
    jointComponentA.connections.push(jointEntityB.id);
    jointComponentA.restLengths.set(jointEntityB.id, restLength);

    jointComponentB.connections.push(jointEntityA.id);
    jointComponentB.restLengths.set(jointEntityA.id, restLength);
  }
}

export default EntityFactory;