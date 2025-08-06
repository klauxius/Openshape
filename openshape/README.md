# OpenShape - AI-Powered CAD Interface

This is a [Next.js](https://nextjs.org) project that provides an AI-powered CAD interface with advanced features including Chain of Thought reasoning, multi-step task management, and comprehensive 3D modeling capabilities.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Key Features

### Chain of Thought System
- **Structured Reasoning**: AI agents maintain focus and reasoning continuity during complex tasks
- **Transparency**: Track thoughts, actions, observations, and decisions
- **Context Preservation**: Maintain reasoning context across multiple tool calls
- **Error Recovery**: Graceful handling of failures with detailed error context

### Multi-Step Task Management
- **Complex Operations**: Break down complex CAD operations into manageable steps
- **Automatic Execution**: Agent automatically executes all steps after task creation
- **Progress Tracking**: Monitor completion status of individual steps
- **Error Handling**: Mark failed steps and provide detailed error information

### CAD Operations
- **Primitive Shapes**: Create cubes, spheres, cylinders, and tori
- **Boolean Operations**: Union, subtract, and intersect operations
- **Transformations**: Move, rotate, and scale objects
- **Sketching**: 2D sketching with extrusion capabilities
- **Measurement Tools**: Distance and angle measurements

### Model Color Management
- **Default Color**: All models use a consistent default color (#94a6b5)
- **Color Customization**: Set individual model colors or change the default
- **Color Tools**: MCP tools for managing model colors
- **Visual Consistency**: Maintain visual coherence across all models

## Documentation

- **[Chain of Thought System](CHAIN_OF_THOUGHT_MCP_TOOL.md)** - Detailed guide to the Chain of Thought MCP tool
- **[Multi-Step Task Management](MULTI_STEP_TASK_MANAGEMENT.md)** - How to use the multi-step task system
- **[Color Management](COLOR_MANAGEMENT.md)** - Model color management and customization
- **[Test Examples](TEST_MULTI_STEP_EXAMPLE.md)** - Examples and testing procedures

## Example Pages

- **`/`** - Main CAD interface with AI assistant
- **`/cad-interface`** - Full CAD interface with all features
- **`/pure-three`** - Basic Three.js scene
- **`/three-test`** - Three.js component testing
- **`/webgl-test`** - WebGL capabilities testing
- **`/color-test`** - Model color management testing

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
