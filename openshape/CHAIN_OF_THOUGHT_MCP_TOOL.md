# Chain of Thought MCP Tool System

## Overview

The Chain of Thought MCP tool system provides a structured way for AI agents to maintain focus and reasoning continuity during complex tasks. This system helps agents think step-by-step, maintain context across multiple operations, and provide transparent reasoning for their decisions.

## How It Works

### 1. Chain of Thought Session Management
The system allows agents to create and manage structured reasoning sessions that track:
- **Task Description**: What the agent is trying to accomplish
- **Thought Steps**: Sequential reasoning, observations, and decisions
- **Context Tracking**: Recent thoughts and current progress
- **Status Management**: Active, completed, or failed states

### 2. Structured Reasoning Types
The system supports different types of thought steps:
- **Reasoning**: Logical analysis and problem-solving steps
- **Action**: Specific actions taken or planned
- **Observation**: Results and findings from operations
- **Decision**: Choices made with rationale and next steps

### 3. Context Maintenance
The system automatically maintains context by:
- Tracking the current step number
- Providing recent thought history
- Maintaining task focus throughout the session
- Supporting resumption of interrupted chains

## Available Tools

### `start_chain_of_thought`
**Purpose**: Creates a new chain of thought session
**Parameters**:
- `chainId`: Unique identifier for the session
- `task`: Description of the task to focus on
- `initialThought`: Optional starting reasoning

**Example**:
```javascript
{
  name: 'start_chain_of_thought',
  input: {
    chainId: 'table_design_001',
    task: 'Design and create a wooden table with four legs',
    initialThought: 'I need to break this down into components: table top and four legs. The table top should be rectangular and the legs should be cylindrical.'
  }
}
```

### `add_thought`
**Purpose**: Adds a thought to the current chain
**Parameters**:
- `chainId`: ID of the chain session
- `thought`: The thought or reasoning to add
- `stepType`: Type of thought ('reasoning', 'action', 'observation', 'decision')

**Example**:
```javascript
{
  name: 'add_thought',
  input: {
    chainId: 'table_design_001',
    thought: 'First, I should create the table top as a rectangular prism with appropriate dimensions.',
    stepType: 'reasoning'
  }
}
```

### `chain_reasoning`
**Purpose**: Performs structured reasoning within a chain
**Parameters**:
- `chainId`: ID of the chain session
- `reasoning`: The reasoning step to perform
- `expectedOutcome`: What is expected to happen after this step

**Example**:
```javascript
{
  name: 'chain_reasoning',
  input: {
    chainId: 'table_design_001',
    reasoning: 'The table top should be 120cm x 80cm x 3cm to provide adequate surface area and stability.',
    expectedOutcome: 'This will create a solid foundation for the table.'
  }
}
```

### `chain_decision`
**Purpose**: Makes a decision within a chain with rationale
**Parameters**:
- `chainId`: ID of the chain session
- `decision`: The decision being made
- `rationale`: The reasoning behind the decision
- `nextAction`: What action will be taken based on this decision

**Example**:
```javascript
{
  name: 'chain_decision',
  input: {
    chainId: 'table_design_001',
    decision: 'Use 5cm radius cylinders for the legs',
    rationale: 'This provides good stability while maintaining aesthetic proportions with the table top.',
    nextAction: 'Create four cylindrical legs with these dimensions.'
  }
}
```

### `get_chain_context`
**Purpose**: Gets the current context of a chain session
**Parameters**:
- `chainId`: ID of the chain session

**Returns**: Current task, step number, recent thoughts, and total thoughts

### `complete_chain_of_thought`
**Purpose**: Completes a chain of thought session
**Parameters**:
- `chainId`: ID of the chain session
- `finalThought`: Optional concluding thought

### `fail_chain_of_thought`
**Purpose**: Marks a chain as failed with error description
**Parameters**:
- `chainId`: ID of the chain session
- `errorThought`: Description of what went wrong

### `get_chain_summary`
**Purpose**: Gets a complete summary of a chain session
**Parameters**:
- `chainId`: ID of the chain session

## Example Workflows

### Complex CAD Design Process
When designing a complex object like a table:

