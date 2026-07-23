import re

file_path = r'C:\Users\MOH\Documents\GG\iABSS-main\iABSS-main\components\AboutPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("name: 'محمة'", "name: 'محمح'")
content = content.replace("nameEn: 'MAHMAH'", "nameEn: 'MHMH'")

pattern = r'<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">.*?</button>\s*\}\)\}\s*</div>'

new_grid = """<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {GAMES_DATA.map((game, i) => (
              <button
                key={i}
                onClick={() => setActiveGame(activeGame === i ? null : i)}
                className={`text-right bg-gradient-to-br from-red-950/40 to-black/60 border border-red-500/20 rounded-[2rem] p-5 transition-all duration-500 group hover:scale-[1.02] ${
                  activeGame === i ? 'shadow-2xl border-red-500/50 bg-red-900/20' : 'hover:border-red-500/40 hover:shadow-red-500/10'
                }`}
                style={{ boxShadow: activeGame === i ? `0 20px 40px -15px ${game.glowColor || 'rgba(239,68,68,0.3)'}` : '0 10px 30px -10px rgba(0,0,0,0.5)' }}
              >
                {/* Pill Header */}
                <div className="flex items-center justify-between bg-black/40 border border-red-500/10 rounded-full p-1.5 pr-6">
                  <h3 className="text-white font-black text-lg leading-none">{game.name}</h3>
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${game.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <game.icon size={22} className="text-white" />
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
                    <div className="bg-black/30 rounded-2xl p-4 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Gamepad2 size={16} className="text-red-500" />
                        <span className="text-red-500 font-black text-xs uppercase tracking-widest">
                          طريقة اللعب
                        </span>
                      </div>
                      <p className="text-white/60 font-bold text-xs leading-relaxed">{game.howToPlay}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>"""

content = re.sub(pattern, new_grid, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
