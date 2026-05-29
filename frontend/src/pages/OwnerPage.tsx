import { useState, useEffect, useMemo } from 'react'
import {
  Container, Title, Table, Button, Group,
  TextInput, Textarea, NumberInput, Modal, Stack, Card, Loader, Alert,
  Text, Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { api, type EventType, type Booking } from '../api'

function BookingCalendar({ bookings, eventTypes }: { bookings: Booking[]; eventTypes: EventType[] }) {
  const days = useMemo(() => {
    const now = new Date()
    const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(utcToday)
      d.setUTCDate(d.getUTCDate() + i)
      return d
    })
  }, [])

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const byDate = useMemo(() => {
    const map: Record<string, Booking[]> = {}
    for (const b of bookings) {
      const k = new Date(b.startTime).toISOString().split('T')[0]
      if (!map[k]) map[k] = []
      map[k].push(b)
    }
    return map
  }, [bookings])

  const dayLanes = useMemo(() => {
    const total: Record<string, number> = {}
    const assign: Record<string, number> = {}

    for (const [dateKey, list] of Object.entries(byDate)) {
      const sorted = [...list].sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
      const ends: number[] = []
      for (const b of sorted) {
        const s = new Date(b.startTime).getTime()
        let idx = ends.findIndex(e => e <= s)
        if (idx === -1) {
          idx = ends.length
          ends.push(0)
        }
        ends[idx] = new Date(b.endTime).getTime()
        assign[b.id] = idx
      }
      total[dateKey] = ends.length || 1
    }
    return { total, assign }
  }, [byDate])

  const PX = 80
  const H = 8 * PX

  function fmt(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
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
          const list = byDate[dateKey] || []
          const lanes = dayLanes.total[dateKey]

          return (
            <div key={di} style={{ flex: 1, minWidth: 110 }}>
              <div style={{ height: 44, textAlign: 'center', padding: '6px 0 0', borderLeft: '1px solid #dee2e6', borderBottom: '1px solid #dee2e6' }}>
                <Text fw={600} size="sm">{dayLabels[day.getUTCDay()]}</Text>
                <Text size="xs" c="dimmed">{day.getUTCDate()}/{day.getUTCMonth() + 1}</Text>
              </div>

              <div style={{ position: 'relative', height: H, borderLeft: '1px solid #dee2e6' }}>
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

                {list.map(b => {
                  const lane = dayLanes.assign[b.id] ?? 0
                  const start = new Date(b.startTime)
                  const end = new Date(b.endTime)
                  const startMin = start.getUTCHours() * 60 + start.getUTCMinutes()
                  const endMin = end.getUTCHours() * 60 + end.getUTCMinutes()
                  const top = (startMin - 540) / (8 * 60) * H
                  const height = (endMin - startMin) / (8 * 60) * H
                  const width = 100 / lanes
                  const title = eventTypes.find(et => et.id === b.eventTypeId)?.title

                  const pad = height < 30 ? '1px 3px' : '2px 4px'
                  const showTitle = title && height > 35
                  return (
                    <Tooltip key={b.id}
                      label={`${b.guestName} · ${b.guestEmail}\n${fmt(b.startTime)}–${fmt(b.endTime)}`}
                    >
                      <div style={{
                        position: 'absolute', top, left: `${lane * width}%`,
                        width: `${width}%`, height,
                        backgroundColor: '#d3f9d8', border: '1px solid #69db7c',
                        borderRadius: 4, padding: pad, overflow: 'hidden',
                        cursor: 'pointer', boxSizing: 'border-box',
                      }}>
                        <Text size="xs" fw={600} c="green.9" lineClamp={1}
                          style={{ lineHeight: 1.3, fontSize: height < 25 ? 10 : undefined }}
                        >
                          {b.guestName}
                        </Text>
                        {showTitle && (
                          <Text size="xs" c="green.8" lineClamp={1}
                            style={{ lineHeight: 1.3 }}
                          >
                            {title}
                          </Text>
                        )}
                      </div>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OwnerPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState({ et: false, bookings: false })
  const [error, setError] = useState<string | null>(null)

  const [opened, { open, close }] = useDisclosure(false)
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [form, setForm] = useState({ title: '', description: '', durationMinutes: 30 })
  const [editForm, setEditForm] = useState<EventType | null>(null)

  useEffect(() => { loadEventTypes(); loadBookings() }, [])

  async function loadEventTypes() {
    setLoading(p => ({ ...p, et: true })); setError(null)
    try { setEventTypes(await api.ownerListEventTypes()) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(p => ({ ...p, et: false })) }
  }

  async function loadBookings() {
    setLoading(p => ({ ...p, bookings: true })); setError(null)
    try { setBookings(await api.ownerListBookings()) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(p => ({ ...p, bookings: false })) }
  }

  async function createEventType() {
    setError(null)
    try {
      await api.ownerCreateEventType(form)
      setForm({ title: '', description: '', durationMinutes: 30 }); close(); loadEventTypes()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
  }

  async function updateEventType() {
    if (!editForm) return; setError(null)
    try {
      await api.ownerUpdateEventType(editForm.id, editForm)
      closeEdit(); loadEventTypes()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
  }

  async function deleteEventType(id: string) {
    setError(null)
    try { await api.ownerDeleteEventType(id); loadEventTypes() }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">Owner Area</Title>

      {error && <Alert color="red" mb="md">{error}</Alert>}

      <Card withBorder mb="md">
        <Group justify="space-between" mb="sm">
          <Title order={4}>Event Types</Title>
          <Group>
            <Button size="xs" onClick={loadEventTypes} loading={loading.et}>Refresh</Button>
            <Button size="xs" onClick={open}>+ Create</Button>
          </Group>
        </Group>
        {loading.et ? <Loader /> : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Duration</Table.Th>
                <Table.Th w={180}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {eventTypes.map(et => (
                <Table.Tr key={et.id}>
                  <Table.Td>{et.title}</Table.Td>
                  <Table.Td>{et.description}</Table.Td>
                  <Table.Td>{et.durationMinutes} min</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button size="xs" variant="light" onClick={() => { setEditForm(et); openEdit() }}>Edit</Button>
                      <Button size="xs" color="red" variant="light" onClick={() => deleteEventType(et.id)}>Delete</Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Title order={4}>Bookings</Title>
          <Button size="xs" onClick={loadBookings} loading={loading.bookings}>Refresh</Button>
        </Group>
        {loading.bookings ? <Loader /> : (
          <BookingCalendar bookings={bookings} eventTypes={eventTypes} />
        )}
      </Card>

      <Modal opened={opened} onClose={close} title="Create Event Type">
        <Stack>
          <TextInput label="Title" value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Textarea label="Description" value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <NumberInput label="Duration (min)" value={form.durationMinutes}
            onChange={v => setForm(p => ({ ...p, durationMinutes: Number(v) }))} />
          <Button onClick={createEventType}>Create</Button>
        </Stack>
      </Modal>

      <Modal opened={editOpened} onClose={closeEdit} title="Edit Event Type">
        {editForm && (
          <Stack>
            <TextInput label="Title" value={editForm.title}
              onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
            <Textarea label="Description" value={editForm.description}
              onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            <NumberInput label="Duration (min)" value={editForm.durationMinutes}
              onChange={v => setEditForm({ ...editForm, durationMinutes: Number(v) })} />
            <Button onClick={updateEventType}>Save</Button>
          </Stack>
        )}
      </Modal>
    </Container>
  )
}

export default OwnerPage
