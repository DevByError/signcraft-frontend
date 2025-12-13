import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Product from './pages/Product';
import Templates from './pages/Templates';
import Editor from './pages/Editor';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import ScheduleCreative from './pages/ScheduleCreative';
import SchedulePlaylist from './pages/SchedulePlaylist';
import ScheduleScreen from './pages/ScheduleScreen';
import Auth from './pages/Auth';
import About from './pages/About';
import Contact from './pages/Contact';
import Legal from './pages/Legal';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product" element={<Product />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/schedule/creative" element={<ScheduleCreative />} />
            <Route path="/schedule/playlist" element={<SchedulePlaylist />} />
            <Route path="/schedule/screen" element={<ScheduleScreen />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/legal" element={<Legal />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;