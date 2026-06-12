import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // First verify the user is an admin/evaluator using their token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has admin/evaluator/facilitator role via user_roles table
    const { data: userRoles, error: rolesError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError || !userRoles || userRoles.length === 0) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allowedRoles = ['admin', 'evaluator', 'facilitator'];
    const hasAccess = userRoles.some(r => allowedRoles.includes(r.role));
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role client to fetch all consenting project data
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get all projects that have data_donation_consent = true
    const { data: consentingProjects, error: projectsError } = await serviceClient
      .from('projects')
      .select('id, name')
      .eq('data_donation_consent', true);

    if (projectsError) {
      console.error('Projects fetch error:', projectsError);
      throw new Error('Failed to fetch consenting projects');
    }

    if (!consentingProjects || consentingProjects.length === 0) {
      return new Response(JSON.stringify({ 
        data: [],
        stats: { total_projects: 0, total_interrogations: 0 },
        message: 'No projects with data donation consent found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const projectIds = consentingProjects.map(p => p.id);

    // Fetch all interrogations from consenting projects
    const { data: interrogations, error: interrogationsError } = await serviceClient
      .from('interrogations')
      .select(`
        id,
        mode,
        user_prompt,
        model_output,
        model_rationale,
        model_revision,
        challenge_tags,
        affected_groups,
        human_feedback,
        verdict,
        anonymized,
        created_at
      `)
      .in('project_id', projectIds)
      .eq('anonymized', true); // Only export anonymized data

    if (interrogationsError) {
      console.error('Interrogations fetch error:', interrogationsError);
      throw new Error('Failed to fetch interrogations');
    }

    // Transform data into training format
    const trainingData = (interrogations || []).map((item, index) => ({
      id: `community_${index + 1}`,
      mode: item.mode,
      scenario: `TIR ${item.mode} interrogation`,
      initial_statement: item.model_output,
      interrogative_response: item.user_prompt,
      collaborative_reasoning: item.model_rationale || 'Community-informed reasoning applied',
      revised_outcome: item.model_revision || item.model_output,
      annotation: `Applied ${item.mode} lens. Verdict: ${item.verdict || 'pending'}`,
      domain: 'Community-sourced',
      affected_groups: item.affected_groups || [],
      harm_types: item.challenge_tags || [],
      human_feedback: item.human_feedback,
      verdict: item.verdict,
      source: 'community_data',
      created_at: item.created_at
    }));

    console.log(`Exported ${trainingData.length} anonymized interrogations from ${consentingProjects.length} consenting projects`);

    return new Response(JSON.stringify({
      data: trainingData,
      stats: {
        total_projects: consentingProjects.length,
        total_interrogations: trainingData.length,
        exported_at: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in export-community-training-data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
