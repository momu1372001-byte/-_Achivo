// src/components/UnifiedBottomNav.tsx
import React, { useState } from "react";
import {
  Home,
  Calendar,
  Target,
  FileText,
  PenTool,
  Timer,
  ListTodo,
  Settings,
  Bot,
  Plus,
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
  const [openMenu, setOpenMenu] = useState(false);

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
    <div>
      {/* 🔹 الشريط السفلي */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg flex justify-around items-center py-2 z-40">
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
              <span className="mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 🔹 زر واحد في المنتصف */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => setOpenMenu(!openMenu)}
          className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 transition"
        >
          <Plus size={28} className={`${openMenu ? "rotate-45 transition" : "transition"}`} />
        </button>

        {/* 🔹 القائمة المنبثقة */}
        {openMenu && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col gap-3 items-center">
            <button
              onClick={() => {
                onOpenAI();
                setOpenMenu(false);
              }}
              className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md hover:bg-purple-600 transition"
            >
              <Bot size={22} />
            </button>
            <button
              onClick={() => {
                onOpenSettings();
                setOpenMenu(false);
              }}
              className="w-12 h-12 rounded-full bg-gray-600 text-white flex items-center justify-center shadow-md hover:bg-gray-700 transition"
            >
              <Settings size={22} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedBottomNav;
