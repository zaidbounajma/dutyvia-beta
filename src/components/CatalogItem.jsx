// src/components/CatalogItem.jsx

export default function CatalogItem({ product, onCreateRequest }) {
  const {
    id, brand, name, category, unit,
    base_price_eur, buyer_price_eur, platform_commission_eur
  } = product;

  return (
    <div style={{
      border: '1px solid #333', borderRadius: 10, padding: 14, marginBottom: 12,
      background: '#14181b'
    }}>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{brand} — {name}</div>
      <div style={{ opacity: 0.8, marginTop: 4 }}>{category} • {unit}</div>
      <div style={{ marginTop: 8 }}>
        <div>Prix base: <b>{base_price_eur.toFixed(2)} €</b></div>
        <div>Prix acheteur: <b>{buyer_price_eur.toFixed(2)} €</b></div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>
          Commission plateforme (info): {platform_commission_eur.toFixed(2)} €
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <button onClick={() => onCreateRequest(product)}
          style={{
            background: '#2b6ef2', color: 'white', border: 0,
            padding: '8px 12px', borderRadius: 8, cursor: 'pointer'
          }}>
          Créer une demande
        </button>
      </div>
    </div>
  );
}
