import { collection, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Store, Flame, Pizza, Coffee, IceCream2, Fish,
  Heart, Salad, ChevronLeft, ChevronRight, Star,
  X, Clock, SlidersHorizontal, TrendingUp,
  AlertCircle, ChevronDown, Beef, Soup
} from 'lucide-react';
import { GiNoodles, GiTacos } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase_data/firebase';
import { getAuth } from 'firebase/auth';
import Navbar from '../components/landing/Navbar';
import KanteenLoader from '../components/KanteenLoader';
import './VendorsPage.css';

// ─── Constants ─────────────────────────────────────────────────────────────────
const CACHE_KEY  = 'kanteen_vendors_cache';
const CACHE_TTL  = 5 * 60 * 1000;
const PAGE_SIZE  = 12;

const CATEGORIES = [
  { name: 'All',      icon: Store,     bg: '#1f2937', fg: '#fff', value: 'All'       },
  { name: 'Deals',    icon: Flame,     bg: '#dc2626', fg: '#fff', value: 'deals'     },
  { name: 'Pizza',    icon: Pizza,     bg: '#ea580c', fg: '#fff', value: 'Pizza'     },
  { name: 'Burgers',  icon: Beef,      bg: '#b45309', fg: '#fff', value: 'Fast Food' },
  { name: 'Asian',    icon: GiNoodles, bg: '#0e7490', fg: '#fff', value: 'Asian'     },
  { name: 'Coffee',   icon: Coffee,    bg: '#78350f', fg: '#fff', value: 'Coffee'    },
  { name: 'Mexican',  icon: GiTacos,   bg: '#c2410c', fg: '#fff', value: 'Mexican'   },
  { name: 'Japanese', icon: Fish,      bg: '#1d4ed8', fg: '#fff', value: 'Japanese'  },
  { name: 'Desserts', icon: IceCream2, bg: '#be185d', fg: '#fff', value: 'Italian'   },
  { name: 'Healthy',  icon: Salad,     bg: '#15803d', fg: '#fff', value: 'Healthy'   },
  { name: 'Soups',    icon: Soup,      bg: '#7c3aed', fg: '#fff', value: 'Soups'     },
];

const DIETARY    = ['Halal 🌙', 'Veg 🥗', 'Vegan 🌱', 'Spicy 🌶️'];
const SORT_OPTS  = [
  { label: 'Most Popular',  value: 'popular' },
  { label: 'Highest Rated', value: 'rating'  },
  { label: 'Newest',        value: 'newest'  },
  { label: 'A – Z',         value: 'az'      },
];
const EMPTY_MSGS = {
  'Pizza':     ['🍕', 'No pizza places yet'],
  'Fast Food': ['🍔', 'No burger spots yet'],
  'Asian':     ['🍜', 'No Asian spots yet' ],
  'Coffee':    ['☕', 'No coffee shops yet'],
  'Mexican':   ['🌮', 'No Mexican spots yet'],
  'Japanese':  ['🍣', 'No sushi spots yet' ],
  'Italian':   ['🍨', 'No dessert spots yet'],
  'Healthy':   ['🥗', 'No healthy spots yet'],
  'Soups':     ['🍲', 'No soup spots yet'  ],
  'deals':     ['🔥', 'No deals right now' ],
  'All':       ['🍽️', 'No restaurants found'],
};
// ───────────────────────────────────────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────────────────────
function isVendorOpen(vendor) {
  if (!vendor.openingHours) return null;
  const day   = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const hours = vendor.openingHours[day];
  if (!hours?.open || !hours?.close) return false;
  const now    = new Date().getHours() * 60 + new Date().getMinutes();
  const [oh,om]= hours.open.split(':').map(Number);
  const [ch,cm]= hours.close.split(':').map(Number);
  return now >= oh*60+om && now < ch*60+cm;
}

function closingText(vendor) {
  if (!vendor.openingHours) return null;
  const day   = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const hours = vendor.openingHours[day];
  if (!hours?.close) return null;
  const [ch,cm]= hours.close.split(':').map(Number);
  const now    = new Date().getHours()*60 + new Date().getMinutes();
  const diff   = ch*60+cm - now;
  if (diff <= 0 || diff > 120) return null;
  return diff < 60 ? `Closes in ${diff}m` : `Closes in 1h`;
}

