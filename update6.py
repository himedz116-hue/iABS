import re
import sys
import random

file_path = r'C:\Users\MOH\Documents\GG\iABSS-main\iABSS-main\components\AboutPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Create a more beautiful, less chaotic, very sleek geometric SVG pattern (circuit / tech / glass cracks)
svg_paths = ""
for _ in range(30):
    x1 = random.randint(0, 400)
    y1 = random.randint(0, 400)
    # create short geometric lines
    x2 = x1 + random.choice([-50, 0, 50, 100])
    y2 = y1 + random.choice([-50, 0, 50, 100])
    width = random.uniform(0.2, 0.8)
    opacity = random.uniform(0.1, 0.4)
    svg_paths += f"<path d='M{x1},{y1} L{x2},{y2}' stroke='rgba(239,68,68,{opacity:.2f})' stroke-width='{width:.2f}' />"

svg = f"<svg width='400' height='400' xmlns='http://www.w3.org/2000/svg'><g fill='none'>{svg_paths}</g></svg>"
import urllib.parse
encoded_svg = "data:image/svg+xml," + urllib.parse.quote(svg)

start_str = '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">'
end_str = '</button>\n            ))}\n          </div>'

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

if start_idx == -1 or content.find(end_str, start_idx) == -1:
    end_str2 = '</button>            ))}          </div>'
    end_idx2 = content.find(end_str2, start_idx)
    if end_idx2 != -1:
        end_idx = end_idx2 + len(end_str2)
    else:
        print("Could not find bounds")
        sys.exit(1)

new_grid = f"""<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {{GAMES_DATA.map((game, i) => (
              <button
                key={{i}}
                onClick={{() => setActiveGame(activeGame === i ? null : i)}}
                className={{`relative text-right rounded-3xl p-6 transition-all duration-500 group overflow-hidden ${{
                  activeGame === i ? 'shadow-[0_0_50px_rgba(239,68,68,0.3)] border-red-500/80 bg-red-950/80 scale-[1.02]' : 'bg-[#0a0000]/90 hover:bg-[#120000]/90 border-red-900/40 hover:border-red-500/80 hover:shadow-[0_0_40px_rgba(239,68,68,0.2)] hover:-translate-y-2'
                }} border backdrop-blur-2xl`}}
                style={{{{ 
                  boxShadow: activeGame === i ? `0 20px 50px -10px ${{game.glowColor || 'rgba(239,68,68,0.5)'}}` : '0 10px 40px -10px rgba(0,0,0,0.8)',
                }}}}
              >
                {{/* Tech/Glass Lines Background */}}
                <div 
                  className="absolute inset-0 opacity-30 group-hover:opacity-70 transition-all duration-[2000ms] ease-out pointer-events-none mix-blend-screen group-hover:scale-125 group-hover:rotate-6"
                  style={{{{
                    backgroundImage: `url("{encoded_svg}")`,
                    backgroundSize: '250px 250px',
                    backgroundPosition: activeGame === i ? 'center' : 'top left'
                  }}}}
                />
                
                {{/* Hover Spotlight Effect */}}
                <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-red-500/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-spin-slow pointer-events-none rounded-full" />
                
                {{/* Center Glow Blob */}}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-red-600/20 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-full" />

                {{/* Glass Edge Highlight */}}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/[0.05] via-white/[0.01] to-transparent pointer-events-none rounded-t-3xl" />

                <div className="relative z-10">
                  {{/* Pill Header: Changed justify-between to gap-4 to keep icon and text together on the right */}}
                  <div className="flex items-center gap-4 bg-black/60 border border-red-500/20 rounded-full p-2 pr-2 group-hover:bg-black/80 group-hover:border-red-500/60 transition-all duration-500 shadow-inner overflow-hidden relative">
                    {{/* Shine effect on pill */}}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 skew-x-[-20deg] pointer-events-none" />
                    
                    {{/* Icon */}}
                    <div
                      className={{`w-12 h-12 rounded-full bg-gradient-to-br ${{game.color}} flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 border border-white/20 relative z-10`}}
                    >
                      <game.icon size={{22}} className="text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]" />
                    </div>
                    
                    {{/* Text */}}
                    <h3 className="text-white font-black text-xl leading-none tracking-wider drop-shadow-lg relative z-10 whitespace-nowrap">{{game.name}}</h3>
                  </div>
                  
                  {{/* Always visible description */}}
                  <div className="mt-6 px-2 text-right">
                    <p className="text-red-100/60 font-bold text-sm leading-loose line-clamp-3 group-hover:text-red-50 transition-colors duration-300 drop-shadow-sm">
                      {{game.description}}
                    </p>
                  </div>

                  {{/* Expanded content */}}
                  <div
                    className={{`overflow-hidden transition-all duration-500 ${{
                      activeGame === i ? 'max-h-[300px] opacity-100 mt-6' : 'max-h-0 opacity-0'
                    }}`}}
                  >
                    <div className="border-t border-red-500/20 pt-5 px-1">
                      <div className="bg-[#050000]/90 rounded-2xl p-4 border border-red-500/20 relative overflow-hidden shadow-inner group-hover:border-red-500/40 transition-colors duration-500 text-right">
                        <div className="absolute inset-0 bg-red-500/10 blur-2xl pointer-events-none" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-start gap-2 mb-3">
                            <span className="text-red-500 font-black text-xs uppercase tracking-[0.2em] drop-shadow-md">
                              طريقة اللعب
                            </span>
                          </div>
                          <p className="text-white/80 font-bold text-xs leading-relaxed">{{game.howToPlay}}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}}
          </div>"""

content = content[:start_idx] + new_grid + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
