import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import honeySpoon from '../assets/honey_spoon.png';

export function Footer() {
  const containerRef = useRef<HTMLElement>(null);
  const [footerTop, setFooterTop] = useState(0);
  const { scrollY } = useScroll();

  useEffect(() => {
    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setFooterTop(rect.top + window.scrollY);
      }
    };

    // Give other components (like images loading) time to layout
    updatePosition();
    const timeoutId = setTimeout(updatePosition, 500);

    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  // Moves the spoon down with the window until it hits its natural layout position
  const spoonY = useTransform(scrollY, (val) => {
    if (!footerTop) return 0;
    const targetY = val + 150 - footerTop; // 150 is the distance from the top of the viewport
    return Math.min(targetY, 0); // Cap at 0 so it docks beautifully into the footer
  });

  return (
    <footer
      ref={containerRef}
      className='relative p-0 overflow-visible bg-dark-red mt-5 md:mt-10'
    >
      <div className='relative mx-auto h-full w-full flex items-center justify-end '>
        <motion.img
          style={{
            y: spoonY,
            opacity: footerTop ? 1 : 0,
          }}
          src={honeySpoon}
          alt='Honey Spoon'
          className='-mt-15 -mr-5 w-48 md:w-auto relative z-50 transition-opacity duration-300'
        />
      </div>
    </footer>
  );
}
