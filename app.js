const fs = require('fs');
const multer = require('multer');
const path = require('path');
require('dotenv').config()

// Ruta del directorio de uploads
const uploadDir = path.join(__dirname, 'uploads');

// crea el directorio, si no existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configurar el almacenamiento de Multer
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir); // Usa la ruta del directorio
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Configurar las rutas y el servidor
const express = require('express');
require('dotenv').config();
const app = express();

app.get('/', (req, res) => {
    res.send('hello');
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        res.json(req.file);
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred.');
    }
});

//const port = process.env.PORT || 3000;
const port = process.env.PORT
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
