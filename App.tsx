import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Info from './pages/Info';
import Templates from './pages/Templates';
import Editor from './pages/Editor';
import ModifyEditor from './pages/ModifyEditor';
import Preview from './pages/Preview';
import Dashboard from './pages/Dashboard';
import Creative from './pages/Creative';
import Playlist from './pages/Playlist';
import PlaylistEditor from './pages/PlaylistEditor';
import PlaylistPreview from './pages/PlaylistPreview';
import Screen from './pages/Screen';
import Auth from './pages/Auth';
import Login from './pages/login';
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
            <Route path="/editor/:designId" element={<Editor />} />

            {/* Modify Editor - Dedicated page for modifying designs */}
            <Route path="/modify/:designId" element={<ModifyEditor />} />

            {/* Preview */}
            <Route path="/preview/:designId" element={<Preview />} />

            {/* Dashboard - includes Schedule Management */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/creative" element={<Creative />} />
            <Route path="/playlist" element={<Playlist />} />
            <Route path="/playlist/edit/:id" element={<PlaylistEditor />} />
            <Route path="/playlist/preview/:id" element={<PlaylistPreview />} />
            <Route path="/screen" element={<Screen />} />

            {/* Authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<Auth />} />

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