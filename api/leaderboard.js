import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(request, response) {
  const puzzleId = request.query.puzzleId || request.body?.puzzleId;

  console.log(`[API] Supabase Request: ${request.method} ${request.url}`);

  if (!supabaseUrl || !supabaseKey) {
    console.error('[API] Supabase configuration missing');
    return response.status(500).json({ error: 'Supabase configuration missing' });
  }

  if (!puzzleId || typeof puzzleId !== 'string') {
    return response.status(400).json({ error: 'Missing puzzleId' });
  }

  if (request.method === 'GET') {
    try {
      console.log(`[API] Fetching leaderboard for ${puzzleId}`);
      const { data, error } = await supabase
        .from('puzzle_records')
        .select('name, time, moves')
        .eq('puzzle_id', puzzleId)
        .order('time', { ascending: true })
        .limit(10);

      if (error) throw error;

      console.log(`[API] Returning ${data?.length || 0} scores from Supabase`);
      return response.status(200).json(data);
    } catch (error) {
      console.error('[API] Supabase GET Error:', error.message || error);
      return response.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
    }
  }

  if (request.method === 'POST') {
    const { name, time, moves } = request.body || {};

    if (!name || typeof time !== 'number') {
      return response.status(400).json({ error: 'Missing name or time' });
    }

    try {
      console.log(`[API] Saving score for ${name} on ${puzzleId}`);
      const { error } = await supabase
        .from('puzzle_records')
        .insert([
          { puzzle_id: puzzleId, name: name.slice(0, 20), time, moves }
        ]);

      if (error) throw error;

      return response.status(200).json({ success: true });
    } catch (error) {
      console.error('[API] Supabase POST Error:', error.message || error);
      return response.status(500).json({ error: 'Failed to save score', details: error.message });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
