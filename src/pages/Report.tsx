import { useRef } from 'react';
import { useCurrentTripData } from '../store/tripStore';
import { CURRENCY_SYMBOLS, EXCHANGE_RATES_TO_ILS } from '../types';
import { differenceInDays, parseISO, format, eachDayOfInterval } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  FileText, Printer, Plane, Building2, Car, MapPin,
  Wallet, CheckSquare, Calendar, TrendingUp, Check, X
} from 'lucide-react';

const sym = CURRENCY_SYMBOLS;

function toILS(amount: number, currency: string) {
  return amount * (EXCHANGE_RATES_TO_ILS[currency] ?? 1);
}

export default function Report() {
  const { trip, flights, hotels, carRentals, activities, budget, checklist } = useCurrentTripData();
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  /* ── computed values ── */
  const startDate = parseISO(trip.startDate || new Date().toISOString().slice(0, 10));
  const endDate   = parseISO(trip.endDate   || new Date().toISOString().slice(0, 10));
  const tripDays  = differenceInDays(endDate, startDate) + 1;
  const today     = new Date();
  const daysUntil = differenceInDays(startDate, today);

  const totalFlightsCost   = flights.reduce((s, f) => s + toILS(f.price, f.currency), 0);
  const totalHotelsCost    = hotels.reduce((s, h) => s + toILS(h.pricePerNight * Math.max(1, differenceInDays(parseISO(h.checkOut || trip.endDate), parseISO(h.checkIn || trip.startDate))), h.currency), 0);
  const totalCarCost       = carRentals.reduce((s, c) => s + toILS(c.pricePerDay * Math.max(1, differenceInDays(parseISO(c.returnDate || trip.endDate), parseISO(c.pickupDate || trip.startDate))), c.currency), 0);
  const totalActivitiesCost = activities.reduce((s, a) => s + toILS(a.price, a.currency), 0);
  const totalBudgetItems   = budget.reduce((s, b) => s + toILS(b.amount, b.currency), 0);
  const totalBudgetILS     = toILS(trip.totalBudget, trip.currency);
  const remaining          = totalBudgetILS - totalBudgetItems;
  const budgetPercent      = totalBudgetILS > 0 ? Math.min(100, Math.round((totalBudgetItems / totalBudgetILS) * 100)) : 0;

  const checklistDone  = checklist.filter(c => c.checked).length;
  const bookedAct      = activities.filter(a => a.booked).length;
  const paidBudget     = budget.filter(b => b.paid).reduce((s, b) => s + toILS(b.amount, b.currency), 0);

  /* budget by category */
  const budgetByCategory = budget.reduce<Record<string, number>>((acc, b) => {
    acc[b.category] = (acc[b.category] ?? 0) + toILS(b.amount, b.currency);
    return acc;
  }, {});

  /* itinerary days */
  let days: Date[] = [];
  try { days = eachDayOfInterval({ start: startDate, end: endDate }); } catch { days = []; }

  const activitiesSorted = [...activities].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <>
      {/* ── Print button (hidden in print) ── */}
      <div className="no-print p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" /> דוח טיול מפורט
          </h1>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow transition-colors"
          >
            <Printer className="w-4 h-4" /> הדפס / שמור PDF
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════
          REPORT DOCUMENT
      ══════════════════════════════════ */}
      <div ref={reportRef} className="report-doc mx-6 mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:mx-0 print:rounded-none print:shadow-none print:border-0">

        {/* ── Cover ── */}
        <div className="report-cover bg-gradient-to-l from-blue-700 to-blue-500 text-white px-10 py-10">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <div className="text-blue-200 text-sm mb-1 flex items-center gap-1">
                <Plane className="w-4 h-4" /> תוכנית טיול מפורטת
              </div>
              <h1 className="text-3xl font-bold mb-1">{trip.name}</h1>
              <p className="text-blue-100 text-lg">{trip.destination}</p>
            </div>
            <div className="text-left space-y-1 text-sm text-blue-100">
              <div>{format(startDate, 'dd/MM/yyyy')} — {format(endDate, 'dd/MM/yyyy')}</div>
              <div>{tripDays} ימים</div>
              {daysUntil > 0 && <div className="text-blue-200">{daysUntil} ימים עד הטיול</div>}
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'טיסות',        value: flights.length,       unit: 'רשומות' },
              { label: 'מלונות',       value: hotels.length,        unit: 'רשומות' },
              { label: 'פעילויות',     value: activities.length,    unit: `(${bookedAct} הוזמנו)` },
              { label: 'רשימת תיוג',  value: `${checklistDone}/${checklist.length}`, unit: 'הושלמו' },
            ].map(k => (
              <div key={k.label} className="bg-white/15 rounded-xl px-4 py-3">
                <div className="text-blue-100 text-xs mb-0.5">{k.label}</div>
                <div className="text-white font-bold text-xl">{k.value}</div>
                <div className="text-blue-200 text-xs">{k.unit}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-8 sm:space-y-10">

          {/* ── 1. Budget Overview ── */}
          <Section icon={<Wallet className="w-5 h-5 text-green-600" />} title="סיכום תקציב" number="1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <KpiBox label="תקציב כולל" value={`${sym[trip.currency]}${trip.totalBudget.toLocaleString()}`} sub={`≈ ₪${Math.round(totalBudgetILS).toLocaleString()}`} color="blue" />
              <KpiBox label="סה״כ הוצאות" value={`₪${Math.round(totalBudgetItems).toLocaleString()}`} sub={`${budgetPercent}% מהתקציב`} color={budgetPercent > 90 ? 'red' : budgetPercent > 70 ? 'yellow' : 'green'} />
              <KpiBox label="שולם" value={`₪${Math.round(paidBudget).toLocaleString()}`} sub={`${budget.filter(b=>b.paid).length} פריטים`} color="green" />
              <KpiBox label="יתרה" value={`₪${Math.round(remaining).toLocaleString()}`} sub={remaining >= 0 ? 'בתקציב' : 'חריגה!'} color={remaining >= 0 ? 'slate' : 'red'} />
            </div>

            {/* Budget bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>ניצול תקציב</span><span>{budgetPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className={`h-3 rounded-full ${budgetPercent>90?'bg-red-500':budgetPercent>70?'bg-yellow-500':'bg-green-500'}`}
                  style={{ width: `${budgetPercent}%` }} />
              </div>
            </div>

            {/* by category */}
            {Object.keys(budgetByCategory).length > 0 && (
              <div className="overflow-x-auto -mx-1"><table className="report-table w-full text-sm min-w-max">
                <thead><tr>
                  <th>קטגוריה</th><th className="text-left">סה״כ (₪)</th><th className="text-left">אחוז מהוצאות</th>
                </tr></thead>
                <tbody>
                  {Object.entries(budgetByCategory)
                    .sort(([,a],[,b]) => b-a)
                    .map(([cat, total]) => (
                    <tr key={cat}>
                      <td className="font-medium">{cat}</td>
                      <td>₪{Math.round(total).toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${Math.round((total/totalBudgetItems)*100)}%` }} />
                          </div>
                          <span>{Math.round((total/totalBudgetItems)*100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-slate-50">
                    <td>סה״כ</td><td>₪{Math.round(totalBudgetItems).toLocaleString()}</td><td>100%</td>
                  </tr>
                </tbody>
              </table></div>
            )}
          </Section>

          {/* ── 2. Flights ── */}
          <Section icon={<Plane className="w-5 h-5 text-blue-600" />} title="טיסות" number="2" count={flights.length} totalILS={totalFlightsCost}>
            {flights.length === 0 ? <Empty /> : (
              <div className="overflow-x-auto -mx-1"><table className="report-table w-full text-sm min-w-max">
                <thead><tr>
                  <th>סוג</th><th>חברה</th><th>מס׳ טיסה</th><th>מוצא</th><th>יעד</th>
                  <th>יציאה</th><th>הגעה</th><th>מחיר</th><th>אישור</th>
                </tr></thead>
                <tbody>
                  {flights.map(f => (
                    <tr key={f.id}>
                      <td><span className={`badge ${f.type==='outbound'?'badge-green':f.type==='return'?'badge-purple':'badge-orange'}`}>
                        {f.type==='outbound'?'הלוך':f.type==='return'?'חזור':'מעבר'}
                      </span></td>
                      <td className="font-medium">{f.airline}</td>
                      <td>{f.flightNumber}</td>
                      <td>{f.from}</td>
                      <td>{f.to}</td>
                      <td className="text-slate-600 text-xs">{f.departure?.replace('T',' ')}</td>
                      <td className="text-slate-600 text-xs">{f.arrival?.replace('T',' ')}</td>
                      <td className="font-medium">{sym[f.currency]}{f.price.toLocaleString()}</td>
                      <td className="text-xs text-slate-500">{f.confirmation}</td>
                    </tr>
                  ))}
                  <tr className="totals-row">
                    <td colSpan={7} className="font-bold">סה״כ טיסות</td>
                    <td className="font-bold">₪{Math.round(totalFlightsCost).toLocaleString()}</td>
                    <td/>
                  </tr>
                </tbody>
              </table></div>
            )}
          </Section>

          {/* ── 3. Hotels ── */}
          <Section icon={<Building2 className="w-5 h-5 text-purple-600" />} title="מלונות" number="3" count={hotels.length} totalILS={totalHotelsCost}>
            {hotels.length === 0 ? <Empty /> : (
              <div className="overflow-x-auto -mx-1"><table className="report-table w-full text-sm min-w-max">
                <thead><tr>
                  <th>שם</th><th>עיר</th><th>צ׳ק-אין</th><th>צ׳ק-אאוט</th>
                  <th>לילות</th><th>מחיר/לילה</th><th>סה״כ</th><th>אישור</th>
                </tr></thead>
                <tbody>
                  {hotels.map(h => {
                    const nights = Math.max(1, differenceInDays(parseISO(h.checkOut || trip.endDate), parseISO(h.checkIn || trip.startDate)));
                    return (
                      <tr key={h.id}>
                        <td className="font-medium">{h.name}</td>
                        <td>{h.city}</td>
                        <td>{h.checkIn}</td>
                        <td>{h.checkOut}</td>
                        <td className="text-center">{nights}</td>
                        <td>{sym[h.currency]}{h.pricePerNight}</td>
                        <td className="font-medium">{sym[h.currency]}{(h.pricePerNight*nights).toLocaleString()}</td>
                        <td className="text-xs text-slate-500">{h.confirmation}</td>
                      </tr>
                    );
                  })}
                  <tr className="totals-row">
                    <td colSpan={6} className="font-bold">סה״כ מלונות</td>
                    <td className="font-bold">₪{Math.round(totalHotelsCost).toLocaleString()}</td>
                    <td/>
                  </tr>
                </tbody>
              </table></div>
            )}
          </Section>

          {/* ── 4. Car Rentals ── */}
          <Section icon={<Car className="w-5 h-5 text-amber-600" />} title="השכרת רכב" number="4" count={carRentals.length} totalILS={totalCarCost}>
            {carRentals.length === 0 ? <Empty /> : (
              <div className="overflow-x-auto -mx-1"><table className="report-table w-full text-sm min-w-max">
                <thead><tr>
                  <th>חברה</th><th>סוג רכב</th><th>איסוף</th><th>תאריך איסוף</th>
                  <th>החזרה</th><th>תאריך החזרה</th><th>ימים</th><th>מחיר/יום</th><th>סה״כ</th><th>אישור</th>
                </tr></thead>
                <tbody>
                  {carRentals.map(c => {
                    const days = Math.max(1, differenceInDays(parseISO(c.returnDate||trip.endDate), parseISO(c.pickupDate||trip.startDate)));
                    return (
                      <tr key={c.id}>
                        <td className="font-medium">{c.company}</td>
                        <td>{c.carType}</td>
                        <td className="text-xs">{c.pickupLocation}</td>
                        <td>{c.pickupDate}</td>
                        <td className="text-xs">{c.dropoffLocation}</td>
                        <td>{c.returnDate}</td>
                        <td className="text-center">{days}</td>
                        <td>{sym[c.currency]}{c.pricePerDay}</td>
                        <td className="font-medium">{sym[c.currency]}{(c.pricePerDay*days).toLocaleString()}</td>
                        <td className="text-xs text-slate-500">{c.confirmation}</td>
                      </tr>
                    );
                  })}
                  <tr className="totals-row">
                    <td colSpan={8} className="font-bold">סה״כ השכרת רכב</td>
                    <td className="font-bold">₪{Math.round(totalCarCost).toLocaleString()}</td>
                    <td/>
                  </tr>
                </tbody>
              </table></div>
            )}
          </Section>

          {/* ── 5. Activities ── */}
          <Section icon={<MapPin className="w-5 h-5 text-rose-600" />} title="פעילויות" number="5" count={activities.length} totalILS={totalActivitiesCost}>
            {activities.length === 0 ? <Empty /> : (
              <div className="overflow-x-auto -mx-1"><table className="report-table w-full text-sm min-w-max">
                <thead><tr>
                  <th>פעילות</th><th>קטגוריה</th><th>תאריך</th><th>שעה</th>
                  <th>מיקום</th><th>מחיר</th><th>הוזמן</th><th>הערות</th>
                </tr></thead>
                <tbody>
                  {activitiesSorted.map(a => (
                    <tr key={a.id}>
                      <td className="font-medium">{a.name}</td>
                      <td><span className="badge badge-blue">{a.category}</span></td>
                      <td>{a.date}</td>
                      <td>{a.time}</td>
                      <td className="text-xs text-slate-600">{a.location}</td>
                      <td>{a.price > 0 ? `${sym[a.currency]}${a.price}` : 'חינם'}</td>
                      <td className="text-center">
                        {a.booked
                          ? <Check className="w-4 h-4 text-green-500 mx-auto" />
                          : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                      <td className="text-xs text-slate-500">{a.notes}</td>
                    </tr>
                  ))}
                  <tr className="totals-row">
                    <td colSpan={5} className="font-bold">סה״כ פעילויות</td>
                    <td className="font-bold">₪{Math.round(totalActivitiesCost).toLocaleString()}</td>
                    <td colSpan={2}/>
                  </tr>
                </tbody>
              </table></div>
            )}
          </Section>

          {/* ── 6. Daily Itinerary ── */}
          <Section icon={<Calendar className="w-5 h-5 text-indigo-600" />} title="מסלול יומי" number="6">
            {days.length === 0 ? <Empty /> : (
              <div className="space-y-4">
                {days.map((day, idx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayActs = activitiesSorted.filter(a => a.date === dateStr);
                  return (
                    <div key={dateStr} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">יום {idx+1}</span>
                          <span className="font-semibold text-slate-700 text-sm">
                            {format(day, 'EEEE, d MMMM yyyy', { locale: he })}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{dayActs.length} פעילויות</span>
                      </div>
                      {dayActs.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {dayActs.map(a => (
                            <div key={a.id} className="px-4 py-2.5 flex items-center gap-4 text-sm">
                              <span className="text-slate-400 w-12 shrink-0 text-xs font-mono">{a.time || '--:--'}</span>
                              <span className="font-medium text-slate-800 flex-1">{a.name}</span>
                              <span className="text-xs text-slate-500">{a.location}</span>
                              {a.price > 0 && <span className="text-xs font-medium text-green-600">{sym[a.currency]}{a.price}</span>}
                              {a.booked && <span className="badge badge-green text-xs">הוזמן</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-400 italic">אין פעילויות מתוכננות</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* ── 7. Full Budget Ledger ── */}
          <Section icon={<TrendingUp className="w-5 h-5 text-green-600" />} title="ספר הוצאות מפורט" number="7" count={budget.length} totalILS={totalBudgetItems}>
            {budget.length === 0 ? <Empty /> : (
              <div className="overflow-x-auto -mx-1"><table className="report-table w-full text-sm min-w-max">
                <thead><tr>
                  <th>קטגוריה</th><th>תיאור</th><th>סכום מקורי</th><th>₪ שקלים</th><th>תאריך</th><th>שולם</th>
                </tr></thead>
                <tbody>
                  {[...budget].sort((a,b)=>a.category.localeCompare(b.category)).map(b => (
                    <tr key={b.id}>
                      <td><span className="badge badge-slate">{b.category}</span></td>
                      <td className="font-medium">{b.description}</td>
                      <td>{sym[b.currency]}{b.amount.toLocaleString()}</td>
                      <td>₪{Math.round(toILS(b.amount,b.currency)).toLocaleString()}</td>
                      <td>{b.date}</td>
                      <td className="text-center">
                        {b.paid
                          ? <Check className="w-4 h-4 text-green-500 mx-auto" />
                          : <X className="w-4 h-4 text-red-400 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                  <tr className="totals-row">
                    <td colSpan={3} className="font-bold">סה״כ הוצאות</td>
                    <td className="font-bold">₪{Math.round(totalBudgetItems).toLocaleString()}</td>
                    <td/>
                    <td className="font-bold text-center text-green-600">₪{Math.round(paidBudget).toLocaleString()} שולם</td>
                  </tr>
                </tbody>
              </table></div>
            )}
          </Section>

          {/* ── 8. Checklist ── */}
          <Section icon={<CheckSquare className="w-5 h-5 text-orange-500" />} title="רשימות תיוג" number="8">
            {checklist.length === 0 ? <Empty /> : (
              <>
                {/* progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>התקדמות כוללת</span>
                    <span>{checklistDone}/{checklist.length} פריטים ({Math.round((checklistDone/checklist.length)*100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-2.5 bg-green-500 rounded-full"
                      style={{ width: `${Math.round((checklistDone/checklist.length)*100)}%` }} />
                  </div>
                </div>

                {/* by category */}
                {(['מסמכים','בגדים','ציוד','תרופות','אלקטרוניקה','אחר'] as const).map(cat => {
                  const items = checklist.filter(c => c.category === cat);
                  if (!items.length) return null;
                  const done = items.filter(i=>i.checked).length;
                  return (
                    <div key={cat} className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-700 text-sm">{cat}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${done===items.length?'bg-green-100 text-green-700':'bg-slate-100 text-slate-500'}`}>
                          {done}/{items.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {items.map(item => (
                          <div key={item.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${item.checked?'bg-green-50':'bg-slate-50'}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${item.checked?'bg-green-500 border-green-500':'border-slate-300'}`}>
                              {item.checked && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className={item.checked?'line-through text-slate-400':'text-slate-700'}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </Section>

          {/* ── 9. Final Summary ── */}
          <div className="bg-gradient-to-l from-slate-800 to-slate-700 text-white rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> סיכום כספי סופי
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {[
                { label: 'טיסות',        val: Math.round(totalFlightsCost) },
                { label: 'מלונות',       val: Math.round(totalHotelsCost) },
                { label: 'השכרת רכב',   val: Math.round(totalCarCost) },
                { label: 'פעילויות',    val: Math.round(totalActivitiesCost) },
                { label: 'הוצאות אחרות', val: Math.round(totalBudgetItems - totalFlightsCost - totalHotelsCost - totalCarCost - totalActivitiesCost) },
              ].map(row => (
                <div key={row.label} className="bg-white/10 rounded-lg px-3 py-2 flex justify-between">
                  <span className="text-slate-300">{row.label}</span>
                  <span className="font-semibold">₪{row.val.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-slate-300 text-xs">תקציב</div>
                <div className="text-xl font-bold">₪{Math.round(totalBudgetILS).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-300 text-xs">הוצאות</div>
                <div className={`text-xl font-bold ${budgetPercent>90?'text-red-400':'text-yellow-300'}`}>₪{Math.round(totalBudgetItems).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-300 text-xs">יתרה</div>
                <div className={`text-xl font-bold ${remaining>=0?'text-green-400':'text-red-400'}`}>₪{Math.round(remaining).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-100">
            דוח הופק ב-{format(today, 'dd/MM/yyyy HH:mm')} | מערכת ניהול טיול
          </div>

        </div>
      </div>
    </>
  );
}

/* ── Sub-components ── */
function Section({ icon, title, number, count, totalILS, children }: {
  icon: React.ReactNode; title: string; number: string;
  count?: number; totalILS?: number; children: React.ReactNode;
}) {
  return (
    <section className="report-section">
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="text-sm font-bold text-slate-400 w-6">{number}.</span>
          {icon} {title}
          {count !== undefined && (
            <span className="text-xs font-normal bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{count} רשומות</span>
          )}
        </h2>
        {totalILS !== undefined && totalILS > 0 && (
          <div className="text-right">
            <div className="text-xs text-slate-400">עלות כוללת</div>
            <div className="font-bold text-slate-700">₪{Math.round(totalILS).toLocaleString()}</div>
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

function KpiBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100', green: 'bg-green-50 border-green-100',
    red: 'bg-red-50 border-red-100', yellow: 'bg-yellow-50 border-yellow-100',
    slate: 'bg-slate-50 border-slate-200',
  };
  return (
    <div className={`${colors[color] ?? colors.slate} border rounded-xl p-4`}>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-slate-400 italic py-3">אין נתונים לסעיף זה.</p>;
}
