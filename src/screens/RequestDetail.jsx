import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, FlatList, Alert } from 'react-native';
import { supabase } from '../../supabase';

export default function RequestDetail({ route, navigation }) {
  const { id } = route.params;
  const [req, setReq] = useState(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    const { data, error } = await supabase.from('requests').select('*').eq('id', id).single();
    if (!error) setReq(data);
  };

  const sendMessage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Alert.alert('Non connecté');
    const { error } = await supabase.from('messages').insert({ request_id: id, sender_id: user.id, body: message });
    if (error) Alert.alert('Erreur', error.message);
    else setMessage('');
  };

  const accept = async () => {
    const { error } = await supabase.from('requests').update({ status: 'accepted' }).eq('id', id);
    if (error) Alert.alert('Erreur', error.message);
    else load();
  };

  const complete = async () => {
    const { error } = await supabase.from('requests').update({ status: 'completed' }).eq('id', id);
    if (error) Alert.alert('Erreur', error.message);
    else {
      Alert.alert('Merci', 'Transfert validé (escrow simulé)');
      navigation.goBack();
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {!req ? <Text>Chargement…</Text> : (
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>{req.product_name} {req.brand ? '— ' + req.brand : ''}</Text>
          <Text>Catégorie: {req.category} | Qté: {req.quantity}</Text>
          <Text>Prix max: {req.max_price} €</Text>
          <Text>Aéroport: {req.airport}</Text>
          <Text>Lieu: {req.meetup_location}</Text>
          <Text>Status: {req.status}</Text>

          {req.category === 'cigarettes' && (
            <View style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginVertical: 12 }}>
              <Text style={{ fontWeight: '600' }}>⚠️ Avertissement</Text>
              <Text>
                Produits du tabac réservés aux 18+. Des limites douanières s’appliquent selon le pays.
                Assurez-vous que la quantité respecte les règles locales (MVP: ≤ 200 unités).
              </Text>
            </View>
          )}

          <View style={{ height: 12 }} />
          <Text style={{ fontWeight: '600' }}>Chat</Text>
          <FlatList
            style={{ flex: 1, marginVertical: 8 }}
            data={[]}
            renderItem={() => null}
            ListEmptyComponent={<Text>(Chat minimal à implémenter – table `messages` prête)</Text>}
          />
          <TextInput
            placeholder="Votre message…"
            value={message}
            onChangeText={setMessage}
            style={{ borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 }}
          />
          <Button title="Envoyer" onPress={sendMessage} />
          <View style={{ height: 12 }} />
          {req.status === 'open' && <Button title="Accepter la demande" onPress={accept} />}
          {req.status === 'accepted' && <Button title="Confirmer la remise (libérer escrow)" onPress={complete} />}
        </View>
      )}
    </View>
  );
}
