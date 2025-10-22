import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key on server
);

export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "Remotion Web App file bucket";