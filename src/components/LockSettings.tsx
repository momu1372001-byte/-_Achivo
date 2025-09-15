// src/components/LockSettings.tsx
import React, { useState } from "react";

interface LockSettingsProps {
  password: string | null;
  setPassword: (pw: string | null) => void;
}

const LockSettings: React.FC<LockSettingsProps> = ({ password, setPassword }) => {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [oldPw, setOldPw] = useState("");

  const handleSetPassword = () => {
    if (!newPw || !confirmPw) return alert("أدخل كلمة المرور وتأكيدها");
    if (newPw !== confirmPw) return alert("كلمتا المرور غير متطابقتين");
    setPassword(newPw);
    setNewPw("");
    setConfirmPw("");
    alert("✅ تم إنشاء كلمة المرور بنجاح");
  };

  const handleChangePassword = () => {
    if (oldPw !== password) return alert("❌ كلمة المرور القديمة غير صحيحة");
    if (!newPw || !confirmPw) return alert("أدخل كلمة المرور الجديدة وتأكيدها");
    if (newPw !== confirmPw) return alert("كلمتا المرور غير متطابقتين");
    setPassword(newPw);
    setOldPw("");
    setNewPw("");
    setConfirmPw("");
    alert("✅ تم تغيير كلمة المرور");
  };

  const handleRemovePassword = () => {
    if (oldPw !== password) return alert("❌ كلمة المرور القديمة غير صحيحة");
    setPassword(null);
    setOldPw("");
    alert("✅ تم إلغاء كلمة المرور");
  };

  return (
    <div className="space-y-6">
      {!password ? (
        <>
          <h3 className="text-lg font-bold">🔐 إنشاء كلمة مرور</h3>
          <input
            type="password"
            placeholder="كلمة المرور"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="تأكيد كلمة المرور"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleSetPassword}
            className="w-full bg-blue-500 text-white py-2 rounded-lg"
          >
            حفظ
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold">🔐 إدارة كلمة المرور</h3>

          {/* تغيير كلمة المرور */}
          <div className="space-y-2">
            <input
              type="password"
              placeholder="كلمة المرور القديمة"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="كلمة المرور الجديدة"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="تأكيد كلمة المرور الجديدة"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleChangePassword}
              className="w-full bg-green-500 text-white py-2 rounded-lg"
            >
              تغيير كلمة المرور
            </button>
          </div>

          {/* إلغاء كلمة المرور */}
          <button
            onClick={handleRemovePassword}
            className="w-full bg-red-500 text-white py-2 rounded-lg mt-4"
          >
            إلغاء كلمة المرور
          </button>
        </>
      )}
    </div>
  );
};

export default LockSettings;
