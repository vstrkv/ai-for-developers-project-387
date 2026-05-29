package calendarbooking.model;

import java.time.Instant;

public class Slot {
    private Instant startTime;
    private Instant endTime;
    private String eventTypeId;

    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
    public String getEventTypeId() { return eventTypeId; }
    public void setEventTypeId(String eventTypeId) { this.eventTypeId = eventTypeId; }
}
