// src/screens/RequestsList.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import supabase from '../../supabase';

export default function RequestsList({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastError, setLastError] = useState('');

  const load = useCallback(async () => {
    setRefreshing(true);
    setLastError('');
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(
          `
            id,
            product_name,
            brand,
            category,
            airport,
            meetup_location,
            max_price,
            price_at_request,
            status,
            match_id,
            created_at
          `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (e) {
      console.error('Requests load error:', e);
      setLastError(String(e?.message ?? e));
      Alert.alert('Erreur', String(e?.message ?? e));
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Séparer en 2 listes
  const openRequests = requests.filter((r) => (r.status || '').toLowerCase() === 'open');
  const acceptedRequests = requests.filter(
    (r) => (r.status || '').toLowerCase() === 'accepted' && r.match_id != null
  );

  function createDemo() {
    navigation.navigate('CreateRequestFromProduct', {
      product: {
        id: 1001,
        name: 'Marlboro Gold Carton',
        brand: 'Marlboro',
        category: 'cigarettes',
        unit: 'carton',
        max_quantity: 5,
        base_price: 40,
      },
    });
  }

  const Card = ({ req, footer }) => (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
      }}
    >
      <Text style={{ fontWeight: '800', fontSize: 16, color: '#0A2540' }}>
        {req.product_name || '—'} {req.brand ? `• ${req.brand}` : ''}
      </Text>
      <Text style={{ color: '#475569', marginTop: 2 }}>
        {req.category || '—'} • Max {req.max_price ?? '—'} € {req.price_at_request ? `(catalogue: ${req.price_at_request} €)` : ''}
      </Text>
      <Text style={{ color: '#64748b', marginTop: 2 }}>
        Aéroport : {req.airport || '—'} • Lieu : {req.meetup_location || '—'}
      </Text>
      <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
        Statut : {req.status || '—'} • {new Date(req.created_at).toLocaleString()}
      </Text>
      {footer}
    </View>
  );

  const renderOpen = ({ item }) => (
    <Card
      req={item}
      footer={
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateRequestFromProduct', { product: {
              id: item.product_id ?? null,
              name: item.product_name,
              brand: item.brand,
              category: item.category,
              unit: '—',
              max_quantity: 5,
              base_price: item.price_at_request ?? item.max_price ?? 0,
            } })}
            style={{ backgroundColor: '#334155', padding: 10, borderRadius: 10, flex: 1 }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>
              Dupliquer / Modifier
            </Text>
          </TouchableOpacity>
        </View>
      }
    />
  );

  const renderAccepted = ({ item }) => (
    <Card
      req={item}
      footer={
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <TouchableOpacity
            onPress={() => {
              if (!item.match_id) {
                Alert.alert('Info', "Cette demande n'a pas encore de match.");
                return;
              }
              navigation.navigate('Chat', { matchId: item.match_id, role: 'buyer' });
            }}
            style={{ backgroundColor: '#1565C0', padding: 10, borderRadius: 10, flex: 1 }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>
              💬 Ouvrir le chat
            </Text>
          </TouchableOpacity>
        </View>
      }
    />
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={{ marginTop: 8 }}>Chargement de tes demandes…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 12 }}>
      {/* Actions globales */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={load}
          style={{ backgroundColor: '#0A2540', padding: 12, borderRadius: 10, flex: 1 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>⟳ Recharger</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Catalog')}
          style={{ backgroundColor: '#1947E5', padding: 12, borderRadius: 10, flex: 1 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>
            📦 Ouvrir le catalogue
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={createDemo}
          style={{ backgroundColor: '#10B981', padding: 12, borderRadius: 10, flex: 1 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>
            ➕ Créer (démo) Marlboro
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('TravelerRequests')}
          style={{ backgroundColor: '#0db167', padding: 12, borderRadius: 10, flex: 1 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>
            ✈️ Mode Voyageur
          </Text>
        </TouchableOpacity>
      </View>

      {lastError ? (
        <Text style={{ color: 'red', marginBottom: 8, fontSize: 12 }}>
          Debug: {lastError}
        </Text>
      ) : null}

      {/* Section : demandes ouvertes */}
      <Text style={{ fontWeight: '800', fontSize: 18, marginBottom: 8, color: '#0A2540' }}>
        Mes demandes ouvertes
      </Text>
      {openRequests.length === 0 ? (
        <Text style={{ color: '#64748b', marginBottom: 16 }}>
          Aucune demande ouverte pour le moment.
        </Text>
      ) : (
        <FlatList
          data={openRequests}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderOpen}
          scrollEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        />
      )}

      {/* Section : demandes acceptées (matchées) */}
      <Text style={{ fontWeight: '800', fontSize: 18, marginVertical: 8, color: '#0A2540' }}>
        Mes demandes acceptées
      </Text>
      {acceptedRequests.length === 0 ? (
        <Text style={{ color: '#64748b' }}>
          Aucune demande acceptée pour l’instant.
        </Text>
      ) : (
        <FlatList
          data={acceptedRequests}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderAccepted}
          scrollEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        />
      )}
    </ScrollView>
  );
}
