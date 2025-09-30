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
  const [servicesOpen, setServicesOpen] = useState(false);

  const services = [
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
      {/* 🔹 زر القائمة العلوية (Settings + AI) في أقصى اليسار */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => setOpenMenu(!openMenu)}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          <Menu size={24} className="text-gray-800 dark:text-gray-200" />
        </button>

        {openMenu && (
          <div className="absolute left-0 mt-2 w-44 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => {
                onOpenAI();
                setOpenMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Bot size={20} />
              <span>{language === "ar" ? "المساعد الذكي" : "AI Assistant"}</span>
            </button>
            <button
              onClick={() => {
                onOpenSettings();
                setOpenMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Settings size={20} />
              <span>{language === "ar" ? "الإعدادات" : "Settings"}</span>
            </button>
          </div>
        )}
      </div>

      {/* 🔹 زر مركزي أسفل الشاشة (FAB) */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => setServicesOpen(!servicesOpen)}
          className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xl hover:bg-blue-600 transition"
        >
          <Plus size={30} className={`${servicesOpen ? "rotate-45 transition" : "transition"}`} />
        </button>

        {/* القائمة المنبثقة للخدمات */}
        {servicesOpen && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 grid grid-cols-3 gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            {services.map((srv) => {
              const Icon = srv.icon;
              return (
                <button
                  key={srv.key}
                  onClick={() => {
                    setActiveTab(srv.key);
                    setServicesOpen(false);
                  }}
                  className={`flex flex-col items-center p-2 rounded-lg transition ${
                    activeTab === srv.key
                      ? "text-blue-500 bg-blue-50 dark:bg-blue-900/40"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon size={26} />
                  <span className="text-xs mt-1">{srv.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default UnifiedBottomNav;
