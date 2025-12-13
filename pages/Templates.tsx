import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const templates = [
  { id: '1', name: 'Coffee Shop Menu', category: 'Restaurant', img: 'https://picsum.photos/400/300?random=10' },
  { id: '2', name: 'Corporate News', category: 'Business', img: 'https://picsum.photos/400/300?random=11' },
  { id: '3', name: 'Summer Sale', category: 'Retail', img: 'https://picsum.photos/400/300?random=12' },
  { id: '4', name: 'Clinic Waiting Room', category: 'Healthcare', img: 'https://picsum.photos/400/300?random=13' },
  { id: '5', name: 'Gym Class Schedule', category: 'Fitness', img: 'https://picsum.photos/400/300?random=14' },
  { id: '6', name: 'School Announcement', category: 'Education', img: 'https://picsum.photos/400/300?random=15' },
];

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleUseTemplate = (id: string) => {
    if (!user) {
        navigate('/login');
        return;
    }
    navigate('/editor');
  };

  return (
    <div className="bg-ivory min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-primary">Design Templates</h1>
          <p className="mt-4 text-xl text-gray-600">
            Start with a professionally designed template and customize it to fit your brand.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="h-48 w-full overflow-hidden">
                <img src={template.img} alt={template.name} className="w-full h-full object-cover transition-transform hover:scale-105 duration-300" />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-vanilla px-2 py-1 rounded">
                        {template.category}
                    </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{template.name}</h3>
                <button
                  onClick={() => handleUseTemplate(template.id)}
                  className="w-full bg-white border border-gray-300 text-primary font-medium py-2 px-4 rounded hover:bg-primary hover:text-white transition-colors"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Templates;