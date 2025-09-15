import { Home, Calendar, Target, Brain } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { name: "Home", path: "/", icon: Home },
  { name: "Calendar", path: "/calendar", icon: Calendar },
  { name: "Goals", path: "/goals", icon: Target },
  { name: "Insights", path: "/insights", icon: Brain },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg flex justify-around py-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;

        return (
          <Link
            key={tab.name}
            to={tab.path}
            className={`flex flex-col items-center text-sm ${
              isActive
                ? "text-blue-500 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <Icon size={22} />
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
