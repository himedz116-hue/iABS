const fs = require('fs');

const rawData = JSON.parse(fs.readFileSync('new_logos.json', 'utf8'));

// Map to Brand interface
const newBrands = rawData.map(item => {
    return {
        name: item.name_en,
        domain: item.website,
        aliases: [item.name_ar, item.name_en, item.name_en.toLowerCase(), item.name_ar.replace(' ', '')]
    };
});

// Format as code string
let brandsCode = 'const POPULAR_BRANDS: Brand[] = [\n';
newBrands.forEach(brand => {
    const aliasesStr = JSON.stringify([...new Set(brand.aliases)]); // Deduplicate
    brandsCode += `    { name: '${brand.name.replace(/'/g, "\\'")}', domain: '${brand.domain}', aliases: ${aliasesStr} },\n`;
});
brandsCode += '];';

let code = fs.readFileSync('components/LogoRound.tsx', 'utf-8');

const startIdx = code.indexOf('const POPULAR_BRANDS: Brand[] = [');
const endIdx = code.indexOf('];', startIdx) + 2;

if (startIdx !== -1 && endIdx !== -1) {
    code = code.slice(0, startIdx) + brandsCode + code.slice(endIdx);
    fs.writeFileSync('components/LogoRound.tsx', code);
    console.log('Successfully replaced POPULAR_BRANDS');
} else {
    console.error('Could not find POPULAR_BRANDS array in the file');
}
