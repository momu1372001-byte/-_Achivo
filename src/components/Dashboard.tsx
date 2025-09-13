import React from 'react';
import { CheckCircle, Clock, Target, TrendingUp, Calendar, Award } from 'lucide-react';
import { Task, Goal } from '../types';

interface DashboardProps {
  tasks: Task[];
  goals: Goal[];
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, goals }) => {
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const todayTasks = tasks.filter(task => {
    const today = new Date();
    const taskDate = task.dueDate;
    return taskDate && 
           new Date(taskDate).toDateString() === today.toDateString();
  });

  const totalTimeSpent = tasks.reduce((total, task) => total + task.timeSpent, 0);
  const averageTimePerTask = tasks.length > 0 ? Math.round(totalTimeSpent / tasks.length) : 0;

  const stats = [
    {
      title: 'المهام المكتملة',
      value: completedTasks.length,
      total: tasks.length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'المهام المتبقية',
      value: pendingTasks.length,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'مهام اليوم',
      value: todayTasks.length,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      title: 'الوقت المستغرق',
      value: `${Math.floor(totalTimeSpent / 60)}س ${totalTimeSpent % 60}د`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
  ];

  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">مرحباً  بك يامحمد محمود 0000 في لوحة التحكم</h2>
        <p className="text-gray-600">تتبع تقدمك وإنجازاتك اليومية</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} ${stat.borderColor} border rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                    {stat.total && (
                      <span className="text-sm text-gray-500 font-normal">/{stat.total}</span>
                    )}
                  </p>
                </div>
                <Icon className={`w-12 h-12 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Completion Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">معدل الإنجاز</h3>
            <Award className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">التقدم الحالي</span>
              <span className="text-sm font-medium text-gray-900">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">الأهداف</h3>
            <Target className="w-6 h-6 text-blue-500" />
          </div>
          <div className="space-y-3">
            {goals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{goal.title}</span>
                    <span className="text-xs text-gray-500">{goal.current}/{goal.target}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {goals.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">لم يتم تعيين أهداف بعد</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">المهام الحديثة</h3>
        <div className="space-y-3">
          {tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                task.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CheckCircle 
                  className={`w-5 h-5 ${
                    task.completed ? 'text-green-500' : 'text-gray-300'
                  }`}
                />
                <div>
                  <p className={`font-medium ${
                    task.completed ? 'text-green-800 line-through' : 'text-gray-900'
                  }`}>
                    {task.title}
                  </p>
                  <p className="text-sm text-gray-500">{task.category}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  task.priority === 'high' 
                    ? 'bg-red-100 text-red-700'
                    : task.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                </span>
                {task.timeSpent > 0 && (
                  <span className="text-xs text-gray-500">
                    {task.timeSpent}د
                  </span>
                )}
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-gray-500 text-center py-8">لا توجد مهام بعد. ابدأ بإضافة مهامك الأولى!</p>
          )}
        </div>
      </div>
    </div>
  );
};