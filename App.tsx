import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Info from './pages/Info';
import Templates from './pages/Templates';
import Editor from './pages/Editor';
import Dashboard from './pages/Dashboard';
import Creative from './pages/Creative';
import Playlist from './pages/Playlist';
import Screen from './pages/Screen';
import Auth from './pages/Auth';
import Legal from './pages/Legal';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Main Pages */}
            <Route path="/" element={<Home />} />
            <Route path="/product" element={<Info />} />
            <Route path="/about" element={<Info />} />
            <Route path="/contact" element={<Info />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/legal" element={<Legal />} />

            {/* Editor */}
            <Route path="/editor" element={<Editor />} />

            {/* Dashboard - includes Schedule Management */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/creative" element={<Creative />} />
            <Route path="/playlist" element={<Playlist />} />
            <Route path="/screen" element={<Screen />} />

            {/* Authentication */}
            <Route path="/login" element={<Auth />} />

            {/* Fallback Routes */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;