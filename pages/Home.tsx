import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layout, Cloud, Smartphone, Palette, Zap } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="bg-ivory">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-ivory sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-primary sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Digital Signage</span>{' '}
                  <span className="block text-primaryLight xl:inline">Made Simple</span>
                </h1>
                <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Create, schedule, and broadcast stunning content to any screen in minutes. No design skills required.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/editor"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primaryLight md:py-4 md:text-lg md:px-10"
                    >
                      Start Designing
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/product"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-vanilla hover:bg-yellow-100 md:py-4 md:text-lg md:px-10"
                    >
                      View Features
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-ivory flex items-center justify-center p-8">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full rounded-xl shadow-2xl border-4 border-white"
            src="https://picsum.photos/800/600?random=1"
            alt="Dashboard interface"
          />
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-12 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-black sm:text-4xl">
              Everything you need to broadcast
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <Palette className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-black">Drag & Drop Editor</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-600">
                  Easily create professional content with our intuitive editor. Add text, images, shapes, and widgets effortlessly.
                </dd>
              </div>
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <Cloud className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-black">Cloud Managed</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-600">
                  Manage all your screens from anywhere in the world. Updates are pushed instantly over the cloud.
                </dd>
              </div>
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <Layout className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-black">Professional Templates</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-600">
                  Get started quickly with hundreds of professionally designed templates for every industry.
                </dd>
              </div>
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                    <Zap className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-black">AI Powered</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-600">
                  Use our built-in AI tools to generate catchy headlines and layout ideas instantly.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to dive in?</span>
            <span className="block text-vanilla">Start your free trial today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-gray-300">
            No credit card required. Join thousands of businesses using SignCraft.
          </p>
          <Link
            to="/editor"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-vanilla hover:bg-white sm:w-auto"
          >
            Get started for free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;