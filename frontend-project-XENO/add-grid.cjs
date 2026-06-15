const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Fix comments
content = content.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

// 2. Change function name to LandingPage
content = content.replace(/export default function App\(\)/g, 'export default function LandingPage()');

// 3. Add grid pattern to hero section
// Find the exact hero section:
// <section
// className="relative min-h-[90vh] flex flex-col items-center justify-center pt-[140px] pb-xxl overflow-hidden bg-[#faf8ff]">
// We'll just replace the start of that section:
content = content.replace(
    /className="relative min-h-\[90vh\] flex flex-col items-center justify-center pt-\[140px\] pb-xxl overflow-hidden bg-\[#faf8ff\]"/g,
    'className="relative min-h-[90vh] flex flex-col items-center justify-center pt-[140px] pb-xxl overflow-hidden bg-[#faf8ff] bg-grid-pattern"'
);

fs.writeFileSync('src/LandingPage.jsx', content);
console.log('Restored LandingPage.jsx and added grid pattern successfully.');
