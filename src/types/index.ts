// src/types.ts

// ✅ تعريف المهام
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done'; // الحالة بدل completed
  priority: 'low' | 'medium' | 'high';
  category?: string;        // ← خليتها اختيارية للتوافق
  dueDate?: Date;
  createdAt: Date;
  timeSpent: number; // بالدقائق
  goalId?: string;   // ← ربط المهمة بهدف (اختياري)
}

// ✅ تعريف الفئات (Categories)
export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
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
  purpose?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  notifyTime?: string; // "HH:MM"
  completedDays?: string[];
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
