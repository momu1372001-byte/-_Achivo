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

      {/* زر + في أسفل المنتصف */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => setServicesOpen(!servicesOpen)}
          className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xl hover:bg-blue-600 transition"
        >
          <Plus
            size={30}
            className={`${servicesOpen ? "rotate-45 transition" : "transition"}`}
          />
        </button>

        {/* الأيقونات على شكل نصف دائرة */}
        <AnimatePresence>
          {servicesOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
            >
              <div className="relative">
                {services.map((srv, i) => {
                  const Icon = srv.icon;

                  // توزيع الأيقونات على نصف دائرة (180°)
                  const totalAngle = Math.PI; // نصف دائرة بالراديان
                  const startAngle = Math.PI; // يبدأ من يسار ليمين
                  const angle =
                    startAngle - (i / (services.length - 1)) * totalAngle;

                  // نصف القطر ديناميك على حسب حجم الشاشة
                  const radius =
                    Math.min(window.innerWidth, window.innerHeight) / 2.8;

                  const x = Math.cos(angle) * radius;
                  const y = -Math.sin(angle) * radius;

                  return (
                    <motion.div
                      key={srv.key}
                      initial={{ x: 0, y: 0, opacity: 0 }}
                      animate={{ x, y, opacity: 1 }}
                      exit={{ x: 0, y: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      className="absolute flex flex-col items-center"
                    >
                      <button
                        onClick={() => {
                          setActiveTab(srv.key);
                          setServicesOpen(false);
                        }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md ${
                          activeTab === srv.key
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        <Icon size={22} />
                      </button>
                      <span className="mt-1 text-xs text-gray-800 dark:text-gray-200">
                        {srv.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default UnifiedBottomNav;
