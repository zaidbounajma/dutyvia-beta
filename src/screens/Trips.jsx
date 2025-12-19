// src/screens/Trips.js
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import supabase from '../supabase';

export default function Trips() {
  const [airport, setAirport] = useState('CDG');
  const [start, setStart] = useState(new Date().toISOString());
  const [end, setEnd] = useState(new Date(Date.now() + 6 * 3600 * 1000).toISOString());
  const [rows, setRows] = useState([]);

  async function load() {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('id', { ascending: false });
    if (error) Alert.alert('Erreur', error.message);
    setRows(data || []);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    const { error } = await supabase.from('trips').insert({
      airport: airport.trim().toUpperCase(),
      window_start: start,
      window_end: end,
    });
    if (error) return Alert.alert('Erreur', error.message);
    Alert.alert('OK', 'Trajet publié.');
    load();
  }

  async function del(id) {
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) return Alert.alert('Erreur', error.message);
    load();
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontWeight: '800', fontSize: 18, marginBottom: 8 }}>Publier un trajet</Text>

      <Text style={{ fontSize: 12, color: '#64748b' }}>Aéroport</Text>
      <TextInput
        value={airport}
        onChangeText={setAirport}
        autoCapitalize="characters"
        placeholder="CDG / ORY"
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 8 }}
      />

      <Text style={{ fontSize: 12, color: '#64748b' }}>Début (ISO)</Text>
      <TextInput
        value={start}
        onChangeText={setStart}
        placeholder="2025-10-27T16:00:00.000Z"
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 8 }}
      />

      <Text style={{ fontSize: 12, color: '#64748b' }}>Fin (ISO)</Text>
      <TextInput
        value={end}
        onChangeText={setEnd}
        placeholder="2025-10-27T20:00:00.000Z"
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 12 }}
      />

      <TouchableOpacity onPress={add} style={{ backgroundColor: '#1565C0', padding: 14, borderRadius: 10, marginBottom: 16 }}>
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Publier</Text>
      </TouchableOpacity>

      <Text style={{ fontWeight: '800', marginBottom: 8 }}>Mes trajets</Text>

      {rows.map(t => (
        <View key={t.id} style={{ backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <Text style={{ fontWeight: '700' }}>{t.airport}</Text>
          <Text style={{ color: '#64748b' }}>De : {new Date(t.window_start).toLocaleString()}</Text>
          <Text style={{ color: '#64748b' }}>À  : {new Date(t.window_end).toLocaleString()}</Text>
          <TouchableOpacity onPress={() => del(t.id)} style={{ marginTop: 8, backgroundColor: '#e11d48', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
