const normalize = (s) => {
    return s
        .toLowerCase()
        .trim()
        .replace(/[\s\-\_\.]+/g, '') // remove spaces, dashes, underscores, dots
        .replace(/[أإآا]/g, 'ا')     // normalize Arabic alef variants
        .replace(/[ؤ]/g, 'و')        // normalize waw
        .replace(/[ئ]/g, 'ي')        // normalize ya
        .replace(/[ة]/g, 'ه')        // normalize ta marbuta
        .replace(/[ى]/g, 'ي')        // normalize alef maqsura
        .replace(/[\u064B-\u065F\u0670]/g, ''); // remove tashkeel/diacritics
};

const levenshtein = (a, b) => {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
};

const fuzzyMatch = (guess, brand) => {
    const g = normalize(guess);
    if (g.length < 2) return false; // too short to be meaningful

    const targets = [
        brand.name,
        brand.domain.split('.')[0],
        ...brand.aliases
    ];

    for (const target of targets) {
        const t = normalize(target);
        if (!t) continue;

        if (g === t) return true;

        if (t.length >= 3 && g.length >= 3) {
            if (t.includes(g) && g.length >= Math.min(3, Math.floor(t.length * 0.4))) return true;
            if (g.includes(t) && t.length >= Math.min(3, Math.floor(g.length * 0.4))) return true;
        }

        if (g.length >= 3 && t.startsWith(g)) return true;
        if (t.length >= 3 && g.startsWith(t)) return true;

        const maxLen = Math.max(g.length, t.length);
        const allowedErrors = maxLen <= 4 ? 1 : maxLen <= 8 ? 2 : 3;
        const dist = levenshtein(g, t);
        if (dist <= allowedErrors && dist < t.length * 0.5) return true;
    }

    return false;
};

const brand = { name: 'Starbucks', domain: 'starbucks.sa', aliases: ["ستاربكس","Starbucks","starbucks"] };

console.log('ستار:', fuzzyMatch('ستار', brand));
console.log('ستار بوكس:', fuzzyMatch('ستار بوكس', brand));
console.log('ستار بكس:', fuzzyMatch('ستار بكس', brand));

