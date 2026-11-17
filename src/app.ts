import { TaskManager } from './task-manager.js';

async function main(): Promise<void> {
  const manager = new TaskManager();
  console.log('Async Task Management');
  const user = await manager.createUser('Aylin');
  console.log('User:', JSON.stringify(user));

  const tasks = await Promise.all([
    manager.createTask('Learn TypeScript interfaces', user.id),
    manager.createTask('Practice async/await', user.id),
  ]);
  console.log('Created tasks:', JSON.stringify(tasks));
  const firstTask = tasks[0];
  if (!firstTask) throw new Error('Expected a task to be created');
  console.log('Updated task:', JSON.stringify(await manager.updateTask(firstTask.id, { completed: true })));

  try {
    await manager.createTask('Task with a missing owner', 999);
  } catch (error: unknown) {
    console.log('Expected failure:', error instanceof Error ? error.message : String(error));
  }

  console.log('Deleted task:', await manager.deleteTask(firstTask.id));
  console.log('Remaining tasks:', JSON.stringify(await manager.listTasks()));
}

main().catch((error: unknown) => {
  console.error('Unexpected failure:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
