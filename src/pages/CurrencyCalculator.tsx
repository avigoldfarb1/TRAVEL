import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeftRight, RefreshCw, Clock, TrendingUp, AlertCircle } from 'lucide-react';

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
  TRY: 'לירה טורקית',
  ZAR: 'ראנד דרום אפריקאי',
  THB: 'באט תאילנדי',
  PLN: 'זלוטי פולני',
  HUF: 'פורינט הונגרי',
  CZK: 'קרונה צ׳כית',
};

const SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', ILS: '₪', GBP: '£', JPY: '¥',
  CHF: 'Fr', AUD: 'A$', CAD: 'C$', CNY: '¥', HKD: 'HK$',
  SGD: 'S$', NZD: 'NZ$', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  INR: '₹', MXN: '$', BRL: 'R$', KRW: '₩', TRY: '₺',
  ZAR: 'R', THB: '฿', PLN: 'zł', HUF: 'Ft', CZK: 'Kč',
};

interface RatesResult {
  base: string;
  date: string;
  rates: Record<string, number>;
  fetchedAt: Date;
}

const QUICK_CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS', 'JPY', 'CHF', 'AUD', 'CAD'];

export default function CurrencyCalculator() {
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('ILS');
  const [amount, setAmount] = useState('1');
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
      if (!res.ok) throw new Error('שגיאה בטעינת שערי מטבע');
      const data = await res.json();
      // frankfurter doesn't return the base itself, so add it
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

  useEffect(() => {
    fetchRates(from);
  }, [from, fetchRates]);

  const rate = result?.rates[to] ?? null;
  const converted = rate !== null && amount !== '' ? parseFloat(amount) * rate : null;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const fmt = (n: number, currency: string) => {
    if (isNaN(n)) return '—';
    const decimals = ['JPY', 'KRW', 'HUF'].includes(currency) ? 0 : 2;
    return n.toLocaleString('he-IL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="p-3 sm:p-6 space-y-5 max-w-3xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            מחשבון המרת מטבע
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">שערים בזמן אמת · frankfurter.app</p>
        </div>
        <button
          onClick={() => fetchRates(from)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          רענן שערים
        </button>
      </div>

      {/* Last updated */}
      {result && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          עודכן ב-{fmtTime(result.fetchedAt)} · תאריך שער: {result.date}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Main calculator */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">

        {/* Amount + From */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">סכום להמרה</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
              placeholder="0"
            />
            <CurrencySelect value={from} onChange={setFrom} label={SYMBOLS[from]} />
          </div>
        </div>

        {/* Swap button */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-100" />
          <button
            onClick={swap}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 text-sm font-medium transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
            החלף
          </button>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Result + To */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">מטבע יעד</label>
          <div className="flex gap-2">
            <div className="flex-1 border-2 border-blue-200 bg-blue-50 rounded-xl px-4 py-3 flex items-center">
              {loading ? (
                <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <span className="text-2xl font-bold text-blue-700">
                  {converted !== null && !isNaN(converted) ? fmt(converted, to) : '—'}
                </span>
              )}
            </div>
            <CurrencySelect value={to} onChange={setTo} label={SYMBOLS[to]} />
          </div>
        </div>

        {/* Exchange rate summary */}
        {rate !== null && !loading && (
          <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-slate-600">
              שער: <strong className="text-slate-800">1 {from}</strong> = <strong className="text-blue-700">{fmt(rate, to)} {to}</strong>
            </span>
            <span className="text-sm text-slate-600">
              הפוך: <strong className="text-slate-800">1 {to}</strong> = <strong className="text-slate-700">{fmt(1 / rate, from)} {from}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Quick rates table */}
      {result && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-700 text-sm">
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
                  className={`w-full flex items-center justify-between px-5 py-3 hover:bg-blue-50 transition-colors text-right ${to === currency ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-center font-bold text-slate-700 text-sm bg-slate-100 rounded-lg py-1">
                      {SYMBOLS[currency] || currency}
                    </span>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{currency}</div>
                      <div className="text-xs text-slate-400">{CURRENCIES[currency]}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-800">
                      {fmt(amtNum * r, currency)} {currency}
                    </div>
                    <div className="text-xs text-slate-400">
                      שער: {fmt(r, currency)}
                    </div>
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

function CurrencySelect({ value, onChange, label }: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer text-center"
        style={{ minWidth: '90px' }}
      >
        {Object.entries(CURRENCIES).map(([code, name]) => (
          <option key={code} value={code}>{code} — {name}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-500">
        {label}
      </span>
    </div>
  );
}
