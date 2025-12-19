// src/screens/TravelerAssigned.js
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import supabase from '../supabase';

export default function TravelerAssigned({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      Alert.alert('Auth', error.message);
      return;
    }
    setUserId(data?.user?.id || null);
  }

  async function load() {
    if (!userId) return;
    setLoading(true);

    // On récupère les matches du voyageur puis on hydrate avec la demande
    const { data: matches, error: mErr } = await supabase
      .from('matches')
      .select('id, status, request_id')
      .eq('traveler_id', userId)
      .order('id', { ascending: false });
    if (mErr) {
      setLoading(false);
      Alert.alert('Erreur', mErr.message);
      return;
    }

    // Hydratation simple (1 requête / demande) - suffisant pour maintenant
    const hydrated = [];
    for (const m of matches) {
      const { data: r, error: rErr } = await supabase
        .from('requests')
        .select('id, product_name, brand, category, airport, meetup_location, created_at')
        .eq('id', m.request_id)
        .single();
      if (!rErr && r) {
        hydrated.push({ match_id: m.id, status: m.status, request: r });
      } else {
        hydrated.push({ match_id: m.id, status: m.status, request: null });
      }
    }

    setRows(hydrated);
    setLoading(false);
  }

  useEffect(() => {
    loadUser();
  }, []);
  useEffect(() => {
    load();
  }, [userId]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 12 }}>
      <TouchableOpacity
        onPress={load}
        style={{ backgroundColor: '#1351b4', padding: 12, borderRadius: 10, marginBottom: 12 }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>
          {loading ? 'Chargement…' : 'Recharger'}
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 16, fontWeight: '700', color: '#0A2540', marginBottom: 8 }}>
        Mes demandes assignées (Voyageur)
      </Text>

      {rows.length === 0 ? (
        <Text style={{ color: '#6b7280' }}>Aucun chat pour le moment.</Text>
      ) : null}

      {rows.map((row) => {
        const r = row.request;
        return (
          <View
            key={row.match_id}
            style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 12 }}
          >
            <Text style={{ fontWeight: '700', color: '#0A2540' }}>
              {r?.product_name || '—'} • {r?.brand || '—'}
            </Text>
            <Text style={{ color: '#64748b' }}>
              {r?.category || '—'} • Aéroport : {r?.airport || '—'}
            </Text>
            <Text style={{ color: '#64748b' }}>Lieu : {r?.meetup_location || '—'}</Text>
            <Text style={{ color: '#64748b', marginBottom: 8 }}>
              Statut match : {row.status || '—'}
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Chat', { matchId: row.match_id, role: 'traveler' })}
              style={{ backgroundColor: '#0ea5e9', padding: 12, borderRadius: 10 }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Ouvrir le chat</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}
