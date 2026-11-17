# Async Task Management

Session 2 assignment: a Node.js backend written in strict TypeScript using ECMAScript modules (ESM), Promises, and async/await.

This project exposes an asynchronous task-management service and a runnable terminal demo, following the Session 1 project format. It does not expose HTTP endpoints. Data is kept in memory and is reset when the process exits or a new `TaskManager` is created. No database or credentials are required.

## Run locally

Install Node.js 22 or newer, then run from this folder:

```sh
npm ci
npm run verify
npm start
```

For automatic restarts while editing:

```sh
npm run dev
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm run typecheck` | Check types without emitting files |
| `npm start` | Build and run the example workflow |
| `npm run dev` | Run the demo in watch mode with tsx |
| `npm test` | Build and run the Node.js test suite |
| `npm run verify` | Run type checking and tests |

## Structure

```text
src/models.ts              User, Task, and TaskUpdate interfaces
src/task-manager.ts        Async user and task operations
src/app.ts                 Success and failure demonstration
test/task-manager.test.ts  Behavioral tests
tsconfig.json              Strict TypeScript and NodeNext ESM configuration
.github/workflows/verify.yml  GitHub Actions verification on Node.js 22 and 24
```

## Models and operations

`User` has `id: number` and `name: string`. `Task` has `id: number`, `title: string`, `completed: boolean`, and `userId: number`. `TaskUpdate` permits changing the title and/or completion status.

Each `TaskManager` owns an independent store. All public operations return Promises, and the in-memory storage simulates asynchronous access by yielding to the Node.js event loop with `setImmediate` from `node:timers/promises`.

| Method | Resolves to | Failure behavior |
| --- | --- | --- |
| `createUser(name)` | A new user | Rejects invalid names |
| `listUsers()` | Copies of all users | Empty array when there are no users |
| `getUser(id)` | A user or `null` | Rejects invalid IDs |
| `createTask(title, userId)` | A new incomplete task | Rejects invalid input or a missing owner |
| `listTasks()` | Copies of all tasks | Empty array when there are no tasks |
| `getTask(id)` | A task or `null` | Rejects invalid IDs |
| `updateTask(id, changes)` | The updated task | Rejects missing tasks, empty updates, unknown fields, or invalid values |
| `deleteTask(id)` | `true` if deleted, `false` if missing | Rejects invalid IDs |

IDs must be positive safe integers. Names and titles are trimmed and cannot be empty. Updates cannot change a task's ID or owner. Validation finishes before an update is stored, so a rejected update leaves the original task intact. Returned records are copies.

Example usage inside a TypeScript ESM module:

```ts
import { TaskManager } from './task-manager.js';

const manager = new TaskManager();
try {
  const user = await manager.createUser('Aylin');
  const tasks = await Promise.all([
    manager.createTask('Learn TypeScript', user.id),
    manager.createTask('Practice async/await', user.id),
  ]);
  console.log(tasks);
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
}
```

The `.js` import extension points to the compiled output. TypeScript resolves it to the source `.ts` file during compilation. See the [official TypeScript Node.js ESM documentation](https://www.typescriptlang.org/docs/handbook/modules/reference.html).

## Expected demo output

```text
Async Task Management
User: {"id":1,"name":"Aylin"}
Created tasks: [{"id":1,"title":"Learn TypeScript interfaces","completed":false,"userId":1},{"id":2,"title":"Practice async/await","completed":false,"userId":1}]
Updated task: {"id":1,"title":"Learn TypeScript interfaces","completed":true,"userId":1}
Expected failure: User 999 not found
Deleted task: true
Remaining tasks: [{"id":2,"title":"Practice async/await","completed":false,"userId":1}]
```

The expected error is caught locally so execution continues. Unexpected top-level errors are logged and set a nonzero process exit code.

## Verification and assignment checklist

- Node.js, TypeScript, and ESM: `type: module`, `NodeNext`, and explicit `.js` imports.
- Models: explicit `Task` and `User` interfaces.
- Async operations: Promise return types, async/await, and concurrent creation with `Promise.all`.
- Success and failure: demo with try/catch and tests for rejected Promises.
- Strict configuration: `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` enabled.
- Verification: `npm run verify` checks types and exercises CRUD, concurrent IDs, validation, missing records, atomic updates, copied data, and independent stores. GitHub Actions runs the same checks.
- Publication: this folder is maintained as its own Git repository; generated files and dependencies are ignored.

## AI use disclosure

OpenAI Codex assisted with interpreting the assignment, writing the TypeScript implementation, configuration, tests, GitHub Actions workflow, and README, and running verification and publication commands. The implementation uses in-memory asynchronous operations for educational purposes. Review the source and run `npm run verify` and `npm start` before submission; students should understand and be able to explain the code they submit.

## Publish future changes

```sh
npm run verify
git add .
git commit -m "Describe your changes"
git push
```
