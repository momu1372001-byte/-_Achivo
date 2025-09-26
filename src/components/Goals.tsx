import React from "react";
import { Plus, Trash2, Edit, Save, Search } from "lucide-react";

export default function Goals() {
  return (
    <div className="p-4 max-w-md mx-auto">
      {/* شريط البحث */}
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="ابحث عن هدف..."
          className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
        />
      </div>

      {/* قائمة الأهداف */}
      <div className="space-y-4">
        {/* عنصر هدف واحد */}
        <div className="p-4 border rounded-xl shadow-sm bg-white flex flex-col gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">الهدف الأول</h3>
            <p className="text-gray-600 text-sm">تفاصيل مختصرة عن الهدف...</p>
          </div>

          {/* أزرار التحكم */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
              aria-label="حفظ الهدف"
              title="حفظ الهدف"
            >
              <Save size={18} />
            </button>
            <button
              className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
              aria-label="تعديل الهدف"
              title="تعديل الهدف"
            >
              <Edit size={18} />
            </button>
            <button
              className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              aria-label="حذف الهدف"
              title="حذف الهدف"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* زر إضافة هدف */}
      <div className="mt-6 flex justify-center">
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-700">
          <Plus size={18} /> إضافة هدف جديد
        </button>
      </div>
    </div>
  );
}
