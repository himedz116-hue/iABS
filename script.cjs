const fs = require('fs');
const file = 'C:\\Users\\MOH\\Documents\\GG\\iABSS-main\\iABSS-main\\components\\AboutPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">[\s\S]*?<\/button>\s*\}\)\}\s*<\/div>/;

const match = content.match(regex);
if(!match) {
  console.log('Could not find grid bounds');
  process.exit(1);
}

const newGrid = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {GAMES_DATA.map((game, i) => (
                <button
                  key={i}
                  onClick={() => setActiveGame(activeGame === i ? null : i)}
                  className={\`text-right bg-white rounded-[2rem] p-5 transition-all duration-500 group hover:scale-[1.02] \${
                    activeGame === i ? 'shadow-2xl' : 'shadow-lg hover:shadow-xl'
                  }\`}
                  style={{ boxShadow: activeGame === i ? \`0 20px 40px -15px \${game.glowColor || 'rgba(0,0,0,0.2)'}\` : '0 10px 30px -10px rgba(0,0,0,0.3)' }}
                >
                  {/* Pill Header */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-full p-1.5 pr-6">
                    <h3 className="text-slate-800 font-black text-lg leading-none">{game.name}</h3>
                    <div
                      className={\`w-12 h-12 rounded-full bg-gradient-to-br \${game.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform\`}
                    >
                      <game.icon size={22} className="text-white" />
                    </div>
                  </div>
                  
                  {/* Always visible description */}
                  <div className="mt-5 px-3">
                    <p className="text-slate-500 font-bold text-sm leading-relaxed line-clamp-3">
                      {game.description}
                    </p>
                  </div>
  
                  {/* Expanded content */}
                  <div
                    className={\`overflow-hidden transition-all duration-500 \${
                      activeGame === i ? 'max-h-[300px] opacity-100 mt-5' : 'max-h-0 opacity-0'
                    }\`}
                  >
                    <div className="border-t border-slate-100 pt-4 px-2">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-slate-700 font-black text-xs uppercase tracking-widest">
                            طريقة اللعب
                          </span>
                        </div>
                        <p className="text-slate-600 font-bold text-xs leading-relaxed">{game.howToPlay}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>`;

content = content.replace(regex, newGrid);
fs.writeFileSync(file, content);
console.log('Replaced grid successfully!');
