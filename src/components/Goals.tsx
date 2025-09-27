import React, { useState } from 'react';
import { Goal, Task } from './types';

interface GoalsProps {}

const Goals: React.FC<GoalsProps> = () => {
    const [lang, setLang] = useState<'en' | 'ar'>('en');

    const translations = {
        en: {
            title: 'Goals',
            goalTitle: 'Title',
            addGoal: 'Add Goal',
            editGoal: 'Edit Goal',
            delete: 'Delete',
            updateGoal: 'Update Goal',
            cancel: 'Cancel',
            searchPlaceholder: 'Search goals...',
            filterByHorizon: 'Filter by Horizon',
            filterByPriority: 'Filter by Priority',
            filterByCategory: 'Filter by Category',
            all: 'All',
            horizon: 'Horizon',
            horizonShort: 'Short-term',
            horizonLong: 'Long-term',
            priority: 'Priority',
            priorityLow: 'Low',
            priorityMedium: 'Medium',
            priorityHigh: 'High',
            type: 'Type',
            typeDaily: 'Daily',
            typeWeekly: 'Weekly',
            category: 'Category',
            deadline: 'Deadline',
            target: 'Target',
            milestones: 'Milestones',
            milestonePlaceholder: 'Add milestone (Press Enter)',
            tasks: 'Tasks',
            task: 'Task',
            noTasks: 'No tasks',
            progress: 'Progress',
            languageToggle: 'العربية',
            personal: 'Personal',
            work: 'Work',
            health: 'Health',
            finance: 'Finance',
        },
        ar: {
            title: 'الأهداف',
            goalTitle: 'العنوان',
            addGoal: 'إضافة هدف',
            editGoal: 'تعديل الهدف',
            delete: 'حذف',
            updateGoal: 'تحديث الهدف',
            cancel: 'إلغاء',
            searchPlaceholder: 'البحث عن الأهداف...',
            filterByHorizon: 'حسب الأمد',
            filterByPriority: 'حسب الأولوية',
            filterByCategory: 'حسب الفئة',
            all: 'الكل',
            horizon: 'المدة',
            horizonShort: 'قصير الأجل',
            horizonLong: 'طويل الأجل',
            priority: 'الأولوية',
            priorityLow: 'منخفضة',
            priorityMedium: 'متوسطة',
            priorityHigh: 'عالية',
            type: 'النوع',
            typeDaily: 'يومي',
            typeWeekly: 'أسبوعي',
            category: 'الفئة',
            deadline: 'الموعد النهائي',
            target: 'الهدف',
            milestones: 'الخطوات',
            milestonePlaceholder: 'إضافة خطوة (اضغط Enter)',
            tasks: 'المهام',
            task: 'المهمة',
            noTasks: 'لا مهام',
            progress: 'التقدم',
            languageToggle: 'English',
            personal: 'شخصي',
            work: 'عمل',
            health: 'صحة',
            finance: 'مالية',
        },
    };

    const t = translations[lang];

    const categories = [
        { value: 'Personal', label: { en: translations.en.personal, ar: translations.ar.personal } },
        { value: 'Work', label: { en: translations.en.work, ar: translations.ar.work } },
        { value: 'Health', label: { en: translations.en.health, ar: translations.ar.health } },
        { value: 'Finance', label: { en: translations.en.finance, ar: translations.ar.finance } },
    ];

    const [goals, setGoals] = useState<Goal[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterHorizon, setFilterHorizon] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

    const [formTitle, setFormTitle] = useState('');
    const [formTarget, setFormTarget] = useState<number>(0);
    const [formCategory, setFormCategory] = useState(categories[0].value);
    const [formHorizon, setFormHorizon] = useState('short');
    const [formPriority, setFormPriority] = useState('Low');
    const [formType, setFormType] = useState<'daily' | 'weekly'>('daily');
    const [formDeadline, setFormDeadline] = useState('');
    const [milestoneInput, setMilestoneInput] = useState('');
    const [formMilestones, setFormMilestones] = useState<string[]>([]);
    const [taskInput, setTaskInput] = useState('');
    const [taskTypeInput, setTaskTypeInput] = useState<'daily' | 'weekly'>('daily');
    const [formTasks, setFormTasks] = useState<Task[]>([]);

    const resetForm = () => {
        setFormTitle('');
        setFormTarget(0);
        setFormCategory(categories[0].value);
        setFormHorizon('short');
        setFormPriority('Low');
        setFormType('daily');
        setFormDeadline('');
        setFormMilestones([]);
        setFormTasks([]);
        setEditingGoalId(null);
    };

    const handleAddOrUpdateGoal = () => {
        if (editingGoalId) {
            setGoals(prevGoals =>
                prevGoals.map(goal =>
                    goal.id === editingGoalId
                        ? {
                              ...goal,
                              title: formTitle,
                              target: formTarget,
                              category: formCategory,
                              horizon: formHorizon,
                              priority: formPriority,
                              type: formType,
                              deadline: formDeadline,
                              milestones: formMilestones,
                              tasks: formTasks,
                              updatedAt: new Date().toISOString(),
                          }
                        : goal
                )
            );
        } else {
            const newGoal: Goal = {
                id: Date.now().toString(),
                title: formTitle,
                target: formTarget,
                category: formCategory,
                horizon: formHorizon,
                priority: formPriority,
                type: formType,
                deadline: formDeadline,
                milestones: formMilestones,
                tasks: formTasks,
                updatedAt: new Date().toISOString(),
            };
            setGoals(prevGoals => [...prevGoals, newGoal]);
        }
        resetForm();
    };

    const handleEditGoal = (goal: Goal) => {
        setEditingGoalId(goal.id);
        setFormTitle(goal.title);
        setFormTarget(goal.target);
        setFormCategory(goal.category);
        setFormHorizon(goal.horizon);
        setFormPriority(goal.priority);
        setFormType(goal.type);
        setFormDeadline(goal.deadline);
        setFormMilestones(goal.milestones);
        setFormTasks(goal.tasks || []);
    };

    const handleDeleteGoal = (id: string) => {
        if (window.confirm('Are you sure you want to delete this goal?')) {
            setGoals(prevGoals => prevGoals.filter(goal => goal.id !== id));
        }
    };

    const handleAddMilestone = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && milestoneInput.trim()) {
            setFormMilestones(prev => [...prev, milestoneInput.trim()]);
            setMilestoneInput('');
        }
    };

    const handleDeleteMilestone = (index: number) => {
        setFormMilestones(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddTask = () => {
        if (!taskInput.trim()) return;
        const newTask: Task = {
            id: Date.now().toString(),
            title: taskInput.trim(),
            type: taskTypeInput,
            completed: false,
        };
        setFormTasks(prev => [...prev, newTask]);
        setTaskInput('');
    };

    const handleDeleteTask = (taskId: string) => {
        setFormTasks(prev => prev.filter(task => task.id !== taskId));
    };

    const toggleTaskCompleted = (goalId: string, taskId: string) => {
        setGoals(prevGoals =>
            prevGoals.map(goal => {
                if (goal.id === goalId) {
                    const updatedTasks = goal.tasks.map(task =>
                        task.id === taskId ? { ...task, completed: !task.completed } : task
                    );
                    return { ...goal, tasks: updatedTasks };
                }
                return goal;
            })
        );
    };

    const filteredGoals = goals.filter(goal => {
        return (
            (filterHorizon === '' || goal.horizon === filterHorizon) &&
            (filterPriority === '' || goal.priority === filterPriority) &&
            (filterCategory === '' || goal.category === filterCategory) &&
            goal.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    return (
        <div className={lang === 'ar' ? 'text-right' : 'text-left'} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="px-4 py-2 bg-gray-200 rounded">
                    {t.languageToggle}
                </button>
            </div>

            <div className="bg-white shadow rounded p-4 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                    {editingGoalId ? t.editGoal : t.addGoal}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium mb-1">{t.goalTitle}</label>
                        <input
                            type="text"
                            value={formTitle}
                            onChange={e => setFormTitle(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">{t.category}</label>
                        <select
                            value={formCategory}
                            onChange={e => setFormCategory(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>
                                    {lang === 'en' ? cat.label.en : cat.label.ar}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium mb-1">{t.target}</label>
                        <input
                            type="number"
                            value={formTarget}
                            onChange={e => setFormTarget(Number(e.target.value))}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">{t.deadline}</label>
                        <input
                            type="date"
                            value={formDeadline}
                            onChange={e => setFormDeadline(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1">{t.horizon}</label>
                        <select
                            value={formHorizon}
                            onChange={e => setFormHorizon(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="short">{t.horizonShort}</option>
                            <option value="long">{t.horizonLong}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium mb-1">{t.priority}</label>
                        <select
                            value={formPriority}
                            onChange={e => setFormPriority(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="Low">{t.priorityLow}</option>
                            <option value="Medium">{t.priorityMedium}</option>
                            <option value="High">{t.priorityHigh}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium mb-1">{t.type}</label>
                        <select
                            value={formType}
                            onChange={e => setFormType(e.target.value as 'daily' | 'weekly')}
                            className="w-full p-2 border rounded"
                        >
                            <option value="daily">{t.typeDaily}</option>
                            <option value="weekly">{t.typeWeekly}</option>
                        </select>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block font-medium mb-1">{t.milestones}</label>
                        <input
                            type="text"
                            placeholder={t.milestonePlaceholder}
                            value={milestoneInput}
                            onChange={e => setMilestoneInput(e.target.value)}
                            onKeyDown={handleAddMilestone}
                            className="w-full p-2 border rounded"
                        />
                        <ul className="mt-2 space-y-1">
                            {formMilestones.map((ms, idx) => (
                                <li key={idx} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                                    <span>{ms}</span>
                                    <button onClick={() => handleDeleteMilestone(idx)} className="text-red-500">
                                        &times;
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block font-medium mb-1">{t.tasks}</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                placeholder={t.task}
                                value={taskInput}
                                onChange={e => setTaskInput(e.target.value)}
                                className="flex-1 p-2 border rounded"
                            />
                            <select
                                value={taskTypeInput}
                                onChange={e => setTaskTypeInput(e.target.value as 'daily' | 'weekly')}
                                className="p-2 border rounded"
                            >
                                <option value="daily">{t.typeDaily}</option>
                                <option value="weekly">{t.typeWeekly}</option>
                            </select>
                            <button
                                onClick={handleAddTask}
                                className="p-2 bg-blue-500 text-white rounded"
                            >
                                +
                            </button>
                        </div>
                        <ul className="space-y-1">
                            {formTasks.map(task => (
                                <li key={task.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                                    <span>
                                        {task.title} ({task.type === 'daily' ? t.typeDaily : t.typeWeekly})
                                    </span>
                                    <button onClick={() => handleDeleteTask(task.id)} className="text-red-500">
                                        &times;
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="mt-4">
                    <button
                        onClick={handleAddOrUpdateGoal}
                        className="px-4 py-2 bg-green-500 text-white rounded mr-2"
                    >
                        {editingGoalId ? t.updateGoal : t.addGoal}
                    </button>
                    {editingGoalId && (
                        <button onClick={resetForm} className="px-4 py-2 bg-gray-300 text-black rounded">
                            {t.cancel}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex gap-2 mb-2 md:mb-0">
                    <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="p-2 border rounded"
                    />
                    <select
                        value={filterHorizon}
                        onChange={e => setFilterHorizon(e.target.value)}
                        className="p-2 border rounded"
                    >
                        <option value="">{t.all}</option>
                        <option value="short">{t.horizonShort}</option>
                        <option value="long">{t.horizonLong}</option>
                    </select>
                    <select
                        value={filterPriority}
                        onChange={e => setFilterPriority(e.target.value)}
                        className="p-2 border rounded"
                    >
                        <option value="">{t.all}</option>
                        <option value="Low">{t.priorityLow}</option>
                        <option value="Medium">{t.priorityMedium}</option>
                        <option value="High">{t.priorityHigh}</option>
                    </select>
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="p-2 border rounded"
                    >
                        <option value="">{t.all}</option>
                        {categories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                                {lang === 'en' ? cat.label.en : cat.label.ar}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredGoals.map(goal => {
                    const completedTasks = goal.tasks.filter(t => t.completed).length;
                    const totalTasks = goal.tasks.length;
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                    return (
                        <div key={goal.id} className="bg-white shadow rounded p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold">{goal.title}</h3>
                                <div>
                                    <button
                                        onClick={() => handleEditGoal(goal)}
                                        className="px-2 py-1 bg-yellow-300 text-black rounded mr-2"
                                    >
                                        {t.editGoal}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGoal(goal.id)}
                                        className="px-2 py-1 bg-red-500 text-white rounded"
                                    >
                                        {t.delete}
                                    </button>
                                </div>
                            </div>
                            <p>
                                {t.category}: {lang === 'en' ? goal.category : translations.ar[goal.category.toLowerCase()]}
                            </p>
                            <p>
                                {t.horizon}: {goal.horizon === 'short' ? t.horizonShort : t.horizonLong}
                            </p>
                            <p>
                                {t.priority}: {goal.priority === 'Low' ? t.priorityLow : goal.priority === 'Medium' ? t.priorityMedium : t.priorityHigh}
                            </p>
                            <p>{t.deadline}: {goal.deadline}</p>
                            {goal.milestones.length > 0 && (
                                <div>
                                    <p className="font-medium">{t.milestones}:</p>
                                    <ul className="list-disc list-inside mb-2">
                                        {goal.milestones.map((ms, idx) => (
                                            <li key={idx}>{ms}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="mb-2">
                                <p className="font-medium">{t.tasks}:</p>
                                {totalTasks > 0 ? (
                                    <ul className="list-disc list-inside">
                                        {goal.tasks.map(task => (
                                            <li key={task.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={task.completed}
                                                    onChange={() => toggleTaskCompleted(goal.id, task.id)}
                                                    className="mr-2"
                                                />
                                                <span>
                                                    {task.title} ({task.type === 'daily' ? t.typeDaily : t.typeWeekly})
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">{t.noTasks}</p>
                                )}
                            </div>
                            <div>
                                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                                    <div
                                        className="bg-blue-500 h-full"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm">{t.progress}: {progress}%</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Goals;

