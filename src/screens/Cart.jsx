// src/screens/Cart.jsx
import React from "react";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { cartItems, totals, setQuantity, removeFromCart, clearCart } =
    useCart();

  const hasItems = cartItems && cartItems.length > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Panier</div>
          <div className="page-subtitle">
            Vérifiez vos articles avant de passer au paiement.
          </div>
        </div>
      </div>

      {!hasItems ? (
        <p>Votre panier est vide pour le moment.</p>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>PU (€)</th>
                <th>Qté</th>
                <th>Total (€)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => {
                const lineTotal =
                  (item.unit_price_eur || 0) * (item.quantity || 0);
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.unit_price_eur.toFixed(2)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                          className="btn-qty"
                          onClick={() =>
                            setQuantity(item.id, (item.quantity || 0) - 1)
                          }
                        >
                          -
                        </button>
                        <span>{item.quantity || 0}</span>
                        <button
                          className="btn-qty"
                          onClick={() =>
                            setQuantity(item.id, (item.quantity || 0) + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{lineTotal.toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Retirer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="totals">
            <div className="totals-row">
              <span>Sous-total</span>
              <span>{totals.subtotal.toFixed(2)} €</span>
            </div>
            <div className="totals-row">
              <span>Commission (10%)</span>
              <span>{totals.fee.toFixed(2)} €</span>
            </div>
            <div className="totals-row totals-row--strong">
              <span>Total</span>
              <span>{totals.total.toFixed(2)} €</span>
            </div>
          </div>

          <div className="actions-row">
            <button className="btn btn-secondary" onClick={clearCart}>
              Vider le panier
            </button>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              Passez à l’onglet <strong>Checkout</strong> pour payer.
            </span>
          </div>
        </>
      )}
    </>
  );
}
