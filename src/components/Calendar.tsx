import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Flag } from 'lucide-react';
import { Task } from '../types';

interface CalendarProps {
  tasks: Task[];
  language: string; // ✅ أضفنا خاصية اللغة
}

export const Calendar: React.FC<CalendarProps> = ({ tasks, language }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // ✅ أسماء الشهور حسب اللغة
  const monthNames = language === "ar"
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
       'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June',
       'July', 'August', 'September', 'October', 'November', 'December'];

  // ✅ أسماء الأيام حسب اللغة
  const weekDays = language === "ar"
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate).toDateString() === date.toDateString()
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();

  const calendarDays: (number | null)[] = [];
  
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <p className="text-gray-600 mt-1">
              {language === "ar" ? "تقويم المهام والمواعيد" : "Tasks & Appointments Calendar"}
            </p>
          </div>
          
          <div className="flex space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              {language === "ar" ? "اليوم" : "Today"}
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 divide-x divide-gray-200">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-24 p-2 bg-gray-50"></div>;
            }

            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayTasks = getTasksForDate(date);
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < today && !isToday;

            return (
              <div
                key={day}
                className={`h-24 p-2 border-b border-gray-200 transition-colors duration-200 hover:bg-gray-50 ${
                  isPast ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${
                    isToday 
                      ? 'bg-blue-600 text-white px-2 py-1 rounded-full'
                      : isPast 
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}>
                    {day}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className={`text-xs p-1 rounded truncate ${
                        task.completed
                          ? 'bg-green-100 text-green-700'
                          : task.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        {task.priority === 'high' && <Flag className="w-2 h-2" />}
                        <span className="truncate">{task.title}</span>
                      </div>
                    </div>
                  ))}
                  
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      {language === "ar" 
                        ? `+${dayTasks.length - 2} مهام أخرى`
                        : `+${dayTasks.length - 2} more tasks`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          {language === "ar" ? "مهام اليوم" : "Today's Tasks"}
        </h3>
        
        <div className="space-y-3">
          {getTasksForDate(today).map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                task.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className={`w-4 h-4 rounded-full ${
                  task.completed
                    ? 'bg-green-500'
                    : task.priority === 'high'
                    ? 'bg-red-500'
                    : task.priority === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}></div>
                <div>
                  <p className={`font-medium ${
                    task.completed ? 'text-green-800 line-through' : 'text-gray-900'
                  }`}>
                    {task.title}
                  </p>
                  <p className="text-sm text-gray-500">{task.category}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  task.priority === 'high' 
                    ? 'bg-red-100 text-red-700'
                    : task.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {language === "ar"
                    ? task.priority === 'high'
                      ? 'عالية'
                      : task.priority === 'medium'
                      ? 'متوسطة'
                      : 'منخفضة'
                    : task.priority === 'high'
                      ? 'High'
                      : task.priority === 'medium'
                      ? 'Medium'
                      : 'Low'}
                </span>
              </div>
            </div>
          ))}
          
          {getTasksForDate(today).length === 0 && (
            <p className="text-gray-500 text-center py-8">
              {language === "ar" ? "لا توجد مهام لليوم" : "No tasks for today"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
