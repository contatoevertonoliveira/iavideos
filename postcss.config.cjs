module.exports = {
  plugins: [
    require('@tailwindcss/postcss')({
      content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './public/**/*.html',
      ],
      safelist: [
        'md:grid-cols-[256px_1fr]',
        'md:[grid-template-columns:16rem_1fr]',
      ],
    }),
    require('autoprefixer'),
  ],
}