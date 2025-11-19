// src/components/PrivacyPolicyModal.tsx

import * as Dialog from '@radix-ui/react-dialog';
import { X, Mail, Shield, Eye, Download, Trash2, Edit, Lock } from 'lucide-react';

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyModal({ open, onOpenChange }: PrivacyPolicyModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-xl z-50">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <Dialog.Title className="text-xl font-bold text-gray-900">
                🔒 Privacy Policy
              </Dialog.Title>
              <p className="text-sm text-gray-600 mt-1">
                Last updated: {new Date().toLocaleDateString()} • GDPR Compliant
              </p>
            </div>
            <Dialog.Close className="text-gray-400 hover:text-gray-600 p-2">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Introduction
              </h2>
              <div className="prose prose-sm max-w-none text-gray-700">
                <p>
                  Fonea Sound Curator ("we", "our", "us") respects your privacy and is committed to protecting your personal data. 
                  This privacy policy explains how we handle your information when you use our music curation application.
                </p>
                <p>
                  <strong>🎵 What is Fonea?</strong> Fonea is a web-based music curation tool that helps you organize and create 
                  playlists using AI assistance. It connects with Spotify and other music services to verify songs and sync playlists.
                </p>
                <p>
                  <strong>🌍 GDPR Compliance:</strong> This policy complies with the EU General Data Protection Regulation (GDPR) 
                  and applies to all users, regardless of location.
                </p>
              </div>
            </section>

            {/* What We Collect */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                What Data We Collect
              </h2>
              
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h3 className="font-medium text-emerald-900 mb-2">✅ Data We DO Collect</h3>
                  <ul className="text-sm text-emerald-800 space-y-1">
                    <li>• <strong>Spotify Authentication Tokens:</strong> Stored locally in your browser to access Spotify API</li>
                    <li>• <strong>Your Playlists:</strong> Songs you import/create, stored locally in your browser</li>
                    <li>• <strong>App Preferences:</strong> Your settings, filters, and UI preferences</li>
                    <li>• <strong>Analytics Data (with consent):</strong> Anonymous usage patterns, clicks, page views</li>
                    <li>• <strong>Cookie Consent:</strong> Your privacy choices for our website</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 mb-2">🚫 Data We DON'T Collect</h3>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Your name, email address, or contact information</li>
                    <li>• Your Spotify username, profile, or listening history</li>
                    <li>• Your music library or personal playlists from Spotify</li>
                    <li>• Passwords or sensitive authentication details</li>
                    <li>• Text input, search queries, or personal content</li>
                    <li>• Cross-device tracking or fingerprinting</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Data */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Edit className="w-5 h-5 text-purple-600" />
                How We Use Your Data
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">🎵 Core Functionality</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Legal Basis:</strong> Contract Performance & Legitimate Interest
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Verify songs exist on music platforms</li>
                    <li>• Create and sync playlists to Spotify</li>
                    <li>• Save your curation work locally</li>
                    <li>• Provide music recommendation features</li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">📊 Analytics (Optional)</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Legal Basis:</strong> Consent
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Understand how users interact with Fonea</li>
                    <li>• Identify bugs and usability issues</li>
                    <li>• Improve features and user experience</li>
                    <li>• Generate anonymous usage statistics</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Storage */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                How We Store & Protect Data
              </h2>
              
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">🏠 Local Storage (Your Browser)</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Most of your data stays on your device and never leaves your browser:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Your playlists and imported songs</li>
                    <li>• Spotify access tokens and refresh tokens</li>
                    <li>• App preferences and settings</li>
                    <li>• Song feedback (keep/skip decisions)</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 You can clear this data anytime by clearing your browser storage.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">☁️ Third-Party Services</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Microsoft Clarity (Analytics)</p>
                      <p className="text-xs text-gray-600">
                        Anonymous usage data processed by Microsoft with IP anonymization. 
                        Data retention: 30 days. Servers: Global (may include outside EU).
                        <a href="https://privacy.microsoft.com/privacystatement" 
                           target="_blank" 
                           className="text-emerald-600 ml-1">Privacy Policy ↗</a>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Spotify Web API</p>
                      <p className="text-xs text-gray-600">
                        Authentication and playlist operations processed according to Spotify's terms.
                        <a href="https://www.spotify.com/privacy" 
                           target="_blank" 
                           className="text-emerald-600 ml-1">Privacy Policy ↗</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-orange-600" />
                Your Privacy Rights (GDPR)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    icon: Eye,
                    title: 'Access',
                    desc: 'See what data we have about you',
                    action: 'Request via email'
                  },
                  {
                    icon: Edit,
                    title: 'Rectify', 
                    desc: 'Correct incorrect information',
                    action: 'Contact us'
                  },
                  {
                    icon: Trash2,
                    title: 'Delete',
                    desc: 'Remove your data completely',
                    action: 'Clear browser storage'
                  },
                  {
                    icon: Download,
                    title: 'Portability',
                    desc: 'Export your data',
                    action: 'JSON export available'
                  },
                  {
                    icon: Lock,
                    title: 'Restrict',
                    desc: 'Limit data processing',
                    action: 'Adjust cookie settings'
                  },
                  {
                    icon: X,
                    title: 'Withdraw',
                    desc: 'Change your consent',
                    action: 'Update preferences'
                  }
                ].map((right, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <right.icon className="w-4 h-4 text-gray-600" />
                      <h3 className="text-sm font-medium text-gray-900">{right.title}</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{right.desc}</p>
                    <p className="text-xs text-emerald-600 font-medium">{right.action}</p>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h3 className="font-medium text-blue-900 mb-2">📧 How to Exercise Your Rights</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Email:</strong> <a href="mailto:foneamusiccurator@gmail.com" className="underline">foneamusiccurator@gmail.com</a></p>
                  <p><strong>Response Time:</strong> Within 30 days (GDPR requirement)</p>
                  <p><strong>Identity Verification:</strong> May be required for security purposes</p>
                  <p><strong>No Cost:</strong> Exercising your rights is free (unless requests are excessive)</p>
                </div>
              </div>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">🌍 International Data Transfers</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">
                  Some services we use may transfer your data outside the European Economic Area (EEA):
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Microsoft Clarity</span>
                    <span className="text-gray-600">Global servers with adequate protection</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Spotify API</span>
                    <span className="text-gray-600">Sweden (EEA) and global CDN</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  All transfers include appropriate safeguards like Standard Contractual Clauses (SCCs) 
                  or adequacy decisions as required by GDPR.
                </p>
              </div>
            </section>

            {/* Contact & Complaints */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600" />
                Contact & Complaints
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">📧 Contact Us</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Privacy Questions:</strong> foneamusiccurator@gmail.com</p>
                    <p><strong>Technical Support:</strong> foneamusiccurator@gmail.com</p>
                    <p><strong>General Inquiries:</strong> foneamusiccurator@gmail.com</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">🏛️ Supervisory Authority</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    If you're not satisfied with our response, you can file a complaint with your local data protection authority.
                  </p>
                  <p className="text-xs text-gray-600">
                    EU residents can find their local authority at: 
                    <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" 
                       target="_blank" 
                       className="text-emerald-600 ml-1">EDPB Website ↗</a>
                  </p>
                </div>
              </div>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">📝 Changes to This Policy</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  We may update this privacy policy from time to time. When we do:
                </p>
                <ul className="text-sm text-gray-700 space-y-1 mb-3">
                  <li>• We'll update the "Last updated" date at the top</li>
                  <li>• For significant changes, we'll notify you via the app or email</li>
                  <li>• You can always find the current version at /privacy</li>
                </ul>
                <p className="text-xs text-gray-600">
                  Continued use of Fonea after changes constitutes acceptance of the updated policy.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6">
              <div className="text-center text-sm text-gray-500">
                <p className="mb-2">
                  Fonea Sound Curator • Built with privacy by design
                </p>
                <p className="text-xs">
                  GDPR Compliant • Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <Dialog.Close asChild>
              <button className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
                I Understand
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
