import { useMemo, useEffect } from 'react';
import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import { translations, dictionary } from '@zxcvbn-ts/language-en';
import clsx from 'clsx';

const zxcvbnValidator = new ZxcvbnFactory({
  translations,
  dictionary,
});

/**
 * Live password strength meter component.
 *
 * @param {object} props
 * @param {string} props.password - Current password string
 * @param {(result: { score: number, isValid: boolean }) => void} [props.onChange] - Callback reporting score and validity
 */
export function PasswordMeter({ password = '', onChange }) {
  const result = useMemo(() => {
    if (!password) {
      return { score: 0, feedback: { warning: null, suggestions: [] } };
    }
    return zxcvbnValidator.check(password);
  }, [password]);

  // Report back to parent form when score or password changes
  useEffect(() => {
    onChange?.({
      score: result.score,
      isValid: result.score >= 2 && password.length >= 8,
    });
  }, [result.score, password.length, onChange]);

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

      {/* Suggestion or requirement notice in sentence case */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-muted">
          {suggestion || (score >= 2 ? 'Strong password' : 'Password is too weak')}
        </span>
        <span className="text-ink-muted text-[11px]">
          {password.length < 8 ? 'Min 8 characters' : ''}
        </span>
      </div>
    </div>
  );
}
