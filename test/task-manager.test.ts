import assert from 'node:assert/strict';
import test from 'node:test';
import { TaskManager } from '../src/task-manager.js';

test('user operations return Promises and protect stored data', async () => {
  const manager = new TaskManager();
  const pending = manager.createUser(' Aylin ');
  assert.ok(pending instanceof Promise);
  const user = await pending;
  assert.deepEqual(user, { id: 1, name: 'Aylin' });
  user.name = 'Changed';
  const users = await manager.listUsers();
  assert.deepEqual(users, [{ id: 1, name: 'Aylin' }]);
  users[0]!.name = 'Changed again';
  const found = await manager.getUser(1);
  assert.equal(found?.name, 'Aylin');
  found!.name = 'Changed lookup';
  assert.equal((await manager.getUser(1))?.name, 'Aylin');
  assert.equal(await manager.getUser(999), null);
});

test('async task CRUD supports concurrent creation and missing records', async () => {
  const manager = new TaskManager();
  const user = await manager.createUser('Aylin');
  const tasks = await Promise.all(Array.from({ length: 10 }, (_, i) => manager.createTask(`Task ${i}`, user.id)));
  assert.equal(new Set(tasks.map((task) => task.id)).size, 10);
  assert.equal((await manager.listTasks()).length, 10);
  const first = tasks[0]!;
  assert.deepEqual(await manager.updateTask(first.id, { title: ' Finished ', completed: true }), {
    ...first, title: 'Finished', completed: true,
  });
  assert.equal((await manager.updateTask(first.id, { completed: false })).completed, false);
  assert.equal(await manager.deleteTask(first.id), true);
  assert.equal(await manager.deleteTask(first.id), false);
  assert.equal(await manager.getTask(first.id), null);
  await assert.rejects(manager.updateTask(first.id, { completed: true }), /not found/);
});

test('invalid inputs reject and failed updates leave stored data unchanged', async () => {
  const manager = new TaskManager();
  await assert.rejects(manager.createUser('  '), /non-empty string/);
  const user = await manager.createUser('Aylin');
  assert.equal(user.id, 1);
  await assert.rejects(manager.createTask(' ', user.id), /non-empty string/);
  await assert.rejects(manager.createTask('Missing owner', 999), /User 999 not found/);
  const task = await manager.createTask(' Original ', user.id);
  assert.equal(task.id, 1);
  await assert.rejects(manager.updateTask(task.id, {}), /title and\/or completed/);
  await assert.rejects(manager.updateTask(task.id, { title: ' ' }), /non-empty string/);
  // Exercise runtime validation for callers that bypass TypeScript.
  // @ts-expect-error Intentional invalid completed value.
  await assert.rejects(manager.updateTask(task.id, { title: 'Changed', completed: 'yes' }), /boolean/);
  // @ts-expect-error Task ownership is immutable.
  await assert.rejects(manager.updateTask(task.id, { userId: 999 }), /title and\/or completed/);
  // @ts-expect-error Intentional malformed update.
  await assert.rejects(manager.updateTask(task.id, null), /object/);
  assert.deepEqual(await manager.getTask(task.id), task);
  for (const id of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(manager.getUser(id), /positive safe integer/);
    await assert.rejects(manager.getTask(id), /positive safe integer/);
    await assert.rejects(manager.deleteTask(id), /positive safe integer/);
    await assert.rejects(manager.createTask('Task', id), /positive safe integer/);
    await assert.rejects(manager.updateTask(id, { completed: true }), /positive safe integer/);
  }
});

test('task results are copies and manager instances have separate stores', async () => {
  const manager = new TaskManager();
  const user = await manager.createUser('Aylin');
  const task = await manager.createTask('Original', user.id);
  task.title = 'Changed';
  const listed = await manager.listTasks();
  listed[0]!.title = 'Changed list';
  const found = await manager.getTask(task.id);
  found!.title = 'Changed lookup';
  assert.equal((await manager.getTask(task.id))?.title, 'Original');
  const updated = await manager.updateTask(task.id, { completed: true });
  updated.completed = false;
  assert.equal((await manager.getTask(task.id))?.completed, true);
  const other = new TaskManager();
  assert.deepEqual(await other.listTasks(), []);
  assert.deepEqual(await other.listUsers(), []);
});
