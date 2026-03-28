import { Trip, Flight, Hotel, CarRental, Activity, BudgetItem, ChecklistItem } from '../types';

interface ExportData {
  trip: Trip;
  flights: Flight[];
  hotels: Hotel[];
  carRentals: CarRental[];
  activities: Activity[];
  budget: BudgetItem[];
  checklist: ChecklistItem[];
}

export async function exportToExcel(data: ExportData) {
  try {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // Trip summary
    const tripSheet = XLSX.utils.aoa_to_sheet([
      ['שם הטיול', data.trip.name],
      ['יעד', data.trip.destination],
      ['תאריך התחלה', data.trip.startDate],
      ['תאריך סיום', data.trip.endDate],
      ['מטבע', data.trip.currency],
      ['תקציב כולל', data.trip.totalBudget],
      ['הערות', data.trip.notes],
    ]);
    XLSX.utils.book_append_sheet(wb, tripSheet, 'סיכום טיול');

    // Flights
    if (data.flights.length > 0) {
      const flightRows = [
        ['סוג', 'חברה', 'מספר טיסה', 'מוצא', 'יעד', 'יציאה', 'הגעה', 'מחיר', 'מטבע', 'אישור', 'הערות'],
        ...data.flights.map(f => [f.type, f.airline, f.flightNumber, f.from, f.to, f.departure, f.arrival, f.price, f.currency, f.confirmation, f.notes]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(flightRows), 'טיסות');
    }

    // Hotels
    if (data.hotels.length > 0) {
      const hotelRows = [
        ['שם', 'עיר', "צ'ק-אין", "צ'ק-אאוט", 'מחיר ללילה', 'מטבע', 'דירוג', 'אישור', 'כתובת', 'הערות'],
        ...data.hotels.map(h => [h.name, h.city, h.checkIn, h.checkOut, h.pricePerNight, h.currency, h.rating, h.confirmation, h.address, h.notes]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hotelRows), 'מלונות');
    }

    // Car rentals
    if (data.carRentals.length > 0) {
      const carRows = [
        ['חברה', 'סוג רכב', 'מקום איסוף', 'תאריך איסוף', 'מקום החזרה', 'תאריך החזרה', 'מחיר ליום', 'מטבע', 'אישור', 'הערות'],
        ...data.carRentals.map(c => [c.company, c.carType, c.pickupLocation, c.pickupDate, c.dropoffLocation, c.returnDate, c.pricePerDay, c.currency, c.confirmation, c.notes]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(carRows), 'השכרת רכב');
    }

    // Activities
    if (data.activities.length > 0) {
      const actRows = [
        ['שם', 'תאריך', 'שעה', 'מיקום', 'מחיר', 'מטבע', 'קטגוריה', 'הוזמן', 'הערות'],
        ...data.activities.map(a => [a.name, a.date, a.time, a.location, a.price, a.currency, a.category, a.booked ? 'כן' : 'לא', a.notes]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(actRows), 'פעילויות');
    }

    // Budget
    if (data.budget.length > 0) {
      const budgetRows = [
        ['קטגוריה', 'תיאור', 'סכום', 'מטבע', 'תאריך', 'שולם'],
        ...data.budget.map(b => [b.category, b.description, b.amount, b.currency, b.date, b.paid ? 'כן' : 'לא']),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(budgetRows), 'תקציב');
    }

    // Checklist
    if (data.checklist.length > 0) {
      const checkRows = [
        ['קטגוריה', 'פריט', 'הושלם'],
        ...data.checklist.map(c => [c.category, c.text, c.checked ? '✓' : '○']),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(checkRows), 'רשימת תיוג');
    }

    XLSX.writeFile(wb, 'trip-plan.xlsx');
  } catch (err) {
    console.error('Excel export error:', err);
    alert('שגיאה בייצוא Excel');
  }
}
