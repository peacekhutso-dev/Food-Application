import { useEffect, useState } from "react";
import { CheckCircle2, Clock, MapPin, ArrowRight, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import './styles/ordercomplete.css';


const OrderComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pickupTime, orderNumber } = location.state || {};
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [navigate]);

  return (
    <div className="order-success-container">
      {/* Animated Background */}
      <div className="success-background">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      {/* Confetti Animation */}
      <div className="confetti-container">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: i % 3 === 0 ? '#dc2626' : i % 3 === 1 ? '#fca5a5' : '#fee2e2'
            }}
          ></div>
        ))}
      </div>

      <div className="success-content">
        <div className="success-card">
          {/* Success Icon */}
          <div className="success-icon-wrapper">
            <CheckCircle2 size={80} className="success-icon" />
            <div className="success-ring"></div>
          </div>

          {/* Main Message */}
          <h1 className="success-title">Order Placed!</h1>
          <p className="success-subtitle">Your order has been confirmed and is being prepared</p>

          {/* Order Number */}
          {orderNumber && (
            <div className="order-number">
              Order #{orderNumber}
            </div>
          )}

          {/* Order Details */}
          <div className="order-details-card">
            <div className="detail-item">
              <div className="detail-icon">
                <Clock size={20} strokeWidth={2.5} />
              </div>
              <div className="detail-content">
                <span className="detail-label">Pickup Time</span>
                <span className="detail-value">{pickupTime || "15-20 minutes"}</span>
              </div>
            </div>

            <div className="detail-divider"></div>

            <div className="detail-item">
              <div className="detail-icon">
                <MapPin size={20} strokeWidth={2.5} />
              </div>
              <div className="detail-content">
                <span className="detail-label">Pickup Location</span>
                <span className="detail-value">At the counter</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="success-actions">
            <button
              onClick={() => navigate("/trackorder", { state: { pickupTime, orderNumber } })}
              className="track-order-btn"
            >
              <span>Track Order</span>
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>

            <button
              onClick={() => navigate("/")}
              className="go-home-btn"
            >
              <Home size={18} strokeWidth={2.5} />
              <span>Back to Home</span>
            </button>
          </div>

          {/* Countdown Notice */}
          <div className="redirect-notice">
            <div className="countdown-circle">
              <svg className="countdown-svg" viewBox="0 0 36 36">
                <path
                  className="countdown-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="countdown-progress"
                  strokeDasharray={`${(countdown / 30) * 100}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="countdown-number">{countdown}</span>
            </div>
            <p>Redirecting to home in {countdown} seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderComplete;