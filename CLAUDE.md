# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server on port 8001 with hot reload
- `npm run build:page` - Build for page mode (TypeScript + Vite)
- `npm run build:demo` - Build for demo mode (TypeScript + Vite)
- `npm run serve:dist` - Serve built dist folder on port 9000
- `npm run serve:marionetter` - Start marionetter WebSocket server

### Code Quality
- `npm run lint` - Run ESLint on TypeScript files in src/
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier

### Utilities
- `npm run pack:demo` - Package demo using custom packing script
- `npm run pack:demo:hash` - Package demo with hash
- `npm run build_and_pack:demo` - Build and package demo in one command

### PaleGL Subdirectory
The PaleGL subdirectory has identical npm scripts but operates on the PaleGL-specific codebase.

## Architecture

### High-Level Structure
This is a WebGL-based sound synthesis and visualization engine called PaleSoundMaker, built on top of PaleGL (a custom WebGL rendering engine). The project uses GLSL shaders for audio synthesis and supports real-time audio generation.

### Key Components

#### PaleGL Engine (`PaleGL/src/PaleGL/`)
- **Core**: GPU abstraction, rendering pipeline, scene management
- **Actors**: 3D objects like cameras, lights, meshes, particles
- **Materials**: Shader management and material system
- **Post-processing**: Effects pipeline with passes for bloom, FXAA, etc.
- **Math**: Vector, matrix, and quaternion operations
- **Loaders**: GLTF, OBJ, and texture loading
- **Shaders**: GLSL shader library with partial includes system

#### Sound System (`PaleGL/src/PaleGL/core/glslSound.ts`)
- GLSL-based audio synthesis using WebGL shaders
- Real-time audio generation and playback
- Audio context management and WebAudio API integration

#### Marionetter (`PaleGL/src/Marionetter/`)
- Timeline-based animation system
- Scene building and property binding
- Hot reload functionality for development

#### Player System (`PaleGL/src/Player/`)
- Application startup and initialization
- Layer management system

### Build System
- **Vite**: Primary build tool with TypeScript support
- **Custom Plugins**: 
  - Shader minification plugin
  - GLSL layout transformation
  - Cache cleanup utilities
- **Environment Modes**: 
  - Page mode: Multi-page application
  - Demo mode: Single packaged demo
  - Root mode: Single index page

### Entry Points
- Main entry: `src/pages/main.ts`
- Current implementation: GLSL sound synthesis demo
- Uses custom sound vertex shader: `src/pages/shaders/sound-vertex.glsl`

### TypeScript Configuration
- Target: ESNext with DOM support
- Path aliases: `@/*` maps to `PaleGL/src/*`
- Strict type checking enabled
- GLSL shader type support via vite-plugin-glsl

### Development Workflow
1. Use `npm run dev` to start development server
2. Edit source files in `src/` or `PaleGL/src/`
3. GLSL shaders are automatically compiled and hot-reloaded
4. TypeScript compilation happens in parallel
5. Use `npm run lint` and `npm run format` before committing

### Special Features
- **GLSL Sound Synthesis**: Real-time audio generation using fragment shaders
- **Hot Reload**: Live shader and code updates during development
- **Shader Minification**: Automated shader compression for production
- **Multi-target Build**: Supports both page and demo build modes
- **Custom Packing**: Specialized build system for demo distribution

## Key Files
- `vite.config.ts`: Complex build configuration with custom plugins
- `src/pages/main.ts`: Main application entry point
- `src/pages/shaders/sound-vertex.glsl`: GLSL audio synthesis shader
- `PaleGL/src/PaleGL/core/glslSound.ts`: Core audio system
- `PaleGL/src/PaleGL/utilities/createGLSLSoundWrapper.ts`: Sound wrapper utilities

## Development Notes
- The codebase uses a custom WebGL rendering engine (PaleGL) rather than three.js
- Audio synthesis is performed entirely in GLSL shaders using WebGL
- The build system supports advanced shader optimization and minification
- Hot reload works for both TypeScript and GLSL shader files
- The project includes demos for WebGL techniques like GPU instancing and raymarching