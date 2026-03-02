import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  // server: {
  //   proxy: {
  //     "/api/v1": {
  //       // Replace this with your actual backend URL!
  //       // If your backend is local, it might be http://localhost:8000
  //       // If it's your remote server, it might be http://139.59.34.99:8000
  //       target: "http://localhost:8000",
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //   },
  // },
  build: {
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        compact: true,
      },
      plugins: [
        // Strip React Router version from bundle so Wappalyzer can't detect it from script content
        {
          name: "strip-react-router-version",
          generateBundle(_, bundle) {
            for (const file of Object.values(bundle)) {
              if (file.type === "chunk" && file.code) {
                file.code = file.code.replace(
                  /window\.__reactRouterVersion\s*=\s*["'][^"']*["']/g,
                  'window.__reactRouterVersion=""',
                );
                file.code = file.code.replace(/["']7\.13\.0["']/g, '""');
              }
            }
          },
        },
      ],
    },
  },
});
