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

### Chain of Thought Management
- **Structured Reasoning**: AI agents can maintain focus through step-by-step reasoning
- **Decision Tracking**: Every decision is recorded with rationale and next actions
- **Context Maintenance**: Keeps track of progress across multiple operations
- **Transparency**: Users can see exactly how the AI thinks through problems

### Multi-Step Task Management
- **Complex Operations**: Handle multi-step CAD operations systematically
- **Progress Tracking**: Monitor completion of individual steps
- **Error Handling**: Identify and address failed steps
- **Automatic Execution**: Complete complex tasks without user intervention

### CAD Operations
- **3D Modeling**: Create and manipulate 3D objects
- **Boolean Operations**: Union, subtract, and intersect shapes
- **Sketching Tools**: 2D sketching with extrusion capabilities
- **Design History**: Track and iterate on design changes

## Documentation

- [Chain of Thought MCP Tool System](CHAIN_OF_THOUGHT_MCP_TOOL.md) - Complete guide to the Chain of Thought reasoning system
- [Multi-Step Task Management](MULTI_STEP_TASK_MANAGEMENT.md) - Guide to managing complex multi-step operations
- [Test Multi-Step Example](TEST_MULTI_STEP_EXAMPLE.md) - Example of multi-step task execution

## Example Pages

- `/chain-of-thought-example` - Interactive demonstration of the Chain of Thought system
- `/cad-interface` - Main CAD interface with all features
- `/jscad-features` - JSCAD-specific features and operations

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
