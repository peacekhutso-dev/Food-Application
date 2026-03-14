import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, User, Search, Menu, X, Home,
  HelpCircle, LogOut, Bell, MapPin, ChevronDown,
  Package, Clock, CheckCircle, Flame, Star
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase_data/firebase';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ─────────────────────────────────────────────────────────────────
const LOCATIONS = ['Block A', 'Block B', 'Block C', 'Main Hall', 'Library'];

const SEARCH_SUGGESTIONS = [
  'Burger Barn', 'Spice Garden', 'Pizza Palace', 'Sushi Corner',
  'Chicken Wings', 'Veggie Bowl', 'Pasta Place', 'Smoothie Bar'
];

const STATUS_CONFIG = {
  pending:   { label: 'Order Placed',     color: '#f59e0b', icon: Clock,       progress: 15  },
  confirmed: { label: 'Confirmed',        color: '#3b82f6', icon: CheckCircle, progress: 35  },
  preparing: { label: 'Preparing',        color: '#f59e0b', icon: Clock,       progress: 55  },
  ready:     { label: 'Ready for Pickup', color: '#10b981', icon: CheckCircle, progress: 80  },
  delivered: { label: 'Delivered',        color: '#6b7280', icon: Package,     progress: 100 },
  cancelled: { label: 'Cancelled',        color: '#ef4444', icon: X,           progress: 0   },
};
// ───────────────────────────────────────────────────────────────────────────────

