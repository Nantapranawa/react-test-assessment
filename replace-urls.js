const fs = require('fs');
const path = require('path');

function processDir(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== '.next') {
                processDir(fullPath);
            }
        } else if (entry.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Just replace all occurrences of literally 'http://localhost:8000' inside strings.
            // A much safer way is to replace 'http://localhost:8000' with \`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}\`
            // and `"http://localhost:8000..."` with \`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}...\`
            // and \`http://localhost:8000...\` with \`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}...\`
            // Let's do it cleanly by searching for exactly `http://localhost:8000` or `'http://localhost:8000...'` 
            // We use a custom token.
            const token = '___NEXT_PUBLIC_API_URL___';

            content = content.replace(/'http:\/\/localhost:8000(.*?)'/g, '`${___NEXT_PUBLIC_API_URL___}$1`');
            content = content.replace(/\"http:\/\/localhost:8000(.*?)\"/g, '`${___NEXT_PUBLIC_API_URL___}$1`');
            content = content.replace(/http:\/\/localhost:8000/g, '${___NEXT_PUBLIC_API_URL___}');
            content = content.replace(/___NEXT_PUBLIC_API_URL___/g, "process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'");

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated', fullPath);
            }
        }
    });
}
processDir(path.join(__dirname, 'apps/web'));
console.log('Done!');
