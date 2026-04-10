export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    colors: {
      brand: { 50:'#f0f4ff',100:'#e0eaff',200:'#c7d7fe',500:'#6272f1',600:'#4a52e5',700:'#3d42ca',900:'#2d3381',950:'#1c1f4d' },
      surface: { 50:'#f8f9fc',100:'#f0f2f8',900:'#141728',950:'#0d0f1c' }
    },
    fontFamily: { display:['"Syne"','sans-serif'], body:['"DM Sans"','sans-serif'] }
  }},
  plugins: [],
};
