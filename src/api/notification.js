import express from 'express';
import nodemailer from 'nodemailer';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || import.meta.env?.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD || import.meta.env?.EMAIL_PASSWORD
  }
});

// Send test notification
router.post('/test', async (req, res) => {
  try {
    const { type, recipient } = req.body;
    
    if (!type || !recipient) {
      return res.status(400).json({ error: 'Type and recipient are required' });
    }
    
    if (type === 'email') {
      // Send test email
      const mailOptions = {
        from: process.env.EMAIL_USER || import.meta.env?.EMAIL_USER,
        to: recipient,
        subject: 'Test Notification from AKA Platform',
        html: `
          <h2>Test Notification</h2>
          <p>This is a test notification from the AKA Platform.</p>
          <p>If you received this email, your notification system is working correctly.</p>
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      
      // Log the test notification
      await supabase
        .from('notification_logs')
        .insert({
          post_id: null,
          notification_type: 'email',
          recipient,
          status: 'sent',
          details: { messageId: info.messageId }
        });
      
      res.json({ success: true, messageId: info.messageId });
    } else if (type === 'lark' || type === 'zalo') {
      // For future implementation
      res.status(501).json({ error: `${type} notifications not yet implemented` });
    } else {
      res.status(400).json({ error: 'Invalid notification type' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notification logs
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const { data, error, count } = await supabase
      .from('notification_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (error) {
      throw error;
    }
    
    res.json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;