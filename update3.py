import re
import sys

file_path = r'C:\Users\MOH\Documents\GG\iABSS-main\iABSS-main\components\AboutPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_str = '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">'
end_str = '</button>\n            ))}\n          </div>'

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

if start_idx == -1 or content.find(end_str, start_idx) == -1:
    # Try alternate end_str (the one without newlines)
    end_str2 = '</button>            ))}          </div>'
    end_idx2 = content.find(end_str2, start_idx)
    if end_idx2 != -1:
        end_idx = end_idx2 + len(end_str2)
    else:
        print("Could not find bounds")
        sys.exit(1)

new_grid = """<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {GAMES_DATA.map((game, i) => (
              <button
                key={i}
                onClick={() => setActiveGame(activeGame === i ? null : i)}
                className={`relative text-right rounded-[2rem] p-5 transition-all duration-500 group hover:scale-[1.02] overflow-hidden ${
                  activeGame === i ? 'shadow-2xl border-red-500/80 bg-red-950/60' : 'bg-black/60 hover:bg-red-950/40 border-red-900/30 hover:border-red-500/60 hover:shadow-[0_0_40px_rgba(239,68,68,0.2)] hover:-translate-y-1'
                } border backdrop-blur-md`}
                style={{ 
                  boxShadow: activeGame === i ? `0 20px 50px -10px ${game.glowColor || 'rgba(239,68,68,0.5)'}` : '0 10px 30px -10px rgba(0,0,0,0.5)',
                }}
              >
                {/* Red Diagonal Stripes Background Effect */}
                <div 
                  className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.4) 10px, rgba(239, 68, 68, 0.4) 20px)'
                  }}
                />
                
                {/* Subtle Inner Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-red-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative z-10">
                  {/* Pill Header */}
                  <div className="flex items-center justify-between bg-black/50 border border-red-500/20 rounded-full p-1.5 pl-6 group-hover:bg-black/70 group-hover:border-red-500/40 transition-all">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${game.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-transform border border-white/20`}
                    >
                      <game.icon size={22} className="text-white drop-shadow-md" />
                    </div>
                    <h3 className="text-white font-black text-xl leading-none tracking-wide drop-shadow-md">{game.name}</h3>
                  </div>
                  
                  {/* Always visible description */}
                  <div className="mt-5 px-3">
                    <p className="text-red-100/70 font-bold text-sm leading-relaxed line-clamp-3 group-hover:text-red-100 transition-colors">
                      {game.description}
                    </p>
                  </div>

                  {/* Expanded content */}
                  <div
                    className={`overflow-hidden transition-all duration-500 ${
                      activeGame === i ? 'max-h-[300px] opacity-100 mt-5' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="border-t border-red-500/20 pt-4 px-2">
                      <div className="bg-black/60 rounded-2xl p-4 border border-red-500/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-500/5 blur-xl pointer-events-none" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-red-400 font-black text-xs uppercase tracking-widest drop-shadow-sm">
                              طريقة اللعب
                            </span>
                          </div>
                          <p className="text-white/90 font-bold text-xs leading-relaxed">{game.howToPlay}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>"""

content = content[:start_idx] + new_grid + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated beautifully successfully")
