import { motion, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';

export const BrandLogo = () => {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setKey(prev => prev + 1);
    }, 6000); 
    return () => clearInterval(interval);
  }, []);

  const text = "BAUFLEX";
  
  const container: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.5 }
    },
    exit: {
      opacity: 1,
      transition: { staggerChildren: 0.1, staggerDirection: -1 }
    }
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", damping: 12, stiffness: 100 }
    },
    hidden: {
      opacity: 0.1,
      y: -8,
      filter: "blur(4px)",
      transition: { type: "spring", damping: 12, stiffness: 100 }
    },
  };

  // Анимация для приписки management
  const subTitleVariant: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 0.7, 
      x: 0, 
      transition: { delay: 1.5, duration: 1 } 
    }
  };

  return (
    <div className="flex flex-col items-start gap-0">
      <motion.div
        key={key}
        variants={container}
        initial="hidden"
        animate="visible"
        className="flex overflow-hidden font-black text-4xl tracking-widest text-red-600 select-none cursor-default leading-none py-1"
      >
        {text.split("").map((char, index) => (
          <motion.span
            key={index}
            variants={child}
            className="inline-block"
          >
            {char}
          </motion.span>
        ))}
      </motion.div>
      
      {/* Пометка management */}
      <motion.span
        initial="hidden"
        animate="visible"
        variants={subTitleVariant}
        className="text-[10px] uppercase tracking-[0.4em] font-light text-white/60 ml-1 select-none"
      >
        management
      </motion.span>
    </div>
  );
};