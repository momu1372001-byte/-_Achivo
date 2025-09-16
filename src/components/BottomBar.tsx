// src/components/BottomBar.tsx
import React from "react";

interface Props {
  onOpenSettings: () => void;
  onOpenAI: () => void;
  language?: string;
}

const BottomBar: React.FC<Props> = ({ onOpenSettings, onOpenAI, language = "ar" }) => {
  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white dark:bg-gray-800 rounded-full shadow-lg px-3 py-2 flex items-center gap-2">
        <button onClick={onOpenAI} className="px-3 py-1 rounded text-sm bg-blue-500 text-white">
          {language === "ar" ? "المساعد" : "AI"}
        </button>
        <button onClick={onOpenSettings} className="px-3 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700">
          {language === "ar" ? "الإعدادات" : "Settings"}
        </button>
      </div>
    </div>
  );
};

export default BottomBar;
