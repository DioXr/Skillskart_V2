import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import ExplorePage from './pages/ExplorePage';
import RoadmapFlowPage from './pages/RoadmapFlowPage';
import DashboardPage from './pages/DashboardPage';
import LoginSignupPage from './pages/LoginSignupPage';
import AdminPanelPage from './pages/AdminPanelPage';
import CustomRoadmapEditorPage from './pages/CustomRoadmapEditorPage';
import { AuthProvider } from './context/AuthContext';
import { AdminRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/roadmap/:id" element={<RoadmapFlowPage />} />
            <Route path="/login" element={<LoginSignupPage />} />
            
            {/* Custom Roadmap Routes (any logged-in user) */}
            <Route path="/custom/new" element={<CustomRoadmapEditorPage />} />
            <Route path="/custom/:id/edit" element={<CustomRoadmapEditorPage />} />
            <Route path="/custom/:id" element={<RoadmapFlowPage />} />
            
            {/* Protected Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPanelPage />} />
            </Route>
            
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
