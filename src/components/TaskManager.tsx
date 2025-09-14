import React, { useState, useEffect } from 'react';
import { Plus, Search, Clock, Calendar, Flag, CheckCircle, Trash2, Play, Pause } from 'lucide-react';
import { Task, Category } from '../types';

interface TaskManagerProps {
  tasks: Task[];
  categories: Category[];
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskAdd: (task: Omit<Task, 'id'>) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  categories,
  onTaskUpdate,
  onTaskDelete,
  onTaskAdd,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: 'عام',
    dueDate: '',
  });

  // ✅ فلترة المهام
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;

    return matchesSearch && matchesPriority && matchesCategory;
  });

  // ✅ إضافة مهمة جديدة
  const handleAddTask = () => {
    if (!newTask.title.trim()) return;

    onTaskAdd({
      title: newTask.title,
      description: newTask.description,
      status: 'todo',
      priority: newTask.priority,
      category: newTask.category,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      createdAt: new Date(),
      timeSpent: 0,
    });

    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      category: 'عام',
      dueDate: '',
    });
    setShowAddForm(false);
  };

  // ✅ تغيير حالة المهمة
  const toggleTaskStatus = (task: Task) => {
    const newStatus =
      task.status === 'todo'
        ? 'in-progress'
        : task.status === 'in-progress'
        ? 'done'
        : 'todo';

    onTaskUpdate({
      ...task,
      status: newStatus,
    });
  };

  // ✅ إدارة المؤقت
  const toggleTimer = (taskId: string) => {
    if (activeTimer === taskId) {
      // إيقاف المؤقت
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        onTaskUpdate({
          ...task,
          timeSpent: task.timeSpent + Math.floor(timerSeconds / 60),
        });
      }
      setActiveTimer(null);
      setTimerSeconds(0);
    } else {
      // تشغيل المؤقت
      setActiveTimer(taskId);
      setTimerSeconds(0);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">إدارة المهام</h2>
          <p className="text-gray-600">نظم مهامك وتابع تقدمك</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة مهمة جديدة</span>
        </button>
      </div>

      {/* 🔍 الفلاتر */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في المهام..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">جميع الأولويات</option>
            <option value="high">أولوية عالية</option>
            <option value="medium">أولوية متوسطة</option>
            <option value="low">أولوية منخفضة</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">جميع الفئات</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 📝 نموذج إضافة مهمة */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">إضافة مهمة جديدة</h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="عنوان المهمة"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <textarea
                placeholder="وصف المهمة (اختياري)"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">أولوية منخفضة</option>
                  <option value="medium">أولوية متوسطة</option>
                  <option value="high">أولوية عالية</option>
                </select>

                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>

              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddTask}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                إضافة المهمة
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 قائمة المهام */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md ${
              task.status === 'done' ? 'opacity-75' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <button
                  onClick={() => toggleTaskStatus(task)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    task.status === 'done'
                      ? 'bg-green-500 border-green-500 text-white'
                      : task.status === 'in-progress'
                      ? 'bg-yellow-500 border-yellow-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  {task.status === 'done' && <CheckCircle className="w-4 h-4" />}
                </button>

                <div className="flex-1">
                  <h3
                    className={`text-lg font-semibold ${
                      task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-gray-600 mt-1">{task.description}</p>
                  )}

                  <div className="flex items-center space-x-4 mt-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        task.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Flag className="w-3 h-3 inline mr-1" />
                      {task.priority === 'high'
                        ? 'عالية'
                        : task.priority === 'medium'
                        ? 'متوسطة'
                        : 'منخفضة'}
                    </span>

                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {task.category}
                    </span>

                    {task.dueDate && (
                      <span className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(task.dueDate).toLocaleDateString('ar-SA')}
                      </span>
                    )}

                    {task.timeSpent > 0 && (
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {Math.floor(task.timeSpent / 60)}س {task.timeSpent % 60}د
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* ⏱️ المؤقت */}
                <div className="flex items-center space-x-2">
                  {activeTimer === task.id && (
                    <span className="text-sm font-mono text-blue-600">
                      {formatTime(timerSeconds)}
                    </span>
                  )}
                  <button
                    onClick={() => toggleTimer(task.id)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      activeTimer === task.id
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {activeTimer === task.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => onTaskDelete(task.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مهام</h3>
            <p className="text-gray-600">
              {searchTerm || filterPriority !== 'all' || filterCategory !== 'all'
                ? 'لا توجد مهام تطابق البحث المحدد'
                : 'ابدأ بإضافة مهامك الأولى'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
