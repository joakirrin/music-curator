// src/components/FeedbackFAB.tsx
// Floating Action Button for helper actions: Companion GPT, Guide, Feedback

import { useState } from "react";

type Props = {
  onOpenGuide: () => void;
};

const FEEDBACK_FORM_URL =
  "https://forms.gle/EaWW3Rgfc4c1QBos9";

// TODO: Reemplaza esta URL por la de tu GPT Companion real.
const COMPANION_GPT_URL =
  "https://chat.openai.com"; // <- ajusta a tu GPT personalizado

export function FeedbackFAB({ onOpenGuide }: Props) {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen((prev) => !prev);

  const handleOpenFeedback = () => {
    window.open(FEEDBACK_FORM_URL, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleOpenCompanion = () => {
    window.open(COMPANION_GPT_URL, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleOpenGuideClick = () => {
    onOpenGuide();
    setOpen(false);
  };

  return (
    <>
      {/* Mini menú flotante encima del FAB */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 flex flex-col items-end gap-2">
          <button
            onClick={handleOpenCompanion}
            className="px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-medium shadow-lg border border-gray-600 hover:bg-gray-800 transition-colors"
          >
            Open Companion GPT
          </button>

          <button
            onClick={handleOpenGuideClick}
            className="px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-medium shadow-lg border border-gray-600 hover:bg-gray-800 transition-colors"
          >
            Open Guide
          </button>

          <button
            onClick={handleOpenFeedback}
            className="px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-medium shadow-lg border border-gray-600 hover:bg-gray-800 transition-colors"
          >
            Send Feedback
          </button>
        </div>
      )}

      {/* FAB principal */}
      <button
        onClick={toggleMenu}
        className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full bg-emerald-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:bg-emerald-700 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
        title="Open Fonea tools"
        aria-label="Open Fonea tools"
      >
        Feedback & Tools
      </button>
    </>
  );
}
