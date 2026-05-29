model Owner {
  id: string;
  name: string;
  email: string;
}

model EventType {
  id: string;
  title: string;
  description: string;
  durationMinutes: int32;
}

model Slot {
  startTime: utcDateTime;
  endTime: utcDateTime;
  eventTypeId: string;
}

model Booking {
  id: string;
  eventTypeId: string;
  guestName: string;
  guestEmail: string;
  startTime: utcDateTime;
  endTime: utcDateTime;
  createdAt: utcDateTime;
}
