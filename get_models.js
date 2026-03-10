const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyMatch = envContent.match(/GOOGLE_GEMINI_API_KEY_PAID=(.*)/);
let key = keyMatch ? keyMatch[1].trim() : null;

// The user has showed that the Paid key ends with M4sg and free ends with g2S0
// But the one in .env.local might not be updated yet. I see the user just updated it in Vercel.
// Let's use the one that is AIza...
const aiZaMatch = envContent.match(/GOOGLE_GEMINI_API_KEY=(AIza.*)/);
if (!key || !key.startsWith('AIza')) {
    key = aiZaMatch ? aiZaMatch[1].trim() : null;
}

if (!key) {
    console.error("NO KEY FOUND");
    process.exit(1);
}

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
    .then(r => r.json())
    .then(d => {
        if (d.error) {
            console.error(d.error);
        } else {
            console.log(d.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).map(m => m.name).join('\n'));
        }
    })
    .catch(console.error);
