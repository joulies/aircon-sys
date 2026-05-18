import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import AboutPage from './pages/AboutPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import AppointmentPage from './pages/AppointmentPage';
import CheckoutPage from './pages/CheckoutPage';
import PurchaseHistoryPage from './pages/PurchaseHistoryPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AdminDashboard from './admin/AdminDashboard';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import AdminUsers from './admin/AdminUsers';
import AdminEmployees from './admin/AdminEmployees';
import AdminAppointments from './admin/AdminAppointments';
import AdminRefundRequests from './admin/AdminRefundRequests';
import AdminOrderAnalytics from './admin/AdminOrderAnalytics';
import AdminAssignEmployees from './admin/AdminAssignEmployees';
import AdminSettings from './admin/AdminSettings';
import AdminReports from './admin/AdminReports';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/otp-verify" element={<OTPVerificationPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/appointment" element={<AppointmentPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/purchase-history" element={<PurchaseHistoryPage />} />
          <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/appointments" element={<AdminAppointments />} />
          <Route path="/admin/order-analytics" element={<AdminOrderAnalytics />} />
          <Route path="/admin/assign-employees" element={<AdminAssignEmployees />} />
          <Route path="/admin/employees" element={<AdminEmployees />} />
          <Route path="/admin/refund-requests" element={<AdminRefundRequests />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Routes>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;