const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const HTML_FILE = path.join(__dirname, 'SympleTax_Portal_v6 (1).html');

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'SympleTax_Portal_v6 (1).html' : req.url);
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'text/plain';
    if (ext === '.html') contentType = 'text/html; charset=utf-8';
    else if (ext === '.css') contentType = 'text/css';
    else if (ext === '.js') contentType = 'application/javascript';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SympleTax server running on port ${PORT}`);
});
