import { Box, Typography } from '@mui/material';

const PP = 'Poppins, system-ui, sans-serif';

/* ─────────────────────────────────────────────────────────────────
   KanteenLoader.jsx
   Full-screen loading overlay — blurs the page behind it and
   pulses the KANTEEN wordmark until loading is done.

   USAGE:
     import KanteenLoader from '../components/KanteenLoader';
     if (loading) return <KanteenLoader />;

   Optional prop:
     message — shown below the wordmark (default: "Loading…")
     <KanteenLoader message="Finding restaurants near you…" />
───────────────────────────────────────────────────────────────── */
const KanteenLoader = ({ message = 'Loading…' }) => {
  return (
    <Box sx={{
      position: 'fixed',
      inset: 0,
      /* Blurs whatever is rendered behind this overlay */
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      bgcolor: 'rgba(255,255,255,0.75)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      gap: 2,
    }}>

      {/* ── KANTEEN wordmark — pulses on/off ── */}
      <Typography sx={{
        fontFamily: PP,
        fontWeight: 900,
        fontSize: '42px',
        letterSpacing: '8px',
        /* Red → dark gradient across the letters */
        background: 'linear-gradient(90deg, #dc2626 0%, #1f2937 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        userSelect: 'none',
        /* Smooth fade in-and-out pulse, loops forever */
        animation: 'kantPulse 1.6s ease-in-out infinite',
        '@keyframes kantPulse': {
          '0%,100%': { opacity: 1,    transform: 'scale(1)'    },
          '50%':     { opacity: 0.15, transform: 'scale(0.97)' },
        },
      }}>
        KANTEEN
      </Typography>

      {/* ── Sub-label ── */}
      <Typography sx={{
        fontFamily: PP,
        fontSize: '13px',
        fontWeight: 500,
        color: '#9ca3af',
        letterSpacing: '0.4px',
      }}>
        {message}
      </Typography>

    </Box>
  );
};

export default KanteenLoader;