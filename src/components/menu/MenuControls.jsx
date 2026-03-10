import { Box, Typography } from '@mui/material';

/* ─────────────────────────────────────────────────────────────────
   MenuControls
   Item count in brand red, sort dropdown matches app input style.
   Font: Poppins
───────────────────────────────────────────────────────────────── */
const MenuControls = ({ itemCount, sortBy, setSortBy }) => {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 3
    }}>
      {/* Item count */}
      <Typography sx={{
        fontWeight: 600,
        fontSize: '0.95rem',
        color: '#dc2626',          /* brand red */
        fontFamily: 'Poppins, sans-serif'
      }}>
        {itemCount} {itemCount === 1 ? 'item' : 'items'} found
      </Typography>

      {/* Sort control */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{
          fontWeight: 600,
          fontSize: '0.85rem',
          color: '#6b7280',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Sort by:
        </Typography>

        {/* Styled to match the app's input fields */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding:         '8px 14px',
            border:          '1px solid #e5e7eb',
            borderRadius:    '8px',
            cursor:          'pointer',
            fontWeight:      600,
            fontSize:        '0.85rem',
            fontFamily:      'Poppins, sans-serif',
            backgroundColor: '#ffffff',
            color:           '#1f2937',
            outline:         'none',
            transition:      'border-color 0.2s ease',
          }}
          onFocus={(e)  => { e.target.style.borderColor = '#dc2626'; e.target.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.1)'; }}
          onBlur={(e)   => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
        >
          <option value="rating">Highest Rating</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </Box>
    </Box>
  );
};

export default MenuControls;