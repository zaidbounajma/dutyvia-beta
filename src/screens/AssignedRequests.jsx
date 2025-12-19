// src/screens/AssignedRequests.js
import { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import supabase from '../supabase';

export default function AssignedRequests({ navigation }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) return;

      // Récupère tous les matches + demandes liées
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id, status, created_at, traveler_id,
          requests:request_id (
            id, requester_id, product_name, brand, category, quantity, airport, meetup_location, status, created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (!error) {
        // Ne garder que les matches où je suis owner OU voyageur
        const mine = (data || []).filter(m =>
          m.traveler_id === uid || m.requests?.requester_id === uid
        );
        setItems(mine);
      }
    })();
  }, []);

  const renderItem = ({ item }) => {
    const r = item.requests;
    return (
      <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2f7', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <Text style={{ fontWeight: '700', color: '#0A2540' }}>
          {r?.product_name}{r?.brand ? ` • ${r.brand}` : ''}
        </Text>
        <Text style={{ color: '#5B7083', marginBottom: 6 }}>
          {r?.category} • Qté {r?.quantity} • {r?.airport}
        </Text>
        <Text style={{ fontSize: 12, color: '#5B7083', marginBottom: 8 }}>
          Match: {item.status} • Demande: {r?.status} • {new Date(item.created_at).toLocaleString()}
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Chat', { matchId: item.id })}
          style={{ backgroundColor: '#1565C0', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Ouvrir le chat</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10 }}>Demandes assignées</Text>
      <FlatList data={items} keyExtractor={(i) => String(i.id)} renderItem={renderItem} />
    </View>
  );
}
