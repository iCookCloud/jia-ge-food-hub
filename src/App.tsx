import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

import { ProtectedRoute, PublicRoute, AdminRoute } from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
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
import ManagementPage from "./pages/ManagementPage";
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
                <ProductsPage />
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
            <Route path="/products/:id" element={
              <PublicRoute>
                <ProductDetailPage />
              </PublicRoute>
            } />
            <Route path="/suppliers/:id" element={
              <PublicRoute>
                <SupplierDetailPage />
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
            <Route path="/profile" element={
              <ProtectedRoute>
                <ManagementPage />
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
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;