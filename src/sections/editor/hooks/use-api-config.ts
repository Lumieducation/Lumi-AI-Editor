import * as React from 'react';

import { PROVIDERS, DEFAULT_PROVIDER } from '../constants';

import type { ProviderType } from '../types';

// ----------------------------------------------------------------------

export function useApiConfig() {
  // State initialization with localStorage
  const [provider, setProvider] = React.useState<ProviderType>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('api_provider') as ProviderType;
      return stored && PROVIDERS[stored] ? stored : DEFAULT_PROVIDER;
    }
    return DEFAULT_PROVIDER;
  });

  const [apiEndpoint, setApiEndpoint] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('api_endpoint') || PROVIDERS[DEFAULT_PROVIDER].endpoint;
    }
    return PROVIDERS[DEFAULT_PROVIDER].endpoint;
  });

  const [apiToken, setApiToken] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('api_token') || '';
    }
    return '';
  });

  // Persist to localStorage
  React.useEffect(() => {
    localStorage.setItem('api_provider', provider);
  }, [provider]);

  React.useEffect(() => {
    localStorage.setItem('api_endpoint', apiEndpoint);
  }, [apiEndpoint]);

  React.useEffect(() => {
    localStorage.setItem('api_token', apiToken);
  }, [apiToken]);

  // Auto-update endpoint when provider changes
  const handleProviderChange = (newProvider: ProviderType) => {
    setProvider(newProvider);
    setApiEndpoint(PROVIDERS[newProvider].endpoint);
  };

  return {
    provider,
    apiEndpoint,
    apiToken,
    setApiEndpoint,
    setApiToken,
    handleProviderChange,
  };
}
