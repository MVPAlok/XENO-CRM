import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Lenis from 'lenis';
import heroVideo from './assets/Create_a_premium_cinematic_Saa.mp4';

export default function LandingPage({ onLaunch }) {
  const threeContainerRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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


  useEffect(() => {
    // Reveal animation observer
    const revealElements = document.querySelectorAll('.reveal, .reveal-fly');
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
      
    {/*  TopNavBar  */}
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300">
        <div className="glass-nav rounded-2xl flex justify-between items-center w-full max-w-6xl px-6 py-3">
            <div className="flex items-center gap-3">
                <img alt="Xeno AI Logo" className="h-9 w-9 object-contain drop-shadow-md"
                    src="data:image/png;base64,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" />
                <span className="text-xl font-extrabold text-gray-900 tracking-tight">Xeno AI</span>
            </div>

            {/*  Modern Pill Navigation  */}
            <nav
                className="hidden md:flex items-center p-1.5 bg-white/40 border border-white/60 rounded-xl shadow-sm backdrop-blur-md">
                <a className="px-5 py-2 rounded-lg bg-white shadow-sm text-primary font-bold text-sm transition-all"
                    href="#">Product</a>
                <a className="px-5 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white/50 font-semibold text-sm transition-all"
                    href="#">Solutions</a>
                <a className="px-5 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white/50 font-semibold text-sm transition-all"
                    href="#">Enterprise</a>
                <a className="px-5 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white/50 font-semibold text-sm transition-all"
                    href="#">Pricing</a>
            </nav>

            <div className="flex items-center gap-3">
                <button onClick={onLaunch}
                    className="hidden lg:block text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors mr-2">Log
                    in</button>
                <button onClick={onLaunch}
                    className="hidden md:flex creative-btn px-6 py-2.5 rounded-xl font-bold text-sm items-center justify-center hover:scale-105 transition-all">
                    Launch AI Campaign
                </button>
                <button id="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden flex items-center justify-center p-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors bg-white/50 border border-gray-200/50 shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">menu</span>
                </button>
            </div>
        </div>

        {/*  Mobile Menu Overlay  */}
        <div id="mobile-menu" className={`fixed inset-x-0 top-[88px] bg-white/95 backdrop-blur-xl z-40 ${isMenuOpen ? "flex" : "hidden"} flex-col px-6 py-8 border-t border-gray-100 h-[calc(100vh-88px)] shadow-2xl`}>
            <nav className="flex flex-col gap-6 text-lg font-bold text-gray-900">
                <a href="#" className="hover:text-primary transition-colors flex justify-between items-center pb-4 border-b border-gray-100">Product <span className="material-symbols-outlined text-gray-400">chevron_right</span></a>
                <a href="#" className="hover:text-primary transition-colors flex justify-between items-center pb-4 border-b border-gray-100">Solutions <span className="material-symbols-outlined text-gray-400">chevron_right</span></a>
                <a href="#" className="hover:text-primary transition-colors flex justify-between items-center pb-4 border-b border-gray-100">Enterprise <span className="material-symbols-outlined text-gray-400">chevron_right</span></a>
                <a href="#" className="hover:text-primary transition-colors flex justify-between items-center pb-4 border-b border-gray-100">Pricing <span className="material-symbols-outlined text-gray-400">chevron_right</span></a>
                
                <div className="mt-4 flex flex-col gap-4">
                    <button onClick={onLaunch} className="w-full py-3.5 rounded-xl font-bold text-gray-700 bg-gray-50 border border-gray-200">Log in</button>
                    <button onClick={onLaunch} className="w-full creative-btn py-3.5 rounded-xl font-bold text-white shadow-md">Launch AI Campaign</button>
                </div>
            </nav>
        </div>
    </header>
    <main>
        {/*  Hero Section  */}
        <section
            className="relative min-h-[90vh] flex flex-col items-center justify-center pt-[140px] pb-xxl overflow-hidden bg-[#faf8ff] bg-grid-pattern">
            {/*  Organic Blobs Background  */}
            <div className="blob bg-indigo-400/40 w-[500px] h-[500px] rounded-full top-0 left-0 mix-blend-multiply"></div>
            <div className="blob bg-pink-300/40 w-[600px] h-[600px] rounded-full top-20 right-10 mix-blend-multiply"
                style={{"animationDelay":"-5s"}}></div>
            <div className="blob bg-emerald-200/40 w-[400px] h-[400px] rounded-full -bottom-20 left-1/3 mix-blend-multiply"
                style={{"animationDelay":"-10s"}}></div>

            <div className="max-w-5xl mx-auto px-lg relative z-10 w-full flex flex-col items-center text-center">
                {/*  Centered Text & CTA  */}
                <div className="relative z-20 flex flex-col items-center">
                    {/*  <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full text-sm font-semibold text-primary shadow-sm border border-white/40 mb-6 reveal floating-1">
                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                        Make Your Marketing Human Again
                    </span>  */}

                    <h1 className="text-5xl lg:text-7xl font-black mb-6 tracking-tight leading-[1.1] text-gray-900 reveal">
                        From Goals to <br />
                        <span className="hero-gradient-text">Beautiful Campaigns</span>
                    </h1>

                    <p className="text-lg lg:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed reveal"
                        style={{"transitionDelay":"100ms"}}>
                        Xeno AI brings empathy and creativity back to automation. Connect deeply with your audience
                        while the AI handles the segmentation, writing, and beautiful design.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-8 reveal justify-center"
                        style={{"transitionDelay":"200ms"}}>
                        <button onClick={onLaunch}
                            className="creative-btn px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                            Launch AI Campaign
                        </button>
                        <button
                            className="px-8 py-4 rounded-xl font-bold text-lg text-gray-700 bg-white/50 border border-gray-200 hover:bg-white/80 backdrop-blur-md transition-all shadow-sm flex items-center justify-center gap-2 hover:-translate-y-1">
                            <span className="material-symbols-outlined">play_circle</span>
                            Watch Demo
                        </button>
                    </div>

                    {/*  Mini Social Proof  */}
                    <div className="flex items-center gap-4 reveal justify-center mb-16" style={{"transitionDelay":"300ms"}}>
                        <div className="flex -space-x-3">
                            <img src="https://i.pravatar.cc/100?img=1"
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" />
                            <img src="https://i.pravatar.cc/100?img=2"
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" />
                            <img src="https://i.pravatar.cc/100?img=3"
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" />
                            <img src="https://i.pravatar.cc/100?img=4"
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" />
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                            Loved by <span className="text-gray-900 font-bold">10,000+</span> creators
                        </div>
                    </div>
                </div>

                                                {/*  Creative Visual Cluster Centered Below  */}
                <div className="relative w-full max-w-4xl flex items-center justify-center mt-4 min-h-[500px] reveal">
                    {/*  Main central video: A beautiful, creative marketing workspace  */}
                    <div className="relative z-10 w-full floating-2">
                        <div
                            className="absolute -inset-4 bg-gradient-to-tr from-primary to-pink-400 rounded-3xl blur-2xl opacity-20">
                        </div>
                        <video 
                            src={heroVideo}
                            className="w-full h-auto rounded-3xl shadow-2xl border-4 border-white/40 object-cover aspect-video"
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                        ></video>
                    </div>

                    {/*  Floating Avatar 1  */}
                    <div className="absolute top-[5%] -left-[5%] z-20 reveal-fly" style={{'--fly-x': '-300px', '--fly-y': '-200px', '--fly-rot': '-180deg', transitionDelay: '300ms'}}>
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" className="human-avatar w-20 h-20 floating-1" alt="Creative Director" />
                    </div>

                    {/*  Floating Avatar 2  */}
                    <div className="absolute bottom-[10%] -left-[2%] z-20 reveal-fly" style={{'--fly-x': '-250px', '--fly-y': '250px', '--fly-rot': '-90deg', transitionDelay: '500ms'}}>
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" className="human-avatar w-16 h-16 floating-3" alt="Marketing Lead" />
                    </div>

                    {/*  Floating Avatar 3  */}
                    <div className="absolute top-[10%] -right-[8%] z-20 reveal-fly" style={{'--fly-x': '300px', '--fly-y': '-150px', '--fly-rot': '180deg', transitionDelay: '400ms'}}>
                        <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop" className="human-avatar w-24 h-24 floating-2" style={{animationDelay: '-2s'}} alt="Content Creator" />
                    </div>

                    {/*  Glassmorphic UI Card  */}
                    <div className="absolute bottom-[5%] -right-[8%] z-30 reveal-fly" style={{'--fly-x': '300px', '--fly-y': '300px', '--fly-rot': '45deg', transitionDelay: '600ms'}}>
                        <div className="glass-card p-5 w-64 floating-1" style={{animationDelay: '-3s'}}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <span className="material-symbols-outlined">favorite</span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Campaign Emotion</p>
                                    <p className="text-sm font-black text-gray-900">Highly Engaging</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-green-400 to-emerald-500 w-[92%] h-full rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/*  AI Generation Card  */}
                    <div className="absolute top-[40%] -left-[12%] z-30 reveal-fly hidden md:block" style={{'--fly-x': '-400px', '--fly-y': '0px', '--fly-rot': '-45deg', transitionDelay: '700ms'}}>
                        <div className="glass-card p-4 w-56 floating-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                                </div>
                                <p className="text-sm font-bold text-gray-900 leading-tight">Generating assets...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        {/*  Trusted Intelligence (Stats)  */}
        <section className="py-xxl bg-surface-container-lowest border-y border-outline-variant/30">
            <div className="max-w-container-max mx-auto px-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-lg text-center">
                    <div className="reveal">
                        <div className="font-display text-headline-lg mb-xs text-primary">500M+</div>
                        <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                            Customers Analyzed</div>
                    </div>
                    <div className="reveal" style={{"transitionDelay":"100ms"}}>
                        <div className="font-display text-headline-lg mb-xs text-primary">10M+</div>
                        <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                            Campaigns Generated</div>
                    </div>
                    <div className="reveal" style={{"transitionDelay":"200ms"}}>
                        <div className="font-display text-headline-lg mb-xs text-primary">45%</div>
                        <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                            Conversion Lift</div>
                    </div>
                    <div className="reveal" style={{"transitionDelay":"300ms"}}>
                        <div className="font-display text-headline-lg mb-xs text-primary">1.2B</div>
                        <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                            Messages Delivered</div>
                    </div>
                </div>
            </div>
        </section>
        {/*  Problem vs Solution  */}
        <section className="py-xxl relative overflow-hidden">
            <div className="max-w-container-max mx-auto px-lg">
                <div className="text-center mb-16 relative z-10">
                    <h2 className="reveal text-4xl lg:text-5xl font-black mb-6 tracking-tight text-gray-900">
                        Manual Fragmentation <br className="hidden sm:block"/> <span className="text-gray-400 font-medium">vs.</span> AI Orchestration
                    </h2>
                    <p className="reveal text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Stop juggling tools. Xeno AI unifies your entire marketing stack into a single, intelligent flow that learns and adapts.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12 relative">
                    {/*  Background connector effect  */}
                    <div className="hidden md:block absolute top-1/2 left-1/2 w-32 h-1 bg-gradient-to-r from-gray-200 to-indigo-300 -translate-x-1/2 -translate-y-1/2 z-0"></div>
                    <div className="hidden md:flex absolute top-1/2 left-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full -translate-x-1/2 -translate-y-1/2 z-10 items-center justify-center text-gray-400 shadow-sm">
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </div>

                    {/*  Manual Workflow  */}
                    <div className="reveal p-8 rounded-[2rem] border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-red-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shadow-sm">
                                <span className="material-symbols-outlined">block</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-800 tracking-tight">Legacy Workflow</span>
                        </div>
                        <ul className="space-y-4 relative z-10">
                            <li className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group/item hover:bg-white hover:shadow-sm transition-all duration-300">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">01</span>
                                <span className="text-gray-600 font-medium pt-1">Manual SQL queries for audience exports</span>
                            </li>
                            <li className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group/item hover:bg-white hover:shadow-sm transition-all duration-300">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">02</span>
                                <span className="text-gray-600 font-medium pt-1">Weeks spent on creative design iterations</span>
                            </li>
                            <li className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group/item hover:bg-white hover:shadow-sm transition-all duration-300">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">03</span>
                                <span className="text-gray-600 font-medium pt-1">Static A/B tests that take months to yield data</span>
                            </li>
                            <li className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group/item hover:bg-white hover:shadow-sm transition-all duration-300">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">04</span>
                                <span className="text-gray-600 font-medium pt-1">Reactive reporting with lagging indicators</span>
                            </li>
                        </ul>
                    </div>

                    {/*  Xeno AI Workflow  */}
                    <div className="reveal p-8 rounded-[2rem] border border-indigo-100 bg-white shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                        {/*  Iridescent glow  */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50 opacity-80"></div>
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-primary to-pink-400 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-opacity duration-500"></div>
                        
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-pink-500 text-white flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-sm" style={{"fontVariationSettings":"'FILL' 1"}}>auto_awesome</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-900 tracking-tight">Xeno AI Strategy</span>
                        </div>
                        <ul className="space-y-4 relative z-10">
                            <li className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-indigo-50 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-default">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-primary">01</span>
                                <span className="text-gray-800 font-semibold pt-1">Instant AI segment discovery from raw CRM data</span>
                            </li>
                            <li className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-indigo-50 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-default">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-primary">02</span>
                                <span className="text-gray-800 font-semibold pt-1">Generative multi-variant creative in minutes</span>
                            </li>
                            <li className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-indigo-50 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-default">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-primary">03</span>
                                <span className="text-gray-800 font-semibold pt-1">Dynamic, real-time optimization for every user</span>
                            </li>
                            <li className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-indigo-50 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-default">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-primary">04</span>
                                <span className="text-gray-800 font-semibold pt-1">Predictive forecasting and automated scaling</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
        {/*  AI Marketing Strategist Conversational UI  */}
        <section className="py-xxl bg-surface-container">
            <div className="max-w-container-max mx-auto px-lg">
                <div className="grid lg:grid-cols-2 gap-xxl items-center">
                    <div className="reveal pr-0 lg:pr-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full text-xs font-bold text-primary mb-6 border border-indigo-100 shadow-sm">
                            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                            AI Agent Always On
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black mb-6 tracking-tight text-gray-900 leading-tight">Your Strategist, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">Always On.</span></h2>
                        <p className="text-lg text-gray-600 mb-10 leading-relaxed">Interact with Xeno AI like you would a senior growth engineer. State your high-level goal, and watch as it builds the entire execution plan effortlessly.</p>
                        <div className="space-y-8">
                            <div className="flex gap-5 items-start group">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                                    <span className="material-symbols-outlined text-[28px]">psychology</span>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-1.5 group-hover:text-primary transition-colors">Cross-Platform Sync</h4>
                                    <p className="text-gray-600 leading-relaxed">Deploy across Email, SMS, Social, and Web from one single instruction.</p>
                                </div>
                            </div>
                            <div className="flex gap-5 items-start group">
                                <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500 shrink-0 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white transition-all duration-300 shadow-sm">
                                    <span className="material-symbols-outlined text-[28px]">data_exploration</span>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-1.5 group-hover:text-pink-500 transition-colors">Behavioral Triggers</h4>
                                    <p className="text-gray-600 leading-relaxed">Campaigns activate exactly when intent is highest based on real-time signals.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="reveal bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-white/40 shadow-2xl relative overflow-hidden group">
                        {/*  subtle glow behind the window  */}
                        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary rounded-full blur-[80px] opacity-10"></div>
                        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-pink-400 rounded-full blur-[80px] opacity-10"></div>

                        {/*  header  */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1.5 mr-4">
                                    <div className="w-3.5 h-3.5 rounded-full bg-red-400 border border-red-500/20 shadow-sm"></div>
                                    <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-500/20 shadow-sm"></div>
                                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-emerald-500/20 shadow-sm"></div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">AI Agent Active</span>
                                </div>
                            </div>
                            <span className="text-xs font-mono font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">v4.0.2-prod</span>
                        </div>
                        
                        {/*  messages  */}
                        <div className="space-y-6 relative z-10">
                            {/*  user msg  */}
                            <div className="flex justify-end">
                                <div className="bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl rounded-tr-sm text-gray-700 max-w-[85%] text-[15px] font-medium shadow-sm">
                                    "Bring back customers who haven't purchased in 60 days."
                                </div>
                            </div>
                            
                            {/*  AI msg  */}
                            <div className="flex justify-start">
                                <div className="bg-gradient-to-br from-indigo-50/80 to-white border border-indigo-100 px-6 py-6 rounded-3xl rounded-tl-sm max-w-[95%] shadow-md relative overflow-hidden group-hover:shadow-xl transition-all duration-500">
                                    {/*  top shine  */}
                                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent opacity-50"></div>
                                    
                                    <div className="flex items-center gap-3 text-primary mb-5">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white shadow-sm">
                                            <span className="material-symbols-outlined text-[16px]" style={{"fontVariationSettings":"'FILL' 1"}}>auto_awesome</span>
                                        </div>
                                        <span className="font-bold text-lg tracking-tight text-gray-900">Strategy Generated</span>
                                    </div>
                                    <div className="space-y-3.5 text-[15px] text-gray-600">
                                        <p className="flex items-start gap-2"><span className="font-bold text-gray-900 min-w-[80px]">Audience:</span> <span>Churned-high-value segment (12.4k users).</span></p>
                                        <p className="flex items-start gap-2"><span className="font-bold text-gray-900 min-w-[80px]">Channel:</span> <span>SMS Primary (10am) + Email Follow-up (4pm).</span></p>
                                        <p className="flex items-start gap-2"><span className="font-bold text-gray-900 min-w-[80px]">Creative:</span> <span>Personalized "We Miss You" with 15% dynamic credit.</span></p>
                                        <div className="p-4 bg-white rounded-xl border border-emerald-100 mt-4 shadow-sm">
                                            <p className="flex items-center gap-2 text-emerald-600 font-bold">
                                                <span className="material-symbols-outlined text-[20px]">trending_up</span>
                                                Target Impact: $142,000 reclaimed revenue in 14 days.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-5 border-t border-gray-100/80 flex flex-wrap gap-3">
                                        <button className="creative-btn px-5 py-2.5 rounded-xl text-[15px] font-bold flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                            Execute Plan
                                            <span className="material-symbols-outlined text-[18px]">send</span>
                                        </button>
                                        <button className="bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 px-5 py-2.5 rounded-xl text-[15px] font-bold text-gray-600 transition-all shadow-sm flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">tune</span>
                                            Refine
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        {/*  Core Workflow Interactive  */}
        <section className="py-24 bg-[#faf8ff] relative overflow-hidden">
            {/*  Background decorations  */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
            <div className="absolute -top-[20%] -right-[10%] w-[700px] h-[700px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-5xl mx-auto px-lg relative z-10">
                <div className="text-center mb-20">
                    <h2 className="reveal text-4xl lg:text-5xl font-black mb-6 tracking-tight text-gray-900">
                        Seamless Flow, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">Massive Impact</span>
                    </h2>
                    <p className="reveal text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        The lifecycle of an AI-driven campaign, simplified into six powerful stages.
                    </p>
                </div>

                <div className="relative pl-4 md:pl-0">
                    {/*  Vertical Line  */}
                    <div className="absolute left-8 md:left-[50px] top-4 bottom-4 w-1 bg-gradient-to-b from-primary/10 via-primary/30 to-pink-400/10 rounded-full"></div>

                    <div className="space-y-10">
                        {/*  Step 1  */}
                        <div className="relative flex items-start gap-8 md:gap-12 group reveal">
                            <div className="absolute left-8 md:left-[50px] -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-primary shadow-md z-10 top-10 group-hover:scale-150 transition-transform duration-300"></div>
                            
                            <div className="w-16 md:w-24 shrink-0 flex justify-end opacity-0 md:opacity-100 hidden md:block">
                                {/*  desktop spacing  */}
                            </div>
                            
                            <div className="flex-1 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 ml-12 md:ml-0 flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-primary shrink-0 shadow-sm">
                                    <span className="material-symbols-outlined text-[32px]">database</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">1. Data Ingestion</h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">Seamlessly connect and ingest raw event data from all your existing platforms, analytics tools, and CRM systems.</p>
                                </div>
                            </div>
                        </div>

                        {/*  Step 2  */}
                        <div className="relative flex items-start gap-8 md:gap-12 group reveal" style={{"transitionDelay":"100ms"}}>
                            <div className="absolute left-8 md:left-[50px] -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-pink-400 shadow-md z-10 top-10 group-hover:scale-150 transition-transform duration-300"></div>
                            
                            <div className="w-16 md:w-24 shrink-0 flex justify-end opacity-0 md:opacity-100 hidden md:block"></div>
                            
                            <div className="flex-1 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 ml-12 md:ml-0 flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500 shrink-0 shadow-sm">
                                    <span className="material-symbols-outlined text-[32px]">target</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">2. Define Goals</h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">Set desired KPIs, target ROAS, or specific conversion metrics. The AI optimizes everything toward these exact targets.</p>
                                </div>
                            </div>
                        </div>

                        {/*  Step 3  */}
                        <div className="relative flex items-start gap-8 md:gap-12 group reveal" style={{"transitionDelay":"200ms"}}>
                            <div className="absolute left-8 md:left-[50px] -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-emerald-400 shadow-md z-10 top-10 group-hover:scale-150 transition-transform duration-300"></div>
                            
                            <div className="w-16 md:w-24 shrink-0 flex justify-end opacity-0 md:opacity-100 hidden md:block"></div>
                            
                            <div className="flex-1 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 ml-12 md:ml-0 flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
                                    <span className="material-symbols-outlined text-[32px]">groups</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">3. Audience Discovery</h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">Xeno AI analyzes behavior patterns to automatically discover and segment high-intent audiences.</p>
                                </div>
                            </div>
                        </div>

                        {/*  Step 4  */}
                        <div className="relative flex items-start gap-8 md:gap-12 group reveal" style={{"transitionDelay":"300ms"}}>
                            <div className="absolute left-8 md:left-[50px] -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-amber-400 shadow-md z-10 top-10 group-hover:scale-150 transition-transform duration-300"></div>
                            
                            <div className="w-16 md:w-24 shrink-0 flex justify-end opacity-0 md:opacity-100 hidden md:block"></div>
                            
                            <div className="flex-1 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 ml-12 md:ml-0 flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                                    <span className="material-symbols-outlined text-[32px]">draw</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">4. Dynamic Content</h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">The generative creative engine produces highly personalized, multi-variant messaging tailored for every individual user.</p>
                                </div>
                            </div>
                        </div>

                        {/*  Step 5  */}
                        <div className="relative flex items-start gap-8 md:gap-12 group reveal" style={{"transitionDelay":"400ms"}}>
                            <div className="absolute left-8 md:left-[50px] -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-blue-400 shadow-md z-10 top-10 group-hover:scale-150 transition-transform duration-300"></div>
                            
                            <div className="w-16 md:w-24 shrink-0 flex justify-end opacity-0 md:opacity-100 hidden md:block"></div>
                            
                            <div className="flex-1 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 ml-12 md:ml-0 flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 shadow-sm">
                                    <span className="material-symbols-outlined text-[32px]">rocket_launch</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">5. Instant Deployment</h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">Launch multi-channel campaigns across email, SMS, and ad networks instantly with a single click.</p>
                                </div>
                            </div>
                        </div>

                        {/*  Step 6  */}
                        <div className="relative flex items-start gap-8 md:gap-12 group reveal" style={{"transitionDelay":"500ms"}}>
                            <div className="absolute left-8 md:left-[50px] -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-purple-400 shadow-md z-10 top-10 group-hover:scale-150 transition-transform duration-300"></div>
                            
                            <div className="w-16 md:w-24 shrink-0 flex justify-end opacity-0 md:opacity-100 hidden md:block"></div>
                            
                            <div className="flex-1 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 ml-12 md:ml-0 flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0 shadow-sm">
                                    <span className="material-symbols-outlined text-[32px]">analytics</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">6. Closed-Loop Analytics</h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">Monitor real-time performance and watch as the AI automatically scales the highest converting paths.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
        {/*  Features Grid  */}
        <section className="py-xxl bg-surface-container-lowest">
            <div className="max-w-container-max mx-auto px-lg">
                <div className="grid md:grid-cols-2 gap-lg">
                    <div
                        className="reveal group relative overflow-hidden rounded-3xl border border-outline-variant/50 p-xl hover:shadow-2xl transition-all duration-500 h-[450px] flex flex-col">
                        <img alt="AI Audience Discovery"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-20"
                            data-alt="A sophisticated abstract visualization of a neural network mapping human profiles. Floating blue and purple nodes connect via thin glowing lines, forming an intelligent web over a white background. The style is clean, high-tech, and clinical, representing AI Audience Discovery and behavioral mapping."
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbKz4SrdIUGjYp9NMQS3qGV3A3HrNilOG_dDHD64sqMIofc2fcxtKPHpCzWEnrkszZ5HxShV6l-XfuKhkk6LNbMkZ5RDgot_E1P9W_pWlphSxr9ClqS9DQ-V2rLDZrArgLf6jlK1ipvEiIkYJj_AV8-AqImObT9wp0yEZ2ur66NwbL3sjGU6ihijJhHh5JCr2FZBKnTKCJWJAm0SsHo5y727Rs_j0YzEA39oIykbMxp4_krr3msaiVH9OzuJnLgdj-lFyVbX8qmKLz" />
                        <div className="relative z-10 mt-auto">
                            <span className="material-symbols-outlined text-primary text-4xl mb-md">person_search</span>
                            <h3 className="font-headline-lg text-headline-lg mb-sm">AI Audience Discovery</h3>
                            <p className="text-on-surface-variant max-w-sm">Automatically identify latent high-value
                                customer segments before they churn.</p>
                        </div>
                    </div>
                    <div
                        className="reveal group relative overflow-hidden rounded-3xl border border-outline-variant/50 p-xl hover:shadow-2xl transition-all duration-500 h-[450px] flex flex-col">
                        <img alt="AI Campaign Generation"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-20"
                            data-alt="An intricate 3D flowchart representing automated campaign generation. Cuboid elements, gear icons, and speech bubbles are arranged in an elegant upward-climbing sequence. Accents of gold and teal highlight the intelligent workflow, set against a pristine, well-lit white studio background."
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyUEO7871uyphtWpUf_1R3tNNWfAMOes4VKy3UNhXZvA9seZKYf_NN4zkveI2xmXhYhd-1DmNg4VMsPridt2JHCxnotYNAmb4IH9j3yInO_JsXqqMmkx9IpzSuJbsEcW3wqIPpVihksNhmA9IYO34HZoPUUWubvsUGNz1Z9zVx48dCTbUyxdnUeir0BgEa4k6tm9rcBnnTlRtGXvMbBQyHqO0s9A4HFGxYv90LQLZOoPFMsyxIQ25Ps2R9m2STqSeXEWckGECLd4Rq" />
                        <div className="relative z-10 mt-auto">
                            <span className="material-symbols-outlined text-primary text-4xl mb-md">auto_mode</span>
                            <h3 className="font-headline-lg text-headline-lg mb-sm">Automated Campaign Generation</h3>
                            <p className="text-on-surface-variant max-w-sm">From email copy to visual assets, Xeno produces
                                1,000s of variants optimized for conversion.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        {/*  Analytics Preview  */}
        <section className="py-xxl">
            <div className="max-w-container-max mx-auto px-lg">
                <div className="flex flex-col lg:flex-row items-center gap-xxl">
                    <div className="reveal lg:w-1/3">
                        <h2 className="font-headline-lg text-headline-lg mb-md">Analytics Built for Impact</h2>
                        <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg">Ditch the vanity metrics. Our
                            dashboard focuses on incremental revenue, attribution clarity, and ROI forecasting.</p>
                        <div className="space-y-md">
                            <div className="flex items-center gap-sm font-medium text-on-surface">
                                <span className="material-symbols-outlined text-primary">monitoring</span>
                                Real-time conversion tracking
                            </div>
                            <div className="flex items-center gap-sm font-medium text-on-surface">
                                <span className="material-symbols-outlined text-primary">compare_arrows</span>
                                Multi-touch attribution
                            </div>
                            <div className="flex items-center gap-sm font-medium text-on-surface">
                                <span className="material-symbols-outlined text-primary">precision_manufacturing</span>
                                Predictive churn analysis
                            </div>
                        </div>
                    </div>
                    <div className="reveal lg:w-2/3">
                        <div
                            className="bg-white rounded-3xl shadow-2xl border border-outline-variant/50 p-sm overflow-hidden transform lg:rotate-2 hover:rotate-0 transition-all duration-500">
                            <img alt="Analytics Dashboard Mockup" className="w-full h-auto rounded-2xl"
                                data-alt="A premium SaaS dashboard interface displaying marketing performance metrics. A clean line chart shows Revenue Over Time trending upwards. Cards on the right show Conversion Rate at 4.5 percent, Total Revenue of 250 thousand dollars, and Ad Spend. A donut chart illustrates channel attribution across Facebook, Google, and Twitter. The UI is minimalist, using a soft blue and green color palette on a white background."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaubz-dA0w-lEabCuM5cERocsl6MZC7z9X69fxgUZCXJblINTmtSABQjuKLG83j0zsMLPSOVntHIF_Q8hUuE1RoqlrG3Vy4tn02KrBeMooFn2ql63dpS3UOTR-YeTWHNy2nPa-mfZxpLAUdR1MZaC2brjUEna2sRSCk1p6nHMi7d6kybkLBWPzfZdPm4NlzkZPwDRKJldMI2kPQa9gRXvM8aw-RrTihNl9iblJHyRkInu-InzfsUh1H-HLSB2Pt4ZdFNO404UbLkG1" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
        {/*  Enterprise Architecture  */}
        <section className="py-xxl bg-on-tertiary-fixed text-on-tertiary relative overflow-hidden">
            {/*  STITCH_THREEJS_START:ANIMATION_6 className="absolute inset-0 w-full h-full opacity-30"  */}
            <div className="absolute inset-0 w-full h-full opacity-30" style={{"display":"block"}}>
                <script src="https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js"></script>
                <div id="threejs-container-ANIMATION_6" ref={threeContainerRef} className="w-full h-full"></div>
                
            </div>
            {/*  STITCH_THREEJS_END:ANIMATION_6  */}
            <div className="max-w-container-max mx-auto px-lg relative z-10 text-center">
                <h2 className="reveal font-headline-lg text-headline-lg mb-md">Enterprise-Grade Architecture</h2>
                <p className="reveal font-body-lg text-body-lg text-on-tertiary/60 max-w-2xl mx-auto mb-xxl">Built to handle
                    billions of data points with sub-millisecond processing. Secure, scalable, and seamless.</p>
                <div className="grid md:grid-cols-3 gap-lg">
                    <div className="reveal p-lg bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                        <div
                            className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary mb-md mx-auto">
                            <span className="material-symbols-outlined">security</span>
                        </div>
                        <h4 className="font-headline-sm text-headline-sm mb-sm">Privacy First</h4>
                        <p className="text-on-tertiary/60 text-body-md">SOC2 Type II compliant with built-in PII redaction
                            and GDPR governance.</p>
                    </div>
                    <div className="reveal p-lg bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md"
                        style={{"transitionDelay":"100ms"}}>
                        <div
                            className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary mb-md mx-auto">
                            <span className="material-symbols-outlined">api</span>
                        </div>
                        <h4 className="font-headline-sm text-headline-sm mb-sm">Universal Connector</h4>
                        <p className="text-on-tertiary/60 text-body-md">Seamlessly integrate with Salesforce, Snowflake,
                            Segment, and 200+ more.</p>
                    </div>
                    <div className="reveal p-lg bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md"
                        style={{"transitionDelay":"200ms"}}>
                        <div
                            className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary mb-md mx-auto">
                            <span className="material-symbols-outlined">speed</span>
                        </div>
                        <h4 className="font-headline-sm text-headline-sm mb-sm">Ultra-Low Latency</h4>
                        <p className="text-on-tertiary/60 text-body-md">Process behavioral signals and trigger campaigns in
                            less than 200ms.</p>
                    </div>
                </div>
            </div>
        </section>
        {/*  Testimonials  */}
        <section className="py-xxl">
            <div className="max-w-container-max mx-auto px-lg">
                <div className="text-center mb-xxl">
                    <h2 className="reveal font-headline-lg text-headline-lg mb-md">Trusted by Market Leaders</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-lg">
                    <div className="reveal p-lg bg-white border border-outline-variant/30 rounded-2xl shadow-sm">
                        <div className="flex gap-xs text-primary mb-md">
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                        </div>
                        <p className="font-body-md text-on-surface-variant mb-lg italic">"Xeno AI didn't just automate our
                            work; it reimagined it. We're running 10x the campaigns with half the team effort."</p>
                        <div className="flex items-center gap-md">
                            <div className="w-10 h-10 rounded-full bg-surface-container"></div>
                            <div>
                                <h5 className="font-medium text-on-surface">Sarah Jenkins</h5>
                                <p className="text-label-md text-outline uppercase tracking-wider">VP of Growth, TechNova
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="reveal p-lg bg-white border border-outline-variant/30 rounded-2xl shadow-sm"
                        style={{"transitionDelay":"100ms"}}>
                        <div className="flex gap-xs text-primary mb-md">
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                        </div>
                        <p className="font-body-md text-on-surface-variant mb-lg italic">"The attribution clarity is
                            game-changing. We finally know exactly which AI-generated variant is driving our enterprise
                            sales."</p>
                        <div className="flex items-center gap-md">
                            <div className="w-10 h-10 rounded-full bg-surface-container"></div>
                            <div>
                                <h5 className="font-medium text-on-surface">Mark Thompson</h5>
                                <p className="text-label-md text-outline uppercase tracking-wider">CMO, Global Retail Group
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="reveal p-lg bg-white border border-outline-variant/30 rounded-2xl shadow-sm"
                        style={{"transitionDelay":"200ms"}}>
                        <div className="flex gap-xs text-primary mb-md">
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                            <span className="material-symbols-outlined"
                                style={{"fontVariationSettings":"'FILL' 1"}}>star</span>
                        </div>
                        <p className="font-body-md text-on-surface-variant mb-lg italic">"Deploying Xeno AI felt like hiring
                            a 100-person agency overnight. The speed of execution is simply unmatched."</p>
                        <div className="flex items-center gap-md">
                            <div className="w-10 h-10 rounded-full bg-surface-container"></div>
                            <div>
                                <h5 className="font-medium text-on-surface">Elena Rodriguez</h5>
                                <p className="text-label-md text-outline uppercase tracking-wider">Director of AI, SaaSify
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        {/*  Final CTA  */}
        <section className="py-xxl relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5"></div>
            <div className="max-w-container-max mx-auto px-lg relative z-10">
                <div
                    className="bg-on-tertiary-fixed rounded-[40px] p-xxl text-center text-on-tertiary overflow-hidden relative">
                    <div
                        className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent">
                    </div>
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="reveal font-display text-display mb-lg">Let AI Run Smarter Campaigns</h2>
                        <p className="reveal font-body-lg text-body-lg text-on-tertiary/70 mb-xl">Join the world's most
                            innovative marketing teams and start scaling with precision today.</p>
                        <div className="reveal flex flex-col sm:flex-row gap-md justify-center">
                            <button onClick={onLaunch}
                                className="bg-primary text-on-primary px-xxl py-md rounded-xl font-headline-sm text-headline-sm hover:scale-105 transition-all">Launch
                                AI Campaign</button>
                            <button
                                className="bg-white/10 border border-white/20 text-on-tertiary px-xxl py-md rounded-xl font-headline-sm text-headline-sm hover:bg-white/20 transition-all">Schedule
                                Demo</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>
    {/*  Footer  */}
    <footer className="bg-surface-container-lowest dark:bg-on-tertiary-fixed border-t border-outline-variant/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter w-full px-lg py-xxl max-w-container-max mx-auto">
            <div className="md:col-span-1">
                <div className="flex items-center gap-sm mb-lg">
                    <img alt="Xeno AI Logo" className="h-8 w-8 object-contain"
                        src="data:image/png;base64,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" />
                    <span
                        className="font-headline-sm text-headline-sm font-black text-on-surface dark:text-on-primary-container">Xeno
                        AI</span>
                </div>
                <p className="font-body-md text-on-surface-variant dark:text-surface-dim mb-lg">Precision engineered for
                    high-growth marketing teams.</p>
            </div>
            <div>
                <h5 className="font-label-md text-label-md font-bold uppercase tracking-widest mb-lg text-on-surface">
                    Platform</h5>
                <ul className="space-y-md">
                    <li><a className="font-label-md text-label-md text-on-surface-variant dark:text-surface-dim hover:text-primary transition-colors"
                            href="#">Campaign Engine</a></li>
                    <li><a className="font-label-md text-label-md text-on-surface-variant dark:text-surface-dim hover:text-primary transition-colors"
                            href="#">Audience Discovery</a></li>
                    <li><a className="font-label-md text-label-md text-on-surface-variant dark:text-surface-dim hover:text-primary transition-colors"
                            href="#">Creative Lab</a></li>
                </ul>
            </div>
            <div>
                <h5 className="font-label-md text-label-md font-bold uppercase tracking-widest mb-lg text-on-surface">
                    Resources</h5>
                <ul className="space-y-md">
                    <li><a className="font-label-md text-label-md text-on-surface-variant dark:text-surface-dim hover:text-primary transition-colors"
                            href="#">Documentation</a></li>
                    <li><a className="font-label-md text-label-md text-on-surface-variant dark:text-surface-dim hover:text-primary transition-colors"
                            href="#">API Reference</a></li>
                    <li><a className="font-label-md text-label-md text-on-surface-variant dark:text-surface-dim hover:text-primary transition-colors"
                            href="#">AI Best Practices</a></li>
                </ul>
            </div>
            <div>
                <h5 className="font-label-md text-label-md font-bold uppercase tracking-widest mb-lg text-on-surface">Legal
                </h5>
                <ul className="space-y-md">
                    <li><a className="font-label-md text-label-md text-on-surface-variant dark:text-surface-dim hover:text-primary transition-colors"
                            href="#">Privacy Policy</a></li>
                    <li><a className="font-label-md text-label-md text-on-surface-variant dark:text-surface-dim hover:text-primary transition-colors"
                            href="#">Terms of Service</a></li>
                    <li><a className="font-label-md text-label-md text-on-surface-variant dark:text-surface-dim hover:text-primary transition-colors"
                            href="#">Security</a></li>
                </ul>
            </div>
        </div>
        <div
            className="max-w-container-max mx-auto px-lg py-lg border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-md">
            <span
                className="font-label-md text-label-md text-on-surface-variant dark:text-surface-dim opacity-80 hover:opacity-100 transition-opacity">©
                2024 Xeno AI Marketing. All rights reserved. Precision engineered for growth.</span>
            <div className="flex gap-md">
                <a className="text-on-surface-variant hover:text-primary" href="#"><span
                        className="material-symbols-outlined">public</span></a>
                <a className="text-on-surface-variant hover:text-primary" href="#"><span
                        className="material-symbols-outlined">hub</span></a>
            </div>
        </div>
    </footer>
    

    </div>
  );
}
