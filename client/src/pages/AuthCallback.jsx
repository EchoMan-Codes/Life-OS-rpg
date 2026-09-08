import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { refreshToken } from '@/features/auth/api';
import { setAccessToken } from '@/lib/axios';
import { ME_QUERY_KEY } from '@/features/auth/hooks';
import { Card } from '@/components/ui';

/**
 * OAuth Callback Landing Page.
 * Handles the redirect from Google OAuth.
 * Exchanges the HttpOnly refresh cookie for the in-memory access token.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function completeAuth() {
      try {
        const data = await refreshToken();
        setAccessToken(data.accessToken);
        queryClient.setQueryData(ME_QUERY_KEY, data.user);
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Failed to complete OAuth sign-in:', err);
        setErrorMsg('Authentication failed or session expired. Redirecting to home...');
        setTimeout(() => navigate('/', { replace: true }), 3000);
      }
    }

    completeAuth();
  }, [navigate, queryClient]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card variant="hud" className="p-8 max-w-md w-full text-center space-y-4">
        {!errorMsg ? (
          <>
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-attr-perception" />
            <h2 className="text-display-sm text-ink">Completing Authentication</h2>
            <p className="text-body-sm text-ink-muted">
              Establishing your secure session with Life OS...
            </p>
          </>
        ) : (
          <>
            <h2 className="text-display-sm text-attr-strength">Authentication Error</h2>
            <p className="text-body-sm text-ink-muted">{errorMsg}</p>
          </>
        )}
      </Card>
    </div>
  );
}
