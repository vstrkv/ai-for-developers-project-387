import { Container, Title, Text, Card, SimpleGrid } from '@mantine/core'
import { Link } from 'react-router-dom'

const links = [
  { to: '/guest', label: 'Guest Area', desc: 'Browse event types, view slots, and make bookings' },
  { to: '/owner', label: 'Owner Area', desc: 'Manage event types and view all bookings' },
]

function Home() {
  return (
    <Container size="sm" py="xl">
      <Title order={1} mb="sm">Calendar Booking</Title>
      <Text c="dimmed" mb="xl">Choose a section to get started</Text>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {links.map(l => (
          <Card key={l.to} component={Link} to={l.to} withBorder shadow="sm" p="lg">
            <Title order={3}>{l.label}</Title>
            <Text size="sm" c="dimmed">{l.desc}</Text>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  )
}

export default Home
