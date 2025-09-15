// src/components/LockScreen.tsx
import React, { useState } from "react";

interface LockScreenProps {
  onUnlock: () => void;
  savedPassword: string;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, savedPassword }) => {
  const [entered, setEntered] = useState("");

  const handleUnlock = () => {
    if (entered === savedPassword) {
      onUnlock();
    } else {
      alert("❌ كلمة المرور غير صحيحة");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-center">🔒 التطبيق مقفول</h2>
        <input
          type="password"
          placeholder="أدخل كلمة المرور"
          value={entered}
          onChange={(e) => setEntered(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleUnlock}
          className="w-full bg-blue-500 text-white py-2 rounded-lg"
        >
          فتح التطبيق
        </button>
      </div>
    </div>
  );
};

export default LockScreen;
