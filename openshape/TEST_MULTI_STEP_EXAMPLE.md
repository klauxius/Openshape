# Test Example: Multi-Step Task Management

## Scenario: "Delete the red cube from the scene"

When a user asks the agent to "delete the red cube", here's how the new multi-step task management system would work:

### Step 1: Agent Creates a Multi-Step Task

The agent would first create a structured task:

```javascript
// Agent creates a multi-step task
{
  name: 'create_multi_step_task',
  input: {
    taskId: 'delete_red_cube_001',
    description: 'Delete the red cube from the scene',
    steps: [
      'List all models in the scene to identify available objects',
      'Identify which model is the red cube based on user request',
      'Delete the identified red cube from the scene',
      'Verify the deletion was successful'
    ]
  }
}
```

**Expected Response:**
```
Created multi-step task: Delete the red cube from the scene with 4 steps
```

### Step 2: Execute Step 1 - List Models

```javascript
// Agent executes step 1
{
  name: 'list_models',
  input: {}
}
```

**Expected Response:**
```
Found 3 models in the scene

Available models:
- Cube (ID: model_1)
- Red Sphere (ID: model_2) 
- Blue Cylinder (ID: model_3)
```

```javascript
// Agent marks step 1 as completed
{
  name: 'complete_task_step',
  input: {
    taskId: 'delete_red_cube_001',
    stepId: 1,
    result: 'Found 3 models: Cube (ID: model_1), Red Sphere (ID: model_2), Blue Cylinder (ID: model_3)'
  }
}
```

### Step 3: Execute Step 2 - Identify Target

The agent analyzes the results and identifies that there's no "red cube" but there is a "Red Sphere". It might ask for clarification or proceed with the closest match.

```javascript
// Agent marks step 2 as completed (with note about clarification)
{
  name: 'complete_task_step',
  input: {
    taskId: 'delete_red_cube_001',
    stepId: 2,
    result: 'No red cube found, but found Red Sphere (ID: model_2). Proceeding with Red Sphere as closest match.'
  }
}
```

### Step 4: Execute Step 3 - Delete Model

```javascript
// Agent deletes the identified model
{
  name: 'delete_model',
  input: {
    modelId: 'model_2'
  }
}
```

**Expected Response:**
```
Deleted model: Red Sphere
```

```javascript
// Agent marks step 3 as completed
{
  name: 'complete_task_step',
  input: {
    taskId: 'delete_red_cube_001',
    stepId: 3,
    result: 'Successfully deleted Red Sphere (ID: model_2) from the scene'
  }
}
```

### Step 5: Execute Step 4 - Verify Deletion

```javascript
// Agent verifies the deletion by listing models again
{
  name: 'list_models',
  input: {}
}
```

**Expected Response:**
```
Found 2 models in the scene

Available models:
- Cube (ID: model_1)
- Blue Cylinder (ID: model_3)
```

```javascript
// Agent marks step 4 as completed
{
  name: 'complete_task_step',
  input: {
    taskId: 'delete_red_cube_001',
    stepId: 4,
    result: 'Verification complete: Red Sphere has been successfully removed. 2 models remain in scene.'
  }
}
```

### Step 6: Check Final Progress

```javascript
// Agent checks the final task progress
{
  name: 'get_task_progress',
  input: {
    taskId: 'delete_red_cube_001'
  }
}
```

**Expected Response:**
```
Task progress: 4/4 steps completed (100%)

Task: Delete the red cube from the scene
Status: completed
Progress: 4 completed, 4 total steps (100%)

Steps:
1. ✅ List all models in the scene to identify available objects
2. ✅ Identify which model is the red cube based on user request  
3. ✅ Delete the identified red cube from the scene
4. ✅ Verify the deletion was successful
```

## Benefits Demonstrated

1. **Systematic Approach**: Each step was executed in order
2. **Progress Tracking**: Clear visibility of what was completed
3. **Error Handling**: Agent handled the case where no exact "red cube" was found
4. **Verification**: Final step confirmed the operation was successful
5. **Transparency**: User can see exactly what the agent did

## Alternative: Error Handling Example

If the deletion had failed, the agent could mark the step as failed:

```javascript
{
  name: 'fail_task_step',
  input: {
    taskId: 'delete_red_cube_001',
    stepId: 3,
    error: 'Model with ID model_2 could not be deleted due to system error'
  }
}
```

This would mark the task as failed and provide clear information about what went wrong.

## Testing the System

To test this new system:

1. **Start the application** and open the CAD interface
2. **Create some models** (cubes, spheres, etc.) using simple commands
3. **Try a complex request** like "delete the red cube" or "create a cube and then move it to the right"
4. **Observe the agent's behavior** - it should now create multi-step tasks and work through them systematically
5. **Check the console logs** to see the task management tools in action

The agent should now handle complex multi-step operations much more reliably and provide clear progress feedback throughout the process. 