-- Enable the http extension for making API calls from PostgreSQL
CREATE EXTENSION IF NOT EXISTS http;

-- Set application settings for API keys and URLs
DO $$
BEGIN
  -- Set OpenAI API key (this will be overridden by actual value in production)
  PERFORM set_config('app.settings.openai_api_key', 'sk-your-openai-key', false);
  
  -- Set seeding API URL (this will be overridden by actual value in production)
  PERFORM set_config('app.settings.seeding_api_url', 'https://platform.omegaa.cloud/api/auto-seed', false);
END $$;