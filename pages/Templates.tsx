import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChevronRight, ArrowLeft } from 'lucide-react';

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(templates.map(t => t.category)));
  
  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  const handleUseTemplate = (id: string) => {
    navigate('/editor', { state: { templateId: id } });
  };

  return (
    <div className="bg-ivory min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-primary mb-4">Design Templates</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a professionally designed template and customize it to fit your brand.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedCategory === null
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-primary border-2 border-gray-200 hover:border-primary'
            }`}
          >
            All Templates
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-primary'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary"
              >
                <div className="h-48 w-full overflow-hidden bg-gray-200 relative">
                  <img
                    src={template.img}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <button
                      onClick={() => handleUseTemplate(template.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primaryLight"
                    >
                      Use Template
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-vanilla px-3 py-1 rounded-full mb-3">
                    {template.category}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{template.name}</h3>
                  <button
                    onClick={() => handleUseTemplate(template.id)}
                    className="w-full bg-white border-2 border-primary text-primary font-semibold py-2 px-4 rounded-lg hover:bg-primary hover:text-white transition-all duration-200"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 text-lg">No templates found for this category.</p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-primaryLight rounded-lg shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Can't find what you're looking for?</h2>
          <p className="mb-6 text-white/90">Start from scratch with our powerful editor</p>
          <button
            onClick={() => navigate('/editor')}
            className="bg-vanilla text-primary hover:bg-yellow-100 px-8 py-3 rounded-lg font-bold transition-colors inline-flex items-center gap-2"
          >
            Start Designing
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Templates;