import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Personal OS',
    short_name: 'Personal OS',
    description: 'Plan, execute, track and review your days, weeks and months.',
    start_url: '/',
    display: 'standalone',
    background_color: '#16171c',
    theme_color: '#16171c',
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
    shortcuts: [
      {
        name: 'New task',
        url: '/tasks',
      },
      {
        name: 'Today',
        url: '/today',
      },
    ],
  }
}
