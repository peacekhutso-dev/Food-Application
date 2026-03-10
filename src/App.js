import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import OrderComplete from './components/checkout/OrderComplete';
import TrackOrder from './components/checkout/TrackOrder';

import MenuPage from './pages/MenuPage';
import SignupLogin from './pages/SignupLogin';
import VendorPage from './pages/VendorPage';
import CartApp from "./pages/CartPage";
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './pages/CheckoutPage';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>

            {/* ── Public Routes ──────────────────────────────────────
                Guests and logged-in users can both access these.     */}
            <Route path="/"               element={<SignupLogin />} />
            <Route path="/vendor"         element={<VendorPage />} />
            <Route path="/menu/:vendorId" element={<MenuPage />}   />
            <Route path="/CartPage"       element={<CartApp />}    />

            {/* ── Protected Routes ───────────────────────────────────
                Guests are redirected to "/" until they log in.       */}
            <Route
              path="/ProfilePage"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/OrderComplete"
              element={
                <ProtectedRoute>
                  <OrderComplete />
                </ProtectedRoute>
              }
            />
            <Route
              path="/TrackOrder"
              element={
                <ProtectedRoute>
                  <TrackOrder />
                </ProtectedRoute>
              }
            />

          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;