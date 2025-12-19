// src/screens/OffersReceived.js
import { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import supabase from '../../supabase';

export default function OffersReceived({ navigation }) {
  const [offers, setOffers] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null));
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadOffers();
  }, [userId]);

  async function loadOffers() {
    const { data, error } = await supabase
      .from('matches')
      .select('id, request_id, status, requests!inner(product_name, airport, requester_id)')
      .eq('requests.requester_id', userId)
      .order('created_at', { ascending: false });

    if (!error) setOffers(data);
  }

  const openChat = (matchId) => {
    navigation.navigate('Chat', { match_id: matchId });
  };

  const renderItem = ({ item }) => (
    <View style={{ backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, marginBottom: 10 }}>
      <Text style={{ fontWeight: '700' }}>{item.requests.product_name}</Text>
      <Text style={{ color: '#555' }}>Aéroport : {item.requests.airport}</Text>
      <Text style={{ color: '#777', marginBottom: 8 }}>Statut : {item.status}</Text>

      <TouchableOpacity
        onPress={() => openChat(item.id)}
        style={{
          backgroundColor: '#007bff',
          paddingVertical: 10,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>💬 Ouvrir le chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Offres reçues</Text>
      {offers.length === 0 ? (
        <Text>Aucune offre reçue pour le moment.</Text>
      ) : (
        <FlatList data={offers} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} />
      )}
    </View>
  );
}
