import { useState } from 'react';
import { useTripStore } from '../store/tripStore';
import { Trip } from '../types';
import { X, Check, Plane } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function NewTripModal({ onClose }: Props) {
  const { createTrip } = useTripStore();
  const [form, setForm] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    currency: 'ILS',
    totalBudget: 0,
    notes: '',
  });

  const f = (field: string, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleCreate = () => {
    if (!form.name.trim() || !form.destination.trim()) return;
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      ...form,
    };
    createTrip(newTrip);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-500" />
            טיול חדש
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-500 block mb-1">שם הטיול *</label>
              <input
                value={form.name}
                onChange={e => f('name', e.target.value)}
                className="input-field"
                placeholder="טיול לאיטליה, חופשה באי..."
                autoFocus
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-slate-500 block mb-1">יעד *</label>
              <input
                value={form.destination}
                onChange={e => f('destination', e.target.value)}
                className="input-field"
                placeholder="רומא, איטליה"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1">תאריך התחלה</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => f('startDate', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1">תאריך סיום</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => f('endDate', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1">תקציב כולל</label>
              <input
                type="number"
                value={form.totalBudget || ''}
                onChange={e => f('totalBudget', +e.target.value)}
                className="input-field"
                placeholder="10000"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1">מטבע עיקרי</label>
              <select
                value={form.currency}
                onChange={e => f('currency', e.target.value)}
                className="input-field"
              >
                {['ILS', 'EUR', 'USD', 'GBP', 'JPY', 'CHF'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs text-slate-500 block mb-1">הערות</label>
              <input
                value={form.notes}
                onChange={e => f('notes', e.target.value)}
                className="input-field"
                placeholder="פרטים נוספים על הטיול..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleCreate}
            disabled={!form.name.trim() || !form.destination.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Check className="w-4 h-4" /> צור טיול
          </button>
        </div>
      </div>
    </div>
  );
}
