import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, ChevronRight, AlertCircle, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase_data/firebase';
import Navbar from '../components/landing/Navbar';
import PickUp from '../components/checkout/PickUp';
import PaymentMethodSelector from '../components/checkout/PaymentMethodSelector';
import CardDetailsForm from '../components/checkout/CardDetailsForm';
import OrderSummary from '../components/checkout/OrderSummary';
import OrderSuccess from '../components/checkout/OrderSuccess';

/* ─────────────────────────────────────────────────────────────────
   CheckoutPage
   Brand: red #dc2626, dark #1f2937, white #fff, bg #f9f9f9
   Font: Poppins
───────────────────────────────────────────────────────────────── */

const PP = "'Poppins', system-ui, sans-serif";

const STEPS = [
  { key: 'pickup',  label: 'Pickup Info', num: 1 },
  { key: 'payment', label: 'Payment',     num: 2 },
  { key: 'review',  label: 'Review',      num: 3 },
];

const stepIndex = (step) => STEPS.findIndex(s => s.key === step);

const CheckoutPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { getCartItemsArray, clearCart, getTotalPrice } = useCart();
  const { currentUser } = useAuth();

  const [currentStep, setCurrentStep] = useState('pickup');
  const [processing,  setProcessing]  = useState(false);
  const [errorMessage,setErrorMessage]= useState('');

  const cart       = getCartItemsArray();
  const vendorName = location.state?.vendorName ||
                     (cart.length > 0 ? cart[0].vendorName : null) ||
                     'Unknown Vendor';

  const [pickupInfo, setPickupInfo] = useState({
    fullName: '', phone: '', pickupTime: '', instructions: ''
  });
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '', cardName: '', expiryDate: '', cvv: ''
  });

  const subtotal   = getTotalPrice();
  const serviceFee = subtotal * 0.10;
  const total      = subtotal + serviceFee;

  // ── Handlers ────────────────────────────────────────────────
  const handleInputChange      = (e) => { setPickupInfo({ ...pickupInfo, [e.target.name]: e.target.value }); setErrorMessage(''); };
  const handlePickupTimeChange = (e) => { setPickupInfo({ ...pickupInfo, pickupTime: e.target.value });      setErrorMessage(''); };
  const handlePaymentSelect    = (id) => { setSelectedPayment(id); setErrorMessage(''); };
  const handleCardInputChange  = (e) => { setCardInfo({ ...cardInfo, [e.target.name]: e.target.value });     setErrorMessage(''); };

  const handleCardNumberChange = (e) => {
    let v = e.target.value.replace(/\s/g, '');
    setCardInfo({ ...cardInfo, cardNumber: v.match(/.{1,4}/g)?.join(' ') || v });
    setErrorMessage('');
  };
  const handleExpiryChange = (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length >= 2) v = v.slice(0,2) + '/' + v.slice(2,4);
    setCardInfo({ ...cardInfo, expiryDate: v });
    setErrorMessage('');
  };

  const validatePickupInfo = () => {
    if (!pickupInfo.fullName.trim())  { setErrorMessage('Please enter your full name');    return false; }
    if (!pickupInfo.phone.trim())     { setErrorMessage('Please enter your phone number'); return false; }
    if (!pickupInfo.pickupTime)       { setErrorMessage('Please select a pickup time');    return false; }
    return true;
  };
  const validatePaymentInfo = () => {
    if (selectedPayment === 'card') {
      if (!cardInfo.cardNumber.trim()) { setErrorMessage('Please enter your card number');      return false; }
      if (!cardInfo.cardName.trim())   { setErrorMessage('Please enter the cardholder name');   return false; }
      if (!cardInfo.expiryDate.trim()) { setErrorMessage('Please enter the card expiry date');  return false; }
      if (!cardInfo.cvv.trim())        { setErrorMessage('Please enter the card CVV');           return false; }
    }
    return true;
  };

  const next = (to) => { setCurrentStep(to); window.scrollTo(0,0); };

  const handleContinueToPayment = () => { if (validatePickupInfo())  next('payment'); };
  const handleContinueToReview  = () => { if (validatePaymentInfo()) next('review');  };

  const handlePlaceOrder = async () => {
    if (!currentUser) {
      setErrorMessage('Please log in to place an order');
      setTimeout(() => navigate('/auth'), 2000);
      return;
    }
    setProcessing(true);
    setErrorMessage('');
    try {
      const orderData = {
        userId: currentUser.uid,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
        pickup: pickupInfo,
        vendorName,
        payment: {
          method: selectedPayment,
          ...(selectedPayment === 'card' && { cardLast4: cardInfo.cardNumber.slice(-4) })
        },
        subtotal, serviceFee, total,
        status: 'Pending',
        createdAt: new Date(),
        timestamp: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        orders: arrayUnion({
          orderId: docRef.id, total, status: 'Pending',
          paymentMethod: selectedPayment,
          ...(selectedPayment === 'card' && { cardLast4: cardInfo.cardNumber.slice(-4) }),
          date: new Date().toISOString(),
          vendor: vendorName,
        })
      });
      await clearCart();
      setProcessing(false);
      next('success');
    } catch {
      setErrorMessage('Unable to place your order. Please check your connection and try again.');
      setProcessing(false);
    }
  };

  // ── Empty cart ───────────────────────────────────────────────
  if (cart.length === 0 && currentStep !== 'success') {
    return (
      <div style={{ minHeight: '100vh', background: '#f9f9f9', fontFamily: PP }}>
        <Navbar />
        <div style={{ height: '80px' }} />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100vh - 80px)', flexDirection: 'column',
          gap: '1rem', padding: '2rem', textAlign: 'center'
        }}>
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%',
            background: '#fef2f2', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem'
          }}>
            <ShoppingBag size={40} color="#dc2626" />
          </div>
          <h2 style={{ color: '#1f2937', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
            Your cart is empty
          </h2>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 1.25rem', fontSize: '0.95rem' }}>
            Add some delicious items to get started!
          </p>
          <button onClick={() => navigate('/vendor')} style={{
            background: '#dc2626', color: '#ffffff', border: 'none',
            padding: '0.8rem 2rem', borderRadius: '10px', fontSize: '0.95rem',
            fontWeight: 700, fontFamily: PP, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(220,38,38,0.22)'
          }}>
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────
  if (currentStep === 'success') {
    return <div><Navbar /><OrderSuccess /></div>;
  }

  const activeIdx = stepIndex(currentStep);

  // ── Main render ──────────────────────────────────────────────
  return (
    <div style={{ background: '#f9f9f9', minHeight: '100vh', fontFamily: PP }}>
      <Navbar />
      <div style={{ height: '80px' }} />

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>

        {/* ── Progress stepper ──────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: '2.5rem'
        }}>
          {STEPS.map((step, i) => {
            const done   = i < activeIdx;
            const active = i === activeIdx;
            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
                {/* Step circle */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: '50%',
                    background: done ? '#dc2626' : active ? '#dc2626' : '#e5e7eb',
                    color: done || active ? '#ffffff' : '#9ca3af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.85rem',
                    fontFamily: PP,
                    boxShadow: active ? '0 4px 14px rgba(220,38,38,0.28)' : 'none',
                    transition: 'all 0.25s ease'
                  }}>
                    {done ? <Check size={16} strokeWidth={3} /> : step.num}
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: active ? 700 : 500,
                    color: active ? '#dc2626' : done ? '#1f2937' : '#9ca3af',
                    whiteSpace: 'nowrap', fontFamily: PP,
                    transition: 'color 0.25s ease'
                  }}>
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div style={{
                    width: '70px', height: '2px',
                    background: i < activeIdx ? '#dc2626' : '#e5e7eb',
                    margin: '0 6px 18px',
                    borderRadius: '2px',
                    transition: 'background 0.3s ease'
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Page title ────────────────────────────────────── */}
        <h1 style={{
          fontSize: '1.4rem', fontWeight: 800, color: '#1f2937',
          textAlign: 'center', margin: '0 0 1.75rem',
          letterSpacing: '-0.03em', fontFamily: PP
        }}>
          {currentStep === 'pickup'  && 'Pickup Information'}
          {currentStep === 'payment' && 'Payment Method'}
          {currentStep === 'review'  && 'Review Your Order'}
        </h1>

        {/* ── Error banner ─────────────────────────────────── */}
        {errorMessage && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '10px', padding: '0.75rem 1rem',
            marginBottom: '1.25rem', display: 'flex',
            alignItems: 'center', gap: '0.5rem',
            color: '#dc2626', fontSize: '0.875rem', fontFamily: PP
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ══ STEP 1: Pickup ══════════════════════════════════ */}
        {currentStep === 'pickup' && (
          <>
            <PickUp
              deliveryInfo={pickupInfo}
              onInputChange={handleInputChange}
              onPickupTimeChange={handlePickupTimeChange}
            />
            <PrimaryBtn onClick={handleContinueToPayment}>
              Continue to Payment <ChevronRight size={17} />
            </PrimaryBtn>
          </>
        )}

        {/* ══ STEP 2: Payment ═════════════════════════════════ */}
        {currentStep === 'payment' && (
          <>
            <PaymentMethodSelector
              selectedPayment={selectedPayment}
              onPaymentSelect={handlePaymentSelect}
            />
            {selectedPayment === 'card' && (
              <div style={{ marginTop: '1.25rem' }}>
                <CardDetailsForm
                  cardInfo={cardInfo}
                  onInputChange={handleCardInputChange}
                  onCardNumberChange={handleCardNumberChange}
                  onExpiryChange={handleExpiryChange}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.875rem', marginTop: '1.75rem' }}>
              <SecondaryBtn onClick={() => next('pickup')}>
                <ChevronLeft size={17} /> Back
              </SecondaryBtn>
              <PrimaryBtn onClick={handleContinueToReview} style={{ flex: 1 }}>
                Review Order <ChevronRight size={17} />
              </PrimaryBtn>
            </div>
          </>
        )}

        {/* ══ STEP 3: Review ══════════════════════════════════ */}
        {currentStep === 'review' && (
          <>
            <OrderSummary
              cartItems={cart}
              subtotal={subtotal}
              serviceFee={serviceFee}
              total={total}
              processing={processing}
              onPlaceOrder={handlePlaceOrder}
            />
            <div style={{ marginTop: '1rem' }}>
              <SecondaryBtn onClick={() => next('payment')} disabled={processing}>
                <ChevronLeft size={17} /> Back to Payment
              </SecondaryBtn>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

/* ── Shared button components ─────────────────────────────────── */
const PrimaryBtn = ({ onClick, children, disabled, style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '0.4rem',
      marginTop: '1.25rem', padding: '0.9rem 1.5rem',
      background: disabled ? '#d1d5db' : '#dc2626',
      color: '#ffffff', border: 'none',
      borderRadius: '10px', fontSize: '0.95rem',
      fontWeight: 700, fontFamily: "'Poppins', sans-serif",
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 4px 14px rgba(220,38,38,0.22)',
      transition: 'all 0.2s ease',
      ...style
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = '#b91c1c'; }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = '#dc2626'; }}
  >
    {children}
  </button>
);

const SecondaryBtn = ({ onClick, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      flex: 1, display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '0.4rem',
      padding: '0.875rem 1.25rem',
      background: '#ffffff', color: '#4b5563',
      border: '1.5px solid #e5e7eb', borderRadius: '10px',
      fontSize: '0.9rem', fontWeight: 600,
      fontFamily: "'Poppins', sans-serif",
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s ease',
      width: '100%'
    }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; }}}
    onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#4b5563'; }}}
  >
    {children}
  </button>
);

export default CheckoutPage;