// src/components/ProductCard.jsx

export default function ProductCard({ p, onAdd }) {
  return (
    <div style={{
      border: "1px solid #eee",
      borderRadius: 12,
      padding: 16,
      display: "flex",
      gap: 12,
      alignItems: "center",
      background: "#111",
      color: "#eee"
    }}>
      <img
        src={p.image_url || "https://via.placeholder.com/80"}
        alt={p.name}
        width={80}
        height={80}
        style={{ objectFit: "cover", borderRadius: 8 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          {p.brand ? `${p.brand} — ` : ""}{p.name}
        </div>
        <div style={{ opacity: 0.7, marginTop: 4 }}>{p.category || "Autre"}</div>
        <div style={{ marginTop: 8, fontWeight: 700 }}>{Number(p.base_price_eur).toFixed(2)} €</div>
      </div>
      <button onClick={() => onAdd(p)} style={{
        padding: "10px 14px", borderRadius: 8, border: "none",
        background: "#2563eb", color: "white", cursor: "pointer"
      }}>
        Ajouter
      </button>
    </div>
  );
}
