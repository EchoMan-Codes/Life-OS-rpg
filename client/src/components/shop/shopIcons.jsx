import PropTypes from 'prop-types';
import {
  Shield,
  Coffee,
  Gamepad2,
  Film,
  Pizza,
  Music,
  Tv,
  BookOpen,
  Sword,
  Trophy,
  Sparkles,
  Gift,
  Package,
} from 'lucide-react';

/**
 * Static component to render a shop item icon without creating dynamic component definitions.
 */
export function ShopItemIcon({ icon, type = 'custom', size = 24, className = '' }) {
  const key = (icon || '').toLowerCase();
  switch (key) {
    case 'shield':
      return <Shield size={size} className={className} />;
    case 'coffee':
      return <Coffee size={size} className={className} />;
    case 'gamepad':
      return <Gamepad2 size={size} className={className} />;
    case 'film':
      return <Film size={size} className={className} />;
    case 'pizza':
      return <Pizza size={size} className={className} />;
    case 'music':
      return <Music size={size} className={className} />;
    case 'tv':
      return <Tv size={size} className={className} />;
    case 'book':
      return <BookOpen size={size} className={className} />;
    case 'sword':
      return <Sword size={size} className={className} />;
    case 'trophy':
      return <Trophy size={size} className={className} />;
    case 'sparkles':
      return <Sparkles size={size} className={className} />;
    case 'gift':
      return <Gift size={size} className={className} />;
    case 'package':
      return <Package size={size} className={className} />;
    default:
      if (type === 'streak_shield') return <Shield size={size} className={className} />;
      if (type === 'equipment') return <Sword size={size} className={className} />;
      return <Gift size={size} className={className} />;
  }
}

ShopItemIcon.propTypes = {
  icon: PropTypes.string,
  type: PropTypes.string,
  size: PropTypes.number,
  className: PropTypes.string,
};
