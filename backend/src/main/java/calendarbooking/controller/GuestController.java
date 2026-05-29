package calendarbooking.controller;

import calendarbooking.model.Booking;
import calendarbooking.model.CreateBookingRequest;
import calendarbooking.model.EventType;
import calendarbooking.model.Slot;
import calendarbooking.service.CalendarService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/guest")
public class GuestController {
    private final CalendarService service;

    public GuestController(CalendarService service) {
        this.service = service;
    }

    @GetMapping("/event-types")
    public List<EventType> listEventTypes() {
        return service.getEventTypes();
    }

    @GetMapping("/event-types/{eventTypeId}/slots")
    public List<Slot> listSlots(@PathVariable String eventTypeId) {
        return service.getSlots(eventTypeId);
    }

    @PostMapping("/bookings")
    public ResponseEntity<?> createBooking(@RequestBody CreateBookingRequest request) {
        try {
            Booking booking = service.createBooking(request);
            return ResponseEntity.ok(booking);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
