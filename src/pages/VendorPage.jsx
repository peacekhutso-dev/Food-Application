import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';
import {
  Store, Flame, Pizza, Coffee, IceCream2,
  Fish, Heart, Salad, ChevronLeft, ChevronRight, Star, MapPin, Search, X
} from 'lucide-react';
import { GiNoodles, GiTacos } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase_data/firebase';
import { getAuth } from 'firebase/auth';
import Navbar from '../components/landing/Navbar';
import KanteenLoader from '../components/KanteenLoader';
import './VendorsPage.css';

const VendorsPage = () => {
  const navigate  = useNavigate();
  const scrollRef = useRef(null);

  const [searchQuery,      setSearchQuery]      = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites,        setFavorites]        = useState([]);
  const [vendors,          setVendors]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [user,             setUser]             = useState({ name: 'User' });
  const [cart,             setCart]             = useState([]);
  const [location,         setLocation]         = useState(null);   // resolved location string
  const [locLoading,       setLocLoading]       = useState(false);
  const [locInput,         setLocInput]         = useState('');     // what the user is typing
  const [locSuggestions,   setLocSuggestions]   = useState([]);     // nominatim suggestions
  const [locOpen,          setLocOpen]          = useState(false);  // dropdown visible
  const locRef                                  = useRef(null);     // for click-outside

  // ── Category definitions ──────────────────────────────────────
  // Each has a bgColor for the filled circle and an icon
  const categoryIcons = [
    { name: 'All',      icon: <Store     size={22} />, bg: '#1f2937', value: 'All'       },
    { name: 'Deals',    icon: <Flame     size={22} />, bg: '#dc2626', value: 'deals'     },
    { name: 'Pizza',    icon: <Pizza     size={22} />, bg: '#ea580c', value: 'Pizza'     },
    { name: 'Burgers',  icon: <Salad     size={22} />, bg: '#16a34a', value: 'Fast Food' },
    { name: 'Asian',    icon: <GiNoodles size={22} />, bg: '#0891b2', value: 'Asian'     },
    { name: 'Coffee',   icon: <Coffee    size={22} />, bg: '#92400e', value: 'Coffee'    },
    { name: 'Mexican',  icon: <GiTacos   size={22} />, bg: '#c2410c', value: 'Mexican'   },
    { name: 'Japanese', icon: <Fish      size={22} />, bg: '#0369a1', value: 'Japanese'  },
    { name: 'Desserts', icon: <IceCream2 size={22} />, bg: '#db2777', value: 'Italian'   },
  ];

  // ── Close dropdown when clicking outside ────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locRef.current && !locRef.current.contains(e.target)) {
        setLocOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Fetch location suggestions as user types ──────────────────
  useEffect(() => {
    if (locInput.trim().length < 2) {
      setLocSuggestions([]);
      return;
    }
    // Debounce — wait 350ms after user stops typing
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locInput)}&format=json&limit=5&addressdetails=1`
        );
        const data = await res.json();
        setLocSuggestions(data);
        setLocOpen(true);
      } catch {
        setLocSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [locInput]);

  // ── Data fetching ─────────────────────────────────────────────
  useEffect(() => {
    fetchVendors();
    fetchUserData();
    fetchLocation();   // grab campus location on mount
  }, []);

  async function fetchUserData() {
    try {
      const auth        = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userRef  = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUser(userData);
        setCart(userData.cart || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  async function fetchVendors() {
    try {
      setLoading(true);
      const vendorsCollection = collection(db, 'vendors');
      const vendorSnapshot    = await getDocs(vendorsCollection);
      const vendorList        = vendorSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setVendors(vendorList);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  }

  // ── Reverse-geocode the user's position into a readable name ──
  function fetchLocation() {
    if (!navigator.geolocation) return;

    setLocLoading(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          // Free reverse-geocode via nominatim (no API key needed)
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          );
          const data = await res.json();

          // Pick the most readable label available
          const place =
            data.address?.building     ||
            data.address?.amenity      ||
            data.address?.road         ||
            data.address?.suburb       ||
            data.address?.city         ||
            'Your campus location';

          setLocation(place);
          setLocInput(place);
        } catch {
          setLocation('Your campus location');
        } finally {
          setLocLoading(false);
        }
      },
      () => {
        // User denied or error — fall back gracefully
        setLocation('Your campus location');
        setLocInput('Your campus location');
        setLocLoading(false);
      },
      { timeout: 8000 }
    );
  }

  // ── Filtering ─────────────────────────────────────────────────
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'deals') return matchesSearch && vendor.deals?.length > 0;
    const matchesCategory =
      selectedCategory === 'All' ||
      vendor.category?.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // ── Favourites toggle ─────────────────────────────────────────
  const toggleFavorite = (vendorId) => {
    setFavorites(prev =>
      prev.includes(vendorId) ? prev.filter(id => id !== vendorId) : [...prev, vendorId]
    );
  };

  // ── Category strip scroll ─────────────────────────────────────
  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -280 : 280,
        behavior: 'smooth',
      });
    }
  };

  if (loading) return <KanteenLoader message="Finding restaurants near you…" />;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="vp-page">

      <Navbar
        userData={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activePage="vendors"
        cartCount={cart.length || 0}
      />

      <div className="vp-container">

        {/* ── Location search strip ────────────────────────────
            GPS auto-detect on load. User can also type to search
            and pick from Nominatim suggestions.                  */}
        <div className="vp-location-wrap" ref={locRef}>
          <div className="vp-location-strip">
            <MapPin size={15} className="vp-location-pin" />
            <input
              className="vp-location-input"
              type="text"
              placeholder="Your campus location"
              value={locInput}
              onChange={(e) => { setLocInput(e.target.value); setLocOpen(true); }}
              onFocus={() => { if (locSuggestions.length > 0) setLocOpen(true); }}
            />
            {/* GPS button — re-detect current position */}
            <button
              className="vp-location-gps"
              onClick={fetchLocation}
              title="Use my location"
              aria-label="Detect my location"
            >
              {locLoading ? '…' : <MapPin size={13} />}
            </button>
            {/* Clear button */}
            {locInput.length > 0 && (
              <button
                className="vp-location-clear"
                onClick={() => { setLocInput(''); setLocSuggestions([]); setLocOpen(false); }}
                aria-label="Clear location"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {locOpen && locSuggestions.length > 0 && (
            <ul className="vp-loc-suggestions">
              {locSuggestions.map((s, i) => (
                <li
                  key={i}
                  className="vp-loc-suggestion-item"
                  onClick={() => {
                    setLocInput(s.display_name);
                    setLocation(s.display_name);
                    setLocSuggestions([]);
                    setLocOpen(false);
                  }}
                >
                  <MapPin size={12} className="vp-loc-s-pin" />
                  <span>{s.display_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── "What are you craving?" heading ─────────────────  */}
        <p className="vp-craving-label">WHAT ARE YOU CRAVING TODAY?</p>

        {/* ── Circular category icons ──────────────────────────
            Each category is a filled circle with an icon above
            and the category name below — matching the mockup.  */}
        <div className="vp-cat-wrapper">
          <div className="vp-cat-nav">

            <button className="vp-cat-arrow" onClick={() => scroll('left')} aria-label="Scroll left">
              <ChevronLeft size={16} />
            </button>

            <div className="vp-cat-track" ref={scrollRef}>
              {categoryIcons.map((cat, i) => (
                <button
                  key={i}
                  className={`vp-cat-item${selectedCategory === cat.value ? ' active' : ''}`}
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {/* Filled circle — uses category bg colour, brightens when active */}
                  <div
                    className="vp-cat-circle"
                    style={{ background: cat.bg }}
                  >
                    {cat.icon}
                  </div>
                  {/* Label below the circle */}
                  <span className="vp-cat-label">{cat.name}</span>
                </button>
              ))}
            </div>

            <button className="vp-cat-arrow" onClick={() => scroll('right')} aria-label="Scroll right">
              <ChevronRight size={16} />
            </button>

          </div>
        </div>

        {/* ── Results bar ──────────────────────────────────────  */}
        <div className="vp-results-bar">
          <span className="vp-results-count">Available on campus</span>
          {selectedCategory !== 'All' && (
            <button className="vp-clear-btn" onClick={() => setSelectedCategory('All')}>
              Clear ✕
            </button>
          )}
        </div>

        {/* ── Vendor grid ──────────────────────────────────────  */}
        <div className="vp-grid">
          {filteredVendors.length === 0 ? (
            <div className="vp-empty">
              <span className="vp-empty-icon">🍽️</span>
              No restaurants found
            </div>
          ) : (
            filteredVendors.map(vendor => (
              <div
                key={vendor.id}
                className="vp-card"
                onClick={() => navigate(`/menu/${vendor.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/menu/${vendor.id}`)}
                aria-label={`View ${vendor.name} menu`}
              >
                {/* Image */}
                <div className="vp-card-img-wrap">
                  <img
                    src={vendor.image || 'https://via.placeholder.com/400x220'}
                    alt={vendor.name}
                    loading="lazy"
                  />
                  {vendor.deals?.length > 0 && <span className="vp-deal-badge">Deal</span>}
                  <button
                    className="vp-fav-btn"
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(vendor.id); }}
                    aria-label="Toggle favourite"
                  >
                    <Heart
                      size={16}
                      color={favorites.includes(vendor.id) ? '#dc2626' : '#9ca3af'}
                      fill={favorites.includes(vendor.id) ? '#dc2626' : 'none'}
                    />
                  </button>
                </div>

                {/* Body */}
                <div className="vp-card-body">
                  <p className="vp-card-name">{vendor.name}</p>
                  {/* Description shown if available — matches mockup */}
                  {vendor.description && (
                    <p className="vp-card-description">{vendor.description}</p>
                  )}
                  <div className="vp-card-meta">
                    <span className="vp-card-rating">
                      <Star size={14} fill="#fbbf24" color="#fbbf24" />
                      {vendor.rating ?? 'N/A'} rating
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default VendorsPage;