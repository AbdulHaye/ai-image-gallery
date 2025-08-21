const express = require('express');
const { supabase } = require('../config/supabase');
const router = express.Router();

// Text search
router.get('/text', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Search in tags and description
    const { data: images, error: searchError } = await supabase
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
      .eq('user_id', user.id)
      .or(`image_metadata.tags.cs.{${query}},image_metadata.description.ilike.%${query}%`)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (searchError) {
      return res.status(400).json({ error: searchError.message });
    }

    const { count, error: countError } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .or(`image_metadata.tags.cs.{${query}},image_metadata.description.ilike.%${query}%`);

    if (countError) {
      return res.status(400).json({ error: countError.message });
    }

    res.status(200).json({
      images,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Similar images search
router.get('/similar/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const imageId = req.params.id;
    
    // Get the target image's metadata
    const { data: targetImage, error: targetError } = await supabase
      .from('image_metadata')
      .select('tags, colors')
      .eq('image_id', imageId)
      .eq('user_id', user.id)
      .single();

    if (targetError || !targetImage) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Find images with similar tags or colors
    // This is a simplified approach - for production, consider using vector similarity
    const { data: similarImages, error: similarError } = await supabase
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
      .eq('user_id', user.id)
      .neq('id', imageId)
      .or(`image_metadata.tags.ov.{${targetImage.tags.join(',')}},image_metadata.colors.ov.{${targetImage.colors.join(',')}}`)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (similarError) {
      return res.status(400).json({ error: similarError.message });
    }

    const { count, error: countError } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('id', imageId)
      .or(`image_metadata.tags.ov.{${targetImage.tags.join(',')}},image_metadata.colors.ov.{${targetImage.colors.join(',')}}`);

    if (countError) {
      return res.status(400).json({ error: countError.message });
    }

    res.status(200).json({
      images: similarImages,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Color search
router.get('/color', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const color = req.query.c;
    if (!color) {
      return res.status(400).json({ error: 'Color parameter is required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Search for images with the specified color
    const { data: images, error: searchError } = await supabase
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
      .eq('user_id', user.id)
      .contains('image_metadata.colors', [color])
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (searchError) {
      return res.status(400).json({ error: searchError.message });
    }

    const { count, error: countError } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .contains('image_metadata.colors', [color]);

    if (countError) {
      return res.status(400).json({ error: countError.message });
    }

    res.status(200).json({
      images,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;