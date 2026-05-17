// lib/pusher.ts
import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance (used in API routes)
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher instance (used in React components)
// We export a singleton function to prevent multiple connections
export const getPusherClient = () => {
  if (!window.pusherClientInstance) {
    window.pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      }
    );
  }
  return window.pusherClientInstance;
};

// Add to global window object for TypeScript
declare global {
  interface Window {
    pusherClientInstance?: PusherClient;
  }
}