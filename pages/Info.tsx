import React, { useState } from 'react';
import { CheckCircle, Monitor, Globe, Mail, Phone, MapPin, Zap, Users, Target } from 'lucide-react';

const Info: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'product' | 'about' | 'contact'>('product');

  const sections = [
    { id: 'product', label: 'Features', icon: Zap },
    { id: 'about', label: 'About Us', icon: Users },
    { id: 'contact', label: 'Contact', icon: Mail },
  ] as const;

  return (
    <div className="bg-ivory min-h-screen">
      {/* Section Navigation */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-0">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold border-b-2 transition-all whitespace-nowrap ${
                    activeSection === section.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 hover:text-primary hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Section */}
      {activeSection === 'product' && (
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-4xl leading-8 font-extrabold tracking-tight text-black sm:text-5xl">
                Powerful features for modern signage
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
                From single screens to global networks, SignCraft scales with your business needs.
              </p>
            </div>

            <div className="space-y-20">
              {/* Feature 1 */}
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-primary mb-4">Intuitive Design Studio</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Forget complex design software. Our web-based editor allows you to create stunning visuals with drag-and-drop simplicity.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="text-green-600 w-6 h-6 flex-shrink-0" />
                      <span>Rich media library with millions of assets</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="text-green-600 w-6 h-6 flex-shrink-0" />
                      <span>Custom fonts and colors for brand consistency</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="text-green-600 w-6 h-6 flex-shrink-0" />
                      <span>AI-powered text generation and design suggestions</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="text-green-600 w-6 h-6 flex-shrink-0" />
                      <span>Template library for quick starts</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-1">
                  <img
                    src="https://picsum.photos/600/400?random=2"
                    alt="Editor"
                    className="rounded-lg shadow-xl border-4 border-white hover:shadow-2xl transition-shadow"
                  />
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-primary mb-4">Remote Device Management</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Monitor the health of your screens, reboot devices remotely, and push updates instantly without visiting the location.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-gray-700">
                      <Monitor className="text-primary w-6 h-6 flex-shrink-0" />
                      <span>Live screenshots and real-time monitoring</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <Globe className="text-primary w-6 h-6 flex-shrink-0" />
                      <span>Global deployment and multi-location management</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="text-green-600 w-6 h-6 flex-shrink-0" />
                      <span>Automatic updates and version control</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="text-green-600 w-6 h-6 flex-shrink-0" />
                      <span>Network status and health alerts</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-1">
                  <img
                    src="https://picsum.photos/600/400?random=3"
                    alt="Device Management"
                    className="rounded-lg shadow-xl border-4 border-white hover:shadow-2xl transition-shadow"
                  />
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-primary mb-4">Content Scheduling & Analytics</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Schedule content for specific times, days, or events. Track engagement and performance with detailed analytics.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="text-green-600 w-6 h-6 flex-shrink-0" />
                      <span>Time-based scheduling and playlists</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="text-green-600 w-6 h-6 flex-shrink-0" />
                      <span>Detailed engagement analytics and reports</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="text-green-600 w-6 h-6 flex-shrink-0" />
                      <span>A/B testing for content optimization</span>
                    </li>
                    <li className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="text-green-600 w-6 h-6 flex-shrink-0" />
                      <span>Audience insights and demographics</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-1">
                  <img
                    src="https://picsum.photos/600/400?random=4"
                    alt="Analytics"
                    className="rounded-lg shadow-xl border-4 border-white hover:shadow-2xl transition-shadow"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Preview */}
            <div className="mt-20 bg-gradient-to-r from-primary to-primaryLight rounded-lg p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-3">Ready to get started?</h3>
              <p className="mb-6 text-white/90">Choose a plan that fits your needs</p>
              <button className="bg-vanilla text-primary hover:bg-yellow-100 px-8 py-3 rounded-lg font-bold transition-colors">
                View Pricing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Section */}
      {activeSection === 'about' && (
        <div className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-primary sm:text-5xl">About SignCraft</h2>
              <p className="mt-4 text-xl text-gray-600">
                Revolutionizing visual communication for businesses worldwide.
              </p>
            </div>

            <div className="space-y-8 text-lg text-gray-600 mb-12">
              <div className="bg-white rounded-lg p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="mb-4">
                  Founded in 2023, SignCraft was born from a simple idea: <span className="font-semibold text-primary">Digital signage shouldn't be complicated.</span>
                </p>
                <p>
                  We noticed that small businesses were struggling with clunky, expensive hardware and difficult software just to put a menu on a TV screen. We set out to build a platform that runs on any device, is managed from the cloud, and is easy enough for anyone to use.
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <p>
                  Today, SignCraft powers screens in coffee shops, corporate offices, schools, and hospitals across the globe. We're proud to serve thousands of customers and continue to innovate to meet their evolving needs.
                </p>
              </div>
            </div>

            {/* Mission & Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-lg p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                <Target className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold text-primary mb-3">Our Mission</h3>
                <p className="text-gray-600">
                  To democratize digital communication by providing affordable, accessible, and powerful tools for everyone.
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                <Zap className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold text-primary mb-3">Our Vision</h3>
                <p className="text-gray-600">
                  Every business, regardless of size, can leverage digital signage to engage and inform their audience.
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                <Users className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold text-primary mb-3">Our Values</h3>
                <p className="text-gray-600">
                  Simplicity, innovation, reliability, and customer success drive everything we do.
                </p>
              </div>
            </div>

            {/* Team Section */}
            <div className="bg-gradient-to-r from-primary to-primaryLight rounded-lg p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-3">Join Our Team</h3>
              <p className="mb-6 text-white/90">We're always looking for passionate people to help us change the world of digital signage</p>
              <button className="bg-vanilla text-primary hover:bg-yellow-100 px-8 py-3 rounded-lg font-bold transition-colors">
                View Careers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Section */}
      {activeSection === 'contact' && (
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-primary sm:text-5xl">Contact Us</h2>
              <p className="mt-4 text-xl text-gray-600">
                Have questions? We'd love to hear from you. Get in touch with our team.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
              {/* Contact Info */}
              <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-bold text-primary mb-8">Get in Touch</h2>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <Mail className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
                      <p className="text-gray-600 mb-1">Support: <span className="font-medium">support@signcraft.com</span></p>
                      <p className="text-gray-600">Sales: <span className="font-medium">sales@signcraft.com</span></p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Phone className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone & WhatsApp</h3>
                      <p className="text-gray-600 mb-1 font-medium">+1 (555) 123-4567</p>
                      <p className="text-sm text-gray-400">Monday - Friday, 9am - 5pm EST</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <MapPin className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Headquarters</h3>
                      <p className="text-gray-600">
                        123 Innovation Drive<br/>
                        Tech City, TC 94000<br/>
                        United States
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-2xl font-bold text-primary mb-8">Send us a Message</h2>
                <form className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company (Optional)</label>
                    <input
                      type="text"
                      placeholder="Your Company"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                    <textarea
                      rows={5}
                      placeholder="Tell us about your project or question..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="button"
                    className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-primaryLight transition-colors"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-lg p-8 border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-bold text-primary mb-8">Frequently Asked Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">What platforms do you support?</h4>
                  <p className="text-gray-600">We support Windows, macOS, Linux, Android, and iOS. Any device with a modern browser can run SignCraft.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">How long does setup take?</h4>
                  <p className="text-gray-600">Most customers are up and running in under 30 minutes. We provide setup guides and 24/7 support.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Do you offer discounts for multiple screens?</h4>
                  <p className="text-gray-600">Yes! Our pricing scales with your business. Contact our sales team for custom quotes.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">What about data security?</h4>
                  <p className="text-gray-600">We use industry-standard encryption and comply with GDPR, CCPA, and other data protection regulations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Info;
