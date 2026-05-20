using TypeSpec.Http;

namespace CalendarBooking.Guest;

@route("/api/guest/event-types")
interface GuestEventTypes {
  @get list(): EventType[];
}

@route("/api/guest/event-types/{eventTypeId}/slots")
interface GuestSlots {
  @get list(@path eventTypeId: string): Slot[];
}

model CreateBookingRequest {
  eventTypeId: string;
  guestName: string;
  guestEmail: string;
  startTime: utcDateTime;
}

@route("/api/guest/bookings")
interface GuestBookings {
  @post create(@body body: CreateBookingRequest): Booking;
}
