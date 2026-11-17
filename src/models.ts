export interface User {
  id: number;
  name: string;
}

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

export interface TaskUpdate {
  title?: string;
  completed?: boolean;
}
