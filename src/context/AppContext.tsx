import { createContext, useContext } from 'react';
import type { CampusData } from '../hooks/useCampusData';
import type { NavigationState } from '../hooks/useNavigation';
import type { PositionState } from '../hooks/usePosition';
import type { RouteState } from '../hooks/useRoute';

export type AppState = {
  campus: CampusData;
  journey: RouteState;
  position: PositionState;
  navigation: NavigationState;
};

export const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppContext.Provider>');
  return ctx;
}
