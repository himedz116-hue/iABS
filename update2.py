import re
import sys

file_path = r'C:\Users\MOH\Documents\GG\iABSS-main\iABSS-main\components\AboutPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we replace the one-liner correctly!
start_str = '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">'
end_str = '</button>            ))}          </div>'

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

if start_idx == -1 or content.find(end_str, start_idx) == -1:
    print("Could not find the bounds!")
    sys.exit(1)

new_grid = """<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {GAMES_DATA.map((game, i) => (
              <button
                key={i}
                onClick={() => setActiveGame(activeGame === i ? null : i)}
                className={`text-right bg-gradient-to-br from-red-950/40 to-black/60 border border-red-500/20 rounded-[2rem] p-5 transition-all duration-500 group hover:scale-[1.02] ${
                  activeGame === i ? 'shadow-2xl border-red-500/50 bg-red-900/40' : 'hover:border-red-500/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:-translate-y-1'
                }`}
              >
                {/* Pill Header */}
                <div className="flex items-center justify-between bg-black/40 border border-red-500/10 rounded-full p-1.5 pr-6">
                  <h3 className="text-white font-black text-lg leading-none tracking-wide drop-shadow-md">{game.name}</h3>
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${game.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform`}
                  >
                    <game.icon size={22} className="text-white drop-shadow-md" />
                  </div>
                </div>
                
                {/* Always visible description */}
                <div className="mt-5 px-3">
                  <p className="text-red-100/70 font-bold text-sm leading-relaxed line-clamp-3">
                    {game.description}
                  </p>
                </div>

                {/* Expanded content */}
                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    activeGame === i ? 'max-h-[300px] opacity-100 mt-5' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="border-t border-red-500/10 pt-4 px-2">
                    <div className="bg-black/40 rounded-2xl p-4 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-400 font-black text-xs uppercase tracking-widest drop-shadow-sm">
                          طريقة اللعب
                        </span>
                      </div>
                      <p className="text-white/80 font-bold text-xs leading-relaxed">{game.howToPlay}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>"""

content = content[:start_idx] + new_grid + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
