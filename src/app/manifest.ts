import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Personal OS",
    short_name: "Personal OS",
    description: "Plan, execute, track and review your days, weeks and months.",
    start_url: "/",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#121212",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Tasks",
        url: "/tasks",
      },
      {
        name: "Today",
        url: "/today",
      },
    ],
  };
}
