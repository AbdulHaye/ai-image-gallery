const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { log } = require('console');
const router = express.Router();

// // Text search - FIXED VERSION
// router.get('/text', async (req, res) => {
//   try {
//     const token = req.headers.authorization?.replace('Bearer ', '');
//     if (!token) {
//       return res.status(401).json({ error: 'Authentication required' });
//     }

//     const { data: { user }, error: userError } = await supabase.auth.getUser(token);
//     if (userError || !user) {
//       return res.status(401).json({ error: 'Invalid authentication' });
//     }

//     const query = req.query.q;
//     if (!query) {
//       return res.status(400).json({ error: 'Search query is required' });
//     }

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const offset = (page - 1) * limit;

//     // First, search for matching image_metadata records
//     const { data: matchingMetadata, error: metadataError } = await supabase
//       .from('image_metadata')
//       .select('image_id')
//       .eq('user_id', user.id)
//       .or(`tags.cs.{${query}},description.ilike.%${query}%`);

//     if (metadataError) {
//       console.error('Metadata search error:', metadataError);
//       return res.status(400).json({ error: metadataError.message });
//     }

//     // Extract the image IDs from the matching metadata
//     const imageIds = matchingMetadata.map(meta => meta.image_id);

//     // If no matches found, return empty results
//     if (imageIds.length === 0) {
//       return res.status(200).json({
//         images: [],
//         pagination: {
//           page,
//           limit,
//           total: 0,
//           totalPages: 0
//         }
//       });
//     }

//     // Now get the images for these IDs
//     const { data: images, error: imagesError, count } = await supabase
//       .from('images')
//       .select(`
//         *,
//         image_metadata (
//           description,
//           tags,
//           colors,
//           ai_processing_status
//         )
//       `, { count: 'exact' })
//       .eq('user_id', user.id)
//       .in('id', imageIds)
//       .order('uploaded_at', { ascending: false })
//       .range(offset, offset + limit - 1);

//     if (imagesError) {
//       console.error('Images search error:', imagesError);
//       return res.status(400).json({ error: imagesError.message });
//     }

//     res.status(200).json({
//       images: images || [],
//       pagination: {
//         page,
//         limit,
//         total: count || 0,
//         totalPages: Math.ceil((count || 0) / limit)
//       }
//     });
//   } catch (error) {
//     console.error('Search error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });


// Text search - FIXED VERSION
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
    console.log
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Search in description, tags, or colors
    const { data: matchingMetadata, error: metadataError } = await supabaseAdmin
      .from('image_metadata')
      .select('image_id')
      .eq('user_id', user.id)
      .or(`description.ilike.%${query}%,tags.cs.{${query}},colors.cs.{${query}}`);

    // console.log('Matching metadata:', matchingMetadata);

    if (metadataError) {
      console.error('Metadata search error:', metadataError);
      return res.status(400).json({ error: metadataError.message });
    }

    const imageIds = matchingMetadata.map(meta => meta.image_id);
    // console.log('Image IDs from metadata:', imageIds);

    if (imageIds.length === 0) {
      return res.status(200).json({
        images: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }

    // Fetch full image data
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
      .in('id', imageIds)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);
    log('Fetched images:', images);
    if (imagesError) {
      console.error('Images search error:', imagesError);
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
    console.error('Search error:', error);
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