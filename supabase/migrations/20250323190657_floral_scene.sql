/*
  # Fix duplicate check_content_violation functions

  1. Changes
    - Drop old version of check_content_violation function (without page_id parameter)
    - Keep only new version that uses page-specific config from auto_engines
  
  2. Details
    - Old version: check_content_violation(content text)
    - New version: check_content_violation(content text, page_id text)
*/

-- Drop old version of check_content_violation
DROP FUNCTION IF EXISTS check_content_violation(content text);

-- Keep only the new version with page_id parameter that uses auto_engines config