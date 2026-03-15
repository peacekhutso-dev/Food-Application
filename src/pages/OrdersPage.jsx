import { useEffect, useState, useMemo } from 'react';
import {
  collection, query, where, onSnapshot,
  orderBy, doc, getDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase_data/firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import KanteenLoader from '../components/KanteenLoader';
import {
  ShoppingBag, Clock, CheckCircle, XCircle,
  ChevronDown, ChevronUp, ArrowLeft, Package,
  RefreshCw, Star, RotateCcw, AlertCircle
} from 'lucide-react';
import './OrdersPage.css';

// ── Status config ─────────────────────────────────────────────
const STATUS = {
  pending:   { label: 'Pending',         color: '#f59e0b', bg: '#fffbeb', icon: Clock,        progress: 15  },
  confirmed: { label: 'Confirmed',       color: '#3b82f6', bg: '#eff6ff', icon: CheckCircle,  progress: 35  },
  preparing: { label: 'Preparing',       color: '#f59e0b', bg: '#fffbeb', icon: Clock,        progress: 55  },
  ready:     { label: 'Ready for Pickup',color: '#10b981', bg: '#ecfdf5', icon: CheckCircle,  progress: 80  },
  delivered: { label: 'Delivered',       color: '#6b7280', bg: '#f9fafb', icon: CheckCircle,  progress: 100 },
  cancelled: { label: 'Cancelled',       color: '#ef4444', bg: '#fef2f2', icon: XCircle,      progress: 0   },
};

const FILTERS = ['All', 'Active', 'Delivered', 'Cancelled'];

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];

// ── Helpers ───────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return '';
  const d = ts?.toDate?.() || new Date(ts);
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatTime(ts) {
  if (!ts) return '';
  const d = ts?.toDate?.() || new Date(ts);
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}
function timeAgo(ts) {
  if (!ts) return '';
  const d   = ts?.toDate?.() || new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return formatDate(ts);
}

// ── Progress bar ──────────────────────────────────────────────
const ProgressBar = ({ status }) => {
  const cfg = STATUS[status] || STATUS.pending;
  const steps = ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Done'];
  return (
    <div className="op-progress-wrap">
      <div className="op-progress-track">
        <div className="op-progress-fill" style={{ width: `${cfg.progress}%`, background: cfg.color }}/>
      </div>
      <div className="op-progress-steps">
        {steps.map(s => <span key={s} className="op-step-label">{s}</span>)}
      </div>
    </div>
  );
};

// ── Single order card ─────────────────────────────────────────
const OrderCard = ({ order, onReorder, onReview }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg    = STATUS[order.status] || STATUS.pending;
  const Icon   = cfg.icon;
  const active = ACTIVE_STATUSES.includes(order.status);

  return (
    <div className={`op-card${active ? ' op-card-active' : ''}`}
      style={{ animationDelay: `${order._idx * 0.05}s` }}>

      {/* Active pulse indicator */}
      {active && <div className="op-active-dot"/>}

      {/* Card header */}
      <div className="op-card-header" onClick={() => setExpanded(p => !p)}>
        <div className="op-card-left">
          {/* Vendor image or fallback */}
          <div className="op-vendor-avatar"
            style={{ background: cfg.bg, borderColor: cfg.color + '44' }}>
            {order.vendorImage
              ? <img src={order.vendorImage} alt={order.vendorName}/>
              : <ShoppingBag size={20} color={cfg.color}/>
            }
          </div>
          <div className="op-card-info">
            <p className="op-vendor-name">{order.vendorName || 'Restaurant'}</p>
            <p className="op-order-meta">
              {formatDate(order.createdAt)} · {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} · <strong>R{order.total?.toFixed(2)}</strong>
            </p>
            <p className="op-order-id">#{order.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        <div className="op-card-right">
          <span className="op-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
            <Icon size={12}/> {cfg.label}
          </span>
          <span className="op-time-ago">{timeAgo(order.createdAt)}</span>
          <button className="op-expand-btn" aria-label="expand">
            {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
        </div>
      </div>

      {/* Progress bar for active orders */}
      {active && <ProgressBar status={order.status}/>}

      {/* Expanded detail */}
      {expanded && (
        <div className="op-detail">
          {/* Items list */}
          <div className="op-items">
            <p className="op-detail-label">Order Items</p>
            {order.items?.map((item, i) => (
              <div key={i} className="op-item-row">
                <div className="op-item-img">
                  {item.image
                    ? <img src={item.image} alt={item.name} loading="lazy"/>
                    : <Package size={16} color="#9ca3af"/>
                  }
                </div>
                <div className="op-item-info">
                  <span className="op-item-name">{item.name}</span>
                  {item.description && (
                    <span className="op-item-desc">{item.description}</span>
                  )}
                </div>
                <div className="op-item-right">
                  <span className="op-item-qty">×{item.quantity || 1}</span>
                  <span className="op-item-price">R{((item.price||0)*(item.quantity||1)).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="op-summary">
            <div className="op-summary-row">
              <span>Subtotal</span>
              <span>R{order.total?.toFixed(2)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="op-summary-row">
                <span>Delivery</span>
                <span>R{order.deliveryFee?.toFixed(2)}</span>
              </div>
            )}
            <div className="op-summary-row op-summary-total">
              <span>Total</span>
              <span>R{((order.total||0) + (order.deliveryFee||0)).toFixed(2)}</span>
            </div>
          </div>

          {/* Order details */}
          <div className="op-order-details">
            {order.location && (
              <p className="op-detail-chip">📍 {order.location}</p>
            )}
            <p className="op-detail-chip">🕐 Placed at {formatTime(order.createdAt)}</p>
            {order.note && (
              <p className="op-detail-chip">📝 {order.note}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="op-actions">
            {order.status === 'delivered' && (
              <>
                <button className="op-btn op-btn-outline" onClick={() => onReorder(order)}>
                  <RotateCcw size={14}/> Reorder
                </button>
                <button className="op-btn op-btn-primary" onClick={() => onReview(order)}>
                  <Star size={14}/> Leave Review
                </button>
              </>
            )}
            {active && (
              <button className="op-btn op-btn-outline" onClick={() => {}}>
                <RefreshCw size={14}/> Refresh Status
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────
const OrdersPage = () => {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [filter,      setFilter]      = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating,setReviewRating]= useState(5);
  const [reviewText,  setReviewText]  = useState('');

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user) { navigate('/auth'); return; }
      setCurrentUser(user);
    });
    return () => unsub();
  }, [navigate]);

  // ── Real-time orders ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, async (snap) => {
      // Enrich with vendor image if not stored on order
      const list = await Promise.all(
        snap.docs.map(async (d, idx) => {
          const data = { id: d.id, _idx: idx, ...d.data() };
          if (!data.vendorImage && data.vendorId) {
            try {
              const vSnap = await getDoc(doc(db, 'vendors', data.vendorId));
              if (vSnap.exists()) data.vendorImage = vSnap.data().image;
            } catch {}
          }
          return data;
        })
      );
      setOrders(list);
      setLoading(false);
      setError(null);
    }, err => {
      console.error('❌ Orders listener:', err);
      setError('Could not load orders. Check your connection.');
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  // ── Derived filtered list ─────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...orders];
    if (filter === 'Active')    list = list.filter(o => ACTIVE_STATUSES.includes(o.status));
    if (filter === 'Delivered') list = list.filter(o => o.status === 'delivered');
    if (filter === 'Cancelled') list = list.filter(o => o.status === 'cancelled');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o =>
        o.vendorName?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.items?.some(i => i.name?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [orders, filter, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total:     orders.length,
    active:    orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    spent:     orders.filter(o => o.status === 'delivered').reduce((s,o) => s + (o.total||0), 0),
  }), [orders]);

  // ── Reorder ───────────────────────────────────────────────────
  const handleReorder = (order) => {
    navigate(`/menu/${order.vendorId}`);
  };

  // ── Review modal ──────────────────────────────────────────────
  const handleReview = (order) => {
    setReviewModal(order);
    setReviewRating(5);
    setReviewText('');
  };
  const submitReview = () => {
    // TODO: write to Firestore reviews collection
    alert(`Review submitted: ${reviewRating}★ — "${reviewText}"`);
    setReviewModal(null);
  };

  if (loading) return <KanteenLoader message="Loading your orders…"/>;

  return (
    <div className="op-page">
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery}/>

      <div className="op-container">

        {/* ── Back + Heading ── */}
        <div className="op-header">
          <button className="op-back" onClick={() => navigate('/')}>
            <ArrowLeft size={16}/> Restaurants
          </button>
          <div>
            <h1 className="op-title">My Orders</h1>
            <p className="op-subtitle">Track and manage all your orders</p>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="op-error">
            <AlertCircle size={16}/> {error}
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {/* ── Stats strip ── */}
        {orders.length > 0 && (
          <div className="op-stats">
            <div className="op-stat">
              <span className="op-stat-val">{stats.total}</span>
              <span className="op-stat-label">Total Orders</span>
            </div>
            <div className="op-stat-divider"/>
            <div className="op-stat">
              <span className="op-stat-val op-stat-active">{stats.active}</span>
              <span className="op-stat-label">Active</span>
            </div>
            <div className="op-stat-divider"/>
            <div className="op-stat">
              <span className="op-stat-val">{stats.delivered}</span>
              <span className="op-stat-label">Delivered</span>
            </div>
            <div className="op-stat-divider"/>
            <div className="op-stat">
              <span className="op-stat-val">R{stats.spent.toFixed(0)}</span>
              <span className="op-stat-label">Total Spent</span>
            </div>
          </div>
        )}

        {/* ── Filter tabs ── */}
        <div className="op-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`op-filter-btn${filter===f?' op-filter-active':''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {f === 'Active' && stats.active > 0 && (
                <span className="op-filter-badge">{stats.active}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Results count ── */}
        <p className="op-count">
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          {filter !== 'All' ? ` · ${filter}` : ''}
        </p>

        {/* ── Orders list ── */}
        {filtered.length === 0 ? (
          <div className="op-empty">
            <div className="op-empty-icon">
              {filter === 'Active' ? '⏳' : filter === 'Delivered' ? '✅' : filter === 'Cancelled' ? '❌' : '🛍️'}
            </div>
            <p className="op-empty-title">
              {filter === 'Active' ? 'No active orders' :
               filter === 'Delivered' ? 'No delivered orders yet' :
               filter === 'Cancelled' ? 'No cancelled orders' :
               'No orders yet'}
            </p>
            <p className="op-empty-sub">
              {filter === 'All' ? 'Your order history will appear here once you place your first order.' : `Nothing here under "${filter}".`}
            </p>
            {filter === 'All' && (
              <button className="op-browse-btn" onClick={() => navigate('/')}>
                Browse Restaurants
              </button>
            )}
          </div>
        ) : (
          <div className="op-list">
            {filtered.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onReorder={handleReorder}
                onReview={handleReview}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Review modal ── */}
      {reviewModal && (
        <div className="op-modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="op-modal" onClick={e => e.stopPropagation()}>
            <h3 className="op-modal-title">Rate your order</h3>
            <p className="op-modal-sub">from <strong>{reviewModal.vendorName}</strong></p>

            {/* Star picker */}
            <div className="op-star-picker">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  className={`op-star${s <= reviewRating ? ' op-star-on' : ''}`}
                  onClick={() => setReviewRating(s)}
                >★</button>
              ))}
            </div>

            <textarea
              className="op-review-input"
              placeholder="Share your experience (optional)…"
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={3}
            />

            <div className="op-modal-actions">
              <button className="op-btn op-btn-outline" onClick={() => setReviewModal(null)}>
                Cancel
              </button>
              <button className="op-btn op-btn-primary" onClick={submitReview}>
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;