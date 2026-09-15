/**
 * MindMerge AI — Legal Content
 *
 * Privacy Policy, Terms of Service, and Cookie Policy content.
 * These are rendered inside modals from the LandingPage footer.
 */

import React from 'react';

export type LegalPageType = 'privacy' | 'terms' | 'cookies';

interface LegalPageInfo {
  title: string;
  lastUpdated: string;
  content: React.ReactNode;
}

export function getLegalContent(type: LegalPageType): LegalPageInfo {
  switch (type) {
    case 'privacy':
      return {
        title: 'Privacy Policy',
        lastUpdated: 'June 2026',
        content: (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">1. Information We Collect</h3>
              <p className="text-slate-600 leading-relaxed">
                When you use MindMerge AI, we may collect the following information:
              </p>
              <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
                <li><strong>Account Information:</strong> Name, email address, and role (teacher or student) when you create an account.</li>
                <li><strong>Content Data:</strong> Classroom materials, notes, and documents you upload for AI processing.</li>
                <li><strong>Usage Data:</strong> How you interact with the platform, including pages visited and features used.</li>
                <li><strong>Device Information:</strong> Browser type, operating system, and screen resolution for optimizing your experience.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">2. How We Use Your Information</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>To provide and improve our AI-powered learning tools.</li>
                <li>To generate personalized study materials, quizzes, and flashcards.</li>
                <li>To communicate with you about your account and platform updates.</li>
                <li>To maintain the security and integrity of our platform.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">3. AI Processing</h3>
              <p className="text-slate-600 leading-relaxed">
                Your uploaded content is processed using Google's Gemini AI API to generate study materials.
                Content is sent to Google's servers for processing and is subject to
                {' '}<a href="https://ai.google.dev/terms" target="_blank" rel="noopener noreferrer" className="text-lagoon-500 hover:underline">Google's AI Terms of Service</a>.
                We do not use your content to train AI models.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">4. Data Sharing</h3>
              <p className="text-slate-600 leading-relaxed">
                We do not sell your personal information. We may share data with:
              </p>
              <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
                <li><strong>Service Providers:</strong> Google (AI processing), hosting providers.</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">5. Data Security</h3>
              <p className="text-slate-600 leading-relaxed">
                We implement industry-standard security measures to protect your data, including encryption in transit (HTTPS) and secure server infrastructure. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">6. Your Rights</h3>
              <p className="text-slate-600 leading-relaxed">
                You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:privacy@mindmerge.ai" className="text-lagoon-500 hover:underline">privacy@mindmerge.ai</a>.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">7. Contact Us</h3>
              <p className="text-slate-600 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at <a href="mailto:privacy@mindmerge.ai" className="text-lagoon-500 hover:underline">privacy@mindmerge.ai</a>.
              </p>
            </section>
          </div>
        ),
      };

    case 'terms':
      return {
        title: 'Terms of Service',
        lastUpdated: 'June 2026',
        content: (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">1. Acceptance of Terms</h3>
              <p className="text-slate-600 leading-relaxed">
                By accessing or using MindMerge AI ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">2. Description of Service</h3>
              <p className="text-slate-600 leading-relaxed">
                MindMerge AI is an educational platform that uses artificial intelligence to transform classroom materials into study resources including master notes, quizzes, and flashcards. The Service is designed for educators and students.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">3. User Accounts</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>You must provide accurate and complete registration information.</li>
                <li>You are responsible for maintaining the security of your account.</li>
                <li>You must be at least 13 years old to use the Service.</li>
                <li>One person or entity may not maintain more than one account.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">4. Content Ownership</h3>
              <p className="text-slate-600 leading-relaxed">
                You retain ownership of all content you upload to the Service. By uploading content, you grant MindMerge AI a limited license to process it through our AI systems solely for the purpose of generating study materials for you. AI-generated content is provided for your personal educational use.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">5. Acceptable Use</h3>
              <p className="text-slate-600 leading-relaxed">You agree not to:</p>
              <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
                <li>Upload content that infringes on intellectual property rights.</li>
                <li>Use the Service for any unlawful purpose.</li>
                <li>Attempt to gain unauthorized access to the Service.</li>
                <li>Reverse engineer or attempt to extract the source code of the Service.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">6. AI-Generated Content</h3>
              <p className="text-slate-600 leading-relaxed">
                Content generated by our AI is provided "as is" for educational purposes. While we strive for accuracy, AI-generated content may contain errors. Teachers should review all generated materials before sharing with students.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">7. Limitation of Liability</h3>
              <p className="text-slate-600 leading-relaxed">
                MindMerge AI is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the Service, including reliance on AI-generated content.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">8. Changes to Terms</h3>
              <p className="text-slate-600 leading-relaxed">
                We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">9. Contact</h3>
              <p className="text-slate-600 leading-relaxed">
                Questions about these Terms? Contact us at <a href="mailto:legal@mindmerge.ai" className="text-lagoon-500 hover:underline">legal@mindmerge.ai</a>.
              </p>
            </section>
          </div>
        ),
      };

    case 'cookies':
      return {
        title: 'Cookie Policy',
        lastUpdated: 'June 2026',
        content: (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">1. What Are Cookies</h3>
              <p className="text-slate-600 leading-relaxed">
                Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and improve your experience.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">2. Cookies We Use</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for authentication and core platform functionality. These cannot be disabled.</li>
                <li><strong>Preference Cookies:</strong> Remember your settings, such as selected role (teacher/student) and theme preferences.</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use the platform so we can improve it. These are anonymous and aggregated.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">3. Third-Party Cookies</h3>
              <p className="text-slate-600 leading-relaxed">
                We may use cookies from third-party services including Google Analytics and Google Fonts. These services have their own privacy policies governing the use of cookies.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">4. Managing Cookies</h3>
              <p className="text-slate-600 leading-relaxed">
                You can control cookies through your browser settings. Disabling cookies may affect the functionality of the Service. Most browsers allow you to:
              </p>
              <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
                <li>View and delete existing cookies</li>
                <li>Block cookies from specific or all websites</li>
                <li>Set preferences for certain types of cookies</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">5. Contact</h3>
              <p className="text-slate-600 leading-relaxed">
                For questions about our cookie practices, contact us at <a href="mailto:privacy@mindmerge.ai" className="text-lagoon-500 hover:underline">privacy@mindmerge.ai</a>.
              </p>
            </section>
          </div>
        ),
      };
  }
}
