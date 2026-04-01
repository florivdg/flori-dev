# flori.dev

Source code for [flori.dev](https://flori.dev) — a personal website and blog built with Astro, Vue, and Tailwind CSS. Deployed as a static site on Netlify.

## Tech Stack

- [Astro](https://astro.build/) v6 — static site generator
- [Vue 3](https://vuejs.org/) — interactive components (charts, gallery overlays)
- [TypeScript](https://www.typescriptlang.org/) — strict mode
- [Tailwind CSS](https://tailwindcss.com/) v4 — styling via Vite plugin
- [MDX](https://mdxjs.com/) — blog content with expressive code blocks
- [Bun](https://bun.sh/) — package manager and script runner

## Features

- **Reads** — Technical blog with 28+ MDX articles, tag filtering, and syntax-highlighted code blocks
- **Photo Grid** — Gallery with AI-generated metadata (titles, alt text, location, tags) and EXIF data
- **Browser Stats** — Live dashboard with Server-Sent Events and Vue-based charts
- **Uses** — Equipment and tools page
- Homepage with bio, skills, and social links

## Project Structure

```
src/
  content/
    reads/          # MDX blog articles
    grid/           # Photos (.jpg) with metadata (.json)
  content.config.ts
  components/
    grid/           # Gallery components (Vue)
    reads/          # Blog components
    stats/          # Browser stats dashboard (Vue)
  layouts/
    Basic.astro     # HTML shell, fonts, analytics
    Layout.astro    # Header + Footer wrapper
  pages/
  plugins/          # Custom remark plugins
  styles/           # Tailwind config and global styles
  utils/
scripts/
  grid-vision.ts    # AI photo metadata generator
```

## Getting Started

```sh
bun install
bun run dev
```

The dev server starts at `http://localhost:4321`.

## Commands

| Command                | Description                                     |
| :--------------------- | :---------------------------------------------- |
| `bun run dev`          | Start the development server                    |
| `bun run build`        | Build the production site to `./dist/`          |
| `bun run preview`      | Preview the production build locally            |
| `bun run grid:prepare` | Generate AI metadata for new photos (see below) |

## Photo Metadata Generation

The `grid:prepare` script processes new photos in `src/content/grid/`. It extracts EXIF data and uses OpenAI Vision to generate titles, descriptions, tags, and location info.

Requirements:

- `OPENAI_API_KEY` environment variable
- `exiftool` installed (`brew install exiftool`)

Drop a `.jpg` into `src/content/grid/` and run `bun run grid:prepare`. The script creates a matching `.json` metadata file for each photo that lacks one.

## Deployment

Hosted on [Netlify](https://www.netlify.com/) as a static site. Configuration is in `netlify.toml`:

- Build command: `bun run build`
- Publish directory: `dist/`
