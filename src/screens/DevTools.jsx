// src/screens/DevTools.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, ScrollView, Text, TouchableOpacity } from 'react-native';
import supabase from '../supabase';

export default function DevTools() {
  async function resetLocal() {
    try {
      await supabase.auth.signOut();      // coupe la session
      await AsyncStorage.clear();          // vide le cache/app storage
      Alert.alert('OK', 'Cache et session vidés. Redémarre l’app.');
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontWeight: '800', fontSize: 18, marginBottom: 12 }}>
        Outils de debug
      </Text>

      <TouchableOpacity
        onPress={resetLocal}
        style={{ backgroundColor: '#0B3D5E', padding: 14, borderRadius: 10 }}
      >
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          🔥 Réinitialiser cache + session
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
