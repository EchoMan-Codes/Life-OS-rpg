import PropTypes from 'prop-types';
import { DesktopNav } from './DesktopNav';

/**
 * Sidebar — Legacy wrapper aliasing to DesktopNav.
 * Retains compatibility with any existing imports while serving the
 * Phase 2 Floating Command Chrome.
 *
 * @param {object} props
 * @param {() => void} [props.onOpenAuth] - Open Auth modal callback
 */
export function Sidebar({ onOpenAuth }) {
  return <DesktopNav onOpenAuth={onOpenAuth} />;
}

Sidebar.propTypes = {
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func,
  onOpenAuth: PropTypes.func,
};
