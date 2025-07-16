import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

import { ProtectedRoute, PublicRoute, SupplierRoute, AdminRoute } from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SuppliersPage from "./pages/SuppliersPage";
import SupplierDetailPage from "./pages/SupplierDetailPage";
import MaterialsPage from "./pages/MaterialsPage";
import MaterialDetailPage from "./pages/MaterialDetailPage";
import QuotationsPage from "./pages/QuotationsPage";
import OrdersPage from "./pages/OrdersPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import SupplierProductsPage from "./pages/SupplierProductsPage";
import SupplierQuotationsPage from "./pages/SupplierQuotationsPage";
import SupplierOrdersPage from "./pages/SupplierOrdersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminSuppliersPage from "./pages/admin/AdminSuppliersPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import SheetCenterPage from "./pages/SheetCenterPage";
import SheetDetailPage from "./pages/SheetDetailPage";
import NetworkCenterPage from "./pages/NetworkCenterPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={
              <PublicRoute>
                <Index />
              </PublicRoute>
            } />
            <Route path="/auth" element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            } />
            <Route path="/products" element={
              <PublicRoute>
                <ProductsPage />
              </PublicRoute>
            } />
            <Route path="/product/:id" element={
              <PublicRoute>
                <ProductDetailPage />
              </PublicRoute>
            } />
            <Route path="/suppliers" element={
              <PublicRoute>
                <SuppliersPage />
              </PublicRoute>
            } />
            <Route path="/supplier/:id" element={
              <PublicRoute>
                <SupplierDetailPage />
              </PublicRoute>
            } />
            
            {/* Protected routes - require authentication */}
            <Route path="/materials" element={
              <ProtectedRoute>
                <MaterialsPage />
              </ProtectedRoute>
            } />
            <Route path="/materials/:id" element={
              <ProtectedRoute>
                <MaterialDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/quotations" element={
              <ProtectedRoute>
                <QuotationsPage />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/sheets" element={
              <PublicRoute>
                <SheetCenterPage />
              </PublicRoute>
            } />
            <Route path="/sheets/:id" element={
              <PublicRoute>
                <SheetDetailPage />
              </PublicRoute>
            } />
            <Route path="/network" element={
              <PublicRoute>
                <NetworkCenterPage />
              </PublicRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            
            {/* Supplier routes */}
            <Route path="/supplier/products" element={
              <SupplierRoute>
                <SupplierProductsPage />
              </SupplierRoute>
            } />
            <Route path="/supplier/quotations" element={
              <SupplierRoute>
                <SupplierQuotationsPage />
              </SupplierRoute>
            } />
            <Route path="/supplier/orders" element={
              <SupplierRoute>
                <SupplierOrdersPage />
              </SupplierRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            } />
            <Route path="/admin/products" element={
              <AdminRoute>
                <AdminProductsPage />
              </AdminRoute>
            } />
            <Route path="/admin/suppliers" element={
              <AdminRoute>
                <AdminSuppliersPage />
              </AdminRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
