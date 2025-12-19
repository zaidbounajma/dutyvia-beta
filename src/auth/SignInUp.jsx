import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function SignIn() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [mode, setMode] = useState('signin');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email, pass);
    if (error) setError(error.message);
  };

  return (
    <div style={{maxWidth:420, margin:'60px auto'}}>
      <h2>{mode==='signin' ? 'Connexion' : 'Créer un compte'}</h2>
      <form onSubmit={submit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" required />
        <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Mot de passe" type="password" required />
        {error && <p style={{color:'tomato'}}>{error}</p>}
        <button type="submit">{mode==='signin' ? 'Se connecter' : 'S’inscrire'}</button>
      </form>
      <button style={{marginTop:8}} onClick={()=>setMode(mode==='signin'?'signup':'signin')}>
        {mode==='signin' ? 'Créer un compte' : 'Déjà inscrit ? Se connecter'}
      </button>
    </div>
  );
}
