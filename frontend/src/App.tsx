import { AppShell, Group, Title, NavLink } from '@mantine/core'
import { Outlet, NavLink as RRNavLink } from 'react-router-dom'

function App() {
  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 0 }}
      padding={0}
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Title order={3}>Calendar Booking</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <NavLink component={RRNavLink} to="/" label="Home" />
        <NavLink component={RRNavLink} to="/guest" label="Guest" />
        <NavLink component={RRNavLink} to="/owner" label="Owner" />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export default App
