import { motion } from "framer-motion";
import { FoneaLogo } from "./FoneaLogo";

export const Header = () => {
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="border-b bg-white"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Brand row */}
        <div className="flex items-baseline gap-4">
          {/* Bigger icon + wordmark */}
          <FoneaLogo
            // Icon size & color
            className="text-emerald-600 h-[clamp(36px,5vw,56px)] w-[clamp(36px,5vw,56px)]"
            // Wordmark size (responsive) & weight
            labelClassName="text-[clamp(28px,4.5vw,44px)] font-extrabold tracking-tight text-gray-900"
          />

          {/* Tagline: clearly secondary */}
          <p className="mt-[6px] text-[clamp(12px,1.4vw,16px)] text-gray-500 font-medium leading-tight">
            Sound Curator
          </p>
        </div>
      </div>
    </motion.header>
  );
};
