import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import supabase from '../supabase';

export default function BuyerRequests({ navigation }) {
  const [rows, setRows] = useState([]);

  async function load() {
    const user = (await supabase.auth.getUser())?.data?.user;
    if (!user) return;

    const { data, error } = await supabase
      .from('v_orders')
      .select('*')
      .eq('requester_id', user.id)
      .order('match_id', { ascending:false });

    if (error) Alert.alert('Erreur', error.message);
    setRows(data || []);
  }

  useEffect(() => { load(); }, []);

  return (
    <ScrollView style={{ flex:1, backgroundColor:'#fff' }} contentContainerStyle={{ padding:12 }}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Catalog')}
        style={{ backgroundColor:'#2563EB', padding:12, borderRadius:8, marginBottom:12 }}
      >
        <Text style={{ color:'#fff', textAlign:'center' }}>Créer depuis le catalogue</Text>
      </TouchableOpacity>

      <Text style={{ fontWeight:'800', marginBottom:8 }}>Demandes assignées (Acheteur)</Text>
      {rows.length === 0 ? (
        <Text style={{ color:'#6b7280' }}>Aucune demande assignée pour le moment.</Text>
      ) : rows.map(o => (
        <View key={o.match_id} style={{ backgroundColor:'#F3F4F6', borderRadius:10, padding:12, marginBottom:10 }}>
          <Text style={{ fontWeight:'700' }}>{o.product_name} • {o.brand}</Text>
          <Text style={{ color:'#64748b', marginBottom:8 }}>
            {o.category} • {o.quantity} pcs • Total dû: {o.total_due_buyer ?? '—'} €
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Chat', { matchId:o.match_id, role:'buyer' })}
            style={{ backgroundColor:'#1D4ED8', padding:12, borderRadius:8 }}
          >
            <Text style={{ color:'#fff', textAlign:'center' }}>Ouvrir le chat</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
