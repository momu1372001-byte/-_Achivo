import { Settings, Bot } from "lucide-react";

interface BottomBarProps {
  onOpenSettings: () => void;
  onOpenAI: () => void;
}

export default function BottomBar({ onOpenSettings, onOpenAI }: BottomBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg flex justify-around py-3 z-40">
      {/* أيقونة الإعدادات */}
      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500"
      >
        <Settings size={22} />
        <span>الإعدادات</span>
      </button>

      {/* أيقونة الذكاء الاصطناعي */}
      <button
        onClick={onOpenAI}
        className="flex flex-col items-center text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500"
      >
        <Bot size={22} />
        <span>الذكاء الاصطناعي</span>
      </button>
    </nav>
  );
}
