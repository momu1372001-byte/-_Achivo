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
  const containerRef = useRef<HTMLDivElement | null>(null); // يحتوي زر + و القوائم
  const menuRef = useRef<HTMLDivElement | null>(null); // يحتوي قائمة الإعدادات (top-left)
  const prefersReducedMotion = useReducedMotion();

  // قائمة الخدمات (بدون dashboard لأن أيقونة Home بعيدة الآن)
  const services = [
    { key: "tasks", label: language === "ar" ? "المهام" : "Tasks", icon: ListTodo },
    { key: "calendar", label: language === "ar" ? "التقويم" : "Calendar", icon: Calendar },
    { key: "goals", label: language === "ar" ? "الأهداف" : "Goals", icon: Target },
    { key: "notes", label: language === "ar" ? "الملاحظات" : "Notes", icon: FileText },
    { key: "draw", label: language === "ar" ? "الرسم" : "Draw", icon: PenTool },
    { key: "pomodoro", label: language === "ar" ? "بومودورو" : "Pomodoro", icon: Timer },
  ];

  // إغلاق بالـ Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setServicesOpen(false);
        setOpenMenu(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // إغلاق بالنقر خارج القوائم (نستخدم 'click' لكي لا نغلق قبل تنفيذ نقرات الأزرار)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node | null;
      const insideContainer = containerRef.current && target && containerRef.current.contains(target);
      const insideMenu = menuRef.current && target && menuRef.current.contains(target);

      // لو النقر خارج أي من المنطقتين → نقفل
      if (!insideContainer && !insideMenu) {
        setServicesOpen(false);
        setOpenMenu(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // نسق الحركة (stagger) مع احترام reduced motion
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
        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20 } },
      };

  // زر Home بعيد: نظهره فقط إذا المستخدم ليس في الصفحة الرئيسية
  const showFarHome = activeTab !== "dashboard";

  return (
    <>
      {/* قائمة الإعدادات اليسار العليا */}
      <div ref={menuRef} className="fixed top-4 left-4 z-[80]">
        <button
          aria-expanded={openMenu}
          aria-label={language === "ar" ? "قائمة" : "Menu"}
          onClick={() => setOpenMenu((s) => !s)}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <Menu size={24} className="text-gray-800 dark:text-gray-200" />
        </button>

        <AnimatePresence>
          {openMenu && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 mt-2 w-44 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              role="menu"
              aria-label={language === "ar" ? "قائمة الإعدادات" : "Settings menu"}
            >
              <button
                type="button"
                onClick={() => {
                  // نفذ الحدث الممرّر من الـ props (تأكد إنك مرّرت الدالة من الأب)
                  onOpenAI();
                  setOpenMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
              >
                <Bot size={18} />
                <span>{language === "ar" ? "المساعد الذكي" : "AI Assistant"}</span>
              </button>

              <button
                type="button"
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
        </AnimatePresence>
      </div>

      {/* الحاوية الأساسية في الأسفل (زر +، البطاقة، و زر Home البعيد) */}
      <div ref={containerRef} className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[70] flex flex-col items-center">
        {/* backdrop (خلفية ضبابية) — z أدنى من العناصر التفاعلية لتجنب Blur على الأزرار */}
        <AnimatePresence>
          {servicesOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
              aria-hidden
              // لو ضغطت على الخلفية تغلق
              onClick={() => setServicesOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* بطاقة الخدمات (تظهر فوق الزر +) */}
        <AnimatePresence>
          {servicesOpen && (
            <motion.div
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={containerVariants}
              transition={{ duration: 0.18 }}
              className="z-[70] mb-4"
            >
              <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 w-[min(92vw,720px)]">
                {services.map((srv) => {
                  const Icon = srv.icon;
                  return (
                    <motion.div key={srv.key} variants={itemVariants} className="flex flex-col items-center">
                      <button
                        type="button"
                        aria-label={srv.label}
                        title={srv.label}
                        onClick={() => {
                          setActiveTab(srv.key);
                          setServicesOpen(false);
                        }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transform transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${
                          activeTab === srv.key
                            ? "bg-blue-500 text-white scale-105 shadow-lg"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:scale-105 hover:shadow-md"
                        }`}
                      >
                        <Icon size={22} />
                      </button>
                      <span className="mt-2 text-[11px] text-gray-800 dark:text-gray-200 text-center">{srv.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* صف التحكم: زر Home البعيد (يسار) و زر + (يمين) */}
        <div className="flex items-center gap-3 z-[71]">
          {/* Home بعيد في الزاوية اليسرى السفلية (يظهر فقط لو مش على dashboard) */}
          <AnimatePresence>
            {showFarHome && (
              <motion.div
                key="far-home"
                initial={{ opacity: 0, x: -6, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -6, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="fixed left-6 bottom-6 z-[75]"
              >
                <button
                  type="button"
                  aria-label={language === "ar" ? "العودة للرئيسية" : "Back to Home"}
                  title={language === "ar" ? "العودة للرئيسية" : "Back to Home"}
                  onClick={() => {
                    setActiveTab("dashboard");
                    setServicesOpen(false);
                    setOpenMenu(false);
                  }}
                  className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-md hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <Home size={20} className="text-gray-700 dark:text-gray-200" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* زر + */}
          <button
            type="button"
            aria-expanded={servicesOpen}
            aria-label={servicesOpen ? (language === "ar" ? "إغلاق" : "Close") : (language === "ar" ? "فتح الخدمات" : "Open services")}
            onClick={() => setServicesOpen((s) => !s)}
            className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl hover:bg-blue-700 transition-transform transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            {servicesOpen ? <X size={28} /> : <Plus size={28} />}
          </button>
        </div>
      </div>
    </>
  );
};

export default UnifiedBottomNav;
