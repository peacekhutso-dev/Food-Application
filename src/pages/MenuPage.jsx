import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, Plus, Minus, ShoppingCart, Star, Clock, Search, X, TrendingUp } from 'lucide-react';
import {
  MdCoffee,
  MdFastfood,
  MdIcecream,
  MdLocalPizza,
  MdLunchDining,
  MdRestaurant,
  MdRamenDining
} from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from '../firebase_data/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useCart } from '../context/CartContext';
import Navbar from '../components/landing/Navbar';
import KanteenLoader from '../components/KanteenLoader';
import './MenuPage.css';

// ── Category icon map ─────────────────────────────────────────
const CAT_ICONS = {
  Pizza:    <MdLocalPizza />,
  Burgers:  <MdFastfood />,
  Salads:   <MdLunchDining />,
  Coffee:   <MdCoffee />,
  Desserts: <MdIcecream />,
  Snacks:   <MdFastfood />,
  Ramen:    <MdRamenDining />,
  All:      <MdRestaurant />,
};

const SORT_OPTS = [
  { label: 'Top Rated',  value: 'rating'     },
  { label: 'Price ↑',    value: 'price-low'  },
  { label: 'Price ↓',    value: 'price-high' },
  { label: 'Popular',    value: 'popular'    },
];

const MenuPage = () => {
  const { vendorId } = useParams();
  const navigate     = useNavigate();
  const { addToCart: addToCartContext, cartItems, getTotalItems } = useCart();
  const catBarRef    = useRef(null);
  const [catSticky,  setCatSticky] = useState(false);

  const [vendor,          setVendor]          = useState(null);
  const [menuItems,       setMenuItems]       = useState([]);
  const [selectedCat,     setSelectedCat]     = useState('All');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [sortBy,          setSortBy]          = useState('rating');
  const [currentUser,     setCurrentUser]     = useState(null);
  const [snack,           setSnack]           = useState({ open: false, msg: '', type: 'success' });
  const [addingId,        setAddingId]        = useState(null);  // item-level loading
  const [quantities,      setQuantities]      = useState({});    // item quantities before adding
  const [loading,         setLoading]         = useState(true);
  const [authReady,       setAuthReady]       = useState(false);
  const [error,           setError]           = useState('');
  const [cartOpen,        setCartOpen]        = useState(false);

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setCurrentUser(user || null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // ── Data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (authReady && vendorId) fetchAll();
  }, [authReady, vendorId]);

  async function fetchAll() {
    setLoading(true); setError('');
    try {
      const vSnap = await getDoc(doc(db, 'vendors', vendorId));
      if (!vSnap.exists()) { setError('Restaurant not found'); setLoading(false); return; }
      setVendor({ id: vSnap.id, ...vSnap.data() });

      const mSnap = await getDocs(query(collection(db, 'menu_items'), where('vendorId', '==', vendorId)));
      setMenuItems(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      setError('Unable to load menu. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // ── Sticky category bar on scroll ────────────────────────────
  useEffect(() => {
    const el = catBarRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setCatSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  // ── Derived filtered + sorted list (useMemo, not useEffect) ──
  const filteredItems = useMemo(() => {
    let list = [...menuItems];
    if (selectedCat !== 'All') list = list.filter(i => i.category === selectedCat);
    if (searchQuery)            list = list.filter(i =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (sortBy === 'rating')     list.sort((a,b) => (b.rating||0) - (a.rating||0));
    if (sortBy === 'price-low')  list.sort((a,b) => a.price - b.price);
    if (sortBy === 'price-high') list.sort((a,b) => b.price - a.price);
    if (sortBy === 'popular')    list.sort((a,b) => (b.orderCount||0) - (a.orderCount||0));
    return list;
  }, [menuItems, selectedCat, searchQuery, sortBy]);

  const categories = useMemo(() =>
    ['All', ...new Set(menuItems.map(i => i.category).filter(Boolean))],
    [menuItems]
  );

  // ── Quantity helpers ──────────────────────────────────────────
  const getQty = id => quantities[id] || 1;
  const setQty = (id, val) => setQuantities(p => ({ ...p, [id]: Math.max(1, val) }));

  // ── Add to cart ───────────────────────────────────────────────
  const handleAdd = useCallback(async (item) => {
    if (!currentUser) { navigate('/auth'); return; }
    if (addingId === item.id) return;
    setAddingId(item.id);
    try {
      const qty = getQty(item.id);
      for (let i = 0; i < qty; i++) await addToCartContext(item);
      setSnack({ open: true, msg: `${item.name} ×${qty} added!`, type: 'success' });
      setQuantities(p => ({ ...p, [item.id]: 1 }));
    } catch {
      setSnack({ open: true, msg: 'Failed to add item. Try again.', type: 'error' });
    } finally {
      setAddingId(null);
    }
  }, [currentUser, addingId, quantities, addToCartContext, navigate]);

  const cartCount = getTotalItems?.() || 0;

  if (loading) return <KanteenLoader message="Loading menu…" />;

  if (error || !vendor) return (
    <div className="mn-page">
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="mn-error-screen">
        <span className="mn-error-emoji">😕</span>
        <p>{error || 'Restaurant not found'}</p>
        <button className="mn-btn-primary" onClick={() => navigate('/')}>
          <ArrowLeft size={16}/> Back to Restaurants
        </button>
      </div>
    </div>
  );

  return (
    <div className="mn-page">
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* ── Hero banner with gradient overlay ── */}
      <div className="mn-hero">
        {vendor.image
          ? <img src={vendor.image} alt={vendor.name} className="mn-hero-img"/>
          : <div className="mn-hero-placeholder"/>
        }
        <div className="mn-hero-overlay"/>
        <div className="mn-hero-content">
          <button className="mn-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={16}/> Restaurants
          </button>
          <div className="mn-hero-info">
            <h1 className="mn-vendor-name">{vendor.name}</h1>
            {vendor.description && (
              <p className="mn-vendor-desc">{vendor.description}</p>
            )}
            <div className="mn-vendor-meta">
              {vendor.rating && (
                <span className="mn-meta-chip mn-meta-gold">
                  <Star size={13} fill="currentColor"/> {vendor.rating.toFixed(1)}
                </span>
              )}
              {vendor.waitTime && (
                <span className="mn-meta-chip">
                  <Clock size={13}/> ~{vendor.waitTime} min
                </span>
              )}
              {vendor.address && (
                <span className="mn-meta-chip">📍 {vendor.address}</span>
              )}
              {vendor.orderCount > 0 && (
                <span className="mn-meta-chip">
                  <TrendingUp size={13}/> {vendor.orderCount}+ orders
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Sort bar ── */}
      <div className="mn-toolbar">
        <div className="mn-search">
          <Search size={16} className="mn-search-icon"/>
          <input
            type="text"
            placeholder="Search menu…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="mn-search-input"
          />
          {searchQuery && (
            <button className="mn-search-clear" onClick={() => setSearchQuery('')}>
              <X size={14}/>
            </button>
          )}
        </div>
        <div className="mn-sort-chips">
          {SORT_OPTS.map(o => (
            <button
              key={o.value}
              className={`mn-sort-chip${sortBy===o.value?' mn-sort-on':''}`}
              onClick={() => setSortBy(o.value)}
            >{o.label}</button>
          ))}
        </div>
      </div>

      {/* ── Category bar (ref for sticky detection) ── */}
      <div ref={catBarRef} className="mn-cat-anchor"/>
      <div className={`mn-cat-bar${catSticky?' mn-cat-sticky':''}`}>
        <div className="mn-cat-track">
          {categories.map(cat => (
            <button
              key={cat}
              className={`mn-cat-btn${selectedCat===cat?' mn-cat-active':''}`}
              onClick={() => setSelectedCat(cat)}
            >
              <span className="mn-cat-icon-wrap">
                {CAT_ICONS[cat] || <MdRestaurant/>}
              </span>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mn-container">

        {/* Results count */}
        <p className="mn-results">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          {selectedCat !== 'All' ? ` in ${selectedCat}` : ''}
        </p>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="mn-empty">
            <span>🍽️</span>
            <p>No items found</p>
            {(selectedCat !== 'All' || searchQuery) && (
              <button className="mn-btn-secondary" onClick={() => { setSelectedCat('All'); setSearchQuery(''); }}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── Menu grid ── */}
        <div className="mn-grid">
          {filteredItems.map((item, idx) => {
            const isAdding   = addingId === item.id;
            const soldOut    = item.available === false;
            const isBestseller = item.orderCount >= 50;
            const isFeatured = item.featured === true;
            const qty        = getQty(item.id);

            return (
              <div
                key={item.id}
                className={`mn-card${soldOut?' mn-card-soldout':''}`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* Image */}
                <div className="mn-card-img">
                  <img
                    src={item.image || 'https://placehold.co/400x300/f3f4f6/9ca3af?text=No+Image'}
                    alt={item.name}
                    loading="lazy"
                  />
                  {/* Badges */}
                  <div className="mn-item-badges">
                    {isBestseller && <span className="mn-badge mn-badge-hot">🔥 Popular</span>}
                    {isFeatured   && <span className="mn-badge mn-badge-feat">⭐ Featured</span>}
                    {soldOut      && <span className="mn-badge mn-badge-sold">Sold Out</span>}
                  </div>
                </div>

                {/* Body */}
                <div className="mn-card-body">
                  <p className="mn-item-name">{item.name}</p>
                  {item.description && (
                    <p className="mn-item-desc">{item.description}</p>
                  )}

                  {/* Star rating */}
                  {item.rating && (
                    <div className="mn-item-stars">
                      {[1,2,3,4,5].map(s => (
                        <Star
                          key={s} size={12}
                          fill={s <= Math.round(item.rating) ? '#fbbf24' : 'none'}
                          color={s <= Math.round(item.rating) ? '#fbbf24' : '#d1d5db'}
                        />
                      ))}
                      <span className="mn-item-rating-val">{item.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags?.length > 0 && (
                    <div className="mn-item-tags">
                      {item.tags.slice(0,3).map(t => (
                        <span key={t} className="mn-item-tag">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Price + quantity + add */}
                  <div className="mn-card-footer">
                    <span className="mn-price">R{item.price.toFixed(2)}</span>

                    {!soldOut && (
                      <div className="mn-add-row">
                        {/* Quantity picker */}
                        <div className="mn-qty">
                          <button
                            className="mn-qty-btn"
                            onClick={() => setQty(item.id, qty - 1)}
                            disabled={qty <= 1}
                          ><Minus size={12}/></button>
                          <span className="mn-qty-val">{qty}</span>
                          <button
                            className="mn-qty-btn"
                            onClick={() => setQty(item.id, qty + 1)}
                          ><Plus size={12}/></button>
                        </div>

                        {/* Add to cart */}
                        <button
                          className={`mn-add-btn${isAdding?' mn-add-loading':''}`}
                          onClick={() => handleAdd(item)}
                          disabled={isAdding}
                        >
                          {isAdding
                            ? <span className="mn-spinner"/>
                            : <><Plus size={14}/> Add</>
                          }
                        </button>
                      </div>
                    )}

                    {soldOut && (
                      <span className="mn-soldout-label">Sold Out</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Floating cart button ── */}
      {cartCount > 0 && (
        <button className="mn-cart-fab" onClick={() => navigate('/CartPage')}>
          <ShoppingCart size={20}/>
          <span>{cartCount} item{cartCount!==1?'s':''} in cart</span>
          <span className="mn-cart-fab-arrow">→</span>
        </button>
      )}

      {/* ── Snackbar ── */}
      {snack.open && (
        <div className={`mn-snack mn-snack-${snack.type}`}>
          {snack.msg}
          <button onClick={() => setSnack(p => ({ ...p, open: false }))}><X size={14}/></button>
        </div>
      )}
    </div>
  );
};

export default MenuPage;