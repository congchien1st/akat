import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Get moderation prompt
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('moderation_prompts')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update moderation prompt
router.put('/', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Deactivate all existing prompts
    await supabase
      .from('moderation_prompts')
      .update({ active: false })
      .eq('active', true);
    
    // Create new active prompt
    const { data, error } = await supabase
      .from('moderation_prompts')
      .insert({
        prompt,
        active: true
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;