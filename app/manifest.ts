import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prompt Manager",
    short_name: "Prompts",
    description: "Gestión profesional de prompts para equipos cerrados",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#0057d9",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
