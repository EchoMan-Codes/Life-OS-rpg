import { useState, useEffect } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';

let validatorPromise = null;

/**
 * Lazy loads ZxcvbnFactory and English dictionary on demand,
 * completely deferring the ~800 kB dictionary out of the initial application bundle.
 */
function getZxcvbnValidator() {
  if (!validatorPromise) {
    validatorPromise = Promise.all([
      import('@zxcvbn-ts/core'),
      import('@zxcvbn-ts/language-en'),
    ]).then(([{ ZxcvbnFactory }, { translations, dictionary }]) => {
      return new ZxcvbnFactory({
        translations,
        dictionary,
      });
    });
  }
  return validatorPromise;
}

/**
 * Live password strength meter component with deferred dictionary loading.
 *
 * @param {object} props
 * @param {string} props.password - Current password string
 * @param {(result: { score: number, isValid: boolean }) => void} [props.onChange] - Callback reporting score and validity
 */
export function PasswordMeter({ password = '', onChange }) {
  const [result, setResult] = useState({
    score: 0,
    feedback: { warning: null, suggestions: [] },
  });

  useEffect(() => {
    if (!password) {
      setResult({ score: 0, feedback: { warning: null, suggestions: [] } });
      onChange?.({ score: 0, isValid: false });
      return;
    }

    let isMounted = true;

    getZxcvbnValidator().then((validator) => {
      if (!isMounted) return;
      const checkResult = validator.check(password);
      setResult(checkResult);
      onChange?.({
        score: checkResult.score,
        isValid: checkResult.score >= 2 && password.length >= 8,
      });
    }).catch((err) => {
      console.warn('Failed to load password validator:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [password, onChange]);

  if (!password) return null;

  const score = result.score; // 0 to 4

  // Color selection based on specification:
  // attr-strength (red) at 0-1 -> xp (amber) at 2 -> attr-vitality (green) at 3-4
  const activeColor =
    score <= 1
      ? 'bg-attr-strength'
      : score === 2
      ? 'bg-xp'
      : 'bg-attr-vitality';

  const suggestion = result.feedback.warning || result.feedback.suggestions?.[0];

  return (
    <div className="space-y-1.5 mt-2">
      {/* 4-segment visual bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((segmentIndex) => (
          <div
            key={segmentIndex}
            className={clsx(
              'h-full rounded-full transition-colors duration-200',
              score >= segmentIndex ? activeColor : 'bg-white/10'
            )}
          />
        ))}
      </div>

      {/* Text feedback */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-ink-muted">
          {score === 0 && 'Very weak'}
          {score === 1 && 'Weak'}
          {score === 2 && 'Fair (min requirement)'}
          {score === 3 && 'Good'}
          {score === 4 && 'Strong'}
        </span>
        {password.length < 8 && (
          <span className="text-attr-strength font-medium">Min 8 characters</span>
        )}
      </div>

      {suggestion && (
        <p className="text-xs text-ink-muted/80 italic">{suggestion}</p>
      )}
    </div>
  );
}

PasswordMeter.propTypes = {
  password: PropTypes.string,
  onChange: PropTypes.func,
};
