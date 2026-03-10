import { FiClock, FiShoppingBag, FiHeart, FiZap } from 'react-icons/fi';
import { CheckCircle } from 'lucide-react';

const About = () => {
  // Benefits data
  const benefits = [
    {
      icon: <FiClock size={24} />,
      title: 'Skip the Queue',
      description: 'Order ahead and your food will be ready when you arrive'
    },
    {
      icon: <FiShoppingBag size={24} />,
      title: 'Easy Ordering',
      description: 'Browse menus and checkout in just a few taps'
    },
    {
      icon: <FiHeart size={24} />,
      title: 'Support Local',
      description: 'Help campus vendors thrive while getting great food'
    },
    {
      icon: <FiZap size={24} />,
      title: 'Fast Pickup',
      description: 'Grab your order and get back to what matters'
    }
  ];

  return (
    <div style={{
      padding: '80px 20px',
      background: '#ffffff'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
        gap: '60px',
        alignItems: 'center'
      }}>
        {/* LEFT SIDE - Image/Visual */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          order: window.innerWidth < 768 ? 2 : 1
        }}>
          <div style={{
            width: '100%',
            height: '500px',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(220, 38, 38, 0.1)'
          }}>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(220, 38, 38, 0.1)',
              top: '-50px',
              right: '-50px'
            }} />
            <div style={{
              position: 'absolute',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'rgba(220, 38, 38, 0.08)',
              bottom: '-40px',
              left: '-40px'
            }} />

            {/* Main illustration - can replace with actual image */}
            <div style={{
              textAlign: 'center',
              zIndex: 1
            }}>
              <div style={{
                fontSize: '120px',
                marginBottom: '20px'
              }}>
                🍽️
              </div>
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                fontSize: '48px'
              }}>
                <span>🍕</span>
                <span>🍔</span>
                <span>🌮</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Content */}
        <div style={{
          order: window.innerWidth < 768 ? 1 : 2
        }}>
          {/* Section Label */}
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: '#fef2f2',
            borderRadius: '20px',
            marginBottom: '16px',
            border: '1px solid #fee2e2'
          }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#dc2626',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Why Kanteen
            </span>
          </div>

          {/* Main Heading */}
          <h2 style={{
            fontSize: window.innerWidth < 768 ? '32px' : '42px',
            fontWeight: 700,
            color: '#000000',
            marginBottom: '20px',
            lineHeight: '1.2',
            letterSpacing: '-0.5px'
          }}>
            Campus Dining,<br />
            <span style={{ color: '#dc2626' }}>Reimagined</span> for Students
          </h2>

          {/* Description */}
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            lineHeight: '1.7',
            marginBottom: '40px'
          }}>
            Kanteen connects you with your favorite campus food spots. Order ahead,
            skip the line, and grab your meal on your schedule. More time for what
            matters, less time waiting.
          </p>

          {/* Benefits Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 640 ? '1fr' : 'repeat(2, 1fr)',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {benefits.map((benefit, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '12px'
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: '#fef2f2',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  flexShrink: 0,
                  border: '1px solid #fee2e2'
                }}>
                  {benefit.icon}
                </div>

                {/* Text */}
                <div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#000000',
                    marginBottom: '4px'
                  }}>
                    {benefit.title}
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats/Social Proof */}
          <div style={{
            display: 'flex',
            gap: '32px',
            marginBottom: '32px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#dc2626',
                marginBottom: '4px'
              }}>
                1000+
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: 500
              }}>
                Happy Students
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#dc2626',
                marginBottom: '4px'
              }}>
                50+
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: 500
              }}>
                Campus Vendors
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#dc2626',
                marginBottom: '4px'
              }}>
                10min
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: 500
              }}>
                Avg. Wait Time
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              padding: '14px 28px',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#b91c1c';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;