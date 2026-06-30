const fs = require('fs');
const lines = fs.readFileSync('components/DrawingChallenge.tsx', 'utf-8').split('\n');

// Look for lines containing the corrupted character pattern
const corruptPattern = /[\u0637][\u0628\u0633\u0638\u0639\u062a\u062b\u062c\u062d\u062e\u062f\u0630\u0631\u0632\u0634\u0635\u0636\u0637\u0641\u0642\u0643\u0644\u0645\u0646\u0647\u0648\u0649\u064a\u0621\u0626]/;

lines.forEach((line, i) => {
    if (corruptPattern.test(line)) {
        console.log(`LINE ${i + 1}: ${line.trim().substring(0, 120)}`);
    }
});
