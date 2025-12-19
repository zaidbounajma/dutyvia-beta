// src/hooks/useUnreadByMatch.js
import { useEffect, useState } from 'react';
import supabase from '../supabase';

export default function useUnreadByMatch() {
  const [map, setMap] = useState({});

  async function load() {
    const { data, error } = await supabase.from('v_unread_by_match').select('*');
    if (!error && data) {
      setMap(Object.fromEntries(data.map(r => [r.match_id, r.unread_count])));
    }
  }

  useEffect(() => {
    load();
    // Optionnel: rafraîchir à intervalle régulier
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, []);

  return map;
}
