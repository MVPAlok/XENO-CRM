const fs = require('fs');

let jsx = fs.readFileSync('src/LandingPage.jsx', 'utf-8');

if (!jsx.includes("import Lenis from 'lenis'")) {
    jsx = jsx.replace("import * as THREE from 'three';", "import * as THREE from 'three';\nimport Lenis from 'lenis';");
}

const lenisEffect = `
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    
    return () => {
      lenis.destroy();
    }
  }, []);
`;

if (!jsx.includes('const lenis = new Lenis(')) {
    jsx = jsx.replace('const [isMenuOpen, setIsMenuOpen] = useState(false);', 'const [isMenuOpen, setIsMenuOpen] = useState(false);\n' + lenisEffect);
}

fs.writeFileSync('src/LandingPage.jsx', jsx);
console.log('Lenis integration added.');
