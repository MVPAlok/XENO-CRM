const fs = require('fs');

let appJsx = fs.readFileSync('src/App.jsx', 'utf-8');

// Replace HTML comments with JSX comments
appJsx = appJsx.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

fs.writeFileSync('src/App.jsx', appJsx);
console.log('App.jsx comments fixed!');
