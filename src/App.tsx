import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";

import { ProtectedRoute, PublicRoute, AdminRoute } from "@/components/auth/ProtectedRoute";

import AuthPage from "./pages/AuthPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SupplierDetailPage from "./pages/SupplierDetailPage";
import ProjectManagementPage from "./pages/ProjectManagementPage";
import QuotationsPage from "./pages/QuotationsPage";
import OrdersPage from "./pages/OrdersPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import MaterialsPage from "./pages/MaterialsPage";
import MaterialDetailPage from "./pages/MaterialDetailPage";
import VideoUploadPage from "./pages/VideoUploadPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import CategoryManagementPage from "./pages/admin/CategoryManagementPage";
import ProductCategoryBatchPage from "./pages/admin/ProductCategoryBatchPage";
import ProductManagementPage from "./pages/admin/ProductManagementPage";
import { UserManagementPage } from "./pages/admin/UserManagementPage";
import MaterialsManagementPage from "./pages/admin/MaterialsManagementPage";
import SupplierVerificationPage from "./pages/admin/SupplierVerificationPage";
import RealtimeTestPage from "./pages/admin/RealtimeTestPage";
import E2ETestPage from "./pages/admin/E2ETestPage";
import ComprehensiveTestPage from "./pages/admin/ComprehensiveTestPage";
import { TestSignOutPage } from "./pages/TestSignOutPage";
import ManagementPage from "./pages/ManagementPage";
import ProfileManagementPage from "./pages/ProfileManagementPage";
import NotFound from "./pages/NotFound";
import { NegotiationPage } from "./pages/NegotiationPage";
import { OrderListDetail } from "./pages/OrderListDetail";
import { CreateOrderListPage } from "./pages/CreateOrderListPage";
import { QuotationPage } from "./pages/QuotationPage";
import { CustomerQuotationPage } from "./pages/CustomerQuotationPage";
import OrderDetailPage from "./pages/OrderDetailPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RealtimeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            } />
            
            {/* Protected routes - require authentication */}
            <Route path="/" element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            } />
            <Route path="/products/:id" element={
              <ProtectedRoute>
                <ProductDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/suppliers/:id" element={
              <ProtectedRoute>
                <SupplierDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/supplier/:id" element={
              <PublicRoute>
                <SupplierDetailPage />
              </PublicRoute>
            } />
            <Route path="/materials" element={
              <ProtectedRoute>
                <MaterialsPage />
              </ProtectedRoute>
            } />
            <Route path="/materials/:type/:id" element={
              <ProtectedRoute>
                <MaterialDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/materials/upload" element={
              <ProtectedRoute>
                <VideoUploadPage />
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
            <Route path="/orders/:id" element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/order-lists/:id" element={
              <ProtectedRoute>
                <OrderListDetail />
              </ProtectedRoute>
            } />
            <Route path="/create-order-list" element={
              <ProtectedRoute>
                <CreateOrderListPage />
              </ProtectedRoute>
            } />
            <Route path="/quotation/:id" element={
              <ProtectedRoute>
                <QuotationPage />
              </ProtectedRoute>
            } />
            <Route path="/customer-quotation/:id" element={
              <ProtectedRoute>
                <CustomerQuotationPage />
              </ProtectedRoute>
            } />
            <Route path="/negotiations" element={
              <ProtectedRoute>
                <NegotiationPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/management" element={
              <ProtectedRoute>
                <ManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/profile/management" element={
              <ProtectedRoute>
                <ProfileManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/test-signout" element={
              <ProtectedRoute>
                <TestSignOutPage />
              </ProtectedRoute>
            } />
            <Route path="/profile/personal" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <ProjectManagementPage />
              </ProtectedRoute>
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
            <Route path="/admin/categories" element={
              <AdminRoute>
                <CategoryManagementPage />
              </AdminRoute>
            } />
            <Route path="/admin/category-batch" element={
              <AdminRoute>
                <ProductCategoryBatchPage />
              </AdminRoute>
            } />
            <Route path="/admin/product-management" element={
              <AdminRoute>
                <ProductManagementPage />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <UserManagementPage />
              </AdminRoute>
            } />
            <Route path="/admin/materials" element={
              <AdminRoute>
                <MaterialsManagementPage />
              </AdminRoute>
            } />
            <Route path="/admin/supplier-verification" element={
              <AdminRoute>
                <SupplierVerificationPage />
              </AdminRoute>
            } />
            <Route path="/admin/realtime-test" element={
              <AdminRoute>
                <RealtimeTestPage />
              </AdminRoute>
            } />
            <Route path="/admin/e2e-test" element={
              <AdminRoute>
                <E2ETestPage />
              </AdminRoute>
            } />
            <Route path="/admin/comprehensive-test" element={
              <AdminRoute>
                <ComprehensiveTestPage />
              </AdminRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RealtimeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;