import { setImmediate } from 'node:timers/promises';
import type { Task, TaskUpdate, User } from './models.js';

function nonEmptyText(value: string, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function validId(id: number): void {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('ID must be a positive safe integer');
  }
}

/** Independent in-memory store. Every operation returns a Promise. */
export class TaskManager {
  private readonly users = new Map<number, User>();
  private readonly tasks = new Map<number, Task>();
  private nextUserId = 1;
  private nextTaskId = 1;

  async createUser(name: string): Promise<User> {
    await setImmediate();
    const user: User = { id: this.nextUserId, name: nonEmptyText(name, 'Name') };
    this.nextUserId += 1;
    this.users.set(user.id, user);
    return { ...user };
  }

  async listUsers(): Promise<User[]> {
    await setImmediate();
    return Array.from(this.users.values(), (user) => ({ ...user }));
  }

  async getUser(id: number): Promise<User | null> {
    await setImmediate();
    validId(id);
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async createTask(title: string, userId: number): Promise<Task> {
    await setImmediate();
    validId(userId);
    const cleanTitle = nonEmptyText(title, 'Title');
    if (!this.users.has(userId)) throw new Error(`User ${userId} not found`);
    const task: Task = {
      id: this.nextTaskId,
      title: cleanTitle,
      completed: false,
      userId,
    };
    this.nextTaskId += 1;
    this.tasks.set(task.id, task);
    return { ...task };
  }

  async listTasks(): Promise<Task[]> {
    await setImmediate();
    return Array.from(this.tasks.values(), (task) => ({ ...task }));
  }

  async getTask(id: number): Promise<Task | null> {
    await setImmediate();
    validId(id);
    const task = this.tasks.get(id);
    return task ? { ...task } : null;
  }

  async updateTask(id: number, changes: TaskUpdate): Promise<Task> {
    await setImmediate();
    validId(id);
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Task ${id} not found`);
    if (changes === null || typeof changes !== 'object' || Array.isArray(changes)) {
      throw new Error('Changes must be an object');
    }
    const keys = Object.keys(changes);
    if (keys.length === 0 || keys.some((key) => key !== 'title' && key !== 'completed')) {
      throw new Error('Provide title and/or completed only');
    }
    // Validate all fields before changing stored data, so failures are atomic.
    const title = 'title' in changes ? nonEmptyText(changes.title, 'Title') : task.title;
    if ('completed' in changes && typeof changes.completed !== 'boolean') {
      throw new Error('Completed must be a boolean');
    }
    const updated: Task = { ...task, title, completed: changes.completed ?? task.completed };
    this.tasks.set(id, updated);
    return { ...updated };
  }

  async deleteTask(id: number): Promise<boolean> {
    await setImmediate();
    validId(id);
    return this.tasks.delete(id);
  }
}
