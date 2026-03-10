import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
    plugins: [svelte()],
    resolve: {
        alias: {
            $lib: path.resolve('./src/lib'),
            $data: path.resolve('./src/data'),
            $styles: path.resolve('./src/styles'),
        },
    },
    server: {
        port: 5173,
    },
});
