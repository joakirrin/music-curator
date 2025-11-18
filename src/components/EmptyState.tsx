import React, { useState, useEffect } from 'react';
import { spotifyAuth } from '@/services/spotifyAuth';
import '../styles/guide.css';

type EmptyStateProps = {
  onImport: () => void;
  onOpenGuide: () => void;
};

const EmptyState: React.FC<EmptyStateProps> = ({ onImport, onOpenGuide }) => {
  // Track auth state with auto-refresh
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authState = spotifyAuth.getAuthState();
      setIsSignedIn(!!authState?.access_token);
    };

    // Check immediately
    checkAuth();
    
    // Recheck every 1 second to catch login changes
    const interval = setInterval(checkAuth, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fonea-empty_root">
      <div className="fonea-empty_card">
        <div className="fonea-empty_badge">Fonea</div>
        
        {/* Title using header font, 2x bigger */}
        <h1 className="fonea-empty_title_header">
          fonea
        </h1>
        
        <p className="fonea-empty_subtitle">
          Curate smarter. Listen deeper.
        </p>

        <p className="fonea-empty_desc">
          {isSignedIn ? (
            <>Start by importing a playlist JSON from the Companion GPT, or open the guide to see the workflow.</>
          ) : (
            <>Sign in with Spotify to verify tracks and start curating your perfect playlist.</>
          )}
        </p>

        {/* Conditional CTA based on sign-in status */}
        <div className="fonea-empty_actions">
          {isSignedIn ? (
            <>
              <button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl" 
                onClick={onImport}
              >
                🤖 Import from ChatGPT
              </button>
              <button className="btn btn-ghost" onClick={onOpenGuide}>
                Open Guide
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => void spotifyAuth.login()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-3 text-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 168 168"
                  className="w-6 h-6"
                  fill="currentColor"
                >
                  <path d="M84 0a84 84 0 1 0 84 84A84 84 0 0 0 84 0ZM122.5 121a5 5 0 0 1-6.9 1.6c-19-11.6-42.8-14.2-71.3-7.7a5 5 0 0 1-2.2-9.7c30.9-7.1 57.8-4.2 79.5 8.8a5 5 0 0 1 1 7Zm9.8-21.7a6.3 6.3 0 0 1-8.7 2c-21.7-13.3-54.8-17.2-80.6-9.3a6.3 6.3 0 0 1-3.6-12c28.6-8.6 64.5-4.3 89.1 11.3a6.3 6.3 0 0 1 3.8 8Zm.8-23.5c-25.3-15-67.2-16.4-91.4-8.8a7.5 7.5 0 0 1-4.6-14.3c27.4-8.8 73.6-7.2 102.8 10.2a7.5 7.5 0 1 1-7.7 12.9Z" />
                </svg>
                Sign in with Spotify to Get Started
              </button>
              <button 
                className="btn btn-ghost mt-2" 
                onClick={onOpenGuide}
              >
                Learn More
              </button>
            </>
          )}
        </div>

        {/* Instructions centered with left-aligned content */}
        {isSignedIn && (
          <div className="fonea-instructions-container">
            <ul className="fonea-instructions-list-proper">
              <li>
                <span className="instruction-circle">1</span>
                <span className="instruction-content">Get JSON from Companion GPT (Round 1)</span>
              </li>
              <li>
                <span className="instruction-circle">2</span>
                <span className="instruction-content">Import JSON here</span>
              </li>
              <li>
                <span className="instruction-circle">3</span>
                <span className="instruction-content">Verify, Keep/Skip, add notes</span>
              </li>
              <li>
                <span className="instruction-circle">4</span>
                <span className="instruction-content">Export Feedback → paste in GPT</span>
              </li>
              <li>
                <span className="instruction-circle">5</span>
                <span className="instruction-content">Import new round and iterate</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
