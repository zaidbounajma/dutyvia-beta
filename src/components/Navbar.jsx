import { useAuth } from "../auth/AuthContext.jsx";

export default function Navbar({ activeTab, onChangeTab }) {
  const { signOut } = useAuth();

  function tabBtn(name, label) {
    return (
      <button
        key={name}
        className={`tab-btn ${activeTab === name ? "active" : ""}`}
        onClick={() => onChangeTab(name)}
      >
        {label}
      </button>
    );
  }

  return (
    <header className="app-header">
      {/* ligne titre + badge + logout */}
      <div className="app-title-row">
        <div className="app-title">
          <span>DutyFree — Web</span>
          <span className="app-title-badge">alpha</span>
        </div>

        <button className="logout-btn" onClick={signOut}>
          Déconnexion
        </button>
      </div>

      {/* ligne des onglets */}
      <div className="nav-row">
        {tabBtn("catalog", "Catalogue")}
        {tabBtn("cart", "Panier")}
        {tabBtn("payment", "Paiement")}
        {tabBtn("buyer", "Acheteur")}
        {tabBtn("traveler", "Voyageur")}
        {tabBtn("chats", "Chats")}
      </div>
    </header>
  );
}
