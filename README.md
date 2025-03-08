# Evolution Simulator

A physics-based evolution simulator where organisms are collections of connected dots ("joints") that evolve different movement strategies to gather food.

## Project Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
evolution-constellations/
│
├── src/
│   ├── components/              # React components
│   │   └── EvolutionSimulator/  # Main simulator components
│   │
│   ├── hooks/                   # Custom React hooks
│   │   └── useSimulation.js     # Simulation logic
│   │
│   ├── simulation/              # Core simulation logic
│   │   ├── models/              # Simulation entity models
│   │   └── constants.js         # Simulation constants
│   │
│   ├── App.jsx                  # Main app component
│   └── main.jsx                 # Entry point
```

## How It Works

- **Organisms**: Collections of connected dots (joints)
- **Joints**: Can be in two states - moving (green) or anchored (red)
- **Evolution**: Organisms that collect more food have a higher chance to reproduce
- **Physics**: Joints can only move effectively relative to anchored joints
- **Genes**: Control how organisms sense and respond to food

## Controls

- **Population Size**: Number of organisms in the simulation
- **Food Amount**: Amount of food available
- **Mutation Rate**: How much organisms can change between generations
- **Simulation Speed**: Speed of the simulation

## Features

- Physics-based movement with joint connections
- Genetic evolution of movement patterns
- Real-time statistics tracking
- Variable joint count that can evolve over time
