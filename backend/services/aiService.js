const axios = require('axios');

// AI Service Selection Documentation:
// I considered two options for AI image analysis:
// 1. OpenAI's GPT-4 with Vision: Powerful but expensive at $0.00765 per image (1024x1024)
// 2. Google Cloud Vision API: Specialized for images, cheaper at $0.0015 per image (first 1000 units/month free)
// 
// I chose OpenAI because:
// - More flexible in generating descriptive sentences
// - Better at understanding context and relationships in images
// - Simpler integration with a single API call
// - Good enough pricing for a demo application

const analyzeImageWithAI = async (imageId, imageUrl) => {
  try {
    // Update status to processing
    const { supabaseAdmin } = require('../config/supabase');
    await supabaseAdmin
      .from('image_metadata')
      .update({ ai_processing_status: 'processing' })
      .eq('image_id', imageId);

    // Call OpenAI API for image analysis
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and provide: 1. 5-10 relevant tags (comma-separated), 2. One descriptive sentence, 3. Top 3 dominant colors in HEX format (comma-separated). Format your response as: TAGS: tag1, tag2, tag3... DESCRIPTION: A descriptive sentence. COLORS: #color1, #color2, #color3'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const analysis = response.data.choices[0].message.content;
    
    // Parse the response
    const tagsMatch = analysis.match(/TAGS:\s*(.+?)(?=DESCRIPTION:|COLORS:|$)/s);
    const descriptionMatch = analysis.match(/DESCRIPTION:\s*(.+?)(?=TAGS:|COLORS:|$)/s);
    const colorsMatch = analysis.match(/COLORS:\s*(.+?)(?=TAGS:|DESCRIPTION:|$)/s);

    const tags = tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';
    const colors = colorsMatch ? colorsMatch[1].split(',').map(color => color.trim()).filter(color => color) : [];

    // Update database with AI analysis results
    const { error } = await supabaseAdmin
      .from('image_metadata')
      .update({
        tags,
        description,
        colors,
        ai_processing_status: 'completed'
      })
      .eq('image_id', imageId);

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    console.log(`AI analysis completed for image ${imageId}`);
  } catch (error) {
    console.error(`AI analysis failed for image ${imageId}:`, error.message);
    
    // Update status to failed
    const { supabaseAdmin } = require('../config/supabase');
    await supabaseAdmin
      .from('image_metadata')
      .update({ ai_processing_status: 'failed' })
      .eq('image_id', imageId);
  }
};

module.exports = {
  analyzeImageWithAI,
};