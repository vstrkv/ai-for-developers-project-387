import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '@mantine/core/styles.css'
import App from './App.tsx'
import Home from './pages/Home.tsx'
import GuestPage from './pages/GuestPage.tsx'
import OwnerPage from './pages/OwnerPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<App />}>
            <Route path="/" element={<Home />} />
            <Route path="/guest" element={<GuestPage />} />
            <Route path="/owner" element={<OwnerPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
)
