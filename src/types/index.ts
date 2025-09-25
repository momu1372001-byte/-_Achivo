// src/types.ts

// ✅ تعريف المهام
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done'; // الحالة بدل completed
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: Date;
  createdAt: Date;
  timeSpent: number; // بالدقائق
}

// ✅ تعريف الفئات (Categories)
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// ✅ تعريف الـ Milestones للأهداف الكبيرة
export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

// ✅ تعريف الأهداف (Goals)
export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  type: 'daily' | 'weekly' | 'monthly';
  category: string;
  horizon?: 'short' | 'long';
  priority?: 'low' | 'medium' | 'high';
  deadline?: string; // تاريخ بصيغة ISO (مثال: "2025-12-31")
  milestones?: Milestone[];
  updatedAt?: number;
}

// ✅ تعريف جلسات الوقت (Time Tracking)
export interface TimeSession {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // بالدقائق
}
