package calendarbooking.model;

import java.time.Instant;

public class Booking {
    private String id;
    private String eventTypeId;
    private String guestName;
    private String guestEmail;
    private Instant startTime;
    private Instant endTime;
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEventTypeId() { return eventTypeId; }
    public void setEventTypeId(String eventTypeId) { this.eventTypeId = eventTypeId; }
    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }
    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }
    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
