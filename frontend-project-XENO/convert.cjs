const fs = require('fs');

const htmlContent = fs.readFileSync('c:\\Users\\sy753\\Patternprinting.c\\OneDrive\\Desktop\\demoo\\index.html', 'utf-8');

// Extract body inner content
const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/);
let bodyHtml = bodyMatch ? bodyMatch[1] : '';

// Remove script tags at the bottom
bodyHtml = bodyHtml.replace(/<script>[\s\S]*?<\/script>/gi, '');

// Convert class= to className=
bodyHtml = bodyHtml.replace(/class=/g, 'className=');

// Convert for= to htmlFor=
bodyHtml = bodyHtml.replace(/for=/g, 'htmlFor=');

// Convert style="animation-delay: -5s;" to style={{ animationDelay: '-5s' }}
// Simple regex for style attribute
bodyHtml = bodyHtml.replace(/style="([^"]+)"/g, (match, p1) => {
    const styleObj = {};
    p1.split(';').forEach(rule => {
        if (rule.trim() === '') return;
        let [key, value] = rule.split(':');
        if (key && value) {
            // Convert kebab-case to camelCase
            key = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
            styleObj[key] = value.trim();
        }
    });
    return `style={${JSON.stringify(styleObj)}}`;
});

// Close self-closing tags
const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link'];
selfClosingTags.forEach(tag => {
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
    bodyHtml = bodyHtml.replace(regex, `<${tag}$1 />`);
});

// Fix Three.js container
bodyHtml = bodyHtml.replace(/<div id="threejs-container-ANIMATION_6" style=\{.*?\}><\/div>/g, '<div id="threejs-container-ANIMATION_6" ref={threeContainerRef} className="w-full h-full"></div>');

// Replace mobile menu state logic
bodyHtml = bodyHtml.replace(/id="mobile-menu-btn"/g, 'id="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}');
bodyHtml = bodyHtml.replace(/id="mobile-menu" className="([^"]*?)hidden([^"]*?)"/g, 'id="mobile-menu" className={`$1${isMenuOpen ? "flex" : "hidden"}$2`}');


// Add the surrounding React component
const reactComponent = `import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function App() {
  const threeContainerRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Reveal animation observer
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    revealElements.forEach(el => observer.observe(el));

    // Header scroll effect
    const handleScroll = () => {
      const header = document.querySelector('header');
      if (header) {
        if (window.scrollY > 20) {
          header.classList.add('py-sm', 'shadow-md');
          header.classList.remove('py-md', 'shadow-sm');
        } else {
          header.classList.add('py-md', 'shadow-sm');
          header.classList.remove('py-sm', 'shadow-md');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!threeContainerRef.current) return;
    const container = threeContainerRef.current;
    
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x4f46e5, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const group = new THREE.Group();
    const geometry = new THREE.BoxGeometry(2, 0.1, 1.5);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      shininess: 100,
      specular: 0x4f46e5
    });

    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = (i - 2) * 0.6;
      mesh.rotation.y = Math.PI / 4;
      mesh.rotation.x = -Math.PI / 8;
      group.add(mesh);

      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x4f46e5, transparent: true, opacity: 0.3 }));
      mesh.add(line);
    }

    scene.add(group);
    camera.position.z = 5;

    let animationFrameId;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      group.rotation.y += 0.002;
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div className="bg-background text-on-background font-body-md overflow-x-hidden">
      ${bodyHtml}
    </div>
  );
}
`;

fs.writeFileSync('src/App.jsx', reactComponent);
console.log('App.jsx has been updated successfully!');
