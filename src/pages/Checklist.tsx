import { useState, useRef } from 'react';
import { useCurrentTripData } from '../store/tripStore';
import { ChecklistItem } from '../types';
import { CheckSquare, Plus, Trash2, X, Check, Pencil } from 'lucide-react';

const CATEGORIES: ChecklistItem['category'][] = ['מסמכים', 'בגדים', 'ציוד', 'תרופות', 'אלקטרוניקה', 'אחר'];

const CATEGORY_ICONS: Record<string, string> = {
  מסמכים: '📄', בגדים: '👕', ציוד: '🎒', תרופות: '💊', אלקטרוניקה: '📱', אחר: '📦',
};

export default function Checklist() {
  const { trip, checklist, addChecklistItem, toggleChecklistItem, updateChecklistItem, deleteChecklistItem } = useCurrentTripData();
  const [showForm, setShowForm] = useState(false);
  const [newText, setNewText] = useState('');
  const [newCat, setNewCat] = useState<ChecklistItem['category']>('אחר');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  const totalChecked = checklist.filter(c => c.checked).length;
  const progress = checklist.length > 0 ? Math.round((totalChecked / checklist.length) * 100) : 0;

  const handleAdd = () => {
    if (!newText.trim()) return;
    addChecklistItem({
      id: `chk-${Date.now()}`,
      tripId: trip.id,
      category: newCat,
      text: newText.trim(),
      checked: false,
    });
    setNewText('');
    setShowForm(false);
  };

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditText(item.text);
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const saveEdit = (id: string) => {
    if (editText.trim()) updateChecklistItem(id, { text: editText.trim() });
    setEditingId(null);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-blue-500" /> רשימות תיוג
        </h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> הוסף פריט
        </button>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span className="font-medium">התקדמות</span>
          <span>{totalChecked} / {checklist.length} פריטים ({progress}%)</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div className="h-3 rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        {progress === 100 && checklist.length > 0 && (
          <p className="text-green-600 text-sm mt-2 font-medium">כל הפריטים הושלמו! 🎉</p>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-700 mb-4">פריט חדש</h3>
          <div className="flex gap-3 flex-wrap">
            <select value={newCat} onChange={e => setNewCat(e.target.value as ChecklistItem['category'])}
              className="input-field w-36">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              value={newText} onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="שם הפריט..." className="input-field flex-1" autoFocus
            />
            <button onClick={handleAdd} className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
              <Check className="w-4 h-4" /> הוסף
            </button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-100">
              <X className="w-4 h-4" /> ביטול
            </button>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CATEGORIES.map(cat => {
          const items = checklist.filter(c => c.category === cat);
          if (items.length === 0) return null;
          const checked = items.filter(i => i.checked).length;

          return (
            <div key={cat} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                  <span>{CATEGORY_ICONS[cat]}</span> {cat}
                </h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  checked === items.length ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>{checked}/{items.length}</span>
              </div>
              <div className="p-3 space-y-1">
                {items.map(item => (
                  <div key={item.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg group transition-colors ${
                      item.checked ? 'bg-green-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        item.checked ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-green-400'
                      }`}
                    >
                      {item.checked && <Check className="w-3 h-3 text-white" />}
                    </button>

                    {/* Text — click pencil to edit */}
                    {editingId === item.id ? (
                      <input
                        ref={editRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(item.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={() => saveEdit(item.id)}
                        className="flex-1 text-sm border-b border-blue-400 outline-none bg-transparent py-0.5"
                      />
                    ) : (
                      <span
                        className={`flex-1 text-sm transition-colors cursor-default ${
                          item.checked ? 'line-through text-slate-400' : 'text-slate-700'
                        }`}
                      >
                        {item.text}
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {editingId !== item.id && (
                        <button
                          onClick={() => startEdit(item)}
                          className="text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteChecklistItem(item.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
