import { Box, Chip, Typography } from '@mui/material';
import { MdRestaurant, MdFastfood, MdLocalDrink, MdIcecream } from 'react-icons/md';

/* ─────────────────────────────────────────────────────────────────
   CategoryFilter
   Active state uses brand red #dc2626.
   Font: Poppins
───────────────────────────────────────────────────────────────── */
const CategoryFilter = ({ selectedCategory, setSelectedCategory }) => {

  const mainCategories = [
    { name: 'All',      icon: <MdRestaurant />, activeColor: '#1f2937', lightBg: '#f3f4f6' },
    { name: 'Food',     icon: <MdFastfood />,   activeColor: '#dc2626', lightBg: '#fef2f2' },
    { name: 'Drinks',   icon: <MdLocalDrink />, activeColor: '#2563eb', lightBg: '#dbeafe' },
    { name: 'Desserts', icon: <MdIcecream />,   activeColor: '#ec4899', lightBg: '#fce7f3' },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography sx={{
        fontWeight: 700,
        mb: 2,
        fontSize: '1rem',
        color: '#1f2937',
        fontFamily: 'Poppins, sans-serif'
      }}>
        Categories
      </Typography>

      <Box sx={{
        display: 'flex',
        gap: 1.5,
        flexWrap: 'wrap',
        pb: 2,
        borderBottom: '2px solid #e5e7eb'
      }}>
        {mainCategories.map((cat) => {
          const isSelected = selectedCategory === cat.name;

          return (
            <Chip
              key={cat.name}
              icon={cat.icon}
              label={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              sx={{
                px: 1.5,
                py: 2.5,
                fontSize: '0.875rem',
                fontWeight: isSelected ? 700 : 600,
                fontFamily: 'Poppins, sans-serif',
                /* Active: filled with the category colour
                   Inactive: light tinted background          */
                bgcolor:    isSelected ? cat.activeColor : cat.lightBg,
                color:      isSelected ? '#ffffff'       : cat.activeColor,
                border:     `2px solid ${isSelected ? cat.activeColor : 'transparent'}`,
                transition: 'all 0.2s ease',
                cursor:     'pointer',
                '&:hover': {
                  bgcolor:   cat.activeColor,
                  color:     '#ffffff',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${cat.activeColor}33`
                },
                '& .MuiChip-icon': {
                  color:    'inherit',
                  fontSize: '1.2rem'
                }
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default CategoryFilter;