import { useState } from 'react';
import { useCurrentTripData } from '../store/tripStore';
import { BudgetItem } from '../types';
import { CURRENCY_SYMBOLS, EXCHANGE_RATES_TO_ILS } from '../types';
import { Wallet, Plus, Trash2, Pencil, X, Check, TrendingUp } from 'lucide-react';

const CURRENCIES = ['ILS', 'EUR', 'USD', 'GBP'];
const CATEGORIES: BudgetItem['category'][] = ['טיסות', 'מלונות', 'השכרת רכב', 'פעילויות', 'אוכל', 'קניות', 'תחבורה', 'אחר'];

const CATEGORY_COLORS: Record<string, string> = {
  טיסות: '#3b82f6',
  מלונות: '#8b5cf6',
  'השכרת רכב': '#f59e0b',
  פעילויות: '#10b981',
  אוכל: '#f97316',
  קניות: '#ec4899',
  תחבורה: '#6366f1',
  אחר: '#94a3b8',
};

function emptyItem(tripId: string): BudgetItem {
  return {
    id: `bud-${Date.now()}`, tripId, category: 'אחר',
    description: '', amount: 0, currency: 'ILS', date: '', paid: false,
  };
}

const ALL_CURRENCIES = ['ILS', 'EUR', 'USD', 'GBP', 'JPY', 'CHF'];

