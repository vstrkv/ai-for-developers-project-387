using TypeSpec.Http;

namespace CalendarBooking.Owner;

@route("/api/owner/event-types")
interface OwnerEventTypes {
  @get list(): EventType[];
  @post create(@body body: EventType): EventType;
  @put update(@path id: string, @body body: EventType): EventType;
  @delete delete(@path id: string): void;
}

@route("/api/owner/bookings")
interface OwnerBookings {
  @get list(): Booking[];
}
