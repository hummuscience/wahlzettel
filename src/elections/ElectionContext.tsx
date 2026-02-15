import { createContext, useContext } from 'react';
import type { ElectionConfig } from './types';

const ElectionContext = createContext<ElectionConfig | null>(null);

export function ElectionProvider({
  config,
  children,
}: {
  config: ElectionConfig;
  children: React.ReactNode;
}) {
  return (
    <ElectionContext.Provider value={config}>
      {children}
    </ElectionContext.Provider>
  );
}

export function useElection(): ElectionConfig {
  const config = useContext(ElectionContext);
  if (!config) {
    throw new Error('useElection must be used within an ElectionProvider');
  }
  return config;
}
