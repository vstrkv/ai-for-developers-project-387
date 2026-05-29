package calendarbooking.model;

public class CreateBookingRequest {
    private String eventTypeId;
    private String guestName;
    private String guestEmail;
    private String startTime;

    public String getEventTypeId() { return eventTypeId; }
    public void setEventTypeId(String eventTypeId) { this.eventTypeId = eventTypeId; }
    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }
    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
}
