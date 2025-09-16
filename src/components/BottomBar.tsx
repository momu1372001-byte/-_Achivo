import React from "react";
import { Settings, Bot } from "lucide-react";

interface BottomBarProps {
  onOpenSettings: () => void;
  onOpenAI: () => void;
  language: "ar" | "en";
}

const BottomBar: React.FC<BottomBarProps> = ({ onOpenSettings, onOpenAI, language }) => {
  return (
    <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center py-2 shadow-lg">
      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center text-gray-600 dark:text-gray-300"
      >
        <Settings className="w-6 h-6 mb-1" />
        <span className="text-xs">{language === "ar" ? "الإعدادات" : "Settings"}</span>
      </button>

      <button
        onClick={onOpenAI}
        className="flex flex-col items-center text-gray-600 dark:text-gray-300"
      >
        <Bot className="w-6 h-6 mb-1" />
        <span className="text-xs">{language === "ar" ? "المساعد" : "AI"}</span>
      </button>
    </div>
  );
};

export default BottomBar;
