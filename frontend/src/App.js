import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import DialogContainer from './components/DialogContainer';
import ToastNotification from './components/ToastNotification';
import AdminRoute from './components/AdminRoute';
import EmployeeRoute from './components/EmployeeRoute';
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
import AdminSettings from './admin/AdminSettings';
import AdminReports from './admin/AdminReports';
import EmployeeLayout from './employee/EmployeeLayout';
import EmployeeDashboard from './employee/EmployeeDashboard';
import EmployeeAssignedAppointments from './employee/EmployeeAssignedAppointments';
import EmployeeAppointmentsHistory from './employee/EmployeeAppointmentsHistory';
import EmployeeAccountSettings from './employee/EmployeeAccountSettings';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <DialogContainer />
        <ToastNotification />
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/otp-verify" element={<OTPVerificationPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/appointment" element={<ProtectedRoute><AppointmentPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/purchase-history" element={<ProtectedRoute><PurchaseHistoryPage /></ProtectedRoute>} />
          <Route path="/order-tracking/:orderId" element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/appointments" element={<AdminRoute><AdminAppointments /></AdminRoute>} />
          <Route path="/admin/employees" element={<AdminRoute><AdminEmployees /></AdminRoute>} />
          <Route path="/admin/refund-requests" element={<AdminRoute><AdminRefundRequests /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />

          {/* Employee Routes */}
          <Route path="/employee/dashboard" element={<EmployeeRoute><EmployeeLayout><EmployeeDashboard /></EmployeeLayout></EmployeeRoute>} />
          <Route path="/employee/assigned" element={<EmployeeRoute><EmployeeLayout><EmployeeAssignedAppointments /></EmployeeLayout></EmployeeRoute>} />
          <Route path="/employee/history" element={<EmployeeRoute><EmployeeLayout><EmployeeAppointmentsHistory /></EmployeeLayout></EmployeeRoute>} />
          <Route path="/employee/settings" element={<EmployeeRoute><EmployeeLayout><EmployeeAccountSettings /></EmployeeLayout></EmployeeRoute>} />
        </Routes>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;