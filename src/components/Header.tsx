// src/components/Header.tsx
import { motion } from "framer-motion";
import { FoneaLogo } from "./FoneaLogo";

export const Header = () => {
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="border-b border-gray-700 bg-gray-900"
    >
      <div className="container mx-auto px-4 py-6">
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
      </div>
    </motion.header>
  );
};
