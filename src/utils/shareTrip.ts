import { Trip, Flight, Hotel, CarRental, Activity } from '../types';

export interface SharedTripData {
  trip: Pick<Trip, 'name' | 'destination' | 'startDate' | 'endDate' | 'notes'>;
  flights: Omit<Flight, 'price' | 'currency'>[];
  hotels: Omit<Hotel, 'pricePerNight' | 'currency'>[];
  carRentals: Omit<CarRental, 'pricePerDay' | 'currency'>[];
  activities: Omit<Activity, 'price' | 'currency'>[];
  /** When true, shared users may annotate the trip (mark activities booked, add notes) */
  canEdit?: boolean;
}

export function encodeSharedTrip(data: SharedTripData): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  } catch {
    return '';
  }
}

export function decodeSharedTrip(encoded: string): SharedTripData | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch {
    return null;
  }
}

export function buildSharedTripData(
  trip: Trip,
  flights: Flight[],
  hotels: Hotel[],
  carRentals: CarRental[],
  activities: Activity[],
): SharedTripData {
  return {
    trip: {
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      notes: trip.notes,
    },
    flights: flights.map(({ price: _p, currency: _c, ...rest }) => rest),
    hotels: hotels.map(({ pricePerNight: _p, currency: _c, ...rest }) => rest),
    carRentals: carRentals.map(({ pricePerDay: _p, currency: _c, ...rest }) => rest),
    activities: activities.map(({ price: _p, currency: _c, ...rest }) => rest),
  };
}

export function generateShareLink(data: SharedTripData, canEdit = false): string {
  const encoded = encodeSharedTrip({ ...data, canEdit });
  return `${window.location.origin}/shared-trip#${encoded}`;
}
