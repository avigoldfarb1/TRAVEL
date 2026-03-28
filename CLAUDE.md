# מערכת ניהול טיול — CLAUDE.md

## מה הפרויקט
אפליקציית React לניהול טיולים — ממשק עברי RTL, שמירה ב-localStorage, ייצוא PDF/Word/Excel.

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS (RTL)
- Zustand + localStorage persist
- React Router v6
- jsPDF + html2canvas (PDF), docx (Word), xlsx (Excel)
- lucide-react, date-fns

## מבנה הפרויקט
```
src/
  types/index.ts          # כל ה-TypeScript types + CURRENCY_SYMBOLS + EXCHANGE_RATES
  store/tripStore.ts      # Zustand store (persist ל-localStorage)
  utils/
    sampleData.ts         # נתוני דוגמה: טיול לאמסטרדם אוגוסט 2026
    exportPdf.ts          # html2canvas + jsPDF
    exportWord.ts         # docx library
    exportExcel.ts        # SheetJS (xlsx)
  components/
    Layout.tsx            # Outlet wrapper
    Sidebar.tsx           # ניווט
  pages/
    Dashboard.tsx         # לוח בקרה + כפתורי ייצוא
    Flights.tsx
    Hotels.tsx
    CarRental.tsx
    Activities.tsx
    Itinerary.tsx         # מסלול יומי לפי תאריך
    Budget.tsx            # תקציב + גרפים + שערי המרה
    Checklist.tsx
```

## עיצוב
- CSS class `.input-field` מוגדר ב-src/index.css כ-@layer component
- כל הדפים משתמשים בפריסה p-6 space-y-5
- RTL מוגדר ב-index.html (dir="rtl") ו-Layout.tsx

## הרצה
```bash
npm run dev   # http://localhost:5173
```
