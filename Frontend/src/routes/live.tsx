import { createFileRoute } from '@tanstack/react-router';
import LiveDashboard from '../components/live-dashboard';

export const Route = createFileRoute('/live')({
  component: LiveDashboard,
});
