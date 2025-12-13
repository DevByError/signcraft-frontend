import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="bg-ivory min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-primary">Contact Us</h1>
          <p className="mt-4 text-xl text-gray-600">
            Have questions? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100">
             <h2 className="text-2xl font-bold text-primary mb-6">Get in touch</h2>
             <div className="space-y-6">
                <div className="flex items-start">
                    <Mail className="w-6 h-6 text-primary mt-1" />
                    <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Email</h3>
                        <p className="text-gray-500">support@signcraft.com</p>
                        <p className="text-gray-500">sales@signcraft.com</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <Phone className="w-6 h-6 text-primary mt-1" />
                    <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Phone & WhatsApp</h3>
                        <p className="text-gray-500">+1 (555) 123-4567</p>
                        <p className="text-xs text-gray-400 mt-1">Mon-Fri 9am-5pm EST</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <MapPin className="w-6 h-6 text-primary mt-1" />
                    <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Headquarters</h3>
                        <p className="text-gray-500">
                            123 Innovation Dr.<br/>
                            Tech City, TC 94000
                        </p>
                    </div>
                </div>
             </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-primary mb-6">Send us a message</h2>
            <form className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary"></textarea>
                </div>
                <button type="button" className="w-full bg-primary text-white font-medium py-2 px-4 rounded-md hover:bg-primaryLight transition-colors">
                    Send Message
                </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;