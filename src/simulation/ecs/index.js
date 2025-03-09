// src/simulation/ecs/index.js
import World from './World';
import Entity from './Entity';
import Component from './Component';
import System from './System';
import EntityFactory from './EntityFactory';

// Components
import PositionComponent from './components/PositionComponent';
import VelocityComponent from './components/VelocityComponent';
import PhysicsComponent from './components/PhysicsComponent';
import JointComponent from './components/JointComponent';
import OrganismComponent from './components/OrganismComponent';
import GeneticComponent from './components/GeneticComponent';
import RenderComponent from './components/RenderComponent';
import FitnessComponent from './components/FitnessComponent';
import FoodComponent from './components/FoodComponent';

// Systems
import PhysicsSystem from './systems/PhysicsSystem';
import JointConnectionSystem from './systems/JointConnectionSystem';
import FoodSystem from './systems/FoodSystem';
import StateSystem from './systems/StateSystem';
import RenderSystem from './systems/RenderSystem';
import EvolutionSystem from './systems/EvolutionSystem';

// Utils
import Vector2 from './utils/Vector2';

export {
  // Core
  World,
  Entity,
  Component,
  System,
  EntityFactory,
  
  // Components
  PositionComponent,
  VelocityComponent,
  PhysicsComponent,
  JointComponent,
  OrganismComponent,
  GeneticComponent,
  RenderComponent,
  FitnessComponent,
  FoodComponent,
  
  // Systems
  PhysicsSystem,
  JointConnectionSystem,
  FoodSystem,
  StateSystem,
  RenderSystem,
  EvolutionSystem,
  
  // Utils
  Vector2
};
