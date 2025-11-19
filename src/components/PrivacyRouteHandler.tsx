// src/components/PrivacyRouteHandler.tsx

import { useState, useEffect } from 'react';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

export function PrivacyRouteHandler() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  useEffect(() => {
    // Check if we're on /privacy route
    const checkPrivacyRoute = () => {
      if (window.location.pathname === '/privacy' || window.location.hash === '#privacy') {
        setIsPrivacyOpen(true);
      }
    };

    // Check on mount
    checkPrivacyRoute();

    // Listen for route changes (for hash routing)
    window.addEventListener('hashchange', checkPrivacyRoute);
    window.addEventListener('popstate', checkPrivacyRoute);

    return () => {
      window.removeEventListener('hashchange', checkPrivacyRoute);
      window.removeEventListener('popstate', checkPrivacyRoute);
    };
  }, []);

  const handleClosePrivacy = () => {
    setIsPrivacyOpen(false);
    
    // Clean up URL if we opened from /privacy
    if (window.location.pathname === '/privacy') {
      window.history.replaceState({}, '', '/');
    } else if (window.location.hash === '#privacy') {
      window.location.hash = '';
    }
  };

  return (
    <PrivacyPolicyModal 
      open={isPrivacyOpen} 
      onOpenChange={handleClosePrivacy} 
    />
  );
}

// Helper function to open privacy from anywhere in the app
export function openPrivacyPolicy() {
  // Use hash routing to avoid full page reload
  window.location.hash = 'privacy';
}
