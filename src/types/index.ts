// src/types.ts

// ✅ تعريف المهام
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category?: string;        
  dueDate?: string;        // تحويل من Date إلى ISO string لتوافق Dashboard
  createdAt: string;       // تحويل من Date إلى ISO string
  timeSpent: number;       // بالدقائق
  goalId?: string;         
  completedAt?: string;    // جديد: لتحديد متى تم الانتهاء
}

// ✅ تعريف الفئات (Categories)
export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

// ✅ تعريف الملاحظات (Notes)
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt?: string;      // ISO string
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
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  notifyTime?: string;     // "HH:MM"
  completedDays?: string[];
  milestones?: Milestone[];
  updatedAt?: number;
}

// ✅ تعريف جلسات الوقت (Time Tracking)
export interface TimeSession {
  id: string;
  taskId: string;
  startTime: string;       // ISO string
  endTime?: string;        // ISO string
  duration: number;        // بالدقائق
}
