import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminRoute } from './components/ProtectedRoute';

// 🚀 Code Splitting: Lazy load heavy components to drastically improve site speed
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const RoadmapFlowPage = lazy(() => import('./pages/RoadmapFlowPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LoginSignupPage = lazy(() => import('./pages/LoginSignupPage'));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'));
const CustomRoadmapEditorPage = lazy(() => import('./pages/CustomRoadmapEditorPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));

// Clean loading spinner for Suspense
const LoadingSpinner = () => (
  <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ fontSize: '0.9rem', fontWeight: '500', letterSpacing: '0.5px' }}>Loading content...</p>
    </div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/roadmap/:id" element={<RoadmapFlowPage />} />
                <Route path="/login" element={<LoginSignupPage />} />
                <Route path="/pricing" element={<PricingPage />} />

                {/* Custom Roadmap Routes */}
                <Route path="/custom/new" element={<CustomRoadmapEditorPage />} />
                <Route path="/custom/:id/edit" element={<CustomRoadmapEditorPage />} />
                <Route path="/custom/:id" element={<RoadmapFlowPage />} />

                {/* Protected Admin Routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminPanelPage />} />
                </Route>

                <Route path="/dashboard" element={<DashboardPage />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
