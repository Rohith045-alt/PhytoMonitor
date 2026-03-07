const path = require('path');
const AppError = require('../helper/AppError');

module.exports = (req, res, next) => {

  if (!req.files || !req.files.image) {
    return next(new AppError('No image uploaded', 400));
  }

  const file = req.files.image;

  const allowedExtensions = ['.jpg', '.jpeg', '.png'];

  const extension = path.extname(file.name).toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return next(new AppError('Invalid file type. Only JPG/PNG allowed.', 400));
  }

  next();
};