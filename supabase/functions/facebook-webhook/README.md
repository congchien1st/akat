# Facebook Webhook Edge Function

This Edge Function handles Facebook webhook events, including verification and event processing.

## Features

- Verifies Facebook webhook challenges
- Stores incoming webhook events in the database
- Relies on PostgreSQL triggers for event processing
- Supports automatic content moderation and seeding

## Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `FB_VERIFY_TOKEN`: The verification token for Facebook webhooks (default: 'akamediaplatfrom9924')
- `OPENAI_API_KEY`: Your OpenAI API key for content moderation
- `SEEDING_API_URL`: URL for the auto-seeding API

## Deployment

Deploy this function to your Supabase project:

```bash
supabase functions deploy facebook-webhook --project-ref your-project-ref
```

## Testing

You can test the webhook verification with:

```
curl "https://your-project-ref.supabase.co/functions/v1/facebook-webhook?hub.mode=subscribe&hub.challenge=1234567890&hub.verify_token=akamediaplatfrom9924"
```

Expected response: `1234567890`

## Setting Up in Facebook Developer Portal

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

## Webhook Processing Flow

1. Facebook sends a webhook event to the Edge Function
2. The Edge Function stores the event in the `webhook_logs` table
3. A PostgreSQL trigger processes the event:
   - For new posts: Stores in `new_posts` table and calls seeding API
   - For new comments: Checks for violations and stores in `violations` table if needed
4. Real-time notifications are sent for violations