export default function Budget() {
  const { trip, budget, addBudgetItem, updateBudgetItem, deleteBudgetItem, convertToILS, getTotalBudgetILS, updateTrip } = useCurrentTripData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BudgetItem>(emptyItem(trip.id));
  const [filterCat, setFilterCat] = useState<string>('הכל');

  // overall budget editing
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState({ totalBudget: trip.totalBudget, currency: trip.currency });

  const openBudgetEdit = () => {
    setBudgetDraft({ totalBudget: trip.totalBudget, currency: trip.currency });
    setEditingBudget(true);
  };
  const saveBudgetEdit = () => {
    updateTrip({ totalBudget: budgetDraft.totalBudget, currency: budgetDraft.currency });
    setEditingBudget(false);
  };

  const f = (field: keyof BudgetItem, value: string | number | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const totalBudgetILS = getTotalBudgetILS();
  const totalSpentILS = budget.reduce((sum, b) => sum + convertToILS(b.amount, b.currency), 0);
  const remaining = totalBudgetILS - totalSpentILS;
  const percent = Math.min(100, Math.round((totalSpentILS / totalBudgetILS) * 100));

  // Category totals
  const categoryTotals = CATEGORIES.map(cat => ({
    cat,
    total: budget.filter(b => b.category === cat).reduce((sum, b) => sum + convertToILS(b.amount, b.currency), 0),
  })).filter(x => x.total > 0);

  const filtered = filterCat === 'הכל' ? budget : budget.filter(b => b.category === filterCat);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-blue-500" /> תקציב
        </h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyItem(trip.id)); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> הוסף הוצאה
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Total budget card — editable */}
        <div className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${editingBudget ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-100'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">תקציב כולל</span>
            {!editingBudget && (
              <button onClick={openBudgetEdit} className="text-slate-400 hover:text-blue-500 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {editingBudget ? (
            <>
              <div className="flex gap-2 mt-2 mb-3">
                <input
                  type="number"
                  value={budgetDraft.totalBudget}
                  onChange={e => setBudgetDraft(d => ({ ...d, totalBudget: +e.target.value }))}
                  className="input-field flex-1 text-lg font-bold"
                  min={0}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') saveBudgetEdit(); if (e.key === 'Escape') setEditingBudget(false); }}
                />
                <select
                  value={budgetDraft.currency}
                  onChange={e => setBudgetDraft(d => ({ ...d, currency: e.target.value }))}
                  className="input-field w-20"
                >
                  {ALL_CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                ≈ ₪{Math.round(convertToILS(budgetDraft.totalBudget, budgetDraft.currency)).toLocaleString()}
              </p>
              <div className="flex gap-2">
                <button onClick={saveBudgetEdit} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                  <Check className="w-3 h-3" /> שמור
                </button>
                <button onClick={() => setEditingBudget(false)} className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-50 transition-colors">
                  <X className="w-3 h-3" /> ביטול
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-slate-800">
                {CURRENCY_SYMBOLS[trip.currency]}{trip.totalBudget.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                ≈ ₪{Math.round(totalBudgetILS).toLocaleString()}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="text-xs text-slate-400 mb-1">הוצאות עד כה</div>
          <div className={`text-2xl font-bold ${percent > 90 ? 'text-red-600' : percent > 70 ? 'text-yellow-600' : 'text-green-600'}`}>
            ₪{Math.round(totalSpentILS).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="text-xs text-slate-400 mb-1">יתרה</div>
          <div className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-blue-600'}`}>
            ₪{Math.round(remaining).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Budget bar */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>{percent}% מהתקציב נוצל</span>
          <span>{100 - percent}% נותר</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all ${percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Category breakdown */}
        {categoryTotals.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> לפי קטגוריה</h3>
            <div className="space-y-2">
              {categoryTotals.sort((a, b) => b.total - a.total).map(({ cat, total }) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-24 text-right">{cat}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${Math.min(100, (total / totalSpentILS) * 100)}%`, backgroundColor: CATEGORY_COLORS[cat] }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 w-20">₪{Math.round(total).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['הכל', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterCat === cat ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <BudgetForm form={form} onChange={f}
          onSave={() => { addBudgetItem({ ...form, id: `bud-${Date.now()}` }); setShowForm(false); }}
          onCancel={() => setShowForm(false)} title="הוצאה חדשה" />
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">אין הוצאות.</div>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full text-sm min-w-max">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['קטגוריה', 'תיאור', 'סכום', 'תאריך', 'שולם', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(item => (
                  editingId === item.id ? (
                    <tr key={item.id}>
                      <td colSpan={6} className="p-4">
                        <BudgetForm form={form} onChange={f}
                          onSave={() => { updateBudgetItem(item.id, form); setEditingId(null); }}
                          onCancel={() => setEditingId(null)} title="עריכת הוצאה" />
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: CATEGORY_COLORS[item.category] }}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{item.description}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{CURRENCY_SYMBOLS[item.currency]}{item.amount.toLocaleString()}</div>
                        <div className="text-xs text-slate-400">≈ ₪{Math.round(convertToILS(item.amount, item.currency)).toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{item.date}</td>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={item.paid}
                          onChange={() => updateBudgetItem(item.id, { paid: !item.paid })}
                          className="w-4 h-4 accent-green-500" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => { setForm({ ...item }); setEditingId(item.id); setShowForm(false); }} className="text-slate-400 hover:text-blue-500"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteBudgetItem(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-semibold text-slate-700">סה"כ</td>
                  <td className="px-4 py-3 font-bold text-slate-800">₪{Math.round(totalSpentILS).toLocaleString()}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Exchange rates */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-3">שערי המרה (ל-₪)</h3>
        <div className="flex gap-4 flex-wrap text-sm">
          {Object.entries(EXCHANGE_RATES_TO_ILS).map(([cur, rate]) => (
            <div key={cur} className="bg-slate-50 rounded-lg px-3 py-2 text-center">
              <div className="font-bold text-slate-700">{cur}</div>
              <div className="text-slate-500">{CURRENCY_SYMBOLS[cur]}1 = ₪{rate}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BudgetForm({ form, onChange, onSave, onCancel, title }: {
  form: BudgetItem; onChange: (f: keyof BudgetItem, v: string | number | boolean) => void;
  onSave: () => void; onCancel: () => void; title: string;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      <h3 className="font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div><label className="text-xs text-slate-500 block mb-1">קטגוריה</label>
          <select value={form.category} onChange={e => onChange('category', e.target.value)} className="input-field">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-2"><label className="text-xs text-slate-500 block mb-1">תיאור</label>
          <input value={form.description} onChange={e => onChange('description', e.target.value)} className="input-field" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">סכום</label>
          <div className="flex gap-1">
            <input type="number" value={form.amount} onChange={e => onChange('amount', +e.target.value)} className="input-field flex-1" />
            <select value={form.currency} onChange={e => onChange('currency', e.target.value)} className="input-field w-20">
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div><label className="text-xs text-slate-500 block mb-1">תאריך</label>
          <input type="date" value={form.date} onChange={e => onChange('date', e.target.value)} className="input-field" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">שולם?</label>
          <div className="flex items-center gap-2 h-10">
            <input type="checkbox" checked={form.paid} onChange={e => onChange('paid', e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-slate-600">כן</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        <button onClick={onCancel} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-100"><X className="w-4 h-4" /> ביטול</button>
        <button onClick={onSave} className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"><Check className="w-4 h-4" /> שמור</button>
      </div>
    </div>
  );
}
