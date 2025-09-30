const path = require('path');

module.exports = {
  content: [
    path.join(__dirname, './pages/**/*.{js,ts,jsx,tsx}'),
    path.join(__dirname, './components/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        // You can add custom colors here
      },
      fontFamily: {
        // You can add custom fonts here
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  // If you want to use CSS variables for dynamic color changes, you can configure them here
  // corePlugins: {
  //   textColor: false,
  //   backgroundColor: false,
  //   borderColor: false,
  // },
  // theme: {
  //   extend: {
  //     textColor: {
  //       skin: {
  //         base: 'var(--color-text-base)',
  //         muted: 'var(--color-text-muted)',
  //         inverted: 'var(--color-text-inverted)',
  //       },
  //     },
  //     backgroundColor: {
  //       skin: {
  //         fill: 'var(--color-fill)',
  //         'button-accent': 'var(--color-button-accent)',
  //         'button-accent-hover': 'var(--color-button-accent-hover)',
  //       },
  //     },
  //     borderColor: {
  //       skin: {
  //         base: 'var(--color-border)',
  //       },
  //     },
  //   },
  // },
};