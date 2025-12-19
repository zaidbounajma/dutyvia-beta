import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Erreur UI:", error, info);
    this.setState({ info });
  }
  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ maxWidth: 900, margin: "40px auto", padding: "16px", border: "2px solid #c00", background: "#fee", color: "#900", borderRadius: "6px", fontFamily:"monospace", whiteSpace:"pre-wrap" }}>
        <h2 style={{marginTop:0}}>⚠️ Erreur détectée</h2>
        <div>{String(this.state.error)}</div>
        {this.state.info && (
          <>
            <h3>Détails</h3>
            <div>{this.state.info.componentStack}</div>
          </>
        )}
        <p style={{fontSize:"14px",color:"#555"}}>👉 Si tu vois ça, envoie-moi exactement le bloc ci-dessus.</p>
      </div>
    );
  }
}
