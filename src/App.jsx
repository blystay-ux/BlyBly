import { Routes, Route } from 'react-router-dom'
import Contact from './pages/Contact'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Search from './pages/Search'
import HotelDetail from './pages/HotelDetail'
import Checkout from './pages/Checkout'
import ManageBooking from './pages/ManageBooking'
import Auth from './pages/Auth'
import ListHotel from './pages/ListHotel'
import Admin from './pages/Admin'
import ManageHotel from './pages/ManageHotel'
import MyBookings from './pages/MyBookings'
import Extranet from './pages/Extranet'
import BlyInsiders from './pages/BlyInsiders'
import Terms from './pages/Terms'
import ComingSoon from './pages/ComingSoon'
import DestinationsPage from './pages/DestinationsPage'
import DestinationPage from './pages/DestinationPage'
import BookingSuccess from './pages/BookingSuccess'
import BookingPaymentFailed from './pages/BookingPaymentFailed'

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/"                    element={<Home />} />
        <Route path="/search"              element={<Search />} />
        <Route path="/hotel/:slug"         element={<HotelDetail />} />
        <Route path="/checkout"            element={<Checkout />} />
        <Route path="/manage-booking"      element={<ManageBooking />} />
        <Route path="/auth"                element={<Auth />} />
        <Route path="/list-hotel"          element={<ListHotel />} />
        <Route path="/admin"               element={<Admin />} />
        <Route path="/manage-hotel"        element={<ManageHotel />} />
        <Route path="/my-bookings"         element={<MyBookings />} />
        <Route path="/extranet"            element={<Extranet />} />
        <Route path="/insiders"            element={<BlyInsiders />} />
        <Route path="/terms"               element={<Terms />} />
        <Route path="/contact"             element={<Contact />} />
        <Route path="/partners"            element={<ComingSoon />} />
        <Route path="/destinations"        element={<DestinationsPage />} />
        <Route path="/accommodation/:slug" element={<DestinationPage />} />

        {/* iKhokha redirects here after payment */}
        <Route path="/booking/success"       element={<BookingSuccess />} />
        <Route path="/booking/payment-failed" element={<BookingPaymentFailed />} />
      </Routes>
    </AuthProvider>
  )
}
