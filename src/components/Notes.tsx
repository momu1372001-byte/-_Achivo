// src/components/Notes.tsx
import React, { useState } from "react";
import { Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string; // نخزن التاريخ كـ string عشان localStorage
}

interface NotesProps {
  language: string;
}

const Notes: React.FC<NotesProps> = ({ language }) => {
  const [notes, setNotes] = useLocalStorage<Note[]>("user-notes", []);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const t = (ar: string, en: string) => (language === "ar" ? ar : en);

  // ✅ إضافة ملاحظة جديدة
  const addNote = () => {
    if (!newTitle.trim() && !newContent.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: newTitle || t("بدون عنوان", "Untitled"),
      content: newContent,
      createdAt: new Date().toISOString(), // نخزن string
    };

    setNotes([...notes, newNote]);
    setNewTitle("");
    setNewContent("");
  };

  // ✅ حذف ملاحظة
  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  // ✅ حفظ التعديلات
  const saveEdit = (id: string) => {
    setNotes(
      notes.map((n) =>
        n.id === id ? { ...n, title: editTitle, content: editContent } : n
      )
    );
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">{t("📝 الملاحظات", "📝 Notes")}</h2>

      {/* ✅ إضافة ملاحظة جديدة */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <input
          type="text"
          placeholder={t("عنوان الملاحظة", "Note title")}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full p-2 mb-2 border rounded dark:bg-gray-900 dark:text-white"
        />
        <textarea
          placeholder={t("اكتب ملاحظتك هنا...", "Write your note here...")}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="w-full p-2 mb-2 border rounded dark:bg-gray-900 dark:text-white"
          rows={3}
        />
        <button
          onClick={addNote}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          <Plus className="w-4 h-4" /> {t("إضافة", "Add")}
        </button>
      </div>

      {/* ✅ عرض الملاحظات */}
      <div className="space-y-4">
        {notes.length === 0 && (
          <p className="text-gray-500">{t("لا توجد ملاحظات", "No notes yet")}</p>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
          >
            {editingId === note.id ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2 mb-2 border rounded dark:bg-gray-900 dark:text-white"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 mb-2 border rounded dark:bg-gray-900 dark:text-white"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(note.id)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded"
                  >
                    <Save className="inline w-4 h-4" /> {t("حفظ", "Save")}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 bg-gray-400 text-white px-4 py-2 rounded"
                  >
                    <X className="inline w-4 h-4" /> {t("إلغاء", "Cancel")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold">{note.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {note.content}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {t("أضيفت في", "Created at")}:{" "}
                  {new Date(note.createdAt).toLocaleString(
                    language === "ar" ? "ar-EG" : "en-US"
                  )}
                </p>

                <div className="flex gap-2 mt-3 justify-end">
                  <button
                    onClick={() => {
                      setEditingId(note.id);
                      setEditTitle(note.title);
                      setEditContent(note.content);
                    }}
                    className="p-1 text-yellow-500 hover:scale-110 transition-transform"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1 text-red-600 hover:scale-110 transition-transform"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notes;
