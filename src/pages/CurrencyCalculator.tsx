import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowUpDown, RefreshCw, Clock, TrendingUp, AlertCircle, RotateCcw } from 'lucide-react';

const CURRENCIES: Record<string, string> = {
  USD: 'דולר אמריקאי',
  EUR: 'אירו',
  ILS: 'שקל ישראלי',
  GBP: 'פאונד בריטי',
  JPY: 'ין יפני',
  CHF: 'פרנק שוויצרי',
  AUD: 'דולר אוסטרלי',
  CAD: 'דולר קנדי',
  CNY: 'יואן סיני',
  HKD: 'דולר הונג קונג',
  SGD: 'דולר סינגפורי',
  NZD: 'דולר ניו זילנד',
  SEK: 'קרונה שוודית',
  NOK: 'קרונה נורווגית',
  DKK: 'קרונה דנית',
  INR: 'רופי הודי',
  MXN: 'פסו מקסיקני',
  BRL: 'ריאל ברזילאי',
  KRW: 'וון דרום קוריאני',
  THB: 'באט תאילנדי',
  TRY: 'לירה טורקית',
  ZAR: 'ראנד דרום אפריקאי',
  PLN: 'זלוטי פולני',
  HUF: 'פורינט הונגרי',
  CZK: 'קרונה צ׳כית',
};

const SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', ILS: '₪', GBP: '£', JPY: '¥',
  CHF: 'Fr', AUD: 'A$', CAD: 'C$', CNY: '¥', HKD: 'HK$',
  SGD: 'S$', NZD: 'NZ$', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  INR: '₹', MXN: '$', BRL: 'R$', KRW: '₩', THB: '฿',
  TRY: '₺', ZAR: 'R', PLN: 'zł', HUF: 'Ft', CZK: 'Kč',
};

interface RatesResult {
  base: string;
  date: string;
  rates: Record<string, number>;
  fetchedAt: Date;
}

const DEFAULT_FROM = 'USD';
const DEFAULT_TO = 'ILS';
const DEFAULT_AMOUNT = '1';
const QUICK_CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS', 'JPY', 'CHF', 'AUD', 'CAD', 'THB'];

export default function CurrencyCalculator() {
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [result, setResult] = useState<RatesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRates = useCallback(async (base: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=${base}`,
        { signal: abortRef.current.signal }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult({
        base: data.base,
        date: data.date,
        rates: { ...data.rates, [data.base]: 1 },
        fetchedAt: new Date(),
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError('לא ניתן לטעון שערי מטבע. בדוק חיבור לאינטרנט ונסה שוב.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(from); }, [from, fetchRates]);

  const rate = result?.rates[to] ?? null;
  const converted = rate !== null && amount !== '' && !isNaN(parseFloat(amount))
    ? parseFloat(amount) * rate
    : null;

  const swap = () => { setFrom(to); setTo(from); };

  const reset = () => {
    setFrom(DEFAULT_FROM);
    setTo(DEFAULT_TO);
    setAmount(DEFAULT_AMOUNT);
  };

  const fmt = (n: number, currency: string) => {
    if (!isFinite(n)) return '—';
    const decimals = ['JPY', 'KRW', 'HUF'].includes(currency) ? 0 : 2;
    return n.toLocaleString('he-IL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-3 sm:p-6 space-y-4 max-w-2xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 shrink-0" />
            מחשבון המרת מטבע
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">שערים בזמן אמת · frankfurter.app</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>אפס מחשבון</span>
          </button>
          <button
            onClick={() => fetchRates(from)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">רענן שערים</span>
          </button>
        </div>
      </div>

      {/* Last updated */}
      {result && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>עודכן {fmtTime(result.fetchedAt)} · שער מתאריך {result.date}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main calculator card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-4">

        {/* FROM row */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 block">סכום להמרה</label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-3 text-xl sm:text-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
              placeholder="0"
            />
            <CurrencySelect value={from} onChange={setFrom} />
          </div>
        </div>

        {/* Swap */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-100" />
          <button
            onClick={swap}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 text-sm font-medium transition-colors"
          >
            <ArrowUpDown className="w-4 h-4 shrink-0" />
            <span>החלף</span>
          </button>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* TO row */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 block">מטבע יעד</label>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0 border-2 border-blue-200 bg-blue-50 rounded-xl px-3 py-3 flex items-center overflow-hidden">
              {loading
                ? <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                : <span className="text-xl sm:text-2xl font-bold text-blue-700 truncate">
                    {converted !== null ? fmt(converted, to) : '—'}
                  </span>
              }
            </div>
            <CurrencySelect value={to} onChange={setTo} />
          </div>
        </div>

        {/* Rate summary */}
        {rate !== null && !loading && (
          <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1">
            <div className="text-sm text-slate-600">
              שער: <strong className="text-slate-800">1 {from}</strong>
              {' = '}
              <strong className="text-blue-700">{fmt(rate, to)} {to}</strong>
            </div>
            <div className="text-sm text-slate-500">
              הפוך: <strong className="text-slate-700">1 {to}</strong>
              {' = '}
              <strong className="text-slate-600">{fmt(1 / rate, from)} {from}</strong>
            </div>
          </div>
        )}

        {/* Reset button — also inside card for easy reach on mobile */}
        <button
          onClick={reset}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-xl text-sm font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          אפס מחשבון
        </button>
      </div>

      {/* Quick rates */}
      {result && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-700 text-sm truncate">
              שערים מהירים — 1 {from} ({CURRENCIES[from]})
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {QUICK_CURRENCIES.filter(c => c !== from).map(currency => {
              const r = result.rates[currency];
              if (r == null) return null;
              const amtNum = parseFloat(amount) || 1;
              return (
                <button
                  key={currency}
                  onClick={() => setTo(currency)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors ${to === currency ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-9 shrink-0 text-center font-bold text-slate-700 text-sm bg-slate-100 rounded-lg py-1">
                      {SYMBOLS[currency] || currency}
                    </span>
                    <div className="text-right min-w-0">
                      <div className="font-medium text-slate-800 text-sm">{currency}</div>
                      <div className="text-xs text-slate-400 truncate">{CURRENCIES[currency]}</div>
                    </div>
                  </div>
                  <div className="text-left shrink-0 mr-2">
                    <div className="font-semibold text-slate-800 text-sm">
                      {fmt(amtNum * r, currency)}
                    </div>
                    <div className="text-xs text-slate-400">שער: {fmt(r, currency)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none h-full border border-slate-200 rounded-xl px-3 py-3 pr-3 pl-7 font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer text-sm"
        style={{ minWidth: '80px', maxWidth: '110px' }}
      >
        {Object.entries(CURRENCIES).map(([code, name]) => (
          <option key={code} value={code}>{code} — {name}</option>
        ))}
      </select>
      {/* Selected currency code shown as overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl">
        <span className="text-base font-bold text-slate-700 bg-white px-1">
          {value}
        </span>
      </div>
    </div>
  );
}
