// src/components/EmptyState.tsx
// ✅ PHASE 2.1: Chat-first workflow

import { motion } from "framer-motion";
import { FoneaLogo } from "@/components/FoneaLogo";

type Props = {
  onOpenChat: () => void;  // 🆕 Open chat instead of import modal
  onOpenGuide: () => void;
};

export default function EmptyState({ onOpenChat, onOpenGuide }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center text-emerald-400">
            <FoneaLogo variant="icon" className="h-24 w-24" />
          </div>
        </motion.div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to Fonea Sound Curator
        </h1>

        {/* ✅ UPDATED: Emphasize chat-first workflow */}
        <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
          Your AI-powered music discovery assistant.
          <br />
          <span className="text-emerald-400 font-medium">
            ✨ Chat with Fonea GPT to discover music instantly!
          </span>
        </p>

        {/* Quick Start Steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-emerald-500 transition-colors"
          >
            <div className="text-3xl mb-3">💬</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              1. Chat with Fonea GPT
            </h3>
            <p className="text-sm text-gray-400">
              Tell Fonea GPT your vibe - mood, context, energy level. Get personalized recommendations instantly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-emerald-500 transition-colors"
          >
            <div className="text-3xl mb-3">✨</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              2. Auto-Verify
            </h3>
            <p className="text-sm text-gray-400">
              Songs are automatically verified with MusicBrainz, Apple Music, and Spotify
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-emerald-500 transition-colors"
          >
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              3. Curate & Export
            </h3>
            <p className="text-sm text-gray-400">
              Keep or skip songs, create playlists, and export to Spotify
            </p>
          </motion.div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={onOpenChat}
            className="px-8 py-4 rounded-xl bg-emerald-600 text-white text-lg font-semibold hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-3"
          >
            <span className="text-2xl">💬</span>
            <span>Start Chatting</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={onOpenGuide}
            className="px-8 py-4 rounded-xl border border-gray-600 text-gray-300 text-lg font-semibold hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">📖</span>
            <span>View Guide</span>
          </motion.button>
        </div>

        {/* Helper Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-sm text-gray-500"
        >
          💡 Tip: Describe the vibe and context for best results
          <br />
          (e.g., "upbeat indie rock for summer road trip")
        </motion.p>
      </motion.div>
    </div>
  );
}
