export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done'; // ✅ بدل completed
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: Date;
  createdAt: Date;
  timeSpent: number; // بالدقايق
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
  type: 'daily' | 'weekly' | 'monthly';
  category: string;
}
