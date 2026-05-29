export interface EventType {
  id: string
  title: string
  description: string
  durationMinutes: number
}

export interface Slot {
  startTime: string
  endTime: string
  eventTypeId: string
}

export interface Booking {
  id: string
  eventTypeId: string
  guestName: string
  guestEmail: string
  startTime: string
  endTime: string
  createdAt: string
}

export interface CreateBookingRequest {
  eventTypeId: string
  guestName: string
  guestEmail: string
  startTime: string
}

const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`)
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path}: ${res.status}`)
  return res.json()
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PUT ${path}: ${res.status}`)
  return res.json()
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE ${path}: ${res.status}`)
}

export const api = {
  guestListEventTypes: () => get<EventType[]>('/guest/event-types'),
  guestListSlots: (eventTypeId: string) =>
    get<Slot[]>(`/guest/event-types/${eventTypeId}/slots`),
  guestCreateBooking: (body: CreateBookingRequest) =>
    post<Booking>('/guest/bookings', body),

  ownerListEventTypes: () => get<EventType[]>('/owner/event-types'),
  ownerCreateEventType: (body: Omit<EventType, 'id'>) =>
    post<EventType>('/owner/event-types', body),
  ownerUpdateEventType: (id: string, body: EventType) =>
    put<EventType>(`/owner/event-types/${id}`, body),
  ownerDeleteEventType: (id: string) => del(`/owner/event-types/${id}`),
  ownerListBookings: () => get<Booking[]>('/owner/bookings'),
}
