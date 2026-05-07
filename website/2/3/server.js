const express = require('express');
const https = require('https');
const http = require('http');
const net = require('net'); 
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const app = express();

const PORT = 8700;

// --- 1. SSL SETUP ---
let sslOptions = null;
try {
    const files = fs.readdirSync(__dirname);
    const keyFile = files.find(f => f.endsWith('-key.pem'));
    if (keyFile) {
        sslOptions = {
            key: fs.readFileSync(path.join(__dirname, keyFile)),
            cert: fs.readFileSync(path.join(__dirname, keyFile.replace('-key.pem', '.pem')))
        };
    }
} catch (e) { console.log("SSL keys missing - running HTTP only."); }

// Ensure Zip directory exists
const zipDir = path.join(__dirname, 'PROJECT_FOLDER_ZIPPED');
if (!fs.existsSync(zipDir)) fs.mkdirSync(zipDir);

// --- 2. MIDDLEWARE & DYNAMIC CONTENT ---
app.use('/favicon', express.static(path.join(__dirname, 'favicon')));
app.use((req, res, next) => {
    if (req.path.endsWith('.embed')) res.setHeader('Content-Type', 'text/html');
    next();
});

// --- 3. ROUTES & REDIRECTS ---

// Main Dashboard
app.get('/', (req, res) => {
    if (!req.query.refresh) return res.redirect('/?refresh=1');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// THE REDIRECT YOU REQUESTED
app.get('/yoplay-mirror-2', (req, res) => {
    console.log(`\x1b[33m[ REDIRECT ]\x1b[0m Sending user to Netlify Mirror...`);
    res.redirect('https://crazy-cattle-3d-mirror-2-yoplay.netlify.app/');
});

// ZIP Downloads
const createZip = (dir, name, res) => {
    const zipPath = path.join(zipDir, name);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => {
        res.download(zipPath, name, () => { if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath); });
    });
    archive.pipe(output);
    archive.directory(dir, false);
    archive.finalize();
};

app.get('/get-latest-zip', (req, res) => createZip('D:\\crazy-cattle-3D', 'crazy-cattle-3D-full.zip', res));
app.get('/download-exe', (req, res) => createZip(path.join(__dirname, 'CrazyCattle3D'), 'CrazyCattle3D-Game.zip', res));

// Auto-Folder Discovery
fs.readdirSync(__dirname, { withFileTypes: true })
    .filter(d => d.isDirectory() && !['node_modules', 'PROJECT_FOLDER_ZIPPED'].includes(d.name))
    .forEach(d => {
        const safeRoute = "/" + d.name.replace(/\s+/g, '-').replace(/[()]/g, '');
        app.use(safeRoute, express.static(path.join(__dirname, d.name)));
    });

// --- 4. THE HYBRID SERVER ENGINE ---
const httpServer = http.createServer(app);
const httpsServer = https.createServer(sslOptions, app);

const mainServer = net.createServer((socket) => {
    socket.once('data', (buffer) => {
        // Handshake detector: 22 = SSL/TLS
        const proxy = buffer[0] === 22 ? httpsServer : httpServer;
        proxy.emit('connection', socket);
        socket.pause();
        socket.unshift(buffer);
        socket.resume();
    });
});
// ... (Previous Zip and Auto-Discovery routes) ...

// Map the root manifest request to the actual file location
app.get('/site.webmanifest', (req, res) => {
    res.sendFile(path.join(__dirname, 'favicon', 'site.webmanifest'));
});


// --- 5. CUSTOM 404 ERROR HANDLER ---
// This MUST be the last route defined
app.use((req, res) => {
    console.log(`\x1b[31m[ 404 ]\x1b[0m Failed attempt to access: ${req.url}`);
    res.status(404).sendFile(path.join(__dirname, 'page-route-error.html'));
});

mainServer.listen(PORT, () => {
    console.log(`\n\x1b[1m\x1b[32m STATION PORTAL - HYBRID MODE ACTIVE \x1b[0m`);
    console.log(`\x1b[36m [ PORT ]\x1b[0m ${PORT}`);
    console.log(`\x1b[35m [ MODE ]\x1b[0m HTTP & HTTPS Co-existing`);
    console.log(`\x1b[34m=========================================\x1b[0m\n`);
});