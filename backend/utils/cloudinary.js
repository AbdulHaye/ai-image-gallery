const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

// Generate thumbnail
const generateThumbnail = async (buffer) => {
  try {
    return await sharp(buffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();
  } catch (error) {
    throw new Error(`Thumbnail generation failed: ${error.message}`);
  }
};

module.exports = {
  uploadToCloudinary,
  generateThumbnail,
};