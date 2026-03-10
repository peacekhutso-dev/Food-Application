import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Grid,
  Rating,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from '../firebase_data/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useCart } from '../context/CartContext';
import Navbar from '../components/landing/Navbar';
import KanteenLoader from '../components/KanteenLoader';
import {
  MdCoffee,
  MdFastfood,
  MdIcecream,
  MdLocalPizza,
  MdLunchDining,
  MdRestaurant,
} from 'react-icons/md';

/* ─────────────────────────────────────────────────────────────────
   Menu (MenuPage)
   Brand colours: red #dc2626, dark #1f2937, gold #fbbf24, white #fff
   Font: Poppins (loaded in index.html)
───────────────────────────────────────────────────────────────── */

// Shared font shorthand
const PP = 'Poppins, system-ui, sans-serif';

const Menu = () => {
  const { vendorId } = useParams();
  const navigate     = useNavigate();
  const { addToCart: addToCartContext } = useCart();

  const [vendor,          setVendor]          = useState(null);
  const [menuItems,       setMenuItems]       = useState([]);
  const [filteredItems,   setFilteredItems]   = useState([]);
  const [selectedCategory,setSelectedCategory]= useState('All');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [sortBy,          setSortBy]          = useState('rating');
  const [currentUser,     setCurrentUser]     = useState(null);
  const [userData,        setUserData]        = useState(null);
  const [snackbarOpen,    setSnackbarOpen]    = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [addingItem,      setAddingItem]      = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');

  // ── Auth listener ─────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserData(user.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (currentUser && vendorId) fetchVendorAndMenu();
  }, [vendorId, currentUser]);

  useEffect(() => {
    filterMenuItems();
  }, [menuItems, selectedCategory, searchQuery, sortBy]);

  // ── Data fetching ─────────────────────────────────────────────
  async function fetchUserData(userId) {
    try {
      const userSnap = await getDoc(doc(db, 'users', userId));
      if (userSnap.exists()) setUserData(userSnap.data());
    } catch {
      setError('Unable to load your profile. Please refresh the page.');
    }
  }

  async function fetchVendorAndMenu() {
    setLoading(true);
    setError('');
    try {
      const vendorSnap = await getDoc(doc(db, 'vendors', vendorId));
      if (vendorSnap.exists()) {
        setVendor({ id: vendorSnap.id, ...vendorSnap.data() });
      } else {
        setError('Restaurant not found');
        setLoading(false);
        return;
      }

      const menuSnapshot = await getDocs(
        query(collection(db, 'menu_items'), where('vendorId', '==', vendorId))
      );
      const menuList = menuSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMenuItems(menuList);
      setFilteredItems(menuList);
    } catch {
      setError('Unable to load menu. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Filtering + sorting ───────────────────────────────────────
  function filterMenuItems() {
    let filtered = [...menuItems];
    if (selectedCategory !== 'All')
      filtered = filtered.filter((item) => item.category === selectedCategory);
    if (searchQuery)
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    if (sortBy === 'rating')      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === 'price-low')  filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') filtered.sort((a, b) => b.price - a.price);
    setFilteredItems(filtered);
  }

  // ── Add to cart ───────────────────────────────────────────────
  async function handleAddToCart(item) {
    if (addingItem) return;
    setAddingItem(true);
    try {
      await addToCartContext(item);
      setSnackbarMessage(`${item.name} added to your cart!`);
      setSnackbarOpen(true);
    } catch {
      setSnackbarMessage('Failed to add item. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setAddingItem(false);
    }
  }

  // ── Loading screen ────────────────────────────────────────────
  if (loading) return <KanteenLoader message="Loading menu…" />;

  // ── Error screen ──────────────────────────────────────────────
  if (error || !vendor) {
    return (
      <Box sx={{ bgcolor: '#f9f9f9', minHeight: '100vh' }}>
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} userData={userData} activePage="Vendors" />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ fontFamily: PP, color: '#dc2626', fontWeight: 600, fontSize: '1.1rem' }}>
            {error || 'Restaurant not found'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/vendor')}
            sx={{
              bgcolor: '#dc2626', fontFamily: PP, fontWeight: 700,
              textTransform: 'none', borderRadius: '8px',
              '&:hover': { bgcolor: '#b91c1c' }
            }}
          >
            Back to Restaurants
          </Button>
        </Box>
      </Box>
    );
  }

  // ── Category config ───────────────────────────────────────────
  const categories = ['All', ...new Set(menuItems.map((item) => item.category))];

  const categoryIcons = {
    Pizza:    <MdLocalPizza />,
    Burgers:  <MdFastfood />,
    Salads:   <MdLunchDining />,
    Coffee:   <MdCoffee />,
    Desserts: <MdIcecream />,
    Snacks:   <MdFastfood />,
  };

  // Sort chip config
  const sortChips = [
    { label: 'Top Rated', value: 'rating'     },
    { label: 'Price ↑',   value: 'price-low'  },
    { label: 'Price ↓',   value: 'price-high' },
  ];

  // ── Main render ───────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: '#f9f9f9', minHeight: '100vh', fontFamily: PP }}>
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        userData={userData}
        activePage="Vendors"
      />
      <Box sx={{ height: '80px' }} />

      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* ── Vendor header card ──────────────────────────────── */}
        <Box sx={{
          mb: 4,
          bgcolor: 'white',
          borderRadius: '14px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>
          {/* Cover image */}
          {vendor.image && (
            <Box
              component="img"
              src={vendor.image}
              alt={vendor.name}
              sx={{
                width: '100%',
                height: { xs: '160px', sm: '200px', md: '260px' },
                objectFit: 'cover',
              }}
            />
          )}

          {/* Vendor details */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Name */}
            <Typography sx={{
              fontFamily: PP, fontWeight: 800,
              fontSize: { xs: '1.4rem', sm: '1.8rem' },
              color: '#1f2937', letterSpacing: '-0.4px', mb: 1
            }}>
              {vendor.name}
            </Typography>

            {/* Rating */}
            {vendor.rating && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                <Rating
                  value={vendor.rating} precision={0.1} readOnly size="small"
                  sx={{ '& .MuiRating-iconFilled': { color: '#fbbf24' } }}
                />
                <Typography sx={{ fontFamily: PP, color: '#6b7280', fontWeight: 600, fontSize: '0.85rem' }}>
                  {vendor.rating}
                </Typography>
              </Box>
            )}

            {/* Description */}
            {vendor.description && (
              <Typography sx={{
                fontFamily: PP, color: '#6b7280',
                fontSize: { xs: '0.875rem', sm: '0.95rem' }, mb: 1
              }}>
                {vendor.description}
              </Typography>
            )}

            {/* Address */}
            {vendor.address && (
              <Typography sx={{ fontFamily: PP, color: '#9ca3af', fontSize: '0.8rem' }}>
                📍 {vendor.address}
              </Typography>
            )}
          </Box>
        </Box>

        {/* ── Filters row ─────────────────────────────────────── */}
        <Box sx={{ mb: 4 }}>
          {/* Header + sort chips */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2, mb: 2
          }}>
            <Typography sx={{
              fontFamily: PP, fontWeight: 700,
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              color: '#1f2937'
            }}>
              Filter by Category
            </Typography>

            {/* Sort chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {sortChips.map((chip) => (
                <Chip
                  key={chip.value}
                  label={chip.label}
                  onClick={() => setSortBy(chip.value)}
                  sx={{
                    fontFamily: PP, fontWeight: 600,
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    bgcolor:  sortBy === chip.value ? '#dc2626' : '#ffffff',
                    color:    sortBy === chip.value ? '#ffffff' : '#1f2937',
                    border:   sortBy === chip.value ? 'none' : '1.5px solid #e5e7eb',
                    '&:hover': {
                      bgcolor: sortBy === chip.value ? '#b91c1c' : '#fef2f2',
                      color:   sortBy === chip.value ? '#ffffff' : '#dc2626',
                    }
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Category chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                icon={categoryIcons[category] || <MdRestaurant />}
                onClick={() => setSelectedCategory(category)}
                sx={{
                  fontFamily: PP, fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                  py: 2.5, px: 1,
                  bgcolor: selectedCategory === category ? '#1f2937' : '#ffffff',
                  color:   selectedCategory === category ? '#ffffff' : '#4b5563',
                  border:  selectedCategory === category ? 'none' : '1.5px solid #e5e7eb',
                  '&:hover': {
                    bgcolor: selectedCategory === category ? '#111827' : '#f3f4f6',
                  },
                  '& .MuiChip-icon': { color: 'inherit', fontSize: '1.1rem' }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* ── Empty state ──────────────────────────────────────── */}
        {filteredItems.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography sx={{ fontFamily: PP, color: '#9ca3af', fontWeight: 500 }}>
              No items found
            </Typography>
          </Box>
        )}

        {/* ── Menu grid ────────────────────────────────────────── */}
        <Grid container spacing={3}>
          {filteredItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderRadius: '14px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                transition: 'all 0.22s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.1)',
                  borderColor: '#d1d5db'
                },
                bgcolor: 'white',
                overflow: 'hidden',
              }}>

                {/* Item image */}
                <CardMedia
                  component="img"
                  image={item.image || 'https://via.placeholder.com/400x300'}
                  alt={item.name}
                  sx={{
                    height: 190,
                    objectFit: 'cover',
                    transition: 'transform 0.35s ease',
                    '&:hover': { transform: 'scale(1.04)' }
                  }}
                />

                <CardContent sx={{
                  flexGrow: 1, display: 'flex',
                  flexDirection: 'column', p: 2
                }}>

                  {/* Name */}
                  <Typography sx={{
                    fontFamily: PP, fontWeight: 700,
                    fontSize: '0.95rem', color: '#1f2937',
                    mb: 0.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.name}
                  </Typography>

                  {/* Description */}
                  <Typography sx={{
                    fontFamily: PP, fontSize: '0.8rem',
                    color: '#9ca3af', flexGrow: 1, mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.4
                  }}>
                    {item.description}
                  </Typography>

                  {/* Rating — gold stars */}
                  <Rating
                    value={item.rating || 4.5} size="small" readOnly
                    sx={{
                      mt: 'auto', mb: 0.5,
                      '& .MuiRating-iconFilled': { color: '#fbbf24' }
                    }}
                  />

                  {/* Price — brand red */}
                  <Typography sx={{
                    fontFamily: PP, fontWeight: 700,
                    fontSize: '1.1rem', color: '#dc2626', mt: 0.5, mb: 1.5
                  }}>
                    R{item.price.toFixed(2)}
                  </Typography>

                  {/* Add to Cart button */}
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={addingItem}
                    onClick={() => handleAddToCart(item)}
                    startIcon={<Plus size={15} />}
                    sx={{
                      bgcolor: '#dc2626',
                      fontFamily: PP, fontWeight: 700,
                      textTransform: 'none',
                      fontSize: '0.875rem',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(220,38,38,0.2)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: '#b91c1c',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 16px rgba(220,38,38,0.3)'
                      },
                      '&:disabled': { bgcolor: '#d1d5db' }
                    }}
                  >
                    {addingItem ? 'Adding…' : 'Add to Cart'}
                  </Button>

                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

      </Container>

      {/* ── Snackbar notification ──────────────────────────────── */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{
            width: '100%',
            bgcolor: '#dc2626',   /* brand red toast */
            color: 'white',
            fontWeight: 600,
            fontFamily: PP,
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Menu;