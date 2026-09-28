import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';
import { farmerProtect } from '../../middleware/productListingMiddleware/farmer.middleware.js';

const router = express.Router();

// Keep the upload in memory first, so we can inspect it before saving anything.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // reject files bigger than 2MB
}).single('image');

// The only real file types we allow, and what extension WE will give them.
const ALLOWED_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg'
};

router.post('/', farmerProtect, (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload error' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Look at the actual bytes to find the real file type.
    const detected = await fileTypeFromBuffer(req.file.buffer);
    const ext = detected && ALLOWED_TYPES[detected.mime];

    if (!ext) {
      return res.status(400).json({ error: 'Only real JPG or PNG images are allowed!' });
    }

    // We build the filename ourselves — never trust the uploader's filename.
    const filename = `image-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    fs.writeFileSync(`uploads/${filename}`, req.file.buffer);

    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: `/uploads/${filename}`
    });
  });
});

export default router;
