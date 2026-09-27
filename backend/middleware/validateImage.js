const path = require('path');
const AppError = require('../helper/AppError');

module.exports = (req, res, next) => {
  if (!req.files || !req.files.image) {
    return next(new AppError('No image file uploaded. Please select a plant leaf image.', 400));
  }

  const file = req.files.image;
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const extension = path.extname(file.name || '').toLowerCase();

  const isExtensionValid = allowedExtensions.includes(extension);
  const isMimeValid = file.mimetype && file.mimetype.startsWith('image/');

  if (!isExtensionValid && !isMimeValid) {
    return next(new AppError('Invalid file type. Only JPG, PNG, and WebP images are allowed.', 400));
  }

  if (file.size > 10 * 1024 * 1024) {
    return next(new AppError('File size too large. Maximum allowed size is 10MB.', 400));
  }

  next();
};