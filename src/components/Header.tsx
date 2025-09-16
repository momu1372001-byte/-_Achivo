import React from "react";
import { Calendar, BarChart3, Target, Clock } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: "ar" | "en";
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, language }) => {
  const tabs = [
    { id: "dashboard", nameAr: "لوحة التحكم", nameEn: "Dashboard", icon: BarChart3 },
    { id: "tasks", nameAr: "المهام", nameEn: "Tasks", icon: Clock },
    { id: "calendar", nameAr: "التقويم", nameEn: "Calendar", icon: Calendar },
    { id: "goals", nameAr: "الأهداف", nameEn: "Goals", icon: Target },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Target className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {language === "ar" ? "منظم المهام" : "Task Organizer"}
            </h1>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700 shadow-sm dark:bg-blue-700 dark:text-white"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{language === "ar" ? tab.nameAr : tab.nameEn}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
