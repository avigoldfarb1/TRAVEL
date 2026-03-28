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

export async function exportToWord(data: ExportData) {
  try {
    const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = await import('docx');

    const children: InstanceType<typeof Paragraph>[] = [];

    const addHeading = (text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) => {
      children.push(new Paragraph({ text, heading: level, alignment: AlignmentType.RIGHT }));
    };

    const addText = (text: string, bold = false) => {
      children.push(new Paragraph({
        children: [new TextRun({ text, bold, rightToLeft: true })],
        alignment: AlignmentType.RIGHT,
      }));
    };

    const addBlank = () => children.push(new Paragraph({ text: '' }));

    // Title
    addHeading(`תוכנית טיול: ${data.trip.name}`);
    addText(`יעד: ${data.trip.destination}`);
    addText(`תאריכים: ${data.trip.startDate} – ${data.trip.endDate}`);
    if (data.trip.notes) addText(`הערות: ${data.trip.notes}`);
    addBlank();

    // Flights
    if (data.flights.length > 0) {
      addHeading('טיסות', HeadingLevel.HEADING_2);
      data.flights.forEach(f => {
        addText(`${f.airline} ${f.flightNumber} | ${f.from} → ${f.to}`, true);
        addText(`יציאה: ${f.departure?.replace('T', ' ')} | הגעה: ${f.arrival?.replace('T', ' ')}`);
        addText(`מחיר: ${f.price} ${f.currency} | אישור: ${f.confirmation}`);
        if (f.notes) addText(`הערות: ${f.notes}`);
        addBlank();
      });
    }

    // Hotels
    if (data.hotels.length > 0) {
      addHeading('מלונות', HeadingLevel.HEADING_2);
      data.hotels.forEach(h => {
        addText(`${h.name} — ${h.city}`, true);
        addText(`צ'ק-אין: ${h.checkIn} | צ'ק-אאוט: ${h.checkOut}`);
        addText(`מחיר ללילה: ${h.pricePerNight} ${h.currency} | אישור: ${h.confirmation}`);
        if (h.address) addText(`כתובת: ${h.address}`);
        if (h.notes) addText(`הערות: ${h.notes}`);
        addBlank();
      });
    }

    // Car rentals
    if (data.carRentals.length > 0) {
      addHeading('השכרת רכב', HeadingLevel.HEADING_2);
      data.carRentals.forEach(c => {
        addText(`${c.company} — ${c.carType}`, true);
        addText(`איסוף: ${c.pickupLocation} (${c.pickupDate})`);
        addText(`החזרה: ${c.dropoffLocation} (${c.returnDate})`);
        addText(`מחיר ליום: ${c.pricePerDay} ${c.currency} | אישור: ${c.confirmation}`);
        if (c.notes) addText(`הערות: ${c.notes}`);
        addBlank();
      });
    }

    // Activities
    if (data.activities.length > 0) {
      addHeading('פעילויות', HeadingLevel.HEADING_2);
      const sorted = [...data.activities].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      sorted.forEach(a => {
        addText(`${a.name} (${a.category})`, true);
        if (a.date) addText(`תאריך: ${a.date} ${a.time}`);
        if (a.location) addText(`מיקום: ${a.location}`);
        if (a.price > 0) addText(`מחיר: ${a.price} ${a.currency}`);
        addText(`הוזמן: ${a.booked ? 'כן' : 'לא'}`);
        if (a.notes) addText(`הערות: ${a.notes}`);
        addBlank();
      });
    }

    // Budget
    if (data.budget.length > 0) {
      addHeading('תקציב', HeadingLevel.HEADING_2);
      data.budget.forEach(b => {
        addText(`${b.category}: ${b.description} — ${b.amount} ${b.currency} (${b.paid ? 'שולם' : 'לא שולם'})`);
      });
      addBlank();
    }

    // Checklist
    if (data.checklist.length > 0) {
      addHeading('רשימת תיוג', HeadingLevel.HEADING_2);
      const byCategory: Record<string, ChecklistItem[]> = {};
      data.checklist.forEach(c => {
        if (!byCategory[c.category]) byCategory[c.category] = [];
        byCategory[c.category].push(c);
      });
      Object.entries(byCategory).forEach(([cat, items]) => {
        addText(cat, true);
        items.forEach(item => addText(`${item.checked ? '✓' : '○'} ${item.text}`));
        addBlank();
      });
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trip-plan.docx';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Word export error:', err);
    alert('שגיאה בייצוא Word');
  }
}
