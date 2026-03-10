import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { Store, Clock, Package } from 'lucide-react';
import Navbar from './Navbar';

const Home = () => {
  const navigate = useNavigate();

  const universities = [
    { id: 'uwc', name: 'UWC', location: 'Bellville', vendors: 15 },
    { id: 'uct', name: 'UCT', location: 'Rondebosch', vendors: 12 },
    { id: 'stellenbosch', name: 'Stellenbosch', location: 'Stellenbosch', vendors: 18 },
    { id: 'cput', name: 'CPUT', location: 'Cape Town', vendors: 10 },
  ];

  const [selectedCampus, setSelectedCampus] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('selectedCampus');
    if (saved) {
      setSelectedCampus(universities.find(u => u.id === saved));
    }
  }, []);

  const handleCampusChange = (e) => {
    const campus = universities.find(u => u.id === e.target.value);
    setSelectedCampus(campus);
    localStorage.setItem('selectedCampus', campus.id);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <Navbar />

      {/* HERO */}
      <section
        style={{
          marginTop: 70,
          padding: '80px 16px',
          background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
          animation: 'slideUp 0.6s ease',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Campus Selector */}
          <div style={{ maxWidth: 360, marginBottom: 32 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8,
              }}
            >
              Select campus
            </label>

            <select
              value={selectedCampus?.id || ''}
              onChange={handleCampusChange}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 14,
                border: '2px solid #dc2626',
                backgroundColor: '#ffffff',
                color: '#111827',
                fontSize: 15,
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage:
                  'linear-gradient(45deg, transparent 50%, #dc2626 50%), linear-gradient(135deg, #dc2626 50%, transparent 50%)',
                backgroundPosition: 'calc(100% - 20px) 55%, calc(100% - 14px) 55%',
                backgroundSize: '6px 6px, 6px 6px',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <option value="" disabled>
                Choose your campus
              </option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.location}
                </option>
              ))}
            </select>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(32px, 6vw, 52px)',
              fontWeight: 800,
              lineHeight: 1.1,
              color: '#111827',
              marginBottom: 16,
            }}
          >
            Campus food,<br />
            <span style={{ color: '#dc2626' }}>without the queue</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(15px, 4vw, 18px)',
              color: '#374151',
              maxWidth: 520,
              marginBottom: 36,
              lineHeight: 1.6,
            }}
          >
            Order from your favourite campus vendors and pick up when it’s ready.
          </p>

          {/* Stats + CTA */}
          {selectedCampus && (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: 24,
                  flexWrap: 'wrap',
                  marginBottom: 36,
                  animation: 'fadeIn 0.4s ease',
                }}
              >
                <Stat icon={<Store size={18} />} text={`${selectedCampus.vendors}+ Vendors`} />
                <Stat icon={<Clock size={18} />} text="Ready in 10 min" />
                <Stat icon={<Package size={18} />} text="Easy pickup" />
              </div>

              <button
                onClick={() => navigate('/vendor')}
                style={{
                  width: '100%',
                  maxWidth: 260,
                  padding: '16px 28px',
                  background: '#dc2626',
                  color: '#ffffff',
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 10px 25px rgba(220,38,38,.35)',
                }}
              >
                Browse Vendors <FiArrowRight />
              </button>
            </>
          )}
        </div>
      </section>

      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const Stat = ({ icon, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    {icon}
    <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
      {text}
    </span>
  </div>
);

export default Home;
