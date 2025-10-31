import { motion } from "framer-motion";
import { FoneaLogo } from "./FoneaLogo";

export const Header = () => {
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="border-b bg-white"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          {/* Logo symbol + wordmark */}
          <FoneaLogo
            className="text-emerald-600 h-10 w-10"
            labelClassName="text-4xl font-bold text-gray-900 tracking-tight"
          />
          {/* Tagline */}
          <p className="text-base text-gray-500 font-medium leading-tight mt-[6px]">
            Sound Curator
          </p>
        </div>
      </div>
    </motion.header>
  );
};
