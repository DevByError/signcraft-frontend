import React from 'react';
import { CheckCircle, Monitor, Smartphone, Globe } from 'lucide-react';

const Product: React.FC = () => {
  return (
    <div className="bg-ivory py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Product</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-black sm:text-4xl">
            Powerful features for modern signage
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
            From single screens to global networks, SignCraft scales with your business needs.
          </p>
        </div>

        <div className="mt-16">
          <div className="space-y-16">
             {/* Feature 1 */}
            <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                     <h3 className="text-2xl font-bold text-primary mb-4">Intuitive Design Studio</h3>
                     <p className="text-lg text-gray-600 mb-6">
                        Forget complex design software. Our web-based editor allows you to create stunning visuals with drag-and-drop simplicity.
                     </p>
                     <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-gray-700"><CheckCircle className="text-green-600 w-5 h-5"/> Rich media library</li>
                        <li className="flex items-center gap-2 text-gray-700"><CheckCircle className="text-green-600 w-5 h-5"/> Custom fonts and colors</li>
                        <li className="flex items-center gap-2 text-gray-700"><CheckCircle className="text-green-600 w-5 h-5"/> AI text generation</li>
                     </ul>
                </div>
                <div className="flex-1">
                    <img src="https://picsum.photos/600/400?random=2" alt="Editor" className="rounded-lg shadow-xl border-4 border-white" />
                </div>
            </div>

             {/* Feature 2 */}
            <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                <div className="flex-1">
                     <h3 className="text-2xl font-bold text-primary mb-4">Remote Device Management</h3>
                     <p className="text-lg text-gray-600 mb-6">
                        Monitor the health of your screens, reboot devices remotely, and push updates instantly without visiting the location.
                     </p>
                     <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-gray-700"><Monitor className="text-primary w-5 h-5"/> Live screenshots</li>
                        <li className="flex items-center gap-2 text-gray-700"><Globe className="text-primary w-5 h-5"/> Global deployment</li>
                     </ul>
                </div>
                <div className="flex-1">
                    <img src="https://picsum.photos/600/400?random=3" alt="Device Management" className="rounded-lg shadow-xl border-4 border-white" />
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;