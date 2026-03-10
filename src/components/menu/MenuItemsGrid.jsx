import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  IconButton,
  Rating,
  Typography,
  Fade
} from '@mui/material';
import { FaHeart, FaRegHeart, FaShoppingCart } from 'react-icons/fa';

/* ─────────────────────────────────────────────────────────────────
   MenuItemsGrid
   Colours: brand red #dc2626, dark #1f2937, gold #fbbf24
   Font: Poppins (loaded via index.html)
───────────────────────────────────────────────────────────────── */
const MenuItemsGrid = ({ items, favorites, toggleFavorite, addToCart }) => {

  // ── Empty state ───────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <Fade in timeout={500}>
        <Box sx={{
          textAlign: 'center',
          py: 12,
          bgcolor: 'white',
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" sx={{ color: '#9ca3af', fontWeight: 600, mb: 1, fontFamily: 'Poppins, sans-serif' }}>
            No menu items found
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', fontFamily: 'Poppins, sans-serif' }}>
            Try adjusting your search or filter
          </Typography>
        </Box>
      </Fade>
    );
  }

  return (
    <Grid container spacing={3}>
      {items.map((item, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
          <Fade in timeout={300 + (index * 50)}>
            <Card sx={{
              height: '520px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #e5e7eb',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: '0 12px 28px rgba(0,0,0,0.1)',
                borderColor: '#d1d5db'
              },
              bgcolor: 'white',
              overflow: 'hidden',
              fontFamily: 'Poppins, sans-serif'
            }}>

              {/* ── Image ── */}
              <Box sx={{
                position: 'relative',
                width: '100%',
                height: '220px',
                overflow: 'hidden',
                flexShrink: 0,
                bgcolor: '#f3f4f6'
              }}>
                <CardMedia
                  component="img"
                  image={item.image || 'https://via.placeholder.com/400x300?text=No+Image'}
                  alt={item.name}
                  sx={{
                    width: '100%',
                    height: '220px',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                    transition: 'transform 0.35s ease',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                />

                {/* Favourite button */}
                <IconButton
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                  sx={{
                    position: 'absolute', top: 10, right: 10,
                    bgcolor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    width: 34, height: 34,
                    transition: 'transform 0.2s ease',
                    '&:hover': { bgcolor: 'white', transform: 'scale(1.15)' }
                  }}
                >
                  {favorites.includes(item.id)
                    ? <FaHeart color="#dc2626" size={15} />
                    : <FaRegHeart color="#9ca3af" size={15} />
                  }
                </IconButton>
              </Box>

              {/* ── Content ── */}
              <CardContent sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                p: 2,
                fontFamily: 'Poppins, sans-serif'
              }}>

                {/* Name */}
                <Typography sx={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: '#1f2937',
                  fontFamily: 'Poppins, sans-serif',
                  mb: 0.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.35
                }}>
                  {item.name}
                </Typography>

                {/* Category */}
                <Typography sx={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 500,
                  mb: 1
                }}>
                  {item.category || 'Food'}
                </Typography>

                {/* Rating */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <Rating
                    value={item.rating || 4.5}
                    readOnly size="small" precision={0.1}
                    sx={{
                      fontSize: '0.9rem',
                      '& .MuiRating-iconFilled': { color: '#fbbf24' }
                    }}
                  />
                  <Typography sx={{
                    fontSize: '0.75rem', color: '#4b5563',
                    fontWeight: 600, fontFamily: 'Poppins, sans-serif'
                  }}>
                    ({item.rating || 4.5})
                  </Typography>
                </Box>

                {/* Description */}
                <Typography sx={{
                  fontSize: '0.8rem',
                  color: '#9ca3af',
                  fontFamily: 'Poppins, sans-serif',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mb: 1.5
                }}>
                  {item.description || 'Delicious menu item'}
                </Typography>

                {/* Price */}
                <Typography sx={{
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  color: '#dc2626',        /* brand red */
                  fontFamily: 'Poppins, sans-serif',
                  mb: 1.5
                }}>
                  {item.price ? `R${item.price.toFixed(2)}` : 'Price not available'}
                </Typography>

                {/* Add to Cart — pushed to bottom */}
                <Box sx={{ mt: 'auto' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<FaShoppingCart size={13} />}
                    onClick={() => addToCart(item)}
                    sx={{
                      bgcolor: '#dc2626',       /* brand red */
                      color: 'white',
                      fontWeight: 700,
                      py: 1.1,
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif',
                      boxShadow: '0 4px 12px rgba(220,38,38,0.2)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: '#b91c1c',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 16px rgba(220,38,38,0.3)'
                      }
                    }}
                  >
                    Add to Cart
                  </Button>
                </Box>

              </CardContent>
            </Card>
          </Fade>
        </Grid>
      ))}
    </Grid>
  );
};

export default MenuItemsGrid;