// src/components/UnifiedBottomNav.tsx
import React, { useState } from "react";
import {
  Home,
  Calendar,
  Target,
  ListTodo,
  MoreHorizontal,
  Settings,
  Bot,
} from "lucide-react";

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenAI: () => void;
  language?: "ar" | "en";
}

const UnifiedBottomNav: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenAI,
  language = "ar",
}) => {
  const [showMore, setShowMore] = useState(false);

  const mainTabs = [
    { key: "dashboard", label: language === "ar" ? "الرئيسية" : "Home", icon: Home },
    { key: "tasks", label: language === "ar" ? "المهام" : "Tasks", icon: ListTodo },
    { key: "calendar", label: language === "ar" ? "التقويم" : "Calendar", icon: Calendar },
    { key: "goals", label: language === "ar" ? "الأهداف" : "Goals", icon: Target },
  ];

  const extraTabs = [
    { key: "notes", label: language === "ar" ? "الملاحظات" : "Notes" },
    { key: "draw", label: language === "ar" ? "الرسم" : "Draw" },
    { key: "pomodoro", label: language === "ar" ? "بومودورو" : "Pomodoro" },
  ];

  return (
    <div>
      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg flex justify-around items-center py-2 z-40">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center text-xs transition ${
                isActive
                  ? "text-blue-500 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <Icon size={22} />
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* زر المزيد */}
        <button
          onClick={() => setShowMore(!showMore)}
          className="flex flex-col items-center text-xs text-gray-500 dark:text-gray-400"
        >
          <MoreHorizontal size={22} />
          <span>{language === "ar" ? "المزيد" : "More"}</span>
        </button>
      </div>

      {/* قائمة المزيد */}
      {showMore && (
        <div className="absolute bottom-16 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg p-4 grid grid-cols-3 gap-3 z-50">
          {extraTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setShowMore(false);
              }}
              className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-600 transition"
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* أزرار AI + Settings كأزرار عائمة */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-3 z-50">
        <button
          onClick={onOpenAI}
          className="p-3 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition"
        >
          <Bot size={20} />
        </button>
        <button
          onClick={onOpenSettings}
          className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
};

export default UnifiedBottomNav;
