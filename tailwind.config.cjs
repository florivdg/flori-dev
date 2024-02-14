/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Mona Sans', 'sans-serif'],
        mono: ['Monaspace Neon', 'monospace'],
      },
      typography: ({ theme }) => ({
        flori: {
          css: {
            maxWidth: 'none',
            '--tw-prose-body': theme('colors.slate[600]'),
            '--tw-prose-headings': theme('colors.slate[600]'),
            '--tw-prose-lead': theme('colors.slate[600]'),
            '--tw-prose-invert-body': theme('colors.slate[200]'),
            '--tw-prose-invert-headings': theme('colors.slate[200]'),
            '--tw-prose-invert-lead': theme('colors.slate[200]'),
          },
        },
      }),
      screens: {
        xs: '425px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
}
