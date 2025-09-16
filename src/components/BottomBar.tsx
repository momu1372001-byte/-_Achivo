// src/components/BottomBar.tsx
import React from "react";

interface Props {
  onOpenSettings: () => void;
  onOpenAI: () => void;
  language?: string;
  settingsIcon?: React.ReactNode; // ✅ أيقونة الإعدادات
  aiIcon?: React.ReactNode;       // ✅ أيقونة الذكاء الاصطناعي
}

const BottomBar: React.FC<Props> = ({
  onOpenSettings,
  onOpenAI,
  language = "ar",
  settingsIcon,
  aiIcon,
}) => {
  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white dark:bg-gray-800 rounded-full shadow-lg px-4 py-3 flex items-center gap-4">
        {/* زر المساعد */}
        <button
          onClick={onOpenAI}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white shadow-md hover:bg-blue-600 transition"
        >
          {aiIcon && <span className="w-6 h-6">{aiIcon}</span>}
          <span className="font-medium">
            {language === "ar" ? "المساعد" : "AI"}
          </span>
        </button>

        {/* زر الإعدادات */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          {settingsIcon && <span className="w-6 h-6">{settingsIcon}</span>}
          <span className="font-medium">
            {language === "ar" ? "الإعدادات" : "Settings"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BottomBar;

