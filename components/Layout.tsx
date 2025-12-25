import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Home, Maximize2, Minimize2 } from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext'; // Authentication removed

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const { user, logout } = useAuth(); // Authentication removed
  const user = { name: 'Guest Designer', email: 'guest@signcraft.com' };
  const logout = () => {};
  const location = useLocation();
  const navigate = useNavigate();

  // Hide header/footer on editor page for maximizing space
  const isEditor = location.pathname === '/editor';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/auth';

  const navLinks = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Info', path: '/product', icon: null },
    { label: 'Templates', path: '/templates', icon: null },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  // Fullscreen toggle state and handlers
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);

  const syncFullscreenState = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  React.useEffect(() => {
    document.addEventListener('fullscreenchange', syncFullscreenState);
    // initial state
    syncFullscreenState();
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await (document.documentElement as HTMLElement).requestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed', e);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-ivory">
      {!isEditor && !isAuthPage && (
        <nav className="sticky top-0 z-50 bg-primary border-b border-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex-shrink-0 flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <img src="/sc.png" alt="SignCraft" className="h-8 w-8" />
                  <span className="font-bold text-xl text-white tracking-tight">SignCraft</span>
                </Link>
                <div className="hidden md:ml-10 md:flex md:space-x-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                        location.pathname === link.path
                          ? 'border-vanilla text-white'
                          : 'border-transparent text-gray-300 hover:text-white hover:border-gray-400'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                {user ? (
                  <>
                    <Link 
                      to="/dashboard" 
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/dashboard'
                          ? 'bg-primaryLight text-white'
                          : 'text-gray-300 hover:text-white hover:bg-primaryLight'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/editor" 
                      className="bg-vanilla text-primary hover:bg-yellow-100 px-4 py-2 rounded-md text-sm font-bold transition-colors shadow-sm"
                    >
                      New Design
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-gray-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      title="Logout"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                    <div className="h-8 w-8 rounded-full bg-primaryLight flex items-center justify-center text-white font-bold border border-gray-500 text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/editor" 
                      className="bg-vanilla text-primary hover:bg-yellow-100 px-4 py-2 rounded-md text-sm font-bold transition-colors shadow-sm"
                    >
                      New Design
                    </Link>
                  </>
                )}
              </div>
              <div className="-mr-2 flex items-center md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-primaryLight"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-primary border-t border-gray-700">
              <div className="pt-2 pb-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                      location.pathname === link.path
                        ? 'border-vanilla bg-primaryLight text-white'
                        : 'border-transparent text-gray-300 hover:bg-primaryLight hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                        location.pathname === '/dashboard'
                          ? 'border-vanilla bg-primaryLight text-white'
                          : 'border-transparent text-gray-300 hover:bg-primaryLight hover:text-white'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/editor"
                      onClick={() => setIsMenuOpen(false)}
                      className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-vanilla hover:bg-primaryLight"
                    >
                      New Design
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-300 hover:bg-primaryLight hover:text-white"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-300 hover:bg-primaryLight hover:text-white"
                    >
                      Login
                    </Link>
                    <Link
                      to="/editor"
                      onClick={() => setIsMenuOpen(false)}
                      className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-vanilla hover:bg-primaryLight"
                    >
                      New Design
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      )}

      <main className="flex-grow">
        {children}
      </main>

      {/* Fullscreen toggle - visible on every page */}
      <button
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        className="fixed right-4 bottom-4 z-50 bg-primaryLight text-white p-3 rounded-full shadow-lg hover:bg-primary transition-colors"
      >
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>

      {!isEditor && !isAuthPage && (
        <footer className="bg-black text-white mt-auto">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                   <img src="/sc.png" alt="SignCraft" className="h-6 w-6" />
                   <span className="font-bold text-xl">SignCraft</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Empowering businesses to communicate effectively through digital displays.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Product</h3>
                <ul className="space-y-3">
                  <li><Link to="/product" className="text-gray-400 hover:text-vanilla text-sm transition-colors">Features</Link></li>
                  <li><Link to="/product" className="text-gray-400 hover:text-vanilla text-sm transition-colors">About Us</Link></li>
                  <li><Link to="/templates" className="text-gray-400 hover:text-vanilla text-sm transition-colors">Templates</Link></li>
                  <li><Link to="/editor" className="text-gray-400 hover:text-vanilla text-sm transition-colors">Editor</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Support</h3>
                <ul className="space-y-3">
                  <li><Link to="/product" className="text-gray-400 hover:text-vanilla text-sm transition-colors">Contact Us</Link></li>
                  <li><Link to="/legal" className="text-gray-400 hover:text-vanilla text-sm transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/legal" className="text-gray-400 hover:text-vanilla text-sm transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
              <div>
                 <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Start Creating</h3>
                 <Link to="/editor" className="block w-full text-center bg-vanilla text-primary hover:bg-yellow-100 font-bold py-2 px-4 rounded transition-colors">
                    New Project
                 </Link>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">&copy; 2024 SignCraft. All rights reserved.</p>
              <div className="flex gap-6">
                <Link to="/legal" className="text-gray-400 hover:text-vanilla text-sm transition-colors">Privacy</Link>
                <Link to="/legal" className="text-gray-400 hover:text-vanilla text-sm transition-colors">Terms</Link>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;