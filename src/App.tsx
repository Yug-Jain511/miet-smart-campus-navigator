import { useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AppContext } from './context/AppContext';
import { useCampusData } from './hooks/useCampusData';
import { useNavigation } from './hooks/useNavigation';
import { usePosition } from './hooks/usePosition';
import { useRoute } from './hooks/useRoute';
import { AdminPage } from './pages/Admin/AdminPage';
import { ExplorePage } from './pages/Explore/ExplorePage';
import { HomePage } from './pages/Home/HomePage';
import { NavigatePage } from './pages/Navigate/NavigatePage';

function Providers() {
  const campus = useCampusData();
  // useRoute needs the live (possibly Admin-edited) graph.
  const journey = useRoute(campus.graph);
  const position = usePosition(campus.graph, campus.calibration);
  // Dataset-driven vertex names for live instructions (stable identity).
  const vertexName = useMemo(() => {
    const locNames = new Map(campus.locations.map((l) => [l.id, l.name]));
    const nodeLoc = new Map(campus.graph.nodes.map((n) => [n.id, n.locationId ?? n.id]));
    return (nodeId: string) => {
      const loc = nodeLoc.get(nodeId) ?? nodeId;
      return locNames.get(loc) ?? loc;
    };
  }, [campus.locations, campus.graph]);
  const navigation = useNavigation(campus.graph, campus.settings.offRouteMeters, vertexName);
  const value = useMemo(
    () => ({ campus, journey, position, navigation }),
    [campus, journey, position, navigation],
  );

  return (
    <AppContext.Provider value={value}>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/navigate" element={<NavigatePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </AppContext.Provider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Providers />
    </BrowserRouter>
  );
}

export default App;
