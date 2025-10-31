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
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FoneaLogo className="text-emerald-600" labelClassName="text-gray-900" />
            <p className="ml-1 text-sm text-gray-600">Sound Curator</p>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
