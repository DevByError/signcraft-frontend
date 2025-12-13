import React from 'react';

const Legal: React.FC = () => {
  return (
    <div className="bg-ivory py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-primary mb-8">Legal Information</h1>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Privacy Policy</h2>
            <div className="prose text-gray-600">
              <p>
                At SignCraft, we take your privacy seriously. This policy describes how we collect and use your data.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>We collect your email and name for account management.</li>
                <li>We store your uploaded media and designs securely.</li>
                <li>We do not sell your personal data to third parties.</li>
                <li>We use cookies to improve user experience and analyze traffic.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Terms of Service</h2>
            <div className="prose text-gray-600">
              <p>
                By using SignCraft, you agree to the following terms:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>You maintain ownership of the content you create.</li>
                <li>You agree not to use the platform for illegal or offensive content.</li>
                <li>We reserve the right to terminate accounts that violate these terms.</li>
                <li>The service is provided "as is" without warranties of any kind.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Legal;