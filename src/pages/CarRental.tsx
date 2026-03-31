import { useState } from 'react';
import { useCurrentTripData } from '../store/tripStore';
import { CarRental } from '../types';
import { CURRENCY_SYMBOLS } from '../types';
import { Car, Plus, Trash2, Pencil, X, Check, MapPin } from 'lucide-react';
import CalendarSync from '../components/CalendarSync';
import { carRentalToCalendarEvent } from '../utils/calendarExport';
import { differenceInDays, parseISO } from 'date-fns';

const CURRENCIES = ['ILS', 'EUR', 'USD', 'GBP'];

function emptyCar(tripId: string): CarRental {
  return {
    id: `cr-${Date.now()}`, tripId, company: '', carType: '',
    pickupLocation: '', dropoffLocation: '', pickupDate: '', returnDate: '',
    pricePerDay: 0, currency: 'EUR', confirmation: '', notes: '',
  };
}

export default function CarRentalPage() {
  const { trip, carRentals, addCarRental, updateCarRental, deleteCarRental } = useCurrentTripData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CarRental>(emptyCar(trip.id));

  const f = (field: keyof CarRental, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  const days = (c: CarRental) => {
    try { return Math.max(1, differenceInDays(parseISO(c.returnDate), parseISO(c.pickupDate))); }
    catch { return 1; }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Car className="w-6 h-6 text-blue-500" /> השכרת רכב
        </h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyCar(trip.id)); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> הוסף השכרה
        </button>
      </div>

      {showForm && (
        <CarForm form={form} onChange={f}
          onSave={() => { addCarRental({ ...form, id: `cr-${Date.now()}` }); setShowForm(false); }}
          onCancel={() => setShowForm(false)} title="השכרה חדשה" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {carRentals.length === 0 && <div className="col-span-2 p-8 text-center text-slate-400 bg-white rounded-xl">אין השכרות רכב. הוסף השכרה חדשה.</div>}
        {carRentals.map(car => (
          editingId === car.id ? (
            <div key={car.id} className="col-span-2">
              <CarForm form={form} onChange={f}
                onSave={() => { updateCarRental(car.id, form); setEditingId(null); }}
                onCancel={() => setEditingId(null)} title="עריכת השכרה" />
            </div>
          ) : (
            <div key={car.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-slate-800 text-lg">{car.company}</h3>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">{car.carType}</p>
                </div>
                <div className="flex gap-1 items-center">
                  <CalendarSync event={carRentalToCalendarEvent(car)} />
                  <button onClick={() => { setForm({ ...car }); setEditingId(car.id); setShowForm(false); }} className="p-2 text-slate-400 hover:text-blue-500"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteCarRental(car.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span><strong>איסוף:</strong> {car.pickupLocation} — {car.pickupDate}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span><strong>החזרה:</strong> {car.dropoffLocation} — {car.returnDate}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-2xl font-bold text-green-600">
                    {CURRENCY_SYMBOLS[car.currency]}{(car.pricePerDay * days(car)).toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-sm mr-2">{days(car)} ימים × {CURRENCY_SYMBOLS[car.currency]}{car.pricePerDay}</span>
                </div>
                {car.confirmation && <span className="text-xs text-slate-400">#{car.confirmation}</span>}
              </div>
              {car.notes && <div className="mt-2 text-sm text-slate-600 bg-yellow-50 rounded p-2">{car.notes}</div>}
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function CarForm({ form, onChange, onSave, onCancel, title }: {
  form: CarRental; onChange: (f: keyof CarRental, v: string | number) => void;
  onSave: () => void; onCancel: () => void; title: string;
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      <h3 className="font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div><label className="text-xs text-slate-500 block mb-1">חברת השכרה</label>
          <input value={form.company} onChange={e => onChange('company', e.target.value)} className="input-field" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">סוג רכב</label>
          <input value={form.carType} onChange={e => onChange('carType', e.target.value)} className="input-field" placeholder="VW Golf" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">מחיר ליום</label>
          <div className="flex gap-1">
            <input type="number" value={form.pricePerDay} onChange={e => onChange('pricePerDay', +e.target.value)} className="input-field flex-1" />
            <select value={form.currency} onChange={e => onChange('currency', e.target.value)} className="input-field w-20">
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div><label className="text-xs text-slate-500 block mb-1">מספר אישור</label>
          <input value={form.confirmation} onChange={e => onChange('confirmation', e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="text-xs text-slate-500 block mb-1">מקום איסוף</label>
          <input value={form.pickupLocation} onChange={e => onChange('pickupLocation', e.target.value)} className="input-field" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">תאריך איסוף</label>
          <input type="date" value={form.pickupDate} onChange={e => onChange('pickupDate', e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="text-xs text-slate-500 block mb-1">מקום החזרה</label>
          <input value={form.dropoffLocation} onChange={e => onChange('dropoffLocation', e.target.value)} className="input-field" /></div>
        <div><label className="text-xs text-slate-500 block mb-1">תאריך החזרה</label>
          <input type="date" value={form.returnDate} onChange={e => onChange('returnDate', e.target.value)} className="input-field" /></div>
        <div className="col-span-2 md:col-span-4"><label className="text-xs text-slate-500 block mb-1">הערות</label>
          <input value={form.notes} onChange={e => onChange('notes', e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        <button onClick={onCancel} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-100"><X className="w-4 h-4" /> ביטול</button>
        <button onClick={onSave} className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"><Check className="w-4 h-4" /> שמור</button>
      </div>
    </div>
  );
}
