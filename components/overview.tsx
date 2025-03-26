import { motion } from 'framer-motion';
import Link from 'next/link';
import { useWindowSize } from 'usehooks-ts';

import { MessageIcon, SparklesIcon } from './icons';

export const Overview = () => {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto px-4 md:px-0 mt-8 md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-4 md:p-6 flex flex-col gap-6 md:gap-8 leading-relaxed text-center mx-auto max-w-xl">
        <p className="flex flex-row justify-center gap-3 md:gap-4 items-center">
          <SparklesIcon size={isMobile ? 24 : 32} />
          <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">Genie.ai</span>
          <MessageIcon size={isMobile ? 24 : 32} />
        </p>
        <p className="text-sm md:text-base">
          Welcome to <span className="font-medium">Genie.ai</span> - your personal AI assistant that makes your digital wishes come true. 
          Powered by state-of-the-art language models, Genie.ai helps you with content creation, 
          information retrieval, and problem-solving.
        </p>
      
        <p className="text-xs md:text-sm text-muted-foreground">
          To get started, simply type your question or request in the chat below.
        </p>
      </div>
    </motion.div>
  );
};
