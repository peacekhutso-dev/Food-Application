import { CreditCard, Wallet, Check } from 'lucide-react';

import './styles/paymentmethodselector.css';


const PaymentMethodSelector = ({ selectedPayment, onPaymentSelect }) => {
  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, Amex'
    },
    {
      id: 'ewallet',
      name: 'E-Wallet',
      icon: Wallet,
      description: 'PayPal, Stripe'
    },
  ];

  return (
    <div className="payment-section">
      <div className="payment-header">
        <CreditCard size={20} strokeWidth={2.5} />
        <h2>Payment Method</h2>
      </div>

      <div className="payment-methods">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`payment-card ${selectedPayment === method.id ? 'selected' : ''}`}
            onClick={() => onPaymentSelect(method.id)}
          >
            <div className="payment-icon-wrapper">
              <method.icon size={24} strokeWidth={2} />
            </div>

            <div className="payment-info">
              <h3>{method.name}</h3>
              <p>{method.description}</p>
            </div>

            <div className="payment-check">
              {selectedPayment === method.id && (
                <div className="check-icon">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;