import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreVertical,
  Edit2,
  MoveRight,
  Archive,
  RotateCcw,
  Trash2,
  ChevronRight,
  AlertTriangle,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { spring } from '@/lib/motionVariants';

/**
 * Universal Item Action Menu for LifeOS entities (Habits, Dailies, Quests, Rewards, etc.).
 *
 * Key guarantees:
 * 1. Rendered in a React Portal directly on document.body with z-[9999] —
 *    NEVER clipped by card containers, overflow:hidden, or bottom navigation.
 * 2. Intelligent viewport-aware positioning:
 *    Flips above trigger if near bottom of screen, clamps horizontally to stay on-screen.
 * 3. Consistent full action set:
 *    - Edit
 *    - Move to (valid destinations only, preserves all item data)
 *    - Archive / Restore (soft-delete, removes from active list)
 *    - Delete (permanent delete with dedicated confirmation modal)
 * 4. Outside-click, escape key, and scroll dismiss handling.
 */
export function ItemActionMenu({
  title = '',
  entityName = 'Item',
  onEdit,
  moveOptions = [],
  onMove,
  onArchive,
  isArchived = false,
  onRestore,
  onDelete,
  className = '',
  triggerAriaLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, placeAbove: false });

  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Compute smart viewport positioning whenever opened
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 190;
    const estimatedHeight = 180;
    const padding = 8;

    // Check vertical space: if less than estimatedHeight + 20px below, place above
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < estimatedHeight + 20 && rect.top > estimatedHeight + 20;

    const top = placeAbove
      ? Math.max(padding, rect.top - estimatedHeight - 4)
      : Math.min(window.innerHeight - estimatedHeight - padding, rect.bottom + 4);

    // Align right edge of menu to right edge of trigger, clamped to screen bounds
    const idealLeft = rect.right - menuWidth;
    const left = Math.max(padding, Math.min(idealLeft, window.innerWidth - menuWidth - padding));

    setMenuCoords({ top, left, placeAbove });
  }, []);

  // Open / Close toggle
  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsMoveOpen(false);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close listeners: click outside, escape key, window scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setIsMoveOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMoveOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
      setIsMoveOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  // Valid move options (excluding current destination if marked)
  const validMoveOptions = (moveOptions || []).filter((opt) => !opt.current);

  return (
    <>
      {/* ── Trigger Button ── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-label={triggerAriaLabel || `${entityName} options`}
        aria-expanded={isOpen}
        className={clsx(
          'w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer shrink-0 select-none',
          'text-slate-400 hover:text-slate-800 dark:text-ink-muted dark:hover:text-ink',
          'hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95',
          isOpen && 'bg-slate-100 text-slate-900 dark:bg-white/15 dark:text-white',
          className
        )}
      >
        <MoreVertical size={16} />
      </button>

      {/* ── Portal Dropdown Menu ── */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.94, y: menuCoords.placeAbove ? 6 : -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: menuCoords.placeAbove ? 6 : -6 }}
                transition={spring.snappy}
                style={{
                  position: 'fixed',
                  top: menuCoords.top,
                  left: menuCoords.left,
                  zIndex: 9999,
                }}
                role="menu"
                aria-orientation="vertical"
                className={clsx(
                  'w-48 py-1.5 rounded-2xl shadow-2xl backdrop-blur-2xl border select-none',
                  'bg-white/95 dark:bg-[#0E1017]/95 border-slate-200/90 dark:border-white/15',
                  'shadow-[0_16px_40px_rgba(0,0,0,0.25),0_0_1px_rgba(0,0,0,0.2)]'
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* 1. Edit Action */}
                {onEdit && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      onEdit();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <Edit2 size={14} className="text-indigo-500 shrink-0" />
                    <span>Edit {entityName}</span>
                  </button>
                )}

                {/* 2. Move to Action */}
                {onMove && validMoveOptions.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setIsMoveOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <MoveRight size={14} className="text-sky-500 shrink-0" />
                        <span>Move to</span>
                      </div>
                      <ChevronRight
                        size={12}
                        className={clsx(
                          'text-slate-400 transition-transform duration-150',
                          isMoveOpen && 'rotate-90'
                        )}
                      />
                    </button>

                    {/* Submenu Destinations */}
                    <AnimatePresence>
                      {isMoveOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-50 dark:bg-white/[0.04] border-y border-slate-200/60 dark:border-white/10 py-1 overflow-hidden"
                        >
                          {validMoveOptions.map((dest) => (
                            <button
                              key={dest.id}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setIsOpen(false);
                                setIsMoveOpen(false);
                                onMove(dest.id);
                              }}
                              className="w-full flex items-center gap-2 px-6 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                              <span className="truncate">{dest.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* 3. Archive / Restore Action */}
                {!isArchived && onArchive && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      onArchive();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-colors text-left cursor-pointer"
                  >
                    <Archive size={14} className="text-amber-500 shrink-0" />
                    <span>Archive</span>
                  </button>
                )}

                {isArchived && onRestore && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      onRestore();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left cursor-pointer"
                  >
                    <RotateCcw size={14} className="text-emerald-500 shrink-0" />
                    <span>Restore to Active</span>
                  </button>
                )}

                {/* Divider if Delete exists */}
                {onDelete && (
                  <div className="h-px bg-slate-200/80 dark:bg-white/10 my-1 mx-2" />
                )}

                {/* 4. Delete Action (Opens Confirmation Modal) */}
                {onDelete && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsOpen(false);
                      setIsConfirmDeleteOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                  >
                    <Trash2 size={14} className="text-rose-500 shrink-0" />
                    <span>Delete</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* ── Dedicated Delete Confirmation Modal ── */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isConfirmDeleteOpen && (
              <div
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                onClick={() => setIsConfirmDeleteOpen(false)}
              >
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/75 backdrop-blur-md"
                />

                {/* Modal Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={spring.snappy}
                  onClick={(e) => e.stopPropagation()}
                  className={clsx(
                    'relative w-full max-w-sm p-5 sm:p-6 rounded-3xl shadow-2xl z-10 space-y-4',
                    'bg-white dark:bg-[#0E1017] border border-slate-200 dark:border-white/15',
                    'text-slate-900 dark:text-white'
                  )}
                >
                  {/* Warning Header */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold font-display leading-tight truncate">
                        Delete {entityName}?
                      </h3>
                      {title && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                          &ldquo;{title}&rdquo;
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsConfirmDeleteOpen(false)}
                      className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Body Text */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    This will permanently remove this {entityName.toLowerCase()} and cannot be undone.
                    {onArchive && !isArchived && (
                      <span className="block mt-1.5 text-amber-600 dark:text-amber-400 font-medium">
                        💡 Tip: You can <strong>Archive</strong> instead to hide it from your active list without losing streak history.
                      </span>
                    )}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmDeleteOpen(false)}
                      className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-center"
                    >
                      Cancel
                    </button>

                    {onArchive && !isArchived && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsConfirmDeleteOpen(false);
                          onArchive();
                        }}
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-400 transition-colors cursor-pointer text-center"
                      >
                        Archive Instead
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsConfirmDeleteOpen(false);
                        onDelete();
                      }}
                      className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors cursor-pointer text-center"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

ItemActionMenu.propTypes = {
  title: PropTypes.string,
  entityName: PropTypes.string,
  onEdit: PropTypes.func,
  moveOptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      current: PropTypes.bool,
    })
  ),
  onMove: PropTypes.func,
  onArchive: PropTypes.func,
  isArchived: PropTypes.bool,
  onRestore: PropTypes.func,
  onDelete: PropTypes.func,
  className: PropTypes.string,
  triggerAriaLabel: PropTypes.string,
};