function isNew(vendor) {
  if (!vendor.createdAt) return false;
  const d = vendor.createdAt?.toDate?.() || new Date(vendor.createdAt);
  return Date.now() - d.getTime() < 30*24*60*60*1000;
}

function sorted(list, by) {
  const v = [...list];
  if (by === 'rating')  return v.sort((a,b) => (b.rating||0)-(a.rating||0));
  if (by === 'popular') return v.sort((a,b) => (b.orderCount||0)-(a.orderCount||0));
  if (by === 'newest')  return v.sort((a,b) => {
    const da = a.createdAt?.toDate?.() || new Date(a.createdAt||0);
    const db_ = b.createdAt?.toDate?.() || new Date(b.createdAt||0);
    return db_-da;
  });
  if (by === 'az') return v.sort((a,b) => a.name.localeCompare(b.name));
  return v;
}
// ─────────────────────────────────────────────────────────────────────────────

const SkeletonCard = ({ i }) => (
  <div className="vp-skeleton" style={{ animationDelay: `${i * 0.06}s` }}>
    <div className="vp-sk-img" />
    <div className="vp-sk-body">
      <div className="vp-sk-line vp-sk-title" />
      <div className="vp-sk-line vp-sk-desc" />
      <div className="vp-sk-line vp-sk-meta" />
    </div>
  </div>
);

