// src/screens/SignIn.js
import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import supabase from '../../supabase';

export default function SignIn({ navigation }) {
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Tente de récupérer une session déjà persistée
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      if (data.session?.user) {
        navigation.replace('RequestsList'); // déjà connecté → on passe à l’app
      }
    });

    // Écoute les changements de session
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) navigation.replace('RequestsList');
    });

    return () => sub?.subscription?.unsubscribe();
  }, [navigation]);

  async function signInAnon() {
    try {
      setBusy(true);
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;

      // On a bien un user anonyme → on route vers la liste
      if (data?.user) {
        Alert.alert('Connexion OK', `UID: ${data.user.id.slice(0, 8)}…`);
        navigation.replace('RequestsList');
      } else {
        Alert.alert('Info', 'Utilisateur non retourné.');
      }
    } catch (e) {
      Alert.alert('Erreur connexion', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
        DutyFree Link ✈️
      </Text>

      <Text style={{ textAlign: 'center', color: '#6b7280' }}>
        Connexion anonyme pour tests (dev). Ton UID sera utilisé pour les RLS.
      </Text>

      <TouchableOpacity
        disabled={busy}
        onPress={signInAnon}
        style={{
          backgroundColor: busy ? '#93c5fd' : '#1d4ed8',
          padding: 14,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>
          {busy ? 'Connexion…' : 'Continuer en anonyme'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
