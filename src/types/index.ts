export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  currency: string;
  notes: string;
  totalBudget: number;
}

export interface Flight {
  id: string;
  tripId: string;
  type: 'outbound' | 'return' | 'connecting';
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  price: number;
  currency: string;
  confirmation: string;
  notes: string;
}

export interface Hotel {
  id: string;
  tripId: string;
  name: string;
  city: string;
  checkIn: string;
  checkOut: string;
  pricePerNight: number;
  currency: string;
  confirmation: string;
  address: string;
  notes: string;
  rating: number;
}

export interface CarRental {
  id: string;
  tripId: string;
  company: string;
  carType: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  returnDate: string;
  pricePerDay: number;
  currency: string;
  confirmation: string;
  notes: string;
}

export interface Activity {
  id: string;
  tripId: string;
  name: string;
  date: string;
  time: string;
  location: string;
  price: number;
  currency: string;
  category: 'תרבות' | 'טבע' | 'אוכל' | 'קניות' | 'בידור' | 'ספורט' | 'אחר';
  notes: string;
  booked: boolean;
}

export interface ItineraryDay {
  date: string;
  notes: string;
  activityIds: string[];
}

export interface BudgetItem {
  id: string;
  tripId: string;
  category: 'טיסות' | 'מלונות' | 'השכרת רכב' | 'פעילויות' | 'אוכל' | 'קניות' | 'תחבורה' | 'אחר';
  description: string;
  amount: number;
  currency: string;
  date: string;
  paid: boolean;
}

export interface ChecklistItem {
  id: string;
  tripId: string;
  category: 'מסמכים' | 'בגדים' | 'ציוד' | 'תרופות' | 'אלקטרוניקה' | 'אחר';
  text: string;
  checked: boolean;
}

export interface ExchangeRates {
  [currency: string]: number;
}

export type Currency = 'ILS' | 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CHF';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  ILS: '₪',
  EUR: '€',
  USD: '$',
  GBP: '£',
  JPY: '¥',
  CHF: 'Fr',
};

export const EXCHANGE_RATES_TO_ILS: ExchangeRates = {
  ILS: 1,
  EUR: 4.0,
  USD: 3.7,
  GBP: 4.7,
  JPY: 0.025,
  CHF: 4.1,
};
