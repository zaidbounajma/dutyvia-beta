import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../../supabase';

const categories = ['parfums','cosmetiques','chocolats','cigarettes'];

export default function CreateRequest({ navigation }) {
  const [productName, setProductName] = useState('Parfum 100 ml');
  const [brand, setBrand] = useState('');
  const [maxPrice, setMaxPrice] = useState('70');
  const [meetup, setMeetup] = useState('CDG T2, Hall Arrivées, 18:00-18:30');
  const [airport, setAirport] = useState('CDG');
  const [category, setCategory] = useState('parfums');
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    if (category === 'cigarettes') {
      Alert.alert(
        'Attention — 18+ & limites douanières',
        'Les produits du tabac sont réservés aux majeurs. Des limites de quantité s’appliquent selon le pays. Pour le MVP, la quantité est limitée à 200 unités.'
      );
    }
  }, [category]);

  const CategoryButton = ({ value }) => (
    <TouchableOpacity
      onPress={() => setCategory(value)}
      style={{
        padding: 10, borderWidth: 1, borderRadius: 8, marginRight: 8,
        backgroundColor: category === value ? '#e0e0e0' : 'transparent'
      }}
    >
      <Text style={{ textTransform: 'capitalize' }}>{value}</Text>
    </TouchableOpacity>
  );

  // ====== VERSION STABLE + DEBUG DE LA FONCTION SAVE ======
  const save = async () => {
    try {
      console.log('[CreateRequest] submit clicked');

      // Vérif session
      const { data: { session }, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) console.error('Session error:', sessErr);
      if (!session?.user?.id) {
        Alert.alert('Non connecté', 'Clique “Continuer” après le mail de connexion, puis réessaie.');
        return;
      }

      // Normalisation champs
      const qty = Math.max(1, parseInt(quantity || '1', 10));
      const price = Number(maxPrice);
      if (!price || price <= 0) {
        Alert.alert('Prix invalide', 'Indique un nombre > 0 (sans €).');
        return;
      }
      if (category === 'cigarettes' && qty > 200) {
        Alert.alert('Limite dépassée', 'Pour le MVP, la quantité de cigarettes est limitée à 200.');
        return;
      }
      if (!airport || airport.toUpperCase() !== 'CDG') {
        Alert.alert('Aéroport', 'Pour l’instant la liste est filtrée sur CDG. Mets Aéroport = CDG.');
        return;
      }

      console.log('Will insert:', {
        requester_id: session.user.id,
        airport, product_name: productName, brand, category,
        quantity: qty, max_price: price, meetup_location: meetup
      });

      const { error } = await supabase.from('requests').insert({
        requester_id: session.user.id,
        airport: airport.toUpperCase(),
        product_name: productName,
        brand,
        category,
        quantity: qty,
        max_price: price,
        meetup_location: meetup,
        status: 'open'
      });

      if (error) {
        console.error('Insert error:', error);
        Alert.alert('Erreur', 'Création impossible : ' + (error.message || 'inconnue'));
        return;
      }

      Alert.alert('OK', 'Demande créée');
      navigation.navigate('RequestsList');
    } catch (e) {
      console.error('Unexpected error:', e);
      Alert.alert('Erreur inattendue', e?.message || 'Voir console');
    }
  };
  // ====== FIN SAVE ======

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, marginBottom: 8 }}>Créer une demande</Text>

      <Text style={{ marginBottom: 6 }}>Catégorie</Text>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        {categories.map((c) => <CategoryButton key={c} value={c} />)}
      </View>

      <TextInput
        placeholder="Produit"
        value={productName}
        onChangeText={setProductName}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 8 }}
      />
      <TextInput
        placeholder="Marque (optionnel)"
        value={brand}
        onChangeText={setBrand}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 8 }}
      />
      <TextInput
        placeholder="Quantité (unités)"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 8 }}
      />
      <TextInput
        placeholder="Prix max (€)"
        value={maxPrice}
        onChangeText={setMaxPrice}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 8 }}
      />
      <TextInput
        placeholder="Lieu/Créneau"
        value={meetup}
        onChangeText={setMeetup}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 8 }}
      />
      <TextInput
        placeholder="Aéroport"
        value={airport}
        onChangeText={setAirport}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 8 }}
      />

      <Button title="Enregistrer" onPress={save} />
    </View>
  );
}