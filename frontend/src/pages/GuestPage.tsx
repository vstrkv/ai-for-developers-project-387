import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Container, Title, Table, Button, Group, Text,
  TextInput, Modal, Stack, Card, Loader, Alert, Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { api, type EventType, type Slot, type Booking } from '../api'

const WORK_START = 540
const WORK_END = 1020
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getDateKey(iso: string): string {
  return iso.slice(0, 10)
}

function findNearestSlot(
  clickedMinutes: number,
  dayBookings: Booking[],
  duration: number,
): number | null {
  const sorted = [...dayBookings]
    .map(b => ({
      start: new Date(b.startTime).getUTCHours() * 60 + new Date(b.startTime).getUTCMinutes(),
      end: new Date(b.endTime).getUTCHours() * 60 + new Date(b.endTime).getUTCMinutes(),
    }))
    .sort((a, b) => a.start - b.start)

  const freeIntervals: Array<{ start: number; end: number }> = []
  let cursor = WORK_START

  for (const bk of sorted) {
    if (bk.start > cursor) freeIntervals.push({ start: cursor, end: bk.start })
    cursor = Math.max(cursor, bk.end)
  }
  if (cursor < WORK_END) freeIntervals.push({ start: cursor, end: WORK_END })

  const snapped = Math.round(clickedMinutes / 5) * 5
  let best: number | null = null
  let bestDist = Infinity

  for (const interval of freeIntervals) {
    const latestStart = interval.end - duration
    const earliestStart = interval.start
    if (latestStart < earliestStart) continue

    if (snapped >= earliestStart && snapped <= latestStart) return snapped

    if (snapped < earliestStart) {
      const dist = earliestStart - snapped
      if (dist < bestDist) { bestDist = dist; best = earliestStart }
    } else {
      const dist = snapped - latestStart
      if (dist < bestDist) { bestDist = dist; best = latestStart }
    }
  }

  return best
}

function GuestPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [selectedEt, setSelectedEt] = useState<string | null>(null)
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState({ et: false, slots: false, bookings: false, book: false })
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null)

  const [opened, { open, close }] = useDisclosure(false)
  const [form, setForm] = useState({ eventTypeId: '', guestName: '', guestEmail: '', startTime: '' })

  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => { loadEventTypes() }, [])

  const days = useMemo(() => {
    const now = new Date()
    const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(utcToday)
      d.setUTCDate(d.getUTCDate() + i)
      return d
    })
  }, [])

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {}
    for (const b of bookings) {
      const k = getDateKey(b.startTime)
      if (!map[k]) map[k] = []
      map[k].push(b)
    }
    return map
  }, [bookings])

  const dayLanes = useMemo(() => {
    const total: Record<string, number> = {}
    const assign: Record<string, number> = {}

    for (const [dateKey, list] of Object.entries(bookingsByDate)) {
      const sorted = [...list].sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
      const ends: number[] = []
      for (const b of sorted) {
        const s = new Date(b.startTime).getTime()
        let idx = ends.findIndex(e => e <= s)
        if (idx === -1) { idx = ends.length; ends.push(0) }
        ends[idx] = new Date(b.endTime).getTime()
        assign[b.id] = idx
      }
      total[dateKey] = ends.length || 1
    }

    return { total, assign }
  }, [bookingsByDate])

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of slots) {
      const key = getDateKey(s.startTime)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return map
  }, [slots])

  const dateKeys = useMemo(() => Array.from(slotsByDate.keys()).sort(), [slotsByDate])

  async function loadEventTypes() {
    setLoading(p => ({ ...p, et: true })); setError(null)
    try { setEventTypes(await api.guestListEventTypes()) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(p => ({ ...p, et: false })) }
  }

  async function loadSlots(eventTypeId: string) {
    setLoading(p => ({ ...p, slots: true })); setError(null)
    try {
      const data = await api.guestListSlots(eventTypeId)
      setSlots(data)
      const keys = [...new Set(data.map(s => getDateKey(s.startTime)))].sort()
      setSelectedDate(keys[0] ?? null)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(p => ({ ...p, slots: false })) }
  }

  async function fetchBookings(eventTypeId: string) {
    setLoading(p => ({ ...p, bookings: true }))
    try { setBookings(await api.guestListBookings(eventTypeId)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(p => ({ ...p, bookings: false })) }
  }

  async function selectEventType(eventType: EventType) {
    setSelectedEt(eventType.id)
    setSelectedEventType(eventType)
    setSelectedStartTime(null)
    await Promise.all([loadSlots(eventType.id), fetchBookings(eventType.id)])
  }

  async function createBooking() {
    setLoading(p => ({ ...p, book: true })); setError(null)
    try {
      const b = await api.guestCreateBooking(form)
      setMyBookings(p => [...p, b]); close()
      setForm({ eventTypeId: form.eventTypeId, guestName: '', guestEmail: '', startTime: '' })
      setSelectedStartTime(null)
      await Promise.all([
        api.guestListSlots(form.eventTypeId).then(setSlots),
        fetchBookings(form.eventTypeId),
      ])
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(p => ({ ...p, book: false })) }
  }

  function handleDayClick(e: React.MouseEvent<HTMLDivElement>, day: Date) {
    if (!selectedEventType) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const containerHeight = rect.height
    const clickedMinutes = WORK_START + (y / containerHeight) * (WORK_END - WORK_START)

    const dateKey = day.toISOString().split('T')[0]
    const dayBookings = bookingsByDate[dateKey] || []
    const validStart = findNearestSlot(clickedMinutes, dayBookings, selectedEventType.durationMinutes)

    if (validStart === null) {
      setError('No available slot near this time')
      return
    }

    const startDate = new Date(Date.UTC(
      day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(),
      Math.floor(validStart / 60), validStart % 60,
    ))
    const iso = startDate.toISOString()
    setSelectedStartTime(iso)
    setSelectedDate(dateKey)
    setForm({ eventTypeId: selectedEventType.id, guestName: '', guestEmail: '', startTime: iso })
    open()
  }

  const PX = 80
  const H = 8 * PX

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">Guest Area</Title>

      {error && <Alert color="red" mb="md">{error}</Alert>}

      <Card withBorder mb="md">
        <Group justify="space-between" mb="sm">
          <Title order={4}>Event Types</Title>
          <Button size="xs" onClick={loadEventTypes} loading={loading.et}>Refresh</Button>
        </Group>
        {loading.et ? <Loader /> : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Duration</Table.Th>
                <Table.Th w={100}>Slots</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {eventTypes.map(et => (
                <Table.Tr key={et.id}>
                  <Table.Td>{et.title}</Table.Td>
                  <Table.Td>{et.description}</Table.Td>
                  <Table.Td>{et.durationMinutes} min</Table.Td>
                  <Table.Td>
                    <Button size="xs" variant="light" onClick={() => selectEventType(et)}>
                      View
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {selectedEt && (
        <Card withBorder mb="md">
          <Title order={4} mb="sm">
            {selectedEventType?.title ?? 'Available Slots'}
          </Title>
          {loading.slots ? <Loader /> : dateKeys.length === 0 && bookings.length === 0 ? (
            <Text c="dimmed" size="sm">No available slots</Text>
          ) : (
            <>
              <div style={{ overflowX: 'auto', border: '1px solid #dee2e6', borderRadius: 8 }}>
                <div style={{ display: 'flex', minWidth: 780 }}>
                  <div style={{ width: 60, flexShrink: 0 }}>
                    <div style={{ height: 44 }} />
                    {Array.from({ length: 8 }, (_, i) => (
                      <div key={i}
                        style={{ height: PX, borderBottom: '1px solid #dee2e6', padding: '0 6px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                      >
                        <Text size="xs" c="dimmed">{i + 9}:00</Text>
                      </div>
                    ))}
                  </div>

                  {days.map((day, di) => {
                    const dateKey = day.toISOString().split('T')[0]
                    const dayBookings = bookingsByDate[dateKey] || []
                    const isSelectedDate = selectedDate === dateKey

                    return (
                      <div key={di} style={{ flex: 1, minWidth: 110 }}>
                        <div style={{ height: 44, textAlign: 'center', padding: '6px 0 0', borderLeft: '1px solid #dee2e6', borderBottom: '1px solid #dee2e6' }}>
                          <Text fw={600} size="sm">{DAY_LABELS[day.getUTCDay()]}</Text>
                          <Text size="xs" c="dimmed">{day.getUTCDate()}/{day.getUTCMonth() + 1}</Text>
                        </div>

                        <div
                          ref={el => { dayRefs.current[dateKey] = el }}
                          data-testid="timeline-column"
                          style={{ position: 'relative', height: H, borderLeft: '1px solid #dee2e6', cursor: selectedEventType ? 'pointer' : 'default' }}
                          onClick={e => handleDayClick(e, day)}
                        >
                          {Array.from({ length: 9 }, (_, i) => (
                            <div key={i} style={{
                              position: 'absolute', top: i * PX, left: 0, right: 0,
                              borderTop: i > 0 ? '1px solid #dee2e6' : undefined,
                            }} />
                          ))}
                          {Array.from({ length: 8 }, (_, i) => (
                            <div key={`h${i}`} style={{
                              position: 'absolute', top: i * PX + PX / 2, left: 0, right: 0,
                              borderTop: '1px dashed #f0f0f0',
                            }} />
                          ))}

                          {dayBookings.map(b => {
                            const lane = dayLanes.assign[b.id] ?? 0
                            const start = new Date(b.startTime)
                            const end = new Date(b.endTime)
                            const startMin = start.getUTCHours() * 60 + start.getUTCMinutes()
                            const endMin = end.getUTCHours() * 60 + end.getUTCMinutes()
                            const top = (startMin - WORK_START) / (WORK_END - WORK_START) * H
                            const height = (endMin - startMin) / (WORK_END - WORK_START) * H
                            const width = 100 / (dayLanes.total[dateKey] || 1)

                            return (
                              <Tooltip key={b.id}
                                label={`Busy · ${fmt(b.startTime)}–${fmt(b.endTime)}`}
                              >
                                <div style={{
                                  position: 'absolute', top, left: `${lane * width}%`,
                                  width: `${width}%`, height,
                                  backgroundColor: '#ffe3e3', border: '1px solid #ffc9c9',
                                  borderRadius: 4, padding: '2px 4px', overflow: 'hidden',
                                  boxSizing: 'border-box',
                                }}>
                                  <Text size="xs" c="red.8" fw={600}>Busy</Text>
                                </div>
                              </Tooltip>
                            )
                          })}

                          {isSelectedDate && selectedStartTime && selectedEventType && (
                            (() => {
                              const start = new Date(selectedStartTime)
                              const end = new Date(start.getTime() + selectedEventType.durationMinutes * 60 * 1000)
                              const startMin = start.getUTCHours() * 60 + start.getUTCMinutes()
                              const endMin = end.getUTCHours() * 60 + end.getUTCMinutes()
                              const top = (startMin - WORK_START) / (WORK_END - WORK_START) * H
                              const height = (endMin - startMin) / (WORK_END - WORK_START) * H

                              return (
                                <div style={{
                                  position: 'absolute', top, left: 0, right: 0,
                                  height, backgroundColor: 'rgba(64, 192, 87, 0.25)',
                                  border: '2px solid #40c057', borderRadius: 4,
                                  boxSizing: 'border-box', pointerEvents: 'none', zIndex: 5,
                                }}>
                                  <Text size="xs" c="green.9" fw={600} style={{ padding: '2px 4px' }}>
                                    {fmt(start.toISOString())} – {fmt(end.toISOString())}
                                  </Text>
                                </div>
                              )
                            })()
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Text size="xs" c="dimmed" mt="xs">
                Click on a free area in the timeline to book a slot
              </Text>
            </>
          )}
        </Card>
      )}

      <Card withBorder>
        <Title order={4} mb="sm">My Bookings</Title>
        {myBookings.length === 0 ? (
          <Text c="dimmed" size="sm">No bookings yet</Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Event</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Start</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {myBookings.map(b => (
                <Table.Tr key={b.id}>
                  <Table.Td>{b.eventTypeId}</Table.Td>
                  <Table.Td>{b.guestName}</Table.Td>
                  <Table.Td>{b.guestEmail}</Table.Td>
                  <Table.Td>{b.startTime}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <Modal opened={opened} onClose={close} title="New Booking">
        <Stack>
          <TextInput label="Name" value={form.guestName}
            onChange={e => setForm(p => ({ ...p, guestName: e.target.value }))} />
          <TextInput label="Email" value={form.guestEmail}
            onChange={e => setForm(p => ({ ...p, guestEmail: e.target.value }))} />
          <TextInput label="Start Time" value={form.startTime}
            onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
          <Button onClick={createBooking} loading={loading.book}>Confirm</Button>
        </Stack>
      </Modal>
    </Container>
  )
}

export default GuestPage