const VendorsPage = () => {
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const auth     = getAuth();
  const currentUser = auth.currentUser;

  const [vendors,       setVendors]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [favorites,     setFavorites]     = useState([]);
  const [recentIds,     setRecentIds]     = useState([]);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [category,      setCategory]      = useState('All');
  const [dietary,       setDietary]       = useState([]);
  const [sortBy,        setSortBy]        = useState('popular');
  const [openOnly,      setOpenOnly]      = useState(false);
  const [showSort,      setShowSort]      = useState(false);
  const [visibleCount,  setVisibleCount]  = useState(PAGE_SIZE);

  // ── Cache → instant load ──────────────────────────────────────
  useEffect(() => {
    try {
      const c = localStorage.getItem(CACHE_KEY);
      if (c) {
        const { data, ts } = JSON.parse(c);
        if (Date.now() - ts < CACHE_TTL) { setVendors(data); setLoading(false); }
      }
    } catch {}
  }, []);

  // ── Real-time vendors ─────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vendors'), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVendors(list);
      setLoading(false);
      setError(null);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: list, ts: Date.now() })); } catch {}
    }, err => {
      console.error(err);
      setError('Could not load restaurants. Check your connection.');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Favorites from Firestore ──────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
      if (snap.exists()) setFavorites(snap.data()?.favorites?.vendors || []);
    });
  }, [currentUser]);

  // ── Recently visited from orders ──────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, 'orders'), snap => {
      const ids = [];
      snap.docs
        .map(d => ({ ...d.data() }))
        .filter(o => o.userId === currentUser.uid)
        .sort((a,b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0))
        .forEach(o => { if (o.vendorId && !ids.includes(o.vendorId)) ids.push(o.vendorId); });
      setRecentIds(ids.slice(0,5));
    });
    return () => unsub();
  }, [currentUser]);

  // ── Toggle favorite ───────────────────────────────────────────
  const toggleFav = async (e, id) => {
    e.stopPropagation();
    const was = favorites.includes(id);
    setFavorites(p => was ? p.filter(x=>x!==id) : [...p,id]);
    if (!currentUser) return;
    try {
      await updateDoc(doc(db,'users',currentUser.uid), {
        'favorites.vendors': was ? arrayRemove(id) : arrayUnion(id)
      });
    } catch { setFavorites(p => was ? [...p,id] : p.filter(x=>x!==id)); }
  };

  const toggleDietary = tag =>
    setDietary(p => p.includes(tag) ? p.filter(t=>t!==tag) : [...p,tag]);

  const scroll = dir =>
    trackRef.current?.scrollBy({ left: dir==='left' ? -300 : 300, behavior: 'smooth' });

  // ── Filter + sort pipeline ────────────────────────────────────
  const filtered = sorted(
    vendors.filter(v => {
      const q   = v.name.toLowerCase().includes(searchQuery.toLowerCase());
      const cat = category==='All' ? true
                : category==='deals' ? v.deals?.length>0
                : v.category?.toLowerCase().includes(category.toLowerCase());
      const diet= dietary.length===0 || dietary.every(t =>
        v.tags?.map(x=>x.toLowerCase()).includes(t.replace(/\s*[^\w\s].*/,'').toLowerCase().trim())
      );
      const open= !openOnly || isVendorOpen(v)===true;
      return q && cat && diet && open;
    }),
    sortBy
  );

  const visible  = filtered.slice(0, visibleCount);
  const hasMore  = visibleCount < filtered.length;
  const recents  = vendors.filter(v => recentIds.includes(v.id));
  const chipCount= (category!=='All'?1:0) + dietary.length + (openOnly?1:0);
  const [emojii, emptyText] = EMPTY_MSGS[category] || EMPTY_MSGS['All'];

  return (
    <div className="vp-page">
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="vp-container">

        {/* ── Error ── */}
        {error && (
          <div className="vp-error">
            <AlertCircle size={16} />
            {error}
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {/* ── Recently Visited ── */}
        {recents.length > 0 && (
          <section className="vp-recents">
            <p className="vp-section-label"><Clock size={13}/> Recently visited</p>
            <div className="vp-recents-row">
              {recents.map(v => (
                <button key={v.id} className="vp-recent-pill" onClick={() => navigate(`/menu/${v.id}`)}>
                  <img src={v.image||'https://via.placeholder.com/32'} alt={v.name}/>
                  {v.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Heading ── */}
        <p className="vp-craving-label">WHAT ARE YOU CRAVING TODAY?</p>

        {/* ── Category strip ── */}
        <div className="vp-cats">
          <button className="vp-cat-arrow" onClick={() => scroll('left')} aria-label="left">
            <ChevronLeft size={15}/>
          </button>
          <div className="vp-cat-track" ref={trackRef}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  className={`vp-cat-btn${active ? ' vp-cat-active' : ''}`}
                  onClick={() => { setCategory(cat.value); setVisibleCount(PAGE_SIZE); }}
                >
                  <span
                    className="vp-cat-icon"
                    style={{ background: active ? cat.bg : `${cat.bg}22`, color: active ? cat.fg : cat.bg }}
                  >
                    <Icon size={20}/>
                  </span>
                  <span className="vp-cat-name">{cat.name}</span>
                </button>
              );
            })}
          </div>
          <button className="vp-cat-arrow" onClick={() => scroll('right')} aria-label="right">
            <ChevronRight size={15}/>
          </button>
        </div>

        {/* ── Filter + Sort row ── */}
        <div className="vp-toolbar">
          <div className="vp-pills">
            {DIETARY.map(tag => (
              <button
                key={tag}
                className={`vp-pill${dietary.includes(tag) ? ' vp-pill-on' : ''}`}
                onClick={() => toggleDietary(tag)}
              >{tag}</button>
            ))}
            <button
              className={`vp-pill${openOnly ? ' vp-pill-on' : ''}`}
              onClick={() => setOpenOnly(p=>!p)}
            >🟢 Open Now</button>
          </div>

          <div className="vp-sort-wrap">
            <button className="vp-sort-btn" onClick={() => setShowSort(p=>!p)}>
              <SlidersHorizontal size={13}/>
              {SORT_OPTS.find(o=>o.value===sortBy)?.label}
              <ChevronDown size={12}/>
            </button>
            {showSort && (
              <>
                <div className="vp-sort-bg" onClick={() => setShowSort(false)}/>
                <div className="vp-sort-menu">
                  {SORT_OPTS.map(o => (
                    <button
                      key={o.value}
                      className={`vp-sort-opt${sortBy===o.value?' vp-sort-active':''}`}
                      onClick={() => { setSortBy(o.value); setShowSort(false); }}
                    >{o.label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Active chips ── */}
        {chipCount > 0 && (
          <div className="vp-chips">
            {category !== 'All' && (
              <span className="vp-chip">
                {category}<button onClick={() => setCategory('All')}><X size={10}/></button>
              </span>
            )}
            {dietary.map(t => (
              <span key={t} className="vp-chip">
                {t}<button onClick={() => toggleDietary(t)}><X size={10}/></button>
              </span>
            ))}
            {openOnly && (
              <span className="vp-chip">
                Open Now<button onClick={() => setOpenOnly(false)}><X size={10}/></button>
              </span>
            )}
            <button className="vp-chip-clear" onClick={() => { setCategory('All'); setDietary([]); setOpenOnly(false); }}>
              Clear all
            </button>
          </div>
        )}

        {/* ── Results count ── */}
        <div className="vp-results-bar">
          <span className="vp-results-count">
            {loading ? 'Loading…' : `${filtered.length} restaurant${filtered.length!==1?'s':''} available`}
          </span>
        </div>

        {/* ── Grid ── */}
        <div className="vp-grid">
          {loading ? (
            Array.from({length: 8}).map((_,i) => <SkeletonCard key={i} i={i}/>)
          ) : filtered.length === 0 ? (
            <div className="vp-empty">
              <span className="vp-empty-icon">{emojii}</span>
              <p>{emptyText}</p>
              {category !== 'All' && (
                <button className="vp-empty-btn" onClick={() => setCategory('All')}>
                  Browse all
                </button>
              )}
            </div>
          ) : visible.map((vendor, idx) => {
            const openStatus = isVendorOpen(vendor);
            const closing    = closingText(vendor);
            const newVendor  = isNew(vendor);
            const fav        = favorites.includes(vendor.id);

            return (
              <div
                key={vendor.id}
                className={`vp-card${openStatus===false?' vp-card-closed':''}`}
                style={{ animationDelay: `${idx * 0.04}s` }}
                onClick={() => navigate(`/menu/${vendor.id}`)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key==='Enter' && navigate(`/menu/${vendor.id}`)}
              >
                {/* Image */}
                <div className="vp-card-img">
                  <img
                    src={vendor.image||'https://via.placeholder.com/400x220'}
                    alt={vendor.name}
                    loading="lazy"
                  />

                  {/* Top-left badges */}
                  <div className="vp-badges">
                    {openStatus !== null && (
                      <span className={`vp-badge-status ${openStatus?'open':'closed'}`}>
                        {openStatus ? '● Open' : '● Closed'}
                      </span>
                    )}
                    {newVendor && <span className="vp-badge-new">New ✨</span>}
                    {vendor.deals?.length > 0 && <span className="vp-badge-deal">🔥 Deal</span>}
                  </div>

                  {/* Closing soon warning */}
                  {closing && (
                    <span className="vp-closing"><Clock size={10}/> {closing}</span>
                  )}

                  {/* Fav button */}
                  <button className="vp-fav" onClick={e => toggleFav(e, vendor.id)}>
                    <Heart size={15} color={fav?'#dc2626':'#9ca3af'} fill={fav?'#dc2626':'none'}/>
                  </button>
                </div>

                {/* Body */}
                <div className="vp-card-body">
                  <p className="vp-card-name">{vendor.name}</p>
                  {vendor.description && (
                    <p className="vp-card-desc">{vendor.description}</p>
                  )}

                  {/* Tags */}
                  {vendor.tags?.length > 0 && (
                    <div className="vp-card-tags">
                      {vendor.tags.slice(0,3).map(t => (
                        <span key={t} className="vp-tag">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="vp-card-meta">
                    <span className="vp-meta-rating">
                      <Star size={12} fill="#fbbf24" color="#fbbf24"/>
                      {vendor.rating ? vendor.rating.toFixed(1) : 'N/A'}
                    </span>
                    {vendor.orderCount > 0 && (
                      <span className="vp-meta-orders">
                        <TrendingUp size={12}/>
                        {vendor.orderCount >= 1000
                          ? `${(vendor.orderCount/1000).toFixed(1)}k`
                          : vendor.orderCount}+
                      </span>
                    )}
                    {vendor.waitTime && (
                      <span className="vp-meta-wait">
                        <Clock size={12}/> ~{vendor.waitTime}m
                      </span>
                    )}
                    {vendor.priceRange && (
                      <span className="vp-meta-price">
                        {'R'.repeat(vendor.priceRange)}
                        <span className="vp-price-dim">{'R'.repeat(3-vendor.priceRange)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Load more ── */}
        {!loading && hasMore && (
          <div className="vp-loadmore-wrap">
            <button className="vp-loadmore" onClick={() => setVisibleCount(p => p+PAGE_SIZE)}>
              Show more restaurants
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default VendorsPage;