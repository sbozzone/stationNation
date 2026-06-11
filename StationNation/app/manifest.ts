import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Station Nation',
    short_name: 'StationNation',
    description: 'Find and rate clean gas-station restrooms near you.',
    start_url: '/',
    display: 'standalone',
    background_color: '#060F24',
    theme_color: '#060F24',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
