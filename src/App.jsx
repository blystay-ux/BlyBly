import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Search from './pages/Search'
import HotelDetail from './pages/HotelDetail'
import Auth from './pages/Auth'
import ListHotel from './pages/ListHotel'
import Admin from './pages/Admin'
import ManageHotel from './pages/ManageHotel'
import MyBookings from './pages/MyBookings'
import Extranet from './pages/Extranet'
import Industry from './pages/Industry'
import ComingSoon from './pages/ComingSoon'

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/search"        element={<Search />} />
        <Route path="/hotel/:slug"   element={<HotelDetail />} />
        <Route path="/auth"          element={<Auth />} />
        <Route path="/list-hotel"    element={<ListHotel />} />
        <Route path="/admin"         element={<Admin />} />
        <Route path="/manage-hotel"  element={<ManageHotel />} />
        <Route path="/my-bookings"   element={<MyBookings />} />
        <Route path="/extranet"      element={<Extranet />} />
        <Route path="/industry"      element={<Industry />} />
        <Route path="/partners"      element={<ComingSoon />} />
      </Routes>
    </AuthProvider>
  )
}
