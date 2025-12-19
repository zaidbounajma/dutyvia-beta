
export default function RootTest() {
  return (
    <div
      style={{
        backgroundColor: "#111827",
        color: "white",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
        HELLO 👋
      </h1>
      <p style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>
        Si tu vois ce message, le moteur React tourne.
        <br />
        Si tu ne vois pas ce message et que l'écran reste bleu/vide,
        alors le problème est AVANT React.
      </p>
    </div>
  );
}
