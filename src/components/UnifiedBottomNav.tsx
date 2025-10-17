// src/components/UnifiedBottomNav.tsx
import React, { useEffect, useRef, useState } from "react";
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
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Calculator } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const services = [
    { key: "tasks", label: language === "ar" ? "المهام" : "Tasks", icon: ListTodo },
    { key: "calendar", label: language === "ar" ? "التقويم" : "Calendar", icon: Calendar },
    { key: "goals", label: language === "ar" ? "الأهداف" : "Goals", icon: Target },
    { key: "notes", label: language === "ar" ? "الملاحظات" : "Notes", icon: FileText },
    { key: "draw", label: language === "ar" ? "الرسم" : "Draw", icon: PenTool },
    { key: "pomodoro", label: language === "ar" ? "بومودورو" : "Pomodoro", icon: Timer },
    { key: "calculator", label: language === "ar" ? "الحاسبة" : "Calculator", icon: Calculator },

  ];

  // إغلاق القوائم عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const containerVariants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { staggerChildren: 0.04 } },
      };

  const itemVariants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0, y: 8, scale: 0.98 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring", stiffness: 260, damping: 20 },
        },
      };

  const showExternalHome = activeTab !== "dashboard";

  return (
    <>
      {/* زر القائمة (المساعد الذكي + الإعدادات) - أسفل يسار */}
      <div className="fixed bottom-6 left-4 z-[9999]">
        <button
          onClick={() => setOpenMenu(!openMenu)}
          className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition shadow-md"
        >
          <Menu size={24} className="text-gray-800 dark:text-gray-200" />
        </button>

        {openMenu && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 left-0 w-44 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* المساعد الذكي */}
            <button
              onClick={() => {
                onOpenAI();
                setOpenMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              <Bot size={18} />
              <span>{language === "ar" ? "المساعد الذكي" : "AI Assistant"}</span>
            </button>

            {/* الإعدادات */}
            <button
              onClick={() => {
                onOpenSettings();
                setOpenMenu(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              <Settings size={18} />
              <span>{language === "ar" ? "الإعدادات" : "Settings"}</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* شبكة الخدمات + زر البلس */}
      <div
        ref={containerRef}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex flex-col items-center"
      >
        <AnimatePresence>
          {servicesOpen && (
            <motion.div
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={containerVariants}
              className="z-40 mb-4"
            >
              <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-4 
                              grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 
                              w-[min(92vw,720px)]">
                {services.map((srv) => {
                  const Icon = srv.icon;
                  return (
                    <motion.div
                      key={srv.key}
                      variants={itemVariants}
                      className="flex flex-col items-center"
                    >
                      <button
                        onClick={() => {
                          setActiveTab(srv.key);
                          setServicesOpen(false);
                        }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all duration-150
                          ${
                            activeTab === srv.key
                              ? "bg-blue-500 text-white scale-105"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:scale-105 hover:shadow-md"
                          }`}
                      >
                        <Icon size={22} />
                      </button>
                      <span className="mt-2 text-[11px] text-gray-800 dark:text-gray-200 text-center">
                        {srv.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* زر البلس */}
        <button
          onClick={() => setServicesOpen(!servicesOpen)}
          className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl hover:bg-blue-700 transition-transform active:scale-95"
        >
          {servicesOpen ? <X size={28} /> : <Plus size={28} />}
        </button>
      </div>

      {/* زر الصفحة الرئيسية - أسفل يمين */}
      <AnimatePresence>
        {showExternalHome && (
          <motion.button
            key="external-home"
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={() => setActiveTab("dashboard")}
            className="fixed bottom-6 right-4 w-12 h-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-md hover:scale-105 transition-transform"
          >
            <Home size={20} className="text-gray-700 dark:text-gray-200" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

export default UnifiedBottomNav;
