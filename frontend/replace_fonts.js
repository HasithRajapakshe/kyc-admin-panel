const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./app', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = content;
        
        modified = modified.replace(/"monospace"/g, '"Poppins, sans-serif"');
        modified = modified.replace(/'monospace'/g, '"Poppins, sans-serif"');
        
        if (content !== modified) {
            fs.writeFileSync(filePath, modified, 'utf8');
            console.log('Updated', filePath);
        }
    }
});
