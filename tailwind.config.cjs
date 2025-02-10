/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
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
    },
  },
}
