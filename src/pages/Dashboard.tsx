import { useState } from 'react';
import { useCurrentTripData } from '../store/tripStore';
import { CURRENCY_SYMBOLS } from '../types';
import { differenceInDays, parseISO, format } from 'date-fns';
import { Plane, Building2, Car, MapPin, Wallet, CheckSquare, Calendar, TrendingUp, Pencil, X, Check, Settings, Share2, Eye, Edit3, Copy, CheckCircle } from 'lucide-react';
import { buildSharedTripData, generateShareLink } from '../utils/shareTrip';
import { exportToPdf } from '../utils/exportPdf';
import { exportToExcel } from '../utils/exportExcel';
import { exportToWord } from '../utils/exportWord';

const CURRENCIES = ['ILS', 'EUR', 'USD', 'GBP', 'JPY', 'CHF'];

export default function Dashboard() {
  const { trip, flights, hotels, carRentals, activities, budget, checklist, convertToILS, updateTrip } = useCurrentTripData();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ ...trip });

  // sync form when trip changes (e.g. switching trips)
  const openEdit = () => { setForm({ ...trip }); setEditMode(true); };
  const cancelEdit = () => setEditMode(false);
  const saveEdit = () => { updateTrip(form); setEditMode(false); };
  const f = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  const [shareOpen, setShareOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<'view' | 'edit' | null>(null);

  const copyLink = (canEdit: boolean) => {
    const shareData = buildSharedTripData(trip, flights, hotels, carRentals, activities);
    const link = generateShareLink(shareData, canEdit);
    const type = canEdit ? 'edit' : 'view';
    navigator.clipboard.writeText(link).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }).catch(() => { prompt(canEdit ? 'קישור עריכה:' : 'קישור צפייה:', link); });
  };

  const today = new Date();
  const startDate = parseISO(trip.startDate || new Date().toISOString().slice(0, 10));
  const endDate   = parseISO(trip.endDate   || new Date().toISOString().slice(0, 10));
  const daysUntil = differenceInDays(startDate, today);
  const tripDays  = differenceInDays(endDate, startDate) + 1;

  const totalSpentILS  = budget.reduce((sum, b) => sum + convertToILS(b.amount, b.currency), 0);
  const totalBudgetILS = convertToILS(trip.totalBudget, trip.currency);
  const budgetPercent  = totalBudgetILS > 0 ? Math.min(100, Math.round((totalSpentILS / totalBudgetILS) * 100)) : 0;

  const checkedCount      = checklist.filter(c => c.checked).length;
  const bookedActivities  = activities.filter(a => a.booked).length;
  const sym = CURRENCY_SYMBOLS;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6" id="export-container">

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{trip.name}</h1>
            <p className="text-slate-500">{trip.destination}</p>
          </div>
          <button
            onClick={openEdit}
            className="mt-1 text-slate-400 hover:text-blue-500 transition-colors"
            title="עריכת פרטי הטיול"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-indigo-600 hover:bg-indigo-700 text-white">
            <Share2 className="w-4 h-4" />
            שתף טיול
          </button>
          <button onClick={exportToPdf}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
            ייצוא PDF
          </button>
          <button onClick={() => exportToWord({ trip, flights, hotels, carRentals, activities, budget, checklist })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            ייצוא Word
          </button>
          <button onClick={() => exportToExcel({ trip, flights, hotels, carRentals, activities, budget, checklist })}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
            ייצוא Excel
          </button>
        </div>
      </div>

      {/* ─── Edit Trip Panel ─── */}
      {editMode && (
        <div className="bg-white border-2 border-blue-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-5 py-3 flex items-center justify-between border-b border-blue-100">
            <h2 className="font-semibold text-blue-800 flex items-center gap-2">
              <Settings className="w-4 h-4" /> עריכת פרטי הטיול
            </h2>
            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500 block mb-1 font-medium">שם הטיול</label>
              <input
                value={form.name}
                onChange={e => f('name', e.target.value)}
                className="input-field text-base font-medium"
              />
            </div>

            {/* Destination */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500 block mb-1 font-medium">יעד</label>
              <input
                value={form.destination}
                onChange={e => f('destination', e.target.value)}
                className="input-field"
                placeholder="עיר, מדינה"
              />
            </div>

            {/* Dates */}
            <div>
              <label className="text-xs text-slate-500 block mb-1 font-medium">תאריך התחלה</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => f('startDate', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1 font-medium">תאריך סיום</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => f('endDate', e.target.value)}
                className="input-field"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="text-xs text-slate-500 block mb-1 font-medium">תקציב כולל</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.totalBudget}
                  onChange={e => f('totalBudget', +e.target.value)}
                  className="input-field flex-1 text-lg font-bold"
                  min={0}
                />
                <select
                  value={form.currency}
                  onChange={e => f('currency', e.target.value)}
                  className="input-field w-24"
                >
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ≈ ₪{Math.round(convertToILS(form.totalBudget, form.currency)).toLocaleString()}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-slate-500 block mb-1 font-medium">הערות</label>
              <input
                value={form.notes}
                onChange={e => f('notes', e.target.value)}
                className="input-field"
                placeholder="פרטים נוספים..."
              />
            </div>
          </div>

          <div className="flex gap-3 px-5 py-4 border-t border-slate-100 justify-end bg-slate-50">
            <button
              onClick={cancelEdit}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-100 transition-colors flex items-center gap-1"
            >
              <X className="w-4 h-4" /> ביטול
            </button>
            <button
              onClick={saveEdit}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Check className="w-4 h-4" /> שמור שינויים
            </button>
          </div>
        </div>
      )}

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar className="w-5 h-5 text-blue-500" />}
          label="ימים לטיול"
          value={daysUntil > 0 ? `${daysUntil} ימים` : daysUntil === 0 ? 'היום!' : 'בעיצומו'}
          sub={`${format(startDate, 'dd/MM/yyyy')} – ${format(endDate, 'dd/MM/yyyy')}`}
          color="blue"
          onEdit={openEdit}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
          label="משך הטיול"
          value={`${tripDays} ימים`}
          sub={`${flights.length} טיסות`}
          color="purple"
        />
        <StatCard
          icon={<Wallet className="w-5 h-5 text-green-500" />}
          label="תקציב"
          value={`${sym['ILS']}${Math.round(totalSpentILS).toLocaleString()}`}
          sub={`מתוך ${sym[trip.currency]}${trip.totalBudget.toLocaleString()} (${budgetPercent}%)`}
          color="green"
          onEdit={openEdit}
        />
        <StatCard
          icon={<CheckSquare className="w-5 h-5 text-orange-500" />}
          label="רשימת תיוג"
          value={`${checkedCount}/${checklist.length}`}
          sub="פריטים הושלמו"
          color="orange"
        />
      </div>

      {/* ─── Budget Bar ─── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <Wallet className="w-4 h-4" /> מעקב תקציב
          </h2>
          <button
            onClick={openEdit}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
          >
            <Pencil className="w-3 h-3" /> ערוך תקציב
          </button>
        </div>

        {/* Budget numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="text-center bg-slate-50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-0.5">תקציב כולל</div>
            <div className="font-bold text-slate-700">
              {sym[trip.currency]}{trip.totalBudget.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">₪{Math.round(totalBudgetILS).toLocaleString()}</div>
          </div>
          <div className="text-center bg-red-50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-0.5">הוצאות</div>
            <div className={`font-bold ${budgetPercent > 90 ? 'text-red-600' : 'text-slate-700'}`}>
              ₪{Math.round(totalSpentILS).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">{budgetPercent}% מהתקציב</div>
          </div>
          <div className="text-center bg-green-50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-0.5">יתרה</div>
            <div className={`font-bold ${totalBudgetILS - totalSpentILS < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₪{Math.round(totalBudgetILS - totalSpentILS).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">{100 - budgetPercent}% נותר</div>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all ${budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
      </div>

      {/* ─── Overview Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OverviewCard title="טיסות" icon={<Plane className="w-4 h-4" />} count={flights.length}>
          {flights.map(f => (
            <div key={f.id} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
              <span className="font-medium">{f.from} → {f.to}</span>
              <span className="text-slate-500">{f.flightNumber}</span>
            </div>
          ))}
        </OverviewCard>

        <OverviewCard title="מלונות" icon={<Building2 className="w-4 h-4" />} count={hotels.length}>
          {hotels.map(h => (
            <div key={h.id} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
              <span className="font-medium">{h.name}</span>
              <span className="text-slate-500">{h.checkIn} – {h.checkOut}</span>
            </div>
          ))}
        </OverviewCard>

        <OverviewCard title="השכרת רכב" icon={<Car className="w-4 h-4" />} count={carRentals.length}>
          {carRentals.map(c => (
            <div key={c.id} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
              <span className="font-medium">{c.company} — {c.carType}</span>
              <span className="text-slate-500">{c.pickupDate}</span>
            </div>
          ))}
        </OverviewCard>

        <OverviewCard title="פעילויות" icon={<MapPin className="w-4 h-4" />} count={activities.length}>
          <div className="text-sm text-slate-500 mb-2">{bookedActivities} הוזמנו מראש</div>
          {activities.slice(0, 4).map(a => (
            <div key={a.id} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
              <span className="font-medium">{a.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${a.booked ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {a.booked ? 'הוזמן' : 'לא הוזמן'}
              </span>
            </div>
          ))}
        </OverviewCard>
      </div>

      {/* ─── Notes ─── */}
      {trip.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800 mb-1">הערות</h3>
            <p className="text-yellow-700 text-sm">{trip.notes}</p>
          </div>
          <button onClick={openEdit} className="text-yellow-500 hover:text-yellow-700 transition-colors shrink-0">
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Share Modal ─── */}
      {shareOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl" onClick={() => setShareOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-500" /> שיתוף הטיול
              </h2>
              <button onClick={() => setShareOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500">
              בחר את רמת הגישה שתרצה להעניק לאנשים שמקבלים את הקישור.
              <span className="font-medium text-slate-600"> מחירים ותקציב לא יוצגו </span>
              בשום קישור.
            </p>

            {/* View-only link */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-semibold text-slate-700">צפייה בלבד</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">מומלץ</span>
              </div>
              <p className="text-xs text-slate-400">המוזמן יוכל לצפות במסלול, טיסות, מלונות ופעילויות — ללא יכולת עריכה.</p>
              <button
                onClick={() => copyLink(false)}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copiedType === 'view' ? 'bg-green-500 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                }`}
              >
                {copiedType === 'view' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedType === 'view' ? 'קישור הועתק!' : 'העתק קישור צפייה'}
              </button>
            </div>

            {/* Edit link */}
            <div className="border border-orange-200 rounded-xl p-4 space-y-2 bg-orange-50/30">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="font-semibold text-slate-700">עריכה משותפת</span>
              </div>
              <p className="text-xs text-slate-400">המוזמן יוכל לסמן פעילויות כ"הוזמן" ולהוסיף הערות. השינויים נשמרים בדפדפן שלו בלבד.</p>
              <button
                onClick={() => copyLink(true)}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copiedType === 'edit' ? 'bg-green-500 text-white' : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                }`}
              >
                {copiedType === 'edit' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedType === 'edit' ? 'קישור הועתק!' : 'העתק קישור עריכה'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, onEdit }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; onEdit?: () => void;
}) {
  const bg: Record<string, string> = {
    blue: 'bg-blue-50', purple: 'bg-purple-50', green: 'bg-green-50', orange: 'bg-orange-50',
  };
  return (
    <div className={`${bg[color]} rounded-xl p-4 border border-white shadow-sm group relative`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function OverviewCard({ title, icon, count, children }: {
  title: string; icon: React.ReactNode; count: number; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">{icon}{title}</h2>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      {children}
    </div>
  );
}
