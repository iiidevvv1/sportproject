import { createBrowserRouter } from 'react-router';
import Dashboard from './pages/Dashboard';
import NewGame from './pages/NewGame';
import InGame from './pages/InGame';
import Stats from './pages/Stats';

export const router = createBrowserRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/games/new', element: <NewGame /> },
  { path: '/games/:id/play', element: <InGame /> },
  { path: '/games/:id/stats', element: <Stats /> },
]);
