import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity } from 'react-native';
import supabase from '../supabase';

export default function TravelerChats({ navigation }) {
  const [rows, setRows] = useState([]);

  async function load() {
    const user = (await supabase.auth.getUser())?.data?.user;
    if (!user) return;

    const { data, error } = await supabase
      .from('v_orders')
      .select('match_id, product_name, brand, category, total_due_buyer, meetup_location')
      .eq('traveler_id', user.id)
      .order('match_id', { ascending:false });

    if (error) Alert.alert('Erreur', error.message);
    setRows(data || []);
  }

  useEffect(() => { load(); }, []);

  return (
    <ScrollView style={{ flex:1, backgroundColor:'#fff' }} contentContainerStyle={{ padding:12 }}>
      <Text style={{ fontWeight:'800', marginBottom:8 }}>Mes chats (Voyageur)</Text>
      {rows.length === 0 ? (
        <Text style={{ color:'#6b7280' }}>Aucun chat.</Text>
      ) : rows.map(x => (
        <TouchableOpacity
          key={x.match_id}
          onPress={() => navigation.navigate('Chat', { matchId:x.match_id, role:'traveler' })}
          style={{ backgroundColor:'#F3F4F6', padding:12, borderRadius:10, marginBottom:10 }}
        >
          <Text style={{ fontWeight:'700' }}>{x.product_name} • {x.brand}</Text>
          <Text style={{ color:'#64748b' }}>{x.category} • RDV: {x.meetup_location}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
