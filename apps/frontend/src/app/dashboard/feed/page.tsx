import { ActivityFeed } from '@/components/dashboard/activity-feed';

export const metadata = { title: 'Activity' };

export default function FeedPage() {
  return (
    <div>
      <h1 className="font-display mb-6 text-display-lg font-semibold tracking-tight">Activity</h1>
      <ActivityFeed />
    </div>
  );
}
