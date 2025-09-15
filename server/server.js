const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const PORT = 3000;

// ===== Find local (hotspot) IP =====
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    // only look at Wi-Fi
    if (name.toLowerCase().includes('wi-fi')) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address; // mine is 10.x.x.x from ipconfig
        }
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIP();

// ===== CORS =====
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// ===== Static folder =====
app.use(express.static(path.join(__dirname, 'public')));

// ===== Multer storage =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(os.homedir(), 'Desktop', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// ===== Upload endpoint =====
app.post('/v1/upload', upload.array('files', 50), (req, res) => {
  console.log(
    'Files received:',
    req.files.map((f) => f.filename)
  );
  res.status(200).send({
    success: true,
    message: 'Files uploaded successfully',
    files: req.files,
  });
});

// ===== Reading files to download in dir =====
const uploadDir = path.join(os.homedir(), 'Desktop', 'uploads', 'shared');
app.get('/file', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      res.status(500).send({
        success: false,
        error:
          'We are having problems processing your request, please try again later',
      });
    }
    res.send(files);
  });
});

// ====== Download Files Endpoint =======
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);

  // set headers 
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${req.params.filename}"`
  );
  res.setHeader('Content-Type', 'application/octet-stream');

  const fileStream = fs.createReadStream(filePath);

  // handle errors properly
  fileStream.on('error', (err) => {
    console.error(err);
    res.sendStatus(500);
  });

  // pipe stream to response (chunk by chunk)
  fileStream.pipe(res);
});
/* ===== Apparently, when downloading files, you see '34.5/?' r.g when using chrome browser you wont see the file size. adding 
fs.statSync(filePath).size, and adding it to the header would solve that. 

 ===== The first version works and shows file size, but can't handle large files. the device freezes and download also freezes. Will 
// update this when i learn more. */
// ===== Start server & QR Code =====
app.listen(PORT, ip, async () => {
  const url = `http://${ip}:${PORT}`;
  console.log(`Server running at ${url}`);

  try {
    const qr = await QRCode.toString(url, { type: 'terminal', small: true });
    console.log(qr);

    // Save QR to file too
    // await QRCode.toFile('qrcode.png', url);
    // console.log('QR Code saved as qrcode.png');
  } catch (err) {
    console.error('QR code error:', err);
  }
});
