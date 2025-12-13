import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowRight } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="bg-ivory min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primaryLight transition-colors font-medium"
          >
            <Home size={20} />
            Back to Home
          </Link>
          
          <div className="flex gap-2 justify-center flex-wrap">
            <Link
              to="/editor"
              className="text-primary hover:text-primaryLight font-medium underline transition-colors flex items-center gap-1"
            >
              Open Editor
              <ArrowRight size={16} />
            </Link>
            <span className="text-gray-400">•</span>
            <Link
              to="/product"
              className="text-primary hover:text-primaryLight font-medium underline transition-colors flex items-center gap-1"
            >
              View Features
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Popular Pages</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/templates" className="text-primary hover:text-primaryLight transition-colors">Browse Templates</Link></li>
            <li><Link to="/schedule" className="text-primary hover:text-primaryLight transition-colors">Schedule Management</Link></li>
            <li><Link to="/dashboard" className="text-primary hover:text-primaryLight transition-colors">Dashboard</Link></li>
            <li><Link to="/about" className="text-primary hover:text-primaryLight transition-colors">About Us</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
