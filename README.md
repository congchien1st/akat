# Facebook Webhook Integration with Supabase

This project implements a comprehensive Facebook webhook integration using Supabase Edge Functions and PostgreSQL triggers for automated content moderation and post seeding.

## Features

- **Webhook Verification**: Automatically verifies Facebook webhook challenges
- **Automated Processing**: Uses PostgreSQL triggers to process webhook events
- **Content Moderation**: Checks comments for violations using OpenAI
- **Auto Seeding**: Automatically calls seeding API for new posts
- **Real-time Notifications**: Notifies users of content violations in real-time
- **Admin Dashboard**: Monitors webhook logs, violations, and new posts

## Architecture

1. **Facebook Webhook** → **Supabase Edge Function** → **Database**
2. **PostgreSQL Trigger** → **Process Event** → **Call External APIs**
3. **Supabase Realtime** → **Frontend Notifications**

## Setup Instructions

### 1. Deploy Supabase Edge Function

```bash
# Navigate to the function directory
cd supabase/functions/facebook-webhook

# Deploy the function
supabase functions deploy facebook-webhook --project-ref your-project-ref
```

### 2. Set Environment Variables

In the Supabase dashboard, set the following environment variables for the Edge Function:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `FB_VERIFY_TOKEN`: The verification token for Facebook webhooks (default: 'akamediaplatfrom9924')
- `OPENAI_API_KEY`: Your OpenAI API key for content moderation
- `SEEDING_API_URL`: URL for the auto-seeding API

### 3. Set PostgreSQL Application Settings

Run the following SQL in the Supabase SQL Editor:

```sql
-- Set OpenAI API key
ALTER SYSTEM SET app.settings.openai_api_key TO 'your-openai-api-key';

-- Set seeding API URL
ALTER SYSTEM SET app.settings.seeding_api_url TO 'https://platform.omegaa.cloud/api/auto-seed';

-- Reload configuration
SELECT pg_reload_conf();
```

### 4. Configure Facebook Webhook

1. Go to your Facebook App in the [Facebook Developer Portal](https://developers.facebook.com/)
2. Navigate to App Settings > Webhooks
3. Click "Add Product" and select "Webhooks"
4. Click "Create New Webhook" and select "Page"
5. Enter your Supabase Edge Function URL: `https://your-project-ref.supabase.co/functions/v1/facebook-webhook`
6. Enter your verify token: `akamediaplatfrom9924` (or your custom token)
7. Select the following subscription fields:
   - `feed` (for posts and comments)
   - `messages` (if you want to receive message events)
8. Click "Verify and Save"
9. Subscribe your app to the pages you want to monitor

## Database Schema

The system uses the following tables:

- `webhook_logs`: Stores all incoming webhook events
- `new_posts`: Stores new posts detected from webhooks
- `violations`: Stores content violations detected by OpenAI
- `error_logs`: Stores errors that occur during processing

## Testing

You can test the webhook verification with:

```
curl "https://your-project-ref.supabase.co/functions/v1/facebook-webhook?hub.mode=subscribe&hub.challenge=1234567890&hub.verify_token=akamediaplatfrom9924"
```

Expected response: `1234567890`

## Monitoring

The admin dashboard provides monitoring for:

1. **Webhook Logs**: View all incoming webhook events
2. **Violations**: Monitor content violations detected by OpenAI
3. **New Posts**: Track new posts and their seeding status

## Troubleshooting

If webhook events are not being processed:

1. Check the `webhook_logs` table to ensure events are being received
2. Verify that the PostgreSQL trigger is working correctly
3. Check the `error_logs` table for any processing errors
4. Ensure the OpenAI API key and seeding API URL are set correctly