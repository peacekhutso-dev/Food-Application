import { Box, Chip, Rating, Typography } from '@mui/material';

/* ─────────────────────────────────────────────────────────────────
   MenuHeader
   Vendor name in dark #1f2937, category chip in brand red,
   deal chip in red tint. Gold stars. Font: Poppins.
───────────────────────────────────────────────────────────────── */
const MenuHeader = ({ vendor }) => {
  return (
    <Box sx={{
      mb: 4,
      p: 3,
      bgcolor: 'white',
      borderRadius: '14px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>

      {/* Vendor name */}
      <Typography sx={{
        fontWeight: 800,
        fontSize: '1.6rem',
        color: '#1f2937',
        fontFamily: 'Poppins, sans-serif',
        letterSpacing: '-0.4px',
        mb: 1.5
      }}>
        {vendor.name}
      </Typography>

      {/* Meta row: category chip + rating + deal */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>

        {/* Category chip — brand red */}
        <Chip
          label={vendor.category}
          sx={{
            bgcolor: '#dc2626',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.8rem',
            fontFamily: 'Poppins, sans-serif',
            height: '28px'
          }}
        />

        {/* Star rating + number */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Rating
            value={vendor.rating || 0}
            precision={0.1}
            size="small"
            readOnly
            sx={{ '& .MuiRating-iconFilled': { color: '#fbbf24' } }}
          />
          <Typography sx={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#6b7280',
            fontFamily: 'Poppins, sans-serif'
          }}>
            {vendor.rating || 'N/A'} rating
          </Typography>
        </Box>

        {/* Deal chip — only shown when deals exist */}
        {vendor.deals && vendor.deals.length > 0 && (
          <Chip
            label={`🔥 ${vendor.deals[0]}`}
            sx={{
              bgcolor: '#fef2f2',
              color: '#dc2626',
              fontWeight: 600,
              fontSize: '0.8rem',
              fontFamily: 'Poppins, sans-serif',
              border: '1px solid #fecaca',
              height: '28px'
            }}
          />
        )}

      </Box>
    </Box>
  );
};

export default MenuHeader;