// src/pages/Home.jsx
import { Link } from 'react-router-dom';

export default function Home() {
  const box = {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    marginTop: 16,
  };
  const btn = {
    padding: '14px 16px',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    background: '#0b3d5e',
    color: '#fff',
    textAlign: 'center',
    textDecoration: 'none',
    fontWeight: 600,
  };

  return (
    <>
      <p>Choisis un mode :</p>
      <div style={box}>
        <Link to="/buyer" style={btn}>🛍️ Acheteur</Link>
        <Link to="/traveler" style={btn}>🧳 Voyageur</Link>
        <Link to="/assigned" style={btn}>📌 Demandes assignées</Link>
        <Link to="/create" style={btn}>➕ Créer une demande</Link>
      </div>
    </>
  );
}
