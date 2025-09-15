import React, { useState } from "react";

interface LockScreenProps {
  savedPassword: string;
  onUnlock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ savedPassword, onUnlock }) => {
  const [entered, setEntered] = useState("");
  const [error, setError] = useState("");

  const handleUnlock = () => {
    if (entered === savedPassword) {
      setError("");
      onUnlock();
    } else {
      setError("❌ كلمة المرور غير صحيحة");
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
          className="w-full p-2 border rounded mb-2"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
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
