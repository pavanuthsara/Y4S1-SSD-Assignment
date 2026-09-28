import Review from '../models/review.model.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { fileTypeFromBuffer } from 'file-type';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reviewsDir = path.join(__dirname, '..', 'uploads', 'reviews');
if (!fs.existsSync(reviewsDir)) {
  fs.mkdirSync(reviewsDir, { recursive: true });
}

const ALLOWED_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg'
};

// Checks a file's real content and, if it's a genuine image, saves it
// under a filename we generate ourselves. Returns null if rejected.
async function saveReviewPicture(file) {
  const detected = await fileTypeFromBuffer(file.buffer);
  const ext = detected && ALLOWED_TYPES[detected.mime];
  if (!ext) return null;

  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  const filePath = `/uploads/reviews/${filename}`;
  fs.writeFileSync(path.join(__dirname, '..', filePath), file.buffer);
  return filePath;
}

export const createReview = async (req, res) => {
  try {
    const { orderId, description, rating } = req.body;
    const buyerId = req.user._id;
    const pictures = [];

    if (req.files && req.files.pictures) {
      const files = Array.isArray(req.files.pictures) ? req.files.pictures : [req.files.pictures];
      if (files.length > 3) {
        return res.status(400).json({ message: 'Maximum 3 pictures allowed.' });
      }
      for (const file of files) {
        const filePath = await saveReviewPicture(file);
        if (!filePath) {
          return res.status(400).json({ message: 'Only real JPG or PNG images are allowed.' });
        }
        pictures.push(filePath);
      }
    }

    const review = new Review({ orderId, buyerId, description, rating, pictures });
    await review.save();
    res.status(201).json({ message: 'Review created successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create review', error: error.message });
  }
};

export const getBuyerReviews = async (req, res) => {
  try {
    const buyerId = req.user._id;
    const reviews = await Review.find({ buyerId }).sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { description, rating } = req.body;
    const buyerId = req.user._id;

    const review = await Review.findOne({ _id: reviewId, buyerId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized.' });
    }

    review.description = description || review.description;
    review.rating = rating || review.rating;

    if (req.files && req.files.pictures) {
      review.pictures.forEach((pic) => {
        const filePath = path.join(__dirname, '..', pic);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

      const files = Array.isArray(req.files.pictures) ? req.files.pictures : [req.files.pictures];
      if (files.length > 3) {
        return res.status(400).json({ message: 'Maximum 3 pictures allowed.' });
      }

      const newPictures = [];
      for (const file of files) {
        const filePath = await saveReviewPicture(file);
        if (!filePath) {
          return res.status(400).json({ message: 'Only real JPG or PNG images are allowed.' });
        }
        newPictures.push(filePath);
      }
      review.pictures = newPictures;
    }

    await review.save();
    res.status(200).json({ message: 'Review updated successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update review', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const buyerId = req.user._id;

    const review = await Review.findOne({ _id: reviewId, buyerId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized.' });
    }

    review.pictures.forEach((pic) => {
      const filePath = path.join(__dirname, '..', pic);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await review.deleteOne();
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
};
