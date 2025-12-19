// src/screens/BuyerAssigned.js
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import supabase from '../supabase';

export default function BuyerAssigned({ navigation }) {
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

    try {
      // 1) Récupère toutes les demandes de cet acheteur
      const { data: requests, error: reqErr } = await supabase
        .from('requests')
        .select('id, product_name, brand, category, airport, meetup_location, requester_id')
        .eq('requester_id', userId);

      if (reqErr) throw reqErr;

      // 2) Pour chacune, voir si elle a un match
      const hydrated = [];
      for (const r of requests) {
        const { data: match, error: mErr } = await supabase
          .from('matches')
          .select('id, traveler_id, status')
          .eq('request_id', r.id)
          .maybeSingle();
        if (!mErr && match) hydrated.push({ ...r, match });
      }

      setRows(hydrated);
    } catch (e) {
      console.error('BuyerAssigned error:', e);
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
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
        style={{ backgroundColor: '#1557b0', margin: 12, borderRadius: 8, padding: 12 }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>
          {loading ? 'Chargement…' : 'Recharger'}
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 16, fontWeight: '700', color: '#0A2540', marginBottom: 8 }}>
        Demandes assignées (Acheteur)
      </Text>

      {rows.length === 0 ? (
        <Text style={{ color: '#6b7280' }}>Aucune demande assignée pour le moment.</Text>
      ) : null}

      {rows.map((r) => (
        <View key={r.id} style={{ backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <Text style={{ fontWeight: '700', color: '#0A2540' }}>
            {r.product_name} • {r.brand}
          </Text>
          <Text style={{ color: '#64748b' }}>
            {r.category} • Aéroport : {r.airport}
          </Text>
          <Text style={{ color: '#64748b' }}>
            Lieu : {r.meetup_location}
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Chat', { matchId: r.match?.id, role: 'buyer' })}
            style={{ backgroundColor: '#0E7AFE', padding: 12, borderRadius: 8, marginTop: 8 }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Ouvrir le chat</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
