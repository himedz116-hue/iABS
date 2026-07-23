import re
import sys
import random

file_path = r'C:\Users\MOH\Documents\GG\iABSS-main\iABSS-main\components\AboutPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Generate random SVG lines
svg_paths = ""
for _ in range(40):
    x1 = random.randint(-50, 450)
    y1 = random.randint(-50, 450)
    x2 = random.randint(-50, 450)
    y2 = random.randint(-50, 450)
    width = random.uniform(0.1, 1.5)
    opacity = random.uniform(0.1, 0.6)
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
                className={{`relative text-right rounded-3xl p-6 transition-all duration-700 group hover:scale-[1.03] overflow-hidden ${{
                  activeGame === i ? 'shadow-2xl border-red-500/60 bg-red-950/80' : 'bg-gradient-to-br from-[#0a0000]/90 to-[#1a0505]/90 border-red-900/30 hover:border-red-500/50 hover:shadow-[0_0_50px_rgba(239,68,68,0.2)] hover:-translate-y-2'
                }} border backdrop-blur-2xl`}}
                style={{{{ 
                  boxShadow: activeGame === i ? `0 20px 50px -10px ${{game.glowColor || 'rgba(239,68,68,0.5)'}}` : '0 10px 40px -10px rgba(0,0,0,0.8)',
                }}}}
              >
                {{/* Completely Random Jagged/Laser Lines Background with Parallax effect */}}
                <div 
                  className="absolute inset-0 opacity-40 group-hover:opacity-80 transition-all duration-[1500ms] pointer-events-none mix-blend-screen transform scale-100 group-hover:scale-125 group-hover:rotate-3"
                  style={{{{
                    backgroundImage: `url("{encoded_svg}")`,
                    backgroundSize: '300px 300px',
                    backgroundPosition: activeGame === i ? 'center' : 'top left'
                  }}}}
                />
                
                {{/* Extra glow blob on hover */}}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-600/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-full" />

                {{/* Glass Top Highlight */}}
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none rounded-t-3xl" />

                {{/* Subtle Inner Glow */}}
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative z-10">
                  {{/* Pill Header */}}
                  <div className="flex items-center justify-between bg-black/60 border border-red-500/20 rounded-full p-2 pl-6 group-hover:bg-black/80 group-hover:border-red-500/60 transition-all duration-500 shadow-inner overflow-hidden relative">
                    {{/* Shine effect on pill */}}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 skew-x-[-20deg] pointer-events-none" />
                    
                    <div
                      className={{`w-12 h-12 rounded-full bg-gradient-to-br ${{game.color}} flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 border border-white/20 relative z-10`}}
                    >
                      <game.icon size={{22}} className="text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]" />
                    </div>
                    <h3 className="text-white font-black text-xl leading-none tracking-wider drop-shadow-lg relative z-10">{{game.name}}</h3>
                  </div>
                  
                  {{/* Always visible description */}}
                  <div className="mt-6 px-2">
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
                      <div className="bg-[#050000]/80 rounded-2xl p-4 border border-red-500/10 relative overflow-hidden shadow-inner group-hover:border-red-500/30 transition-colors duration-500">
                        <div className="absolute inset-0 bg-red-500/5 blur-2xl pointer-events-none" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
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
