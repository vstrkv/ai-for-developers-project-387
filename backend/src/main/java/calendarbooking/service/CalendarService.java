package calendarbooking.service;

import calendarbooking.model.Booking;
import calendarbooking.model.CreateBookingRequest;
import calendarbooking.model.EventType;
import calendarbooking.model.Slot;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CalendarService {
    private final Map<String, EventType> eventTypes = new ConcurrentHashMap<>();
    private final Map<String, Booking> bookings = new ConcurrentHashMap<>();

    public List<EventType> getEventTypes() {
        return new ArrayList<>(eventTypes.values());
    }

    public EventType createEventType(EventType eventType) {
        eventType.setId(UUID.randomUUID().toString());
        eventTypes.put(eventType.getId(), eventType);
        return eventType;
    }

    public EventType updateEventType(String id, EventType eventType) {
        eventType.setId(id);
        eventTypes.put(id, eventType);
        return eventType;
    }

    public void deleteEventType(String id) {
        eventTypes.remove(id);
    }

    public List<Slot> getSlots(String eventTypeId) {
        EventType eventType = eventTypes.get(eventTypeId);
        if (eventType == null) {
            return List.of();
        }

        List<Slot> slots = new ArrayList<>();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        for (int day = 1; day <= 7; day++) {
            LocalDate date = today.plusDays(day);
            LocalTime start = LocalTime.of(9, 0);
            LocalTime end = LocalTime.of(17, 0);
            LocalTime time = start;

            while (time.plusMinutes(eventType.getDurationMinutes()).compareTo(end) <= 0) {
                LocalDateTime slotStart = LocalDateTime.of(date, time);
                LocalDateTime slotEnd = slotStart.plusMinutes(eventType.getDurationMinutes());

                Instant slotStartInstant = slotStart.toInstant(ZoneOffset.UTC);
                Instant slotEndInstant = slotEnd.toInstant(ZoneOffset.UTC);
                boolean isBooked = bookings.values().stream().anyMatch(b ->
                    slotStartInstant.isBefore(b.getEndTime())
                    && slotEndInstant.isAfter(b.getStartTime())
                );

                if (!isBooked) {
                    Slot slot = new Slot();
                    slot.setStartTime(slotStart.toInstant(ZoneOffset.UTC));
                    slot.setEndTime(slotEnd.toInstant(ZoneOffset.UTC));
                    slot.setEventTypeId(eventTypeId);
                    slots.add(slot);
                }

                time = time.plusMinutes(eventType.getDurationMinutes());
            }
        }

        return slots;
    }

    public List<Booking> getBookings() {
        return new ArrayList<>(bookings.values());
    }

    public Booking createBooking(CreateBookingRequest request) {
        EventType eventType = eventTypes.get(request.getEventTypeId());
        if (eventType == null) {
            throw new IllegalArgumentException("Event type not found");
        }

        Instant start = Instant.parse(request.getStartTime());
        Instant end = start.plusSeconds(eventType.getDurationMinutes() * 60L);

        boolean alreadyBooked = bookings.values().stream().anyMatch(b ->
            start.isBefore(b.getEndTime())
            && end.isAfter(b.getStartTime())
        );
        if (alreadyBooked) {
            throw new IllegalArgumentException("This time slot is already booked");
        }

        Booking booking = new Booking();
        booking.setId(UUID.randomUUID().toString());
        booking.setEventTypeId(request.getEventTypeId());
        booking.setGuestName(request.getGuestName());
        booking.setGuestEmail(request.getGuestEmail());
        booking.setStartTime(start);
        booking.setEndTime(end);
        booking.setCreatedAt(Instant.now());

        bookings.put(booking.getId(), booking);
        return booking;
    }
}
