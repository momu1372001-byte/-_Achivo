// src/components/UnifiedBottomNav.tsx
import React from "react";
import {
  Home,
  Calendar,
  Target,
  FileText,
  PenTool,
  Timer,
  Settings,
  Bot,
  ListTodo,
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
  const tabs = [
    { key: "dashboard", label: language === "ar" ? "الرئيسية" : "Home", icon: Home },
    { key: "tasks", label: language === "ar" ? "المهام" : "Tasks", icon: ListTodo },
    { key: "calendar", label: language === "ar" ? "التقويم" : "Calendar", icon: Calendar },
    { key: "goals", label: language === "ar" ? "الأهداف" : "Goals", icon: Target },
    { key: "notes", label: language === "ar" ? "الملاحظات" : "Notes", icon: FileText },
    { key: "draw", label: language === "ar" ? "الرسم" : "Draw", icon: PenTool },
    { key: "pomodoro", label: language === "ar" ? "بومودورو" : "Pomodoro", icon: Timer },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg flex justify-around items-center py-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-col items-center text-sm transition ${
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

      {/* أزرار AI + الإعدادات */}
      <div className="flex gap-3 ml-3">
        <button
          onClick={onOpenAI}
          className="flex items-center gap-1 px-3 py-2 rounded-full bg-blue-500 text-white shadow-md hover:bg-blue-600 transition"
        >
          <Bot size={18} />
          <span className="hidden sm:inline">{language === "ar" ? "المساعد" : "AI"}</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1 px-3 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          <Settings size={18} />
          <span className="hidden sm:inline">
            {language === "ar" ? "الإعدادات" : "Settings"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default UnifiedBottomNav;
