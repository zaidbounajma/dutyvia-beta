import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createRequestFromProduct } from '../logic/createRequest';

export default function CreateRequestFromProduct({ route, navigation }) {
  const product = route?.params?.product || {
    id: null, brand: 'Marque', name: 'Produit', category:'autre', base_price_eur: 1, unit:'-', max_quantity: 5
  };
  const [airport, setAirport] = useState('CDG');
  const [meetup, setMeetup] = useState('CDG T2, Hall Arrivées, 18:00-18:30');
  const [qty, setQty] = useState(1);

  const inc = () => setQty(q => Math.min(q + 1, product.max_quantity || 5));
  const dec = () => setQty(q => Math.max(1, q - 1));

  async function onCreate() {
    try {
      const rec = await createRequestFromProduct(product, { airport, meetup, qty });
      Alert.alert('✅ Demande créée', `ID: ${rec.id}`);
      navigation.navigate('BuyerRequests');
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  }

  return (
    <ScrollView style={{ flex:1, backgroundColor:'#fff' }} contentContainerStyle={{ padding:16 }}>
      <Text style={{ fontSize:18, fontWeight:'800' }}>
        {product.name} • {product.brand}
      </Text>
      <Text style={{ color:'#64748b', marginBottom:12 }}>
        {product.category} • {product.unit} • Prix catalogue: {product.base_price_eur} €
      </Text>

      <Text style={{ fontSize:12, color:'#64748b' }}>Quantité</Text>
      <View style={{ flexDirection:'row', alignItems:'center', marginBottom:12 }}>
        <TouchableOpacity onPress={dec} style={{ padding:10, backgroundColor:'#e6f2ff', borderRadius:8, marginRight:8 }}><Text>-</Text></TouchableOpacity>
        <Text style={{ minWidth:40, textAlign:'center', fontSize:16 }}>{qty}</Text>
        <TouchableOpacity onPress={inc} style={{ padding:10, backgroundColor:'#e6f2ff', borderRadius:8, marginLeft:8 }}><Text>+</Text></TouchableOpacity>
      </View>

      <Text style={{ fontSize:12, color:'#64748b' }}>Aéroport</Text>
      <TextInput
        value={airport} onChangeText={setAirport} autoCapitalize="characters" placeholder="CDG/ORY"
        style={{ backgroundColor:'#F8FAFC', borderColor:'#e5e7eb', borderWidth:1, borderRadius:10, padding:12, marginBottom:10 }}
      />

      <Text style={{ fontSize:12, color:'#64748b' }}>Lieu/Heure rencontre</Text>
      <TextInput
        value={meetup} onChangeText={setMeetup} placeholder="Lieu+créneau"
        style={{ backgroundColor:'#F8FAFC', borderColor:'#e5e7eb', borderWidth:1, borderRadius:10, padding:12, marginBottom:16 }}
      />

      <TouchableOpacity onPress={onCreate} style={{ backgroundColor:'#1565C0', padding:14, borderRadius:12 }}>
        <Text style={{ color:'#fff', textAlign:'center', fontWeight:'700' }}>Créer la demande</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
