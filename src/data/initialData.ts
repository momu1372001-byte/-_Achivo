import { Task, Category, Goal } from '../types';

export const initialCategories: Category[] = [
  { id: '1', name: 'عام', color: '#3B82F6', icon: 'folder' },
  { id: '2', name: 'عمل', color: '#EF4444', icon: 'briefcase' },
  { id: '3', name: 'شخصي', color: '#10B981', icon: 'user' },
  { id: '4', name: 'دراسة', color: '#F59E0B', icon: 'book' },
  { id: '5', name: 'صحة', color: '#8B5CF6', icon: 'heart' },
];

export const initialTasks: Task[] = [
  {
    id: '1',
    title: 'مراجعة التقرير الشهري',
    description: 'مراجعة وتحليل الأرقام والإحصائيات للشهر الماضي',
    completed: false,
    priority: 'high',
    category: 'عمل',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    createdAt: new Date(),
    timeSpent: 45,
  },
  {
    id: '2',
    title: 'ممارسة الرياضة',
    description: 'جري لمدة 30 دقيقة في الحديقة',
    completed: true,
    priority: 'medium',
    category: 'صحة',
    dueDate: new Date(),
    createdAt: new Date(),
    timeSpent: 30,
  },
  {
    id: '3',
    title: 'قراءة كتاب التطوير الذاتي',
    description: 'قراءة الفصل الثالث من كتاب تطوير المهارات',
    completed: false,
    priority: 'low',
    category: 'شخصي',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    createdAt: new Date(),
    timeSpent: 0,
  },
  {
    id: '4',
    title: 'إعداد العرض التقديمي',
    description: 'تحضير العرض التقديمي لاجتماع فريق العمل',
    completed: false,
    priority: 'high',
    category: 'عمل',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    timeSpent: 60,
  },
];

export const initialGoals: Goal[] = [
  {
    id: '1',
    title: 'إنجاز 5 مهام عمل يومياً',
    target: 5,
    current: 2,
    type: 'daily',
    category: 'عمل',
  },
  {
    id: '2',
    title: 'ممارسة الرياضة 3 مرات أسبوعياً',
    target: 3,
    current: 1,
    type: 'weekly',
    category: 'صحة',
  },
  {
    id: '3',
    title: 'قراءة فصل واحد يومياً',
    target: 1,
    current: 0,
    type: 'daily',
    category: 'شخصي',
  },
];