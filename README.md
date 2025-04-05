# Space Idle

A 2D idle game made with TypeScript and Phaser where you control a ship to collect resources and purchase upgrades.

## Game Features

- Control a spaceship to collect metal and crystal resources
- Passive resource generation over time
- Purchase ship upgrades to increase resource collection rates
- Simple, intuitive UI

## How to Play

1. Move your ship by moving your mouse - the ship will follow the cursor
2. Collect resources (blue orbs for metal, red orbs for crystal) by flying into them
3. Resources are also generated automatically over time
4. Purchase upgrades to increase your resource generation rates
5. Try to unlock all upgrades!

## Development

This project uses:
- TypeScript for type-safe code
- Phaser 3 for 2D game rendering and physics
- Vite for fast development and building

### Getting Started

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

- `src/` - Source code
  - `assets/` - Game assets (images, sounds, etc.)
  - `scenes/` - Phaser scenes (Loading, Game, UI)
  - `objects/` - Game object classes 
  - `systems/` - Game systems (Resource management, etc.)
- `public/` - Static assets

## Next Steps / TODO

- Add more ship upgrades
- Add ship customization
- Add enemy encounters
- Add different resource types
- Add save/load functionality 