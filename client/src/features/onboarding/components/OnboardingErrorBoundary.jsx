import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * Defensive Error Boundary for Onboarding steps.
 * Catches any render or runtime crash in question steps and provides a graceful recovery
 * option so the user never sees a blank white screen.
 */
export class OnboardingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Onboarding step crashed:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-8 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4 my-auto">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white font-display">
              Step Configuration Error
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              We encountered an issue preparing this question. Don&apos;t worry, your progress is safe.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Step &amp; Continue</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

OnboardingErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onReset: PropTypes.func,
};
