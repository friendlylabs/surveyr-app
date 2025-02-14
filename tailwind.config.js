module.exports = {
  content: [
    "./www/**/*.html",
    "./src/**/*.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: ['lofi', 'dim']
  },
};