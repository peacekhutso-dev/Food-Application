import { BsTwitter, BsYoutube } from "react-icons/bs";
import { FaFacebookF } from "react-icons/fa";
import { SiLinkedin } from "react-icons/si";
import { FiMail, FiPhone } from "react-icons/fi";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Browse Vendors', path: '/vendor' },
    { name: 'Orders', path: '/orders' },
    { name: 'Favorites', path: '/favorites' }
  ];

  const supportLinks = [
    { name: 'Help Center', path: '/help' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'FAQs', path: '/faq' },
    { name: 'Order Tracking', path: '/orders' }
  ];

  const legalLinks = [
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Cookie Policy', path: '/cookies' }
  ];

  const socialLinks = [
    { icon: <BsTwitter />, link: 'https://twitter.com' },
    { icon: <SiLinkedin />, link: 'https://linkedin.com' },
    { icon: <BsYoutube />, link: 'https://youtube.com' },
    { icon: <FaFacebookF />, link: 'https://facebook.com' }
  ];

  return (
    <footer style={{ background: '#000', color: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 16px 24px' }}>

        {/* TOP GRID */}
        <div className="footer-grid">

          {/* BRAND */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 32 }}>🍽️</span>
              <span style={{ fontSize: 24, fontWeight: 700 }}>Kanteen</span>
            </div>

            <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, maxWidth: 320 }}>
              Your campus kitchen, delivered. Skip the queue and order from your favorite campus spots.
            </p>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="mailto:support@kanteen.co.za" className="footer-link">
                <FiMail /> support@kanteen.co.za
              </a>
              <a href="tel:+27XXXXXXXXX" className="footer-link">
                <FiPhone /> +27 XX XXX XXXX
              </a>
            </div>
          </div>

          {/* QUICK LINKS */}
          <FooterColumn title="Quick Links" links={quickLinks} />

          {/* SUPPORT */}
          <FooterColumn title="Support" links={supportLinks} />

          {/* SOCIAL */}
          <div>
            <h4 className="footer-title">Follow Us</h4>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {socialLinks.map((s, i) => (
                <a
                  key={i}
                  href={s.link}
                  target="_blank"
                  rel="noreferrer"
                  className="social-icon"
                >
                  {s.icon}
                </a>
              ))}
            </div>

            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 10 }}>
              Get campus food deals & updates
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                placeholder="Your email"
                className="newsletter-input"
              />
              <button className="newsletter-btn">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div style={{ height: 1, background: '#374151', margin: '32px 0' }} />

        {/* BOTTOM */}
        <div className="footer-bottom">
          <span style={{ color: '#9ca3af', fontSize: 14 }}>
            © {currentYear} Kanteen. All rights reserved.
          </span>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {legalLinks.map((l, i) => (
              <a key={i} href={l.path} className="footer-link">
                {l.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* CSS */}
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 48px;
        }

        .footer-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .footer-link {
          color: #9ca3af;
          font-size: 14px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: color .2s ease;
        }

        .footer-link:hover {
          color: #dc2626;
        }

        .social-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #1f2937;
          border: 1px solid #374151;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all .2s ease;
        }

        .social-icon:hover {
          background: #dc2626;
          border-color: #dc2626;
          transform: translateY(-2px);
        }

        .newsletter-input {
          flex: 1;
          min-width: 180px;
          padding: 10px 12px;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 6px;
          color: white;
          outline: none;
        }

        .newsletter-btn {
          padding: 10px 16px;
          background: #dc2626;
          border: none;
          border-radius: 6px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .footer-bottom {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: space-between;
          align-items: center;
          text-align: center;
        }

        @media (max-width: 640px) {
          .footer-bottom {
            justify-content: center;
          }
        }

        input::placeholder {
          color: #6b7280;
        }
      `}</style>
    </footer>
  );
};

const FooterColumn = ({ title, links }) => (
  <div>
    <h4 className="footer-title">{title}</h4>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {links.map((l, i) => (
        <li key={i} style={{ marginBottom: 12 }}>
          <a href={l.path} className="footer-link">
            {l.name}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export default Footer;
