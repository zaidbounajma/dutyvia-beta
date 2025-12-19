// src/screens/Catalog.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useCart } from "../context/CartContext";

const CITY_OPTIONS = [
  "Paris",
  "Lyon",
  "Marseille",
  "Lille",
  "Bordeaux",
  "Toulouse",
  "Nice",
  "Nantes",
  "Strasbourg",
  "Montpellier",
  "Autre",
];

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Filtre catégorie
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Formulaires "Créer une demande"
  const [openRequestForId, setOpenRequestForId] = useState(null);
  const [requestForms, setRequestForms] = useState({});

  // Nom acheteur (stocké localement)
  const [buyerName, setBuyerName] = useState("");

  const [requestActionMsg, setRequestActionMsg] = useState("");
  const [requestActionError, setRequestActionError] = useState("");
  const [creatingRequestForId, setCreatingRequestForId] = useState(null);

  const cartCtx = useCart();
  const addToCart = cartCtx?.addToCart || (() => {});

  // Charger buyerName depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dutyvia_buyer_name");
      if (raw && raw.trim().length > 0) {
        setBuyerName(raw.trim());
      }
    } catch {
      // ignore
    }
  }, []);

  // Sauvegarder buyerName à chaque changement
  useEffect(() => {
    try {
      if (buyerName && buyerName.trim().length > 0) {
        localStorage.setItem("dutyvia_buyer_name", buyerName.trim());
      }
    } catch {
      // ignore
    }
  }, [buyerName]);

  // Chargement des produits
  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("category", { ascending: true })
          .order("name", { ascending: true });

        if (error) throw error;
        if (!isMounted) return;

        const cleaned =
          (data || []).filter((p) => {
            const price = Number(p.unit_price_eur || p.base_price_eur || 0);
            return price > 0;
          }) || [];

        setProducts(cleaned);
      } catch (e) {
        console.error("❌ Erreur chargement produits:", e);
        if (isMounted) {
          setErrorMsg(
            "Impossible de charger le catalogue pour le moment."
          );
          setProducts([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "ALL") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const formatEuro = (val) => {
    const n = Number(val || 0);
    if (Number.isNaN(n)) return "—";
    return `${n.toFixed(2)} €`;
  };

  const getProductPrice = (p) =>
    Number(p.unit_price_eur || p.base_price_eur || 0);

  const getFormState = (productId, defaultPrice) => {
    const existing = requestForms[productId];
    if (existing) return existing;

    return {
      targetCity: "",
      maxBudget: defaultPrice || 0,
      quantity: 1,
      details: "",
    };
  };

  const updateFormField = (productId, field, value) => {
    setRequestForms((prev) => {
      const current = getFormState(productId, undefined);
      return {
        ...prev,
        [productId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const openRequestForm = (product) => {
    const price = getProductPrice(product);
    setOpenRequestForId(product.id);

    setRequestForms((prev) => {
      if (prev[product.id]) return prev;
      return {
        ...prev,
        [product.id]: {
          targetCity: "",
          maxBudget: price,
          quantity: 1,
          details: "",
        },
      };
    });
  };

  const cancelRequestForm = (productId) => {
    setOpenRequestForId((current) =>
      current === productId ? null : current
    );
    // On ne supprime pas les valeurs, pour laisser l'utilisateur revenir
  };

  const handleCreateRequest = async (product) => {
    setRequestActionError("");
    setRequestActionMsg("");

    const productId = product.id;
    const price = getProductPrice(product);
    const form = getFormState(productId, price);

    const maxBudgetNum = Number(form.maxBudget || 0);
    const qtyNum = Number(form.quantity || 1);

    if (!form.targetCity || form.targetCity.trim().length === 0) {
      setRequestActionError(
        "Merci de sélectionner une ville de rendez-vous pour la demande."
      );
      return;
    }

    if (!maxBudgetNum || maxBudgetNum <= 0) {
      setRequestActionError(
        "Merci de saisir un budget maximum valide pour la demande."
      );
      return;
    }

    if (!qtyNum || qtyNum <= 0) {
      setRequestActionError(
        "Merci de saisir une quantité valide pour la demande."
      );
      return;
    }

    setCreatingRequestForId(productId);

    try {
      const payload = {
        product_id: product.id,
        product_name: product.name,
        product_label: product.label || product.name,
        quantity: qtyNum,
        max_budget_eur: maxBudgetNum,
        target_city: form.targetCity || null,
        details: form.details || null,
        status: "open",
        requester_name:
          buyerName && buyerName.trim().length > 0
            ? buyerName.trim()
            : null,
      };

      const { data, error } = await supabase
        .from("requests")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      const msg = `Demande créée pour "${product.name}" à destination de ${form.targetCity}, budget max ${formatEuro(
        maxBudgetNum
      )}.`;
      setRequestActionMsg(msg);
      window.alert(msg);

      // On ferme le formulaire mais on garde les valeurs si besoin
      setOpenRequestForId(null);
    } catch (e) {
      console.error("❌ Erreur création demande:", e);
      setRequestActionError(
        e.message || "Erreur lors de la création de la demande."
      );
    } finally {
      setCreatingRequestForId(null);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Catalogue Dutyvia</div>
          <div className="page-subtitle">
            Choisissez un produit à acheter en duty free ou créez une
            demande pour qu’un voyageur vous le ramène.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minWidth: 220,
          }}
        >
          <label
            style={{
              fontSize: 11,
              color: "#a3a092",
            }}
          >
            Votre prénom (affiché aux voyageurs)
          </label>
          <input
            type="text"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder="Ex : Zaid"
            style={{
              fontSize: 12,
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #374151",
              backgroundColor: "#020617",
              color: "#e5e7eb",
            }}
          />
        </div>
      </div>

      {/* Filtres catégories + messages globaux */}
      <div style={{ marginBottom: 10 }}>
        {errorMsg && (
          <div
            className="alert-error"
            style={{ marginBottom: 8, whiteSpace: "pre-wrap" }}
          >
            ❌ {errorMsg}
          </div>
        )}
        {requestActionError && (
          <div
            className="alert-error"
            style={{ marginBottom: 8, whiteSpace: "pre-wrap" }}
          >
            ❌ {requestActionError}
          </div>
        )}
        {requestActionMsg && (
          <div className="alert-success" style={{ marginBottom: 8 }}>
            ✅ {requestActionMsg}
          </div>
        )}

        {categories.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <button
              type="button"
              className={
                selectedCategory === "ALL"
                  ? "chip chip--active"
                  : "chip"
              }
              onClick={() => setSelectedCategory("ALL")}
            >
              Tout
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={
                  selectedCategory === cat ? "chip chip--active" : "chip"
                }
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p>Chargement du catalogue...</p>
      ) : filteredProducts.length === 0 ? (
        <p>Aucun produit disponible pour le moment.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {filteredProducts.map((p) => {
            const price = getProductPrice(p);
            const form = getFormState(p.id, price);
            const isFormOpen = openRequestForId === p.id;

            return (
              <article key={p.id} className="card product-card">
                <div className="card-header">
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#f6f0da",
                    }}
                  >
                    {p.name}
                  </div>
                  {p.category && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                      }}
                    >
                      {p.category}
                    </div>
                  )}
                </div>

                {p.short_description && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#c3bda5",
                      marginBottom: 6,
                    }}
                  >
                    {p.short_description}
                  </div>
                )}

                <div
                  style={{
                    fontSize: 13,
                    color: "#f6f0da",
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  {formatEuro(price)}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: isFormOpen ? 8 : 0,
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      addToCart({
                        id: p.id,
                        name: p.name,
                        unit_price_eur: price,
                        quantity: 1,
                      })
                    }
                  >
                    Ajouter au panier
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      isFormOpen
                        ? cancelRequestForm(p.id)
                        : openRequestForm(p)
                    }
                  >
                    {isFormOpen
                      ? "Fermer la demande"
                      : "Créer une demande"}
                  </button>
                </div>

                {isFormOpen && (
                  <div
                    style={{
                      marginTop: 6,
                      paddingTop: 6,
                      borderTop: "1px dashed rgba(75,85,99,0.7)",
                      fontSize: 12,
                      color: "#e5e7eb",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#a3a092",
                        marginBottom: 2,
                      }}
                    >
                      Détail de la demande pour ce produit :
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: 6,
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <label
                          style={{
                            fontSize: 11,
                            color: "#a3a092",
                            marginBottom: 2,
                          }}
                        >
                          Ville de rendez-vous
                        </label>
                        <select
                          value={form.targetCity}
                          onChange={(e) =>
                            updateFormField(
                              p.id,
                              "targetCity",
                              e.target.value
                            )
                          }
                          style={{
                            fontSize: 12,
                            padding: "4px 6px",
                            borderRadius: 8,
                            border: "1px solid #374151",
                            backgroundColor: "#020617",
                            color: "#e5e7eb",
                          }}
                        >
                          <option value="">Sélectionnez...</option>
                          {CITY_OPTIONS.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <label
                          style={{
                            fontSize: 11,
                            color: "#a3a092",
                            marginBottom: 2,
                          }}
                        >
                          Budget max (€)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={form.maxBudget}
                          onChange={(e) =>
                            updateFormField(
                              p.id,
                              "maxBudget",
                              e.target.value
                            )
                          }
                          style={{
                            fontSize: 12,
                            padding: "4px 6px",
                            borderRadius: 8,
                            border: "1px solid #374151",
                            backgroundColor: "#020617",
                            color: "#e5e7eb",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <label
                          style={{
                            fontSize: 11,
                            color: "#a3a092",
                            marginBottom: 2,
                          }}
                        >
                          Quantité
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={form.quantity}
                          onChange={(e) =>
                            updateFormField(
                              p.id,
                              "quantity",
                              e.target.value
                            )
                          }
                          style={{
                            fontSize: 12,
                            padding: "4px 6px",
                            borderRadius: 8,
                            border: "1px solid #374151",
                            backgroundColor: "#020617",
                            color: "#e5e7eb",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label
                        style={{
                          fontSize: 11,
                          color: "#a3a092",
                          marginBottom: 2,
                        }}
                      >
                        Détails pour le voyageur (optionnel)
                      </label>
                      <textarea
                        rows={3}
                        value={form.details}
                        onChange={(e) =>
                          updateFormField(p.id, "details", e.target.value)
                        }
                        placeholder="Par ex. : version 100 ml, pas de coffret, remise en main propre à la sortie du terminal..."
                        style={{
                          fontSize: 12,
                          padding: "4px 6px",
                          borderRadius: 8,
                          border: "1px solid #374151",
                          backgroundColor: "#020617",
                          color: "#e5e7eb",
                          resize: "vertical",
                        }}
                      />
                    </div>

                    <div className="actions-row" style={{ marginTop: 4 }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => cancelRequestForm(p.id)}
                        disabled={creatingRequestForId === p.id}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleCreateRequest(p)}
                        disabled={creatingRequestForId === p.id}
                      >
                        {creatingRequestForId === p.id
                          ? "Création..."
                          : "Valider la demande"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
