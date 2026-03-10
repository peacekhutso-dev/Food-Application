import { ShoppingBag, Lock, ArrowRight } from 'lucide-react';

import './styles/ordersummary.css';


const OrderSummary = ({
  cartItems,
  subtotal,
  serviceFee,
  total,
  processing,
  onPlaceOrder
}) => {
  return (
    <div className="order-summary-wrapper">
      <div className="summary-card">
        <div className="summary-header">
          <ShoppingBag size={20} strokeWidth={2.5} />
          <h2>Order Summary</h2>
        </div>

        <div className="summary-items">
          {cartItems.map((item, index) => (
            <div
              key={item.id}
              className="summary-item"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="item-image">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="item-details">
                <h4>{item.name}</h4>
                <p>Qty: {item.quantity}</p>
              </div>
              <span className="item-price">R{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="summary-divider"></div>

        <div className="summary-breakdown">
          <div className="summary-row">
            <span className="row-label">Subtotal</span>
            <span className="row-value">R{subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span className="row-label">Service Fee (10%)</span>
            <span className="row-value">R{serviceFee.toFixed(2)}</span>
          </div>
          <div className="summary-divider thin"></div>
          <div className="summary-row total-row">
            <span className="row-label">Total</span>
            <span className="row-value">R{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          className={`place-order-btn ${processing ? 'processing' : ''}`}
          onClick={onPlaceOrder}
          disabled={processing}
        >
          {processing ? (
            <>
              <div className="button-spinner"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Place Order • R{total.toFixed(2)}</span>
              <ArrowRight size={20} strokeWidth={2.5} />
            </>
          )}
        </button>

        <div className="secure-note">
          <Lock size={14} strokeWidth={2.5} />
          <p>Your payment is secure and encrypted</p>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;