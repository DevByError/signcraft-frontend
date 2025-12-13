import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Monitor, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Hide header/footer on editor page for maximizing space
  const isEditor = location.pathname === '/editor';

  const navLinks = [
    { label: 'Product', path: '/product' },
    { label: 'Templates', path: '/templates' },
    { label: 'Schedule', path: '/schedule' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-ivory">
      {!isEditor && (
        <nav className="sticky top-0 z-50 bg-primary border-b border-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                  <Monitor className="h-8 w-8 text-vanilla" />
                  <span className="font-bold text-xl text-white tracking-tight">SignCraft</span>
                </Link>
                <div className="hidden md:ml-10 md:flex md:space-x-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                        location.pathname === link.path
                          ? 'border-vanilla text-white'
                          : 'border-transparent text-gray-300 hover:border-gray-400 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/editor" className="bg-vanilla text-primary hover:bg-white px-4 py-2 rounded-md text-sm font-bold transition-colors shadow-sm">
                   Open Editor
                </Link>
                <div className="flex items-center gap-2 pl-4 border-l border-gray-600">
                   <div className="h-8 w-8 rounded-full bg-primaryLight flex items-center justify-center text-white font-bold border border-gray-500">
                      {user?.name.charAt(0)}
                   </div>
                </div>
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
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-300 hover:bg-primaryLight hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
                 <Link
                   to="/dashboard"
                   onClick={() => setIsMenuOpen(false)}
                   className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-300 hover:bg-primaryLight hover:text-white"
                 >
                   Dashboard
                 </Link>
                 <Link
                   to="/editor"
                   onClick={() => setIsMenuOpen(false)}
                   className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-vanilla hover:bg-primaryLight"
                 >
                   Open Editor
                 </Link>
              </div>
            </div>
          )}
        </nav>
      )}

      <main className="flex-grow">
        {children}
      </main>

      {!isEditor && (
        <footer className="bg-black text-white">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                   <Monitor className="h-6 w-6 text-vanilla" />
                   <span className="font-bold text-xl">SignCraft</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Empowering businesses to communicate effectively through digital displays.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Product</h3>
                <ul className="space-y-3">
                  <li><Link to="/product" className="text-gray-400 hover:text-vanilla text-sm">Features</Link></li>
                  <li><Link to="/templates" className="text-gray-400 hover:text-vanilla text-sm">Templates</Link></li>
                  <li><Link to="/editor" className="text-gray-400 hover:text-vanilla text-sm">Editor</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Support</h3>
                <ul className="space-y-3">
                  <li><Link to="/contact" className="text-gray-400 hover:text-vanilla text-sm">Contact Us</Link></li>
                  <li><Link to="/legal" className="text-gray-400 hover:text-vanilla text-sm">Privacy Policy</Link></li>
                  <li><Link to="/legal" className="text-gray-400 hover:text-vanilla text-sm">Terms of Service</Link></li>
                </ul>
              </div>
              <div>
                 <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Start Creating</h3>
                 <Link to="/editor" className="block w-full text-center bg-vanilla text-primary hover:bg-white font-bold py-2 px-4 rounded transition-colors">
                    New Project
                 </Link>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-800 pt-8 flex justify-between items-center">
              <p className="text-gray-500 text-sm">&copy; 2024 SignCraft. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;