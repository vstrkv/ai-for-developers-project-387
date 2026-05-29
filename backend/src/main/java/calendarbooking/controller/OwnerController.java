package calendarbooking.controller;

import calendarbooking.model.Booking;
import calendarbooking.model.EventType;
import calendarbooking.service.CalendarService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {
    private final CalendarService service;

    public OwnerController(CalendarService service) {
        this.service = service;
    }

    @GetMapping("/event-types")
    public List<EventType> listEventTypes() {
        return service.getEventTypes();
    }

    @PostMapping("/event-types")
    public EventType createEventType(@RequestBody EventType eventType) {
        return service.createEventType(eventType);
    }

    @PutMapping("/event-types/{id}")
    public EventType updateEventType(@PathVariable String id, @RequestBody EventType eventType) {
        return service.updateEventType(id, eventType);
    }

    @DeleteMapping("/event-types/{id}")
    public void deleteEventType(@PathVariable String id) {
        service.deleteEventType(id);
    }

    @GetMapping("/bookings")
    public List<Booking> listBookings() {
        return service.getBookings();
    }
}
