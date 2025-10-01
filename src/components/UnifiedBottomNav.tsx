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
import { motion, AnimatePresence } from "framer-motion";

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
    { key: "tasks", label: language === "ar" ? "المهام" : "Tasks", icon: ListTodo },
    { key: "calendar", label: language === "ar" ? "التقويم" : "Calendar", icon: Calendar },
    { key: "goals", label: language === "ar" ? "الأهداف" : "Goals", icon: Target },
    { key: "notes", label: language === "ar" ? "الملاحظات" : "Notes", icon: FileText },
    { key: "draw", label: language === "ar" ? "الرسم" : "Draw", icon: PenTool },
    { key: "pomodoro", label: language === "ar" ? "بومودورو" : "Pomodoro", icon: Timer },
  ];

  return (
    <>
      {/* زر القائمة العلوية (Settings + AI) */}
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

      {/* شريط التنقل السفلي */}
      <div className="fixed bottom-6 w-full px-6 z-50 flex items-center justify-between">
        {/* زر + في المنتصف */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <button
              onClick={() => setServicesOpen(!servicesOpen)}
              className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xl hover:bg-blue-600 transition"
            >
              <Plus
                size={30}
                className={`${servicesOpen ? "rotate-45 transition" : "transition"}`}
              />
            </button>
{/* شبكة الأيقونات عند الفتح */}
<AnimatePresence>
  {servicesOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.25 }}
      className="absolute bottom-24 left-1/2 transform -translate-x-1/2
                 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6
                 w-full max-w-md grid grid-cols-3 gap-6 justify-items-center"
    >
      {services.map((srv) => {
        const Icon = srv.icon;
        return (
          <div key={srv.key} className="flex flex-col items-center">
            <button
              onClick={() => {
                setActiveTab(srv.key);
                setServicesOpen(false);
              }}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md transition ${
                activeTab === srv.key
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Icon size={24} />
            </button>
            <span className="mt-2 text-sm text-gray-800 dark:text-gray-200 text-center">
              {srv.label}
            </span>
          </div>
        );
      })}
    </motion.div>
  )}
</AnimatePresence>


           
           
          
          
          
          
          
          
          
          
          </div>
        </div>

        {/* زر الرئيسية (أقصى اليمين) */}
        <button
          onClick={() => {
            setActiveTab("dashboard");
            setServicesOpen(false);
          }}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition ${
            activeTab === "dashboard"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          <Home size={28} />
        </button>
      </div>
    </>
  );
};

export default UnifiedBottomNav;
