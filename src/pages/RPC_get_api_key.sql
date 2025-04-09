
-- This SQL will need to be executed manually in the Supabase SQL Editor
CREATE OR REPLACE FUNCTION get_api_key_by_service(service_name text)
RETURNS json AS $$
DECLARE
  api_key_record record;
BEGIN
  SELECT * INTO api_key_record
  FROM api_keys
  WHERE service = service_name
  AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('key', NULL);
  END IF;
  
  RETURN json_build_object('key', api_key_record.key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_api_key_by_service(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_api_key_by_service(text) TO anon;
