import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Contexts
import { AuthProvider } from './contexts/AuthContext'; // Your existing user state
import { AuthGlobalProvider } from './contexts/AuthGlobalProvider'; // NEW: Handles 401 Interceptors & Modal

// Layouts & Components
import Layout from './components/Layout';

// Pages
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
import Legal from './pages/Legal';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  return (
    // 1. AuthProvider (User State): Wraps everything to provide user data
    <AuthProvider>
      <Router>
        {/* 2. AuthGlobalProvider (Interceptors): MUST be inside Router to use 'useNavigate' */}
        <AuthGlobalProvider>
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

              {/* Modify Editor */}
              <Route path="/modify/:designId" element={<ModifyEditor />} />

              {/* Preview */}
              <Route path="/preview/:designId" element={<Preview />} />

              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/creative" element={<Creative />} />
              <Route path="/playlist" element={<Playlist />} />
              <Route path="/playlist/edit/:id" element={<PlaylistEditor />} />
              <Route path="/playlist/preview/:id" element={<PlaylistPreview />} />
              <Route path="/screen" element={<Screen />} />

              {/* Authentication */}
              <Route path="/login" element={<Auth />} />
              <Route path="/auth" element={<Auth />} />

              {/* Fallback Routes */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthGlobalProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;