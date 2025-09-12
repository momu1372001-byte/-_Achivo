export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: Date;
  createdAt: Date;
  timeSpent: number; // in minutes
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  type: 'daily' | 'weekly';
  category: string;
}

export interface TimeSession {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
}