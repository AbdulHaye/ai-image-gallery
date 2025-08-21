const express = require('express');
const multer = require('multer');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { uploadToCloudinary, generateThumbnail } = require('../utils/cloudinary');
const { analyzeImageWithAI } = require('../services/aiService');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Upload image
router.post('/upload', upload.array('images', 10), async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadResults = [];

    for (const file of req.files) {
      try {
        // Upload original image to Cloudinary
        const originalResult = await uploadToCloudinary(file.buffer, 'ai-gallery/originals');
        
        // Generate thumbnail
        const thumbnailBuffer = await generateThumbnail(file.buffer);
        const thumbnailResult = await uploadToCloudinary(thumbnailBuffer, 'ai-gallery/thumbnails');

        // Save to database
        const { data: imageData, error: dbError } = await supabaseAdmin
          .from('images')
          .insert({
            user_id: user.id,
            filename: file.originalname,
            original_path: originalResult.secure_url,
            thumbnail_path: thumbnailResult.secure_url
          })
          .select()
          .single();

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`);
        }

        // Add to metadata table with pending status
        const { error: metadataError } = await supabaseAdmin
          .from('image_metadata')
          .insert({
            image_id: imageData.id,
            user_id: user.id,
            ai_processing_status: 'pending'
          });

        if (metadataError) {
          throw new Error(`Metadata error: ${metadataError.message}`);
        }

        // Process image with AI in background
        analyzeImageWithAI(imageData.id, originalResult.secure_url)
          .catch(err => console.error(`AI processing failed for image ${imageData.id}:`, err));

        uploadResults.push({
          id: imageData.id,
          filename: file.originalname,
          thumbnail: thumbnailResult.secure_url,
          status: 'uploaded'
        });
      } catch (fileError) {
        uploadResults.push({
          filename: file.originalname,
          error: fileError.message,
          status: 'failed'
        });
      }
    }

    res.status(200).json({ results: uploadResults });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's images - USE ADMIN CLIENT
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    // console.log('Authenticated user ID:', user?.id);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // console.log(`Querying images for user_id: ${user.id}, page: ${page}, limit: ${limit}`);
    
    // USE THE ADMIN CLIENT HERE to bypass RLS
    const { data: images, error: imagesError, count } = await supabaseAdmin
      .from('images')
      .select(`
        *,
        image_metadata (
          description,
          tags,
          colors,
          ai_processing_status
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // console.log('Fetched images with metadata:', images);
    // console.log('Images error:', imagesError);
    // console.log('Count:', count);

    if (imagesError) {
      console.error('Detailed images error:', imagesError);
      return res.status(400).json({ error: imagesError.message });
    }

    res.status(200).json({
      images: images || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Unexpected error in images route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single image
router.get('/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const { data: image, error: imageError } = await supabase
      .from('images')
      .select(`
        *,
        image_metadata (
          description,
          tags,
          colors,
          ai_processing_status
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', user.id)
      .single();

    if (imageError) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.status(200).json({ image });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete image
router.delete('/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // First check if the image belongs to the user
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', user.id)
      .single();

    if (imageError || !image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete from database (this will cascade to metadata due to foreign key)
    const { error: deleteError } = await supabase
      .from('images')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    // Note: In a production app, you'd also delete the files from Cloudinary
    // This is omitted for simplicity but should be implemented

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;