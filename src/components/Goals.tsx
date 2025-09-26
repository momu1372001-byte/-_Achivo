import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

// Define types for Goal and Milestone
interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}
interface Goal {
  id: string;
  title: string;
  target: number;
  milestones: Milestone[];
}

const Goals: React.FC = () => {
  // Language state ('en' or 'ar')
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  // State for all goals
  const [goals, setGoals] = useState<Goal[]>([]);

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form states inside modal
  const [title, setTitle] = useState<string>('');
  const [target, setTarget] = useState<number>(1);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState<string>('');

  // Open modal for adding a new goal
  const openAddModal = () => {
    setEditingGoal(null);
    setTitle('');
    setTarget(1);
    setMilestones([]);
    setShowModal(true);
  };

  // Open modal for editing an existing goal
  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setTarget(goal.target);
    // Clone existing milestones
    setMilestones(goal.milestones.map(m => ({ ...m })));
    setShowModal(true);
  };

  // Close the modal
  const closeModal = () => {
    setShowModal(false);
    setNewMilestoneTitle('');
  };

  // Handle saving of goal (either new or update)
  const handleSaveGoal = () => {
    // Validation: title cannot be empty
    if (title.trim() === '') {
      toast.error(
        language === 'ar' 
          ? 'عنوان الهدف لا يمكن أن يكون فارغًا' 
          : 'Title cannot be empty'
      ); // react-hot-toast error example:contentReference[oaicite:0]{index=0}
      return;
    }
    // Validation: target at least 1
    if (target < 1) {
      toast.error(
        language === 'ar' 
          ? 'يجب أن يكون الهدف على الأقل 1' 
          : 'Goal must be at least 1'
      ); // react-hot-toast error example:contentReference[oaicite:1]{index=1}
      return;
    }
    // Prepare updated goal object
    const updatedGoal: Goal = {
      id: editingGoal ? editingGoal.id : Date.now().toString(),
      title,
      target,
      milestones: [...milestones],
    };
    if (editingGoal) {
      // Update existing goal
      setGoals(prev =>
        prev.map(g => (g.id === editingGoal.id ? updatedGoal : g))
      );
      toast.success(
        language === 'ar' 
          ? 'تم تحديث الهدف بنجاح!' 
          : 'Goal updated successfully!'
      ); // react-hot-toast success example:contentReference[oaicite:2]{index=2}
    } else {
      // Add new goal
      setGoals(prev => [...prev, updatedGoal]);
      toast.success(
        language === 'ar' 
          ? 'تم حفظ الهدف بنجاح!' 
          : 'Goal saved successfully!'
      ); // react-hot-toast success example:contentReference[oaicite:3]{index=3}
    }
    closeModal();
  };

  // Handle deletion of a goal
  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    toast.success(
      language === 'ar' 
        ? 'تم حذف الهدف!' 
        : 'Goal deleted'
    ); // react-hot-toast success example:contentReference[oaicite:4]{index=4}
  };

  // Handle adding a new milestone
  const handleAddMilestone = () => {
    if (newMilestoneTitle.trim() === '') return;
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: newMilestoneTitle,
      completed: false,
    };
    setMilestones(prev => [...prev, newMilestone]);
    setNewMilestoneTitle('');
  };

  // Toggle milestone completed/uncompleted
  const handleToggleMilestone = (id: string) => {
    setMilestones(prev =>
      prev.map(m =>
        m.id === id ? { ...m, completed: !m.completed } : m
      )
    );
  };

  // Update milestone title
  const handleMilestoneTitleChange = (id: string, newTitle: string) => {
    setMilestones(prev =>
      prev.map(m => (m.id === id ? { ...m, title: newTitle } : m))
    );
  };

  // Remove a milestone from the list
  const handleRemoveMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* Existing goals display (do not modify logic) */}
      <div className="mb-4">
        {goals.map(goal => (
          <div key={goal.id} className="flex items-center justify-between p-4 border border-gray-200 mb-2 rounded">
            <div>
              <h3 className="font-bold text-lg">{goal.title}</h3>
              <p className="text-sm text-gray-600">
                {language === 'ar'
                  ? `الهدف: ${goal.target}`
                  : `Target: ${goal.target}`}
              </p>
            </div>
            <div>
              <button
                onClick={() => openEditModal(goal)}
                className="mr-2 text-blue-600 hover:underline"
              >
                {language === 'ar' ? 'تعديل' : 'Edit'}
              </button>
              <button
                onClick={() => handleDeleteGoal(goal.id)}
                className="text-red-600 hover:underline"
              >
                {language === 'ar' ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={openAddModal}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          {language === 'ar' ? 'اضافة هدف' : 'Add Goal'}
        </button>
      </div>

      {/* Modal for adding/editing a goal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-lg relative">
            <h2 className="text-xl font-bold mb-4">
              {editingGoal
                ? (language === 'ar' ? 'تحديث الهدف' : 'Update Goal')
                : (language === 'ar' ? 'اضافة هدف جديد' : 'Add New Goal')}
            </h2>
            <div className="mb-4">
              <input
                type="text"
                className="border border-gray-300 p-2 rounded w-full"
                placeholder={language === 'ar' ? 'عنوان الهدف' : 'Goal Title'}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <input
                type="number"
                className="border border-gray-300 p-2 rounded w-full"
                placeholder={language === 'ar' ? 'الهدف' : 'Target'}
                min={1}
                value={target}
                onChange={e => setTarget(Number(e.target.value))}
              />
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">
                {language === 'ar' ? 'المعالم' : 'Milestones'}
              </h3>
              <ul className="mb-2">
                {milestones.map(m => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between mt-2"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2 h-4 w-4"
                        checked={m.completed}
                        onChange={() => handleToggleMilestone(m.id)}
                      />
                      <input
                        type="text"
                        className="border border-gray-300 p-1 rounded"
                        value={m.title}
                        onChange={e => handleMilestoneTitleChange(m.id, e.target.value)}
                        placeholder={language === 'ar' ? 'المعلم...' : 'Milestone...'}
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveMilestone(m.id)}
                      className="text-red-600 ml-4"
                    >
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center">
                <input
                  type="text"
                  className="border border-gray-300 p-2 rounded w-full"
                  placeholder={language === 'ar' ? 'عنوان المعلم' : 'Milestone Title'}
                  value={newMilestoneTitle}
                  onChange={e => setNewMilestoneTitle(e.target.value)}
                />
                <button
                  onClick={handleAddMilestone}
                  className="ml-2 bg-green-500 text-white px-3 py-1 rounded"
                >
                  {language === 'ar' ? 'اضافة معلم' : 'Add Milestone'}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSaveGoal}
                className="bg-blue-500 text-white px-4 py-2 rounded"
                type="button"
              >
                {language === 'ar' ? 'حفظ' : 'Save'}
              </button>
              <button
                onClick={closeModal}
                className="ml-2 bg-gray-300 px-4 py-2 rounded"
                type="button"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toaster for notifications */}
      <Toaster position="top-right" />
    </div>
  );
};

export default Goals;