1. **Start Chain**: Create a chain for the table design task
2. **Reasoning Steps**: Break down the design into components
3. **Decisions**: Make choices about dimensions and materials
4. **Actions**: Execute CAD operations with clear reasoning
5. **Observations**: Note results and adjust plans accordingly
6. **Complete**: Finish with a summary of what was accomplished

### Multi-Step Problem Solving
For complex problems requiring multiple steps:

1. **Start Chain**: Define the problem clearly
2. **Analyze**: Break down the problem into sub-problems
3. **Plan**: Create a step-by-step approach
4. **Execute**: Perform each step with reasoning
5. **Evaluate**: Check results and adjust if needed
6. **Complete**: Summarize the solution

## Benefits

### For AI Agents
1. **Structured Thinking**: Forces step-by-step reasoning
2. **Context Maintenance**: Keeps track of progress and decisions
3. **Transparency**: Makes reasoning visible and auditable
4. **Error Recovery**: Can identify where things went wrong
5. **Resumability**: Can pick up interrupted chains

### For Users
1. **Understanding**: See how the agent thinks through problems
2. **Trust**: Transparent reasoning builds confidence
3. **Debugging**: Easy to identify where issues occur
4. **Learning**: Can understand the agent's approach
5. **Collaboration**: Can provide feedback on reasoning

### For Complex Tasks
1. **Focus**: Maintains attention on the main task
2. **Consistency**: Ensures all steps are considered
3. **Quality**: Reduces errors through systematic thinking
4. **Documentation**: Creates a record of the design process
5. **Iteration**: Supports improvement through analysis

## Integration with Multi-Step Tasks

The Chain of Thought system works seamlessly with the existing multi-step task management:

1. **Task Creation**: Start a chain when creating a multi-step task
2. **Step Execution**: Add thoughts for each step being executed
3. **Progress Tracking**: Use chain context to understand current progress
4. **Error Handling**: Use chain failure to document what went wrong
5. **Completion**: Complete both the task and the chain together

## Best Practices

### For AI Agents
1. **Start Early**: Begin chains at the start of complex tasks
2. **Be Specific**: Use detailed reasoning and clear decisions
3. **Maintain Focus**: Keep thoughts relevant to the main task
4. **Document Actions**: Record what you're doing and why
5. **Handle Errors**: Use failure chains to learn from mistakes

### For Users
1. **Review Chains**: Check the agent's reasoning for complex tasks
2. **Provide Feedback**: Suggest improvements to the reasoning process
3. **Use for Debugging**: Examine chains when things go wrong
4. **Learn Patterns**: Understand how the agent approaches problems
5. **Collaborate**: Work with the agent's reasoning process

## Example Chain of Thought Session

```
Chain ID: table_design_001
Task: Design and create a wooden table with four legs

Thought 1 (Reasoning): I need to break this down into components: table top and four legs. The table top should be rectangular and the legs should be cylindrical.

Thought 2 (Decision): Use 120cm x 80cm x 3cm for table top dimensions. Rationale: Provides adequate surface area while maintaining good proportions.

Thought 3 (Action): Creating the table top using create_cube with the specified dimensions.

Thought 4 (Observation): Table top created successfully. Now I need to position the legs at the corners.

Thought 5 (Decision): Use 5cm radius, 70cm height for legs. Rationale: Good stability and aesthetic proportions.

Thought 6 (Action): Creating first leg at position [60, 40, -35] using create_cylinder.

Thought 7 (Observation): First leg created. Repeating for remaining three legs.

Thought 8 (Action): Creating remaining legs at positions [-60, 40, -35], [60, -40, -35], [-60, -40, -35].

Thought 9 (Reasoning): Now I need to combine all parts using boolean union operations.

Thought 10 (Action): Performing union operation on table top and all four legs.

Thought 11 (Observation): Table assembly completed successfully. Final result is a complete table with proper proportions.

Thought 12 (Conclusion): Successfully created a wooden table with four legs. The design meets the requirements and maintains good structural integrity.
```

## Technical Implementation

The Chain of Thought system is implemented as part of the MCP tools framework:

- **Manager**: `chainOfThoughtManager` handles session state
- **Tools**: Individual MCP tools for each operation
- **Integration**: Works with existing CAD and task management tools
- **Persistence**: Chains are maintained in memory during the session
- **Export**: Chain summaries can be exported for documentation

This system provides a powerful way to maintain AI agent focus and reasoning transparency during complex CAD and design tasks. 