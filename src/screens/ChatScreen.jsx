import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { sendMessage } from '../logic/sendMessage';
import supabase from '../supabase';

export default function ChatScreen({ route }) {
  const { matchId, role } = route.params;
  const [me, setMe] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data?.user ?? null));
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, body, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) Alert.alert('Erreur', error.message);
    setMsgs(data || []);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`msg-${matchId}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:`match_id=eq.${matchId}` },
        () => load()
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [matchId]);

  async function onSend() {
    try {
      await sendMessage({ matchId, body: text });
      setText('');
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ padding:12 }}>
        <Text style={{ fontWeight:'800' }}>Messagerie — #{matchId}</Text>
        <Text style={{ color:'#64748b' }}>Rôle : {role}</Text>
      </View>

      <ScrollView style={{ flex:1, paddingHorizontal:12 }}>
        {msgs.length === 0 ? (
          <Text style={{ color:'#94a3b8', textAlign:'center', marginTop:20 }}>Aucun message…</Text>
        ) : msgs.map(m => {
          const mine = me && m.sender_id === me.id;
          return (
            <View key={m.id} style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginVertical:6 }}>
              <View style={{
                backgroundColor: mine ? '#1D4ED8' : '#E5E7EB',
                padding:10, borderRadius:10, maxWidth:'80%'
              }}>
                <Text style={{ color: mine ? '#fff' : '#111827' }}>{m.body}</Text>
                <Text style={{ color: mine ? '#bfdbfe' : '#6b7280', fontSize:12 }}>
                  {new Date(m.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection:'row', padding:10, gap:8 }}>
        <TextInput
          value={text} onChangeText={setText} placeholder="Écrire un message…"
          style={{ flex:1, backgroundColor:'#F3F4F6', borderRadius:10, paddingHorizontal:12, paddingVertical:10 }}
        />
        <TouchableOpacity onPress={onSend} style={{ backgroundColor:'#10B981', paddingHorizontal:16, justifyContent:'center', borderRadius:10 }}>
          <Text style={{ color:'#fff', fontWeight:'700' }}>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
