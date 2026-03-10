import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, Heart, Package, Menu, X, Home, HelpCircle, LogOut, Settings } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getTotalItems } = useCart();
  const { userDetails, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const count = getTotalItems();
    setCartCount(count);
  }, [getTotalItems]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const user = userDetails || { name: 'User' };
  const firstName = user?.name?.split(' ')[0] || 'User';

  const isActive = (path) => {
    if (path === '/vendor') return location.pathname === '/' || location.pathname === '/vendor';
    return location.pathname.includes(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Shops', path: '/vendor', icon: Home },
    { name: 'Orders', path: '/orders', icon: Package },

  ];

  return (
    <>
      {/* Main Navbar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 1000,
        background: '#ffffff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        borderBottom: '1px solid #f3f4f6'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px'
        }}>
          {/* Left Section - Logo & Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {/* Mobile Hamburger */}
            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Menu size={24} color="#000000" />
              </button>
            )}

            {/* Logo */}
            <div
              onClick={() => navigate('/vendor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <img
                src="/path-to-your-logo.png"
                alt="Kanteen"
                style={{
                  height: '40px',
                  width: 'auto',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div style={{
                fontSize: '40px',
                display: 'none'
              }}>

              </div>
              <span style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#000000',
                letterSpacing: '-0.5px'
              }}>
                K a n t e e n
              </span>
            </div>

            {/* Desktop Nav Links */}
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        background: isActive(link.path) ? '#fef2f2' : 'transparent',
                        color: isActive(link.path) ? '#dc2626' : '#4b5563',
                        fontWeight: 500,
                        fontSize: '15px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive(link.path)) {
                          e.currentTarget.style.background = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive(link.path)) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <Icon size={18} />
                      {link.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Center Section - Search Bar (Desktop Only) */}
          {!isMobile && (
            <div style={{
              flex: 1,
              maxWidth: '500px',
              margin: '0 32px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#dc2626';
                e.currentTarget.style.background = '#ffffff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#f9fafb';
              }}
              >
                <Search size={20} color="#9ca3af" style={{ marginRight: '10px' }} />
                <input
                  type="text"
                  placeholder="Search for restaurants or food..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    background: 'transparent',
                    fontSize: '15px',
                    color: '#000000'
                  }}
                />
              </div>
            </div>
          )}

          {/* Right Section - Cart & User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Cart */}
            <button
              onClick={() => navigate('/CartPage')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ShoppingCart
                size={24}
                color={isActive('/CartPage') ? '#dc2626' : '#000000'}
              />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  background: '#dc2626',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#000000',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#dc2626'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <User size={20} />
                <span style={{ display: isMobile ? 'none' : 'block' }}>Profile</span>
              </button>

              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  border: '1px solid #e5e7eb',
                  minWidth: '200px',
                  overflow: 'hidden',
                  zIndex: 1001
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: '#000000' }}>
                      {user?.name || 'User'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                      {user?.email || ''}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigate('/ProfilePage');
                      setIsUserDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#4b5563',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <User size={18} />
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      navigate('/orders');
                      setIsUserDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#4b5563',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Package size={18} />
                    Order History
                  </button>

                  <button
                    onClick={() => {
                      alert('Help & Support');
                      setIsUserDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#4b5563',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <HelpCircle size={18} />
                    Help & Support
                  </button>

                  <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0' }} />

                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#dc2626',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      fontWeight: 500
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Menu */}
      {isMobile && (
        <>
          {/* Overlay */}
          {isMobileMenuOpen && (
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1100,
                transition: 'opacity 0.3s ease'
              }}
            />
          )}

          {/* Sidebar */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: isMobileMenuOpen ? 0 : '-280px',
            width: '280px',
            height: '100vh',
            background: '#ffffff',
            zIndex: 1101,
            transition: 'left 0.3s ease',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#000000'
              }}>
                Kanteen
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} color="#000000" />
              </button>
            </div>

            {/* Search Bar (Mobile) */}
            <div style={{ padding: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '10px 12px',
                border: '1px solid #e5e7eb'
              }}>
                <Search size={18} color="#9ca3af" style={{ marginRight: '8px' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    background: 'transparent',
                    fontSize: '14px',
                    color: '#000000'
                  }}
                />
              </div>
            </div>

            {/* Nav Links */}
            <div style={{ padding: '8px' }}>
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.path}
                    onClick={() => {
                      navigate(link.path);
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      border: 'none',
                      background: isActive(link.path) ? '#fef2f2' : 'transparent',
                      color: isActive(link.path) ? '#dc2626' : '#4b5563',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: 500,
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      marginBottom: '4px'
                    }}
                  >
                    <Icon size={20} />
                    {link.name}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #f3f4f6', margin: '16px 0' }} />

            {/* User Options */}
            <div style={{ padding: '8px' }}>
              <button
                onClick={() => {
                  navigate('/ProfilePage');
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: '#4b5563',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 500,
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  marginBottom: '4px'
                }}
              >
                <User size={20} />
                My Profile
              </button>

              <button
                onClick={() => {
                  navigate('/orders');
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: '#4b5563',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 500,
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  marginBottom: '4px'
                }}
              >
                <Package size={20} />
                Order History
              </button>

              <button
                onClick={() => {
                  alert('Help & Support');
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: '#4b5563',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 500,
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  marginBottom: '4px'
                }}
              >
                <HelpCircle size={20} />
                Help & Support
              </button>

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  marginTop: '8px'
                }}
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* Close dropdowns when clicking outside */}
      {isUserDropdownOpen && (
        <div
          onClick={() => setIsUserDropdownOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 999
          }}
        />
      )}

      <style>{`
        input::placeholder {
          color: #9ca3af !important;
        }
      `}</style>
    </>
  );
};

export default Navbar;