const Navbar = ({ searchQuery = '', setSearchQuery }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getTotalItems, cartItems } = useCart();
  const { userDetails, logout, currentUser } = useAuth();

  const [cartCount, setCartCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Feature states
  const [selectedLocation, setSelectedLocation] = useState('Block A');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isOrderTrackOpen, setIsOrderTrackOpen] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  // Real order state
  const [activeOrder, setActiveOrder] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const cartHoverTimeout = useRef(null);
  const searchRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const user = userDetails || { name: 'Guest' };

  const currentStatus = activeOrder ? (STATUS_CONFIG[activeOrder.status] || STATUS_CONFIG.pending) : null;
  const StatusIcon = currentStatus?.icon || Clock;

  // ── Cart count ──
  useEffect(() => { setCartCount(getTotalItems()); }, [getTotalItems]);

  // ── Resize ──
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Real-time active order from Firestore ──
  useEffect(() => {
    if (!currentUser) {
      setActiveOrder(null);
      setOrdersLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid),
      where('status', 'in', ['pending', 'confirmed', 'preparing', 'ready']),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        setActiveOrder({
          id: docSnap.id,
          shortId: `#${docSnap.id.slice(-4).toUpperCase()}`,
          shop: data.vendorName || 'Restaurant',
          status: data.status || 'pending',
          total: data.total || 0,
          items: data.items || [],
        });
      } else {
        setActiveOrder(null);
      }
      setOrdersLoading(false);
    }, (error) => {
      console.error('❌ Navbar order listener:', error);
      setOrdersLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ── Notifications from real Firestore orders ──
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const status = data.status?.toLowerCase();
        const isActive = ['pending', 'confirmed', 'preparing', 'ready'].includes(status);
        return {
          id: docSnap.id,
          type: 'order',
          message: getOrderMessage(status, data.vendorName),
          time: getTimeAgo(data.createdAt?.toDate?.()),
          read: !isActive,
        };
      });
      setNotifications(notifs);
    }, (error) => {
      console.error('❌ Navbar notifications listener:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ── Live search suggestions ──
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setSearchSuggestions(
        SEARCH_SUGGESTIONS.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery]);

  // ── Helpers ──
  const getTimeAgo = (date) => {
    if (!date) return '';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getOrderMessage = (status, shopName) => {
    const shop = shopName || 'your restaurant';
    const map = {
      pending:   `Order placed at ${shop} ⏳`,
      confirmed: `${shop} confirmed your order ✅`,
      preparing: `${shop} is preparing your order 👨‍🍳`,
      ready:     `Your order from ${shop} is ready for pickup! 🎉`,
      delivered: `Order from ${shop} was delivered`,
      cancelled: `Order from ${shop} was cancelled`,
    };
    return map[status] || `Order update from ${shop}`;
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.includes(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleSearchSelect = (term) => {
    setSearchQuery && setSearchQuery(term);
    if (!recentSearches.includes(term)) {
      setRecentSearches(prev => [term, ...prev].slice(0, 5));
    }
    setIsSearchFocused(false);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleCartMouseEnter = () => {
    clearTimeout(cartHoverTimeout.current);
    setIsCartHovered(true);
  };
  const handleCartMouseLeave = () => {
    cartHoverTimeout.current = setTimeout(() => setIsCartHovered(false), 300);
  };

  const closeAll = () => {
    setIsLocationOpen(false);
    setIsNotifOpen(false);
    setIsUserDropdownOpen(false);
    setIsOrderTrackOpen(false);
    setIsSearchFocused(false);
  };

  const navLinks = [{ name: 'Shops', path: '/', icon: Home }];

  const getHour = () => new Date().getHours();
  const greeting = getHour() < 12 ? 'Good morning' : getHour() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .nb-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        .nb-logo { font-family: 'Syne', sans-serif !important; }

        input::placeholder { color: #9ca3af !important; }

        .nb-icon-btn {
          background: none; border: none; cursor: pointer;
          padding: 8px; display: flex; align-items: center; justify-content: center;
          border-radius: 10px; transition: background 0.18s ease;
          position: relative;
        }
        .nb-icon-btn:hover { background: #f3f4f6; }

        .nb-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          background: #ffffff; border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.13);
          border: 1px solid #f0f0f0; z-index: 1050;
          animation: nb-pop 0.18s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes nb-pop {
          from { opacity: 0; transform: scale(0.92) translateY(-6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }

        .nb-badge {
          position: absolute; top: 2px; right: 2px;
          background: #dc2626; color: #fff;
          border-radius: 50%; width: 18px; height: 18px;
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #fff;
        }

        .nb-pulse::after {
          content: ''; position: absolute; top: 2px; right: 2px;
          width: 10px; height: 10px; border-radius: 50%;
          background: #10b981;
          animation: nb-ping 1.4s ease infinite;
          border: 2px solid #fff;
        }
        @keyframes nb-ping {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.5); opacity: 0.5; }
        }

        .nb-cart-preview {
          position: absolute; top: calc(100% + 10px); right: 0;
          background: #fff; border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.13);
          border: 1px solid #f0f0f0; z-index: 1050; width: 280px;
          animation: nb-pop 0.18s cubic-bezier(.34,1.56,.64,1) both;
        }

        .nb-notif-item { transition: background 0.15s; }
        .nb-notif-item:hover { background: #fafafa; }

        .nb-search-dropdown {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0;
          background: #fff; border-radius: 14px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.11);
          border: 1px solid #f0f0f0; z-index: 1050; overflow: hidden;
          animation: nb-pop 0.15s ease both;
        }

        .nb-suggestion:hover { background: #fef2f2; cursor: pointer; }
        .nb-suggestion { transition: background 0.12s; padding: 10px 14px; font-size: 14px; color: #374151; display: flex; align-items: center; gap: 8px; }

        .nb-banner {
          background: #dc2626;
          color: #fff; text-align: center; font-size: 13px; font-weight: 500;
          padding: 8px 40px; position: relative; letter-spacing: 0.01em;
        }
        .nb-banner-close {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.2); border: none; border-radius: 50%;
          width: 22px; height: 22px; cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .nb-banner-close:hover { background: rgba(255,255,255,0.35); }

        .nb-order-track { min-width: 260px; }
        .nb-progress-bar {
          height: 4px; border-radius: 2px; background: #f3f4f6; overflow: hidden; margin-top: 10px;
        }
        .nb-progress-fill {
          height: 100%; border-radius: 2px; background: #dc2626;
          transition: width 0.6s ease;
        }
      `}</style>

      <div className="nb-root" style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000 }}>

        {/* ── Announcement Banner ── */}
        {isBannerVisible && (
          <div className="nb-banner">
            🔥 Free delivery on all orders today — use code <strong>KANTEEN</strong> at checkout!
            <button className="nb-banner-close" onClick={() => setIsBannerVisible(false)}>
              <X size={12} />
            </button>
          </div>
        )}

        {/* ── Main Nav ── */}
        <nav style={{
          background: '#ffffff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          borderBottom: '1px solid #f3f4f6',
        }}>
          <div style={{
            maxWidth: '1400px', margin: '0 auto', padding: '0 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px'
          }}>

            {/* ── LEFT: Hamburger + Logo + Nav ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {isMobile && (
                <button className="nb-icon-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  <Menu size={22} color="#111" />
                </button>
              )}

              {/* Logo: KANTEEN */}
              <div onClick={() => { navigate('/'); closeAll(); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <span className="nb-logo" style={{ fontSize: '20px', fontWeight: 800, color: '#111', letterSpacing: '2px' }}>
                  K A N T E E N
                </span>

              </div>

              {!isMobile && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <button key={link.path} onClick={() => navigate(link.path)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                          background: isActive(link.path) ? '#fef2f2' : 'transparent',
                          color: isActive(link.path) ? '#dc2626' : '#4b5563',
                          fontWeight: 500, fontSize: '14px', transition: 'all 0.18s ease'
                        }}
                        onMouseEnter={(e) => { if (!isActive(link.path)) e.currentTarget.style.background = '#f9fafb'; }}
                        onMouseLeave={(e) => { if (!isActive(link.path)) e.currentTarget.style.background = 'transparent'; }}>
                        <Icon size={16} />{link.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── CENTER: Search ── */}
            {!isMobile && (location.pathname === '/' || location.pathname === '/vendor') && (
              <div style={{ flex: 1, maxWidth: '480px', margin: '0 24px', position: 'relative' }} ref={searchRef}>
                <div style={{
                  display: 'flex', alignItems: 'center', background: isSearchFocused ? '#fff' : '#f9fafb',
                  borderRadius: '12px', padding: '9px 14px',
                  border: `1.5px solid ${isSearchFocused ? '#dc2626' : '#e5e7eb'}`,
                  transition: 'all 0.2s ease', boxShadow: isSearchFocused ? '0 0 0 3px rgba(220,38,38,0.08)' : 'none'
                }}>
                  <Search size={18} color={isSearchFocused ? '#dc2626' : '#9ca3af'} style={{ marginRight: '10px', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Search restaurants or food..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery) handleSearchSelect(searchQuery); }}
                    style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '14px', color: '#111' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery && setSearchQuery('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#9ca3af', display: 'flex' }}>
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Search Dropdown */}
                {isSearchFocused && (
                  <div className="nb-search-dropdown">
                    {searchQuery.length === 0 && recentSearches.length > 0 && (
                      <>
                        <div style={{ padding: '10px 14px 4px', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Recent
                        </div>
                        {recentSearches.map((s) => (
                          <div key={s} className="nb-suggestion" onClick={() => handleSearchSelect(s)}>
                            <Clock size={14} color="#9ca3af" />{s}
                          </div>
                        ))}
                      </>
                    )}
                    {searchSuggestions.length > 0 && (
                      <>
                        <div style={{ padding: '10px 14px 4px', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Suggestions
                        </div>
                        {searchSuggestions.map((s) => (
                          <div key={s} className="nb-suggestion" onClick={() => handleSearchSelect(s)}>
                            <Search size={14} color="#9ca3af" />{s}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── RIGHT: Actions ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

              {/* Location Picker */}
              {!isMobile && (
                <div style={{ position: 'relative' }}>
                  <button className="nb-icon-btn"
                    onClick={() => { setIsLocationOpen(!isLocationOpen); setIsNotifOpen(false); setIsUserDropdownOpen(false); setIsOrderTrackOpen(false); }}
                    style={{ gap: '5px', padding: '7px 12px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <MapPin size={15} color="#dc2626" />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedLocation}
                    </span>
                    <ChevronDown size={13} color="#9ca3af" />
                  </button>

                  {isLocationOpen && (
                    <div className="nb-dropdown" style={{ minWidth: '180px' }}>
                      <div style={{ padding: '10px 14px 6px', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Deliver to
                      </div>
                      {LOCATIONS.map((loc) => (
                        <button key={loc}
                          onClick={() => { setSelectedLocation(loc); setIsLocationOpen(false); }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 14px', border: 'none', background: selectedLocation === loc ? '#fef2f2' : 'none',
                            color: selectedLocation === loc ? '#dc2626' : '#374151',
                            cursor: 'pointer', fontSize: '14px', fontWeight: selectedLocation === loc ? 600 : 400,
                            transition: 'background 0.12s', textAlign: 'left'
                          }}
                          onMouseEnter={(e) => { if (selectedLocation !== loc) e.currentTarget.style.background = '#f9fafb'; }}
                          onMouseLeave={(e) => { if (selectedLocation !== loc) e.currentTarget.style.background = 'none'; }}>
                          <MapPin size={14} color={selectedLocation === loc ? '#dc2626' : '#9ca3af'} />
                          {loc}
                          {selectedLocation === loc && <CheckCircle size={14} color="#dc2626" style={{ marginLeft: 'auto' }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Order Tracking — real Firestore data */}
              <div style={{ position: 'relative' }}>
                <button
                  className={`nb-icon-btn ${activeOrder ? 'nb-pulse' : ''}`}
                  title="Track order"
                  onClick={() => { setIsOrderTrackOpen(!isOrderTrackOpen); setIsNotifOpen(false); setIsUserDropdownOpen(false); setIsLocationOpen(false); }}>
                  <Package size={22} color={isOrderTrackOpen ? '#dc2626' : '#374151'} />
                </button>

                {isOrderTrackOpen && (
                  <div className="nb-dropdown nb-order-track" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '12px' }}>Active Order</div>

                    {ordersLoading ? (
                      <div style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>Loading...</div>
                    ) : activeOrder ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '15px', color: '#111' }}>{activeOrder.shop}</span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{activeOrder.shortId}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <StatusIcon size={15} color={currentStatus.color} />
                          <span style={{ fontSize: '13px', fontWeight: 500, color: currentStatus.color }}>
                            {currentStatus.label}
                          </span>
                          <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>
                            R{activeOrder.total?.toFixed(2)}
                          </span>
                        </div>
                        <div className="nb-progress-bar">
                          <div className="nb-progress-fill" style={{ width: `${currentStatus.progress}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                          {['Placed', 'Confirmed', 'Preparing', 'Ready'].map((s) => (
                            <span key={s} style={{ fontSize: '10px', color: '#9ca3af' }}>{s}</span>
                          ))}
                        </div>

                        {activeOrder.items?.length > 0 && (
                          <div style={{ marginTop: '12px', padding: '10px', background: '#f9fafb', borderRadius: '10px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>Items</div>
                            {activeOrder.items.slice(0, 3).map((item, i) => (
                              <div key={i} style={{ fontSize: '13px', color: '#374151', display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span>{item.name} × {item.quantity}</span>
                                <span style={{ color: '#6b7280' }}>R{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                              </div>
                            ))}
                            {activeOrder.items.length > 3 && (
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>+{activeOrder.items.length - 3} more items</div>
                            )}
                          </div>
                        )}

                        <button onClick={() => { navigate('/orders'); setIsOrderTrackOpen(false); }}
                          style={{ marginTop: '14px', width: '100%', padding: '9px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                          View Full Order →
                        </button>
                      </>
                    ) : (
                      <div style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '12px 0' }}>
                        <Package size={32} color="#e5e7eb" style={{ display: 'block', margin: '0 auto 8px' }} />
                        No active orders
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notifications — from real Firestore orders */}
              <div style={{ position: 'relative' }}>
                <button className="nb-icon-btn"
                  onClick={() => { setIsNotifOpen(!isNotifOpen); setIsUserDropdownOpen(false); setIsLocationOpen(false); setIsOrderTrackOpen(false); }}>
                  <Bell size={22} color={isNotifOpen ? '#dc2626' : '#374151'} />
                  {unreadCount > 0 && (
                    <span className="nb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="nb-dropdown" style={{ width: '320px' }}>
                    <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>All caught up! 🎉</div>
                      ) : notifications.map((n) => (
                        <div key={n.id} className="nb-notif-item"
                          onClick={() => { navigate('/orders'); setIsNotifOpen(false); }}
                          style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start', background: n.read ? '#fff' : '#fffbfb', borderBottom: '1px solid #f9f9f9', cursor: 'pointer' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Package size={16} color="#dc2626" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', color: '#111', lineHeight: 1.4, fontWeight: n.read ? 400 : 600 }}>{n.message}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{n.time}</div>
                          </div>
                          {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', flexShrink: 0, marginTop: 4 }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cart with hover preview */}
              <div style={{ position: 'relative' }}
                onMouseEnter={handleCartMouseEnter}
                onMouseLeave={handleCartMouseLeave}>
                <button className="nb-icon-btn" onClick={() => navigate('/CartPage')}>
                  <ShoppingCart size={22} color={isActive('/CartPage') ? '#dc2626' : '#374151'} />
                  {cartCount > 0 && <span className="nb-badge">{cartCount}</span>}
                </button>

                {isCartHovered && cartCount > 0 && (
                  <div className="nb-cart-preview"
                    onMouseEnter={handleCartMouseEnter}
                    onMouseLeave={handleCartMouseLeave}>
                    <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>Your Cart ({cartCount} items)</span>
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {(cartItems || []).slice(0, 5).map((item, i) => (
                        <div key={i} style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f9f9f9' }}>
                          <div>
                            <div style={{ fontSize: '13px', color: '#111', fontWeight: 500 }}>{item.name}</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>x{item.quantity}</div>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>
                            R{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '12px 16px' }}>
                      <button onClick={() => navigate('/CartPage')}
                        style={{ width: '100%', padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                        Go to Cart →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User */}
              <div style={{ position: 'relative' }}>
                {currentUser ? (
                  <>
                    <button
                      onClick={() => { setIsUserDropdownOpen(!isUserDropdownOpen); setIsNotifOpen(false); setIsLocationOpen(false); setIsOrderTrackOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 12px',
                        borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff',
                        cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#111', transition: 'all 0.18s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={15} color="#dc2626" />
                      </div>
                      {!isMobile && <span>{user?.name?.split(' ')[0] || 'Profile'}</span>}
                    </button>

                    {isUserDropdownOpen && (
                      <div className="nb-dropdown" style={{ minWidth: '220px' }}>
                        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>
                            {greeting}, {user?.name?.split(' ')[0] || 'there'} 👋
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{user?.email || ''}</div>
                        </div>

                        {[
                          { label: 'My Profile', icon: User, path: '/ProfilePage' },
                          { label: 'My Orders', icon: Package, path: '/orders' },
                        ].map(({ label, icon: Icon, path }) => (
                          <button key={label} onClick={() => { navigate(path); setIsUserDropdownOpen(false); }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#374151', textAlign: 'left', transition: 'background 0.12s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                            <Icon size={16} />{label}
                          </button>
                        ))}

                        <button onClick={() => { alert('Help & Support'); setIsUserDropdownOpen(false); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#374151', textAlign: 'left', transition: 'background 0.12s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                          <HelpCircle size={16} /> Help & Support
                        </button>

                        <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0' }} />

                        <button onClick={handleLogout}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#dc2626', fontWeight: 600, textAlign: 'left', transition: 'background 0.12s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button onClick={() => navigate('/auth')}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#dc2626', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: '#fff', transition: 'background 0.18s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}>
                    <User size={17} /> Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* ── Mobile Sidebar ── */}
      {isMobile && (
        <>
          {isMobileMenuOpen && (
            <div onClick={() => setIsMobileMenuOpen(false)}
              style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.45)', zIndex: 1100 }} />
          )}

          <div className="nb-root" style={{
            position: 'fixed', top: 0, left: isMobileMenuOpen ? 0 : '-290px', width: '290px',
            height: '100vh', background: '#fff', zIndex: 1101,
            transition: 'left 0.28s cubic-bezier(.4,0,.2,1)',
            boxShadow: '4px 0 20px rgba(0,0,0,0.12)', overflowY: 'auto'
          }}>
            {/* Sidebar header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="nb-logo" style={{ fontSize: '18px', fontWeight: 800, color: '#111', letterSpacing: '1.5px' }}>KANTEEN</span>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={15} color="#fff" />
                </div>
              </div>
              <button className="nb-icon-btn" onClick={() => setIsMobileMenuOpen(false)}><X size={22} color="#111" /></button>
            </div>

            {/* Greeting */}
            {currentUser && (
              <div style={{ padding: '14px 16px', background: '#fef2f2', margin: '12px', borderRadius: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#dc2626' }}>
                  {greeting}, {user?.name?.split(' ')[0] || 'there'} 👋
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{user?.email}</div>
              </div>
            )}

            {/* Active order card on mobile */}
            {activeOrder && currentStatus && (
              <div style={{ margin: '0 12px 12px', padding: '12px', background: '#fffbfb', border: '1px solid #fecaca', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: '6px' }}>Active Order</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{activeOrder.shop}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                  <StatusIcon size={13} color={currentStatus.color} />
                  <span style={{ fontSize: '12px', color: currentStatus.color, fontWeight: 500 }}>{currentStatus.label}</span>
                </div>
                <div className="nb-progress-bar" style={{ marginTop: '8px' }}>
                  <div className="nb-progress-fill" style={{ width: `${currentStatus.progress}%` }} />
                </div>
              </div>
            )}

            {/* Mobile Search */}
            <div style={{ padding: '4px 12px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', borderRadius: '10px', padding: '9px 12px', border: '1px solid #e5e7eb' }}>
                <Search size={16} color="#9ca3af" style={{ marginRight: '8px' }} />
                <input type="text" placeholder="Search restaurants..." value={searchQuery}
                  onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '14px', color: '#111' }} />
              </div>
            </div>

            {/* Location picker mobile */}
            <div style={{ padding: '0 12px 12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', padding: '0 4px' }}>Deliver to</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {LOCATIONS.map(loc => (
                  <button key={loc} onClick={() => setSelectedLocation(loc)}
                    style={{ padding: '6px 12px', borderRadius: '20px', border: `1.5px solid ${selectedLocation === loc ? '#dc2626' : '#e5e7eb'}`, background: selectedLocation === loc ? '#fef2f2' : '#fff', color: selectedLocation === loc ? '#dc2626' : '#374151', fontSize: '13px', fontWeight: selectedLocation === loc ? 600 : 400, cursor: 'pointer' }}>
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0' }} />

            {/* Nav links */}
            <div style={{ padding: '8px 12px' }}>
              {navLinks.map(({ name, path, icon: Icon }) => (
                <button key={path} onClick={() => { navigate(path); setIsMobileMenuOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 14px', border: 'none', background: isActive(path) ? '#fef2f2' : 'transparent', color: isActive(path) ? '#dc2626' : '#374151', cursor: 'pointer', fontSize: '15px', fontWeight: 500, borderRadius: '10px', marginBottom: '2px', textAlign: 'left' }}>
                  <Icon size={18} />{name}
                </button>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0' }} />

            {/* User actions */}
            <div style={{ padding: '8px 12px' }}>
              {currentUser ? (
                <>
                  {[{ label: 'My Profile', icon: User, path: '/ProfilePage' }, { label: 'My Orders', icon: Package, path: '/orders' }].map(({ label, icon: Icon, path }) => (
                    <button key={label} onClick={() => { navigate(path); setIsMobileMenuOpen(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 14px', border: 'none', background: 'transparent', color: '#374151', cursor: 'pointer', fontSize: '15px', fontWeight: 500, borderRadius: '10px', marginBottom: '2px', textAlign: 'left' }}>
                      <Icon size={18} />{label}
                    </button>
                  ))}
                  <button onClick={() => { alert('Help & Support'); setIsMobileMenuOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 14px', border: 'none', background: 'transparent', color: '#374151', cursor: 'pointer', fontSize: '15px', fontWeight: 500, borderRadius: '10px', marginBottom: '2px', textAlign: 'left' }}>
                    <HelpCircle size={18} /> Help & Support
                  </button>
                  <button onClick={handleLogout}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 14px', border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: '15px', fontWeight: 700, borderRadius: '10px', marginTop: '4px', textAlign: 'left' }}>
                    <LogOut size={18} /> Logout
                  </button>
                </>
              ) : (
                <button onClick={() => { navigate('/auth'); setIsMobileMenuOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 14px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 700, borderRadius: '10px', textAlign: 'left' }}>
                  <User size={18} /> Login
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Backdrop for dropdowns */}
      {(isUserDropdownOpen || isNotifOpen || isLocationOpen || isOrderTrackOpen) && (
        <div onClick={closeAll}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999 }} />
      )}
    </>
  );
};

export default Navbar;