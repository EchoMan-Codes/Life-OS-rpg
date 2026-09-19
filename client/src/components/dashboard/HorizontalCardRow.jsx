import { useRef } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * HorizontalCardRow — Reusable native-feel horizontal card container.
 *
 * Implements:
 * - Edge-bleed peek layout revealing more cards
 * - Touch momentum & CSS scroll snap (snap-x mandatory)
 * - Hidden scrollbars for clean native appearance
 * - Optional desktop arrow navigation
 */
export function HorizontalCardRow({
  children,
  className = '',
  showControls = false,
  ariaLabel = 'Horizontal card list',
}) {
  const containerRef = useRef(null);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group w-full">
      {/* Optional Left Scroll Arrow for Desktop */}
      {showControls && (
        <button
          type="button"
          onClick={scrollLeft}
          aria-label="Scroll left"
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-obsidian-900/90 border border-glass-border text-ink-muted hover:text-ink items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      {/* Scrollable Container with Edge Bleed */}
      <div
        ref={containerRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className={clsx(
          'flex gap-3.5 overflow-x-auto pb-2 pt-1 px-1',
          'snap-x snap-mandatory scroll-smooth',
          // Hide visible scrollbars cross-browser
          'scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
          // Bleed slightly off screen edges on mobile
          '-mx-4 px-4 sm:mx-0 sm:px-0',
          className
        )}
      >
        {children}
      </div>

      {/* Optional Right Scroll Arrow for Desktop */}
      {showControls && (
        <button
          type="button"
          onClick={scrollRight}
          aria-label="Scroll right"
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-obsidian-900/90 border border-glass-border text-ink-muted hover:text-ink items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
        >
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

HorizontalCardRow.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  showControls: PropTypes.bool,
  ariaLabel: PropTypes.string,
};
