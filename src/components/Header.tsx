import { motion } from 'framer-motion';
import { Music } from 'lucide-react';

export const Header = () => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="border-b bg-white shadow-sm"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Music className="h-8 w-8 text-emerald-600" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fonea - Sound Curator</h1>
            <p className="text-sm text-gray-600">Take your music curation to the next level</p>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
