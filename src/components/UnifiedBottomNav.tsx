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
  Menu,
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
  const [menuOpen, setMenuOpen] = useState(false);

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
    <>
      {/* زر القائمة العلوية */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          <Menu size={24} className="text-gray-800 dark:text-gray-200" />
        </button>

        {/* القائمة المنبثقة */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => {
                onOpenAI();
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Bot size={20} />
              <span>{language === "ar" ? "المساعد" : "AI Assistant"}</span>
            </button>
            <button
              onClick={() => {
                onOpenSettings();
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Settings size={20} />
              <span>{language === "ar" ? "الإعدادات" : "Settings"}</span>
            </button>
          </div>
        )}
      </div>

      {/* الشريط السفلي مع Scroll */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg overflow-x-auto">
        <div className="flex justify-start items-center px-2 py-2 gap-4 min-w-max">
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
                <Icon size={24} />
                <span className="mt-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default UnifiedBottomNav;
