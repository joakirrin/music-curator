// src/components/Header.tsx
// ✅ UPDATED: Added YouTube login support alongside Spotify

import { motion } from "framer-motion";
import { FoneaLogo } from "./FoneaLogo";
import { SpotifyLoginButton } from "./SpotifyLoginButton";
import { YouTubeLoginButton } from "./YouTubeLoginButton";

type HeaderProps = {
  onOpenGuide: () => void;
};

export const Header = ({ onOpenGuide }: HeaderProps) => {
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="border-b border-gray-700 bg-gray-900"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Logo and tagline */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3">
              <FoneaLogo
                className="text-emerald-500 h-[clamp(40px,6vw,64px)] w-[clamp(40px,6vw,64px)]"
                labelClassName="text-[clamp(32px,5.2vw,52px)] font-extrabold tracking-tight text-white"
              />
            </div>
            <p className="mt-2 text-[clamp(14px,1.5vw,18px)] text-gray-400 font-medium leading-snug">
              Sound Curator
            </p>
          </div>

          {/* Right: Utility buttons */}
          <div className="flex items-center gap-3">
            {/* 🆕 YouTube login button */}
            <YouTubeLoginButton />

            {/* Spotify login button */}
            <SpotifyLoginButton />

            {/* Open Guide button */}
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-600 bg-transparent text-gray-300 text-sm font-medium hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-colors"
              title="Open getting started guide"
            >
              <span className="text-base">📖</span>
              <span className="hidden sm:inline">Guide</span>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
