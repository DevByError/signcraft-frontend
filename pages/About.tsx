import React from 'react';

const About: React.FC = () => {
  return (
    <div className="bg-ivory py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
            About SignCraft
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 lg:mx-auto">
            Revolutionizing visual communication for businesses worldwide.
          </p>
        </div>

        <div className="mt-10">
           <div className="prose prose-lg mx-auto text-gray-600">
             <p>
                Founded in 2023, SignCraft was born from a simple idea: Digital signage shouldn't be complicated.
                We noticed that small businesses were struggling with clunky, expensive hardware and difficult software just to put a menu on a TV screen.
             </p>
             <p className="mt-4">
                We set out to build a platform that runs on any device, is managed from the cloud, and is easy enough for anyone to use.
                Today, SignCraft powers screens in coffee shops, corporate offices, schools, and hospitals across the globe.
             </p>
             <h3 className="mt-8 text-2xl font-bold text-primary">Our Mission</h3>
             <p className="mt-4">
                To democratize digital communication by providing affordable, accessible, and powerful tools for everyone.
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default About;