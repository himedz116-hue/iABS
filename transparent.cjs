const fs = require('fs');
let code = fs.readFileSync('components/DrawingChallenge.tsx', 'utf-8');

// Replace LobbyPhase
code = code.replace(
    'className="w-full h-full flex flex-col items-center bg-[#0d0d12] text-right select-none overflow-hidden"',
    'className={`w-full h-full flex flex-col items-center ${isOBS ? "bg-transparent" : "bg-[#0d0d12]"} text-right select-none overflow-hidden`}'
);
code = code.replace(
    '<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1033_0%,transparent_70%)] opacity-50" />',
    '{!isOBS && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1033_0%,transparent_70%)] opacity-50" />}'
);

// Replace ResultPhase
code = code.replace(
    'className="w-full h-full flex flex-col items-center justify-center bg-[#0d0d12] p-5 select-none overflow-hidden"',
    'className={`w-full h-full flex flex-col items-center justify-center ${isOBS ? "bg-transparent" : "bg-[#0d0d12]"} p-5 select-none overflow-hidden`}'
);
code = code.replace(
    '<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1033_0%,transparent_70%)] opacity-30" />',
    '{!isOBS && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1033_0%,transparent_70%)] opacity-30" />}'
);

// Replace OBSConnectionPhase (even if OBS won't see it, for completeness)
code = code.replace(
    'className="w-full h-full flex flex-col items-center justify-center bg-[#0d0d12] text-right select-none"',
    'className={`w-full h-full flex flex-col items-center justify-center ${isOBS ? "bg-transparent" : "bg-[#0d0d12]"} text-right select-none`}'
);
code = code.replace(
    '<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#201044_0%,transparent_70%)] opacity-30" />',
    '{!isOBS && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#201044_0%,transparent_70%)] opacity-30" />}'
);

// Replace SelectPhase
code = code.replace(
    'className="w-full h-full flex flex-col items-center justify-center bg-[#0d0d12] text-right select-none"',
    'className={`w-full h-full flex flex-col items-center justify-center ${isOBS ? "bg-transparent" : "bg-[#0d0d12]"} text-right select-none`}'
);
code = code.replace(
    '<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#201044_0%,transparent_70%)] opacity-30" />',
    '{!isOBS && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#201044_0%,transparent_70%)] opacity-30" />}'
);

// Fix the DRAWING isOBS phase (remove white background from canvas)
code = code.replace(
    '<div className="relative w-full h-full bg-white rounded-[2rem] shadow-[0_0_60px_rgba(124,58,237,0.4)] border-8 border-white overflow-hidden ring-4 ring-violet-500/50">',
    '<div className="relative w-full h-full bg-transparent overflow-hidden">'
);
code = code.replace(
    '<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#fcfcfc_0%,_#f3f4f6_100%)]" />',
    ''
);
code = code.replace(
    'className="absolute inset-0 w-full h-full object-contain mix-blend-multiply drop-shadow-md"',
    'className="absolute inset-0 w-full h-full object-contain drop-shadow-md"'
);

// One critical fix: canvas data broadcast is image/jpeg which lacks transparency.
// We MUST change it to image/webp or image/png for OBS transparency to work!
code = code.replace(
    'toDataURL(\'image/jpeg\', 0.5)',
    'toDataURL(\'image/webp\', 0.7)'
);

fs.writeFileSync('components/DrawingChallenge.tsx', code);
console.log('Fixed transparency in all phases');
