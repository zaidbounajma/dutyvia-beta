import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { acceptRequest } from '../logic/acceptRequest';
import supabase from '../supabase';

export default function TravelerRequests({ navigation }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadOpen() {
    setLoading(true);
    const { data, error } = await supabase
      .from('requests')
      .select('id, product_name, brand, category, airport, meetup_location, created_at, max_price')
      .eq('status', 'open')
      .order('id', { ascending:false });

    if (error) Alert.alert('Erreur', error.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { loadOpen(); }, []);

  async function onAccept(reqId) {
    try {
      const matchId = await acceptRequest(reqId);
      Alert.alert('Acceptée', 'Chat ouvert');
      navigation.navigate('Chat', { matchId, role:'traveler' });
    } catch (e) {
      Alert.alert('Erreur', e.message);
      loadOpen();
    }
  }

  return (
    <ScrollView style={{ flex:1, backgroundColor:'#fff' }} contentContainerStyle={{ padding:12 }}>
      <TouchableOpacity
        onPress={() => navigation.navigate('TravelerChats')}
        style={{ backgroundColor:'#0B3D5E', padding:12, borderRadius:8, marginBottom:10 }}
      >
        <Text style={{ color:'#fff', textAlign:'center' }}>💬 Mes chats (Voyageur)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={loadOpen}
        style={{ backgroundColor:'#1555CC', padding:12, borderRadius:8, marginBottom:12 }}
      >
        <Text style={{ color:'#fff', textAlign:'center' }}>{loading ? 'Chargement…' : 'Recharger'}</Text>
      </TouchableOpacity>

      <Text style={{ fontWeight:'800', marginBottom:8 }}>Demandes ouvertes (Voyageur)</Text>

      {rows.length === 0 ? (
        <Text style={{ color:'#6b7280' }}>Aucune demande ouverte pour le moment.</Text>
      ) : rows.map(r => (
        <View key={r.id} style={{ backgroundColor:'#f3f4f6', borderRadius:10, padding:12, marginBottom:12 }}>
          <Text style={{ fontWeight:'700' }}>{r.product_name} • {r.brand}</Text>
          <Text style={{ color:'#6b7280', marginBottom:8 }}>
            {r.category} • Max {r.max_price ?? '—'} € • Aéroport: {r.airport}
          </Text>
          <TouchableOpacity
            onPress={() => onAccept(r.id)}
            style={{ backgroundColor:'#10B981', padding:12, borderRadius:8 }}
          >
            <Text style={{ color:'#fff', textAlign:'center', fontWeight:'700' }}>
              Proposer d’acheter / Accepter
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
