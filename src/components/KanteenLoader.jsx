import { Box, Typography } from '@mui/material';

const PP = 'Poppins, system-ui, sans-serif';

/* ─────────────────────────────────────────────────────────────────
   KanteenLoader.jsx
   Full-screen loading overlay — each letter of KANTEEN bounces
   up and down in a staggered wave, all in solid red.

   USAGE:
     import KanteenLoader from '../components/KanteenLoader';
     if (loading) return <KanteenLoader />;

   Optional prop:
     message — shown below the wordmark (default: "Loading…")
     <KanteenLoader message="Finding restaurants near you…" />
───────────────────────────────────────────────────────────────── */
const LETTERS = ['K', 'A', 'N', 'T', 'E', 'E', 'N'];

const KanteenLoader = ({ message = 'Loading…' }) => {
  return (
    <Box sx={{
      position: 'fixed',
      inset: 0,
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

      {/* ── KANTEEN wordmark — each letter bounces in a wave ── */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '2px',

        /* Define the bounce keyframe once at this level */
        '@keyframes kantBounce': {
          '0%,  100%': { transform: 'translateY(0px)'   },
          '40%':        { transform: 'translateY(-18px)' },
          '60%':        { transform: 'translateY(-10px)' },
        },
      }}>
        {LETTERS.map((letter, i) => (
          <Typography
            key={i}
            sx={{
              fontFamily: PP,
              fontWeight: 900,
              fontSize: '42px',
              letterSpacing: '4px',
              color: '#dc2626',
              userSelect: 'none',
              display: 'inline-block',
              lineHeight: 1,

              /* Each letter starts its bounce a little later = wave */
              animation: `kantBounce 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
            }}
          >
            {letter}
          </Typography>
        ))}
      </Box>

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