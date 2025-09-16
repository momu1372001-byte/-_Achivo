import React from "react";
import { Calendar, BarChart3, Target, Clock } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "dashboard", name: "لوحة التحكم", icon: BarChart3 },
    { id: "tasks", name: "المهام", icon: Clock },
    { id: "calendar", name: "التقويم", icon: Calendar },
    { id: "goals", name: "الأهداف", icon: Target },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* شعار التطبيق */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Target className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">منظم المهام</h1>
          </div>

          {/* شريط التنقل */}
          <nav className="flex overflow-x-auto no-scrollbar whitespace-nowrap space-x-2 rtl:space-x-reverse">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm sm:text-base">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};










