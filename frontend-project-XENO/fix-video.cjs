const fs = require('fs');

let content = fs.readFileSync('src/LandingPage.jsx', 'utf-8');

// The file currently has a missing section due to bad tool replacement.
// Let's restore the whole block from '{/*  Creative Visual Cluster Centered Below  */}'
// down to '{/*  Floating Avatar 2  */}'

const correctBlock = `                {/*  Creative Visual Cluster Centered Below  */}
                <div className="relative w-full max-w-4xl flex items-center justify-center mt-4 min-h-[500px] reveal">
                    {/*  Main central image: A beautiful, creative marketing workspace  */}
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
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
                        className="human-avatar w-20 h-20 top-[5%] -left-[5%] floating-1" alt="Creative Director" />

                    {/*  Floating Avatar 2  */}`;

const badPattern = /\{\/\*\s*Creative Visual Cluster Centered Below\s*\*\/\}\s*<div className="relative w-full max-w-4xl flex items-center justify-center mt-4 min-h-\[500px\] reveal">\s*\{\/\*\s*Floating Avatar 2\s*\*\/\}/;

content = content.replace(badPattern, correctBlock);

fs.writeFileSync('src/LandingPage.jsx', content);
console.log('Fixed video replacing!');
