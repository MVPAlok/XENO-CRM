const fs = require('fs');

// 1. Update index.css
let css = fs.readFileSync('src/index.css', 'utf-8');

if (!css.includes('.reveal-fly')) {
    css = css.replace('.human-avatar {', `.reveal-fly {
    opacity: 0;
    transform: scale(0.2) translate(var(--fly-x, 0), var(--fly-y, 0)) rotate(var(--fly-rot, -45deg));
    transition: all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .reveal-fly.active {
    opacity: 1;
    transform: scale(1) translate(0, 0) rotate(0deg);
  }

  .human-avatar {`);

    // Remove absolute and z-index from human-avatar so the wrapper can handle it
    css = css.replace('position: absolute;\n', '');
    css = css.replace('z-index: 20;\n', '');
    fs.writeFileSync('src/index.css', css);
}

// 2. Update LandingPage.jsx
let jsx = fs.readFileSync('src/LandingPage.jsx', 'utf-8');

// Update IntersectionObserver
jsx = jsx.replace(/querySelectorAll\('\.reveal'\)/, "querySelectorAll('.reveal, .reveal-fly')");

// Replace Avatar 1
jsx = jsx.replace(
    /<img src="https:\/\/images.unsplash.com\/photo-1534528741775-53994a69daeb\?q=80&w=200&auto=format&fit=crop"\s*className="human-avatar w-20 h-20 top-\[5%\] -left-\[5%\] floating-1" alt="Creative Director" \/>/g,
    `<div className="absolute top-[5%] -left-[5%] z-20 reveal-fly" style={{'--fly-x': '-200px', '--fly-y': '-200px', '--fly-rot': '-90deg', transitionDelay: '300ms'}}>
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" className="human-avatar w-20 h-20 floating-1" alt="Creative Director" />
                    </div>`
);

// Replace Avatar 2
jsx = jsx.replace(
    /<img src="https:\/\/images.unsplash.com\/photo-1507003211169-0a1dd7228f2d\?q=80&w=200&auto=format&fit=crop"\s*className="human-avatar w-16 h-16 bottom-\[10%\] -left-\[2%\] floating-3" alt="Marketing Lead" \/>/g,
    `<div className="absolute bottom-[10%] -left-[2%] z-20 reveal-fly" style={{'--fly-x': '-200px', '--fly-y': '200px', '--fly-rot': '90deg', transitionDelay: '500ms'}}>
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" className="human-avatar w-16 h-16 floating-3" alt="Marketing Lead" />
                    </div>`
);

// Replace Avatar 3
jsx = jsx.replace(
    /<img src="https:\/\/images.unsplash.com\/photo-1517841905240-472988babdf9\?q=80&w=200&auto=format&fit=crop"\s*className="human-avatar w-24 h-24 top-\[10%\] -right-\[8%\] floating-2" style=\{\{"animationDelay":"-2s"\}\}\s*alt="Content Creator" \/>/g,
    `<div className="absolute top-[10%] -right-[8%] z-20 reveal-fly" style={{'--fly-x': '200px', '--fly-y': '-200px', '--fly-rot': '180deg', transitionDelay: '400ms'}}>
                        <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop" className="human-avatar w-24 h-24 floating-2" style={{animationDelay: '-2s'}} alt="Content Creator" />
                    </div>`
);

// Replace Glass Card 1 (Campaign Emotion)
// Current: <div className="glass-card absolute bottom-[5%] -right-[8%] p-5 z-30 w-64 floating-1" style={{"animationDelay":"-3s"}}>
jsx = jsx.replace(
    /<div className="glass-card absolute bottom-\[5%\] -right-\[8%\] p-5 z-30 w-64 floating-1"([^>]*?)>/g,
    `<div className="absolute bottom-[5%] -right-[8%] z-30 reveal-fly" style={{'--fly-x': '250px', '--fly-y': '250px', '--fly-rot': '45deg', transitionDelay: '600ms'}}>
                        <div className="glass-card p-5 w-64 floating-1"$1>`
);
// We need to add a closing </div> for the wrapper. The original card ended with </div>\n                    </div>\n                </div>
// We'll replace the inner content manually. It's safer to use a more precise regex.
jsx = jsx.replace(
    /<div className="absolute bottom-\[5%\] -right-\[8%\] z-30 reveal-fly"(.*?)>\s*<div className="glass-card p-5 w-64 floating-1"(.*?)>\s*<div className="flex items-center gap-3 mb-3">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/,
    `<div className="absolute bottom-[5%] -right-[8%] z-30 reveal-fly"$1>
                        <div className="glass-card p-5 w-64 floating-1"$2>
                            <div className="flex items-center gap-3 mb-3">$3</div>
                        </div>
                    </div>`
);

// Actually, let's just write the exact full block for the visual cluster.
// I have the full block from the previous step.

const newVisualCluster = `                {/*  Creative Visual Cluster Centered Below  */}
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
                </div>`;

// Regex to replace the whole block
const blockRegex = /\{\/\*\s*Creative Visual Cluster Centered Below\s*\*\/\}[\s\S]*?\{\/\*\s*Trusted Intelligence \(Stats\)\s*\*\/\}/;
jsx = jsx.replace(blockRegex, newVisualCluster + '\n            </div>\n        </section>\n        {/*  Trusted Intelligence (Stats)  */}');

fs.writeFileSync('src/LandingPage.jsx', jsx);
console.log('Successfully added outer space fly-in animations to the elements!');
