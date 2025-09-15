import React, { useState } from "react";

interface LockSettingsProps {
  password: string | null;
  setPassword: (pw: string | null) => void;
}

const LockSettings: React.FC<LockSettingsProps> = ({ password, setPassword }) => {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = () => {
    if (!newPw || !confirmPw) return setMessage("⚠️ أدخل كلمة المرور وتأكيدها");
    if (newPw !== confirmPw) return setMessage("❌ كلمتا المرور غير متطابقتين");
    setPassword(newPw);
    setNewPw(""); setConfirmPw("");
    setMessage("✅ تم إنشاء كلمة المرور بنجاح");
  };

  const handleChange = () => {
    if (oldPw !== password) return setMessage("❌ كلمة المرور القديمة خاطئة");
    if (!newPw || !confirmPw) return setMessage("⚠️ أدخل كلمة المرور الجديدة");
    if (newPw !== confirmPw) return setMessage("❌ غير متطابقة");
    setPassword(newPw);
    setOldPw(""); setNewPw(""); setConfirmPw("");
    setMessage("✅ تم تغيير كلمة المرور");
  };

  const handleRemove = () => {
    if (oldPw !== password) return setMessage("❌ كلمة المرور القديمة خاطئة");
    setPassword(null);
    setOldPw("");
    setMessage("✅ تم إلغاء كلمة المرور");
  };

  return (
    <div className="p-6">
      {!password ? (
        <>
          <h2 className="text-lg font-bold mb-4">🔐 إنشاء كلمة مرور</h2>
          <input
            type="password"
            placeholder="كلمة المرور"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="password"
            placeholder="تأكيد كلمة المرور"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          <button
            onClick={handleCreate}
            className="w-full bg-blue-500 text-white py-2 rounded-lg"
          >
            حفظ
          </button>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold mb-4">🔐 إدارة كلمة المرور</h2>
          <input
            type="password"
            placeholder="كلمة المرور القديمة"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="password"
            placeholder="كلمة المرور الجديدة"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="password"
            placeholder="تأكيد كلمة المرور"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          <button
            onClick={handleChange}
            className="w-full bg-green-500 text-white py-2 rounded-lg mb-2"
          >
            تغيير كلمة المرور
          </button>
          <button
            onClick={handleRemove}
            className="w-full bg-red-500 text-white py-2 rounded-lg"
          >
            إلغاء كلمة المرور
          </button>
        </>
      )}
      {message && <p className="mt-3 text-sm">{message}</p>}
    </div>
  );
};

export default LockSettings;
