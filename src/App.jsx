import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Search from './pages/Search'
import HotelDetail from './pages/HotelDetail'
import Auth from './pages/Auth'
import ListHotel from './pages/ListHotel'
import Admin from './pages/Admin'
import ManageHotel from './pages/ManageHotel'

function Layout() {
  const location = useLocation()
  const hideNav = location.pathname === '/'

  return (
    <>
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/hotel/:slug" element={<HotelDetail />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/list-hotel" element={<ListHotel />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/manage-hotel" element={<ManageHotel />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  )
}
