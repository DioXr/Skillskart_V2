import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const MockPayModal = ({ show, onClose, paymentData }) => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [payMethod, setPayMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [card, setCard] = useState({ number: '', name: '', exp: '', cvv: '' });
  const [upi, setUpi] = useState('');

  if (!show || !paymentData) return null;

  const handleCardChange = (e, field) => {
    let val = e.target.value;
    if (field === 'number') {
      val = val.replace(/\D/g, '').slice(0, 16);
      val = val.replace(/(\d{4})/g, '$1 ').trim();
    }
    if (field === 'exp') {
      val = val.replace(/\D/g, '').slice(0, 4);
      if (val.length > 2) val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    if (field === 'cvv') {
      val = val.replace(/\D/g, '').slice(0, 3);
    }
    setCard({ ...card, [field]: val });
  };

  const isFormValid = () => {
    if (payMethod === 'card') {
      return card.number.length === 19 && card.name.trim().length > 2 && card.exp.length === 5 && card.cvv.length === 3;
    } else {
      return upi.includes('@') && upi.length > 5;
    }
  };

  const processPayment = async () => {
    if (!isFormValid()) return;
    setProcessing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const verifyRes = await axios.post('/api/payment/verify', {
        razorpay_order_id: paymentData.orderId,
        razorpay_payment_id: "mock_pay_" + Date.now(),
        razorpay_signature: "mock_signature",
        plan: paymentData.plan,
        billingCycle: paymentData.billingCycle,
      }, config);
      
      await refreshUser();
      toast.success(verifyRes.data.message || 'Subscription activated instantly! 🎉');
      onClose();
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      toast.error('Mock verification failed. Please try again.');
      setProcessing(false);
    }
  };

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(5, 5, 10, 0.8)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  };

  const modalStyle = {
    background: 'var(--card)', border: '1px solid var(--card-border)',
    borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '32px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: '8px',
    background: 'var(--bg)', border: '1px solid var(--card-border)',
    color: 'var(--text)', fontSize: '0.9rem', marginBottom: '16px', outline: 'none'
  };

  return ReactDOM.createPortal(
    <div style={overlayStyle}>
      <div style={modalStyle} className="animate-fade-in">
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>
          Complete Payment
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Mock Checkout for <strong style={{ color: 'var(--text)' }}>{paymentData.plan.toUpperCase()}</strong> Plan
          ({paymentData.billingCycle})
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg)', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setPayMethod('card')}
            style={{
              flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
              background: payMethod === 'card' ? 'var(--card)' : 'transparent',
              color: payMethod === 'card' ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: payMethod === 'card' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            Credit/Debit Card
          </button>
          <button
            onClick={() => setPayMethod('upi')}
            style={{
              flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
              background: payMethod === 'upi' ? 'var(--card)' : 'transparent',
              color: payMethod === 'upi' ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: payMethod === 'upi' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            UPI ID
          </button>
        </div>

        {payMethod === 'card' ? (
          <div className="animate-fade-in">
            <input placeholder="Cardholder Name" value={card.name} onChange={e => handleCardChange(e, 'name')} style={inputStyle} />
            <input placeholder="Card Number (16 Digits)" value={card.number} onChange={e => handleCardChange(e, 'number')} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '2px' }} />
            <div style={{ display: 'flex', gap: '16px' }}>
              <input placeholder="MM/YY" value={card.exp} onChange={e => handleCardChange(e, 'exp')} style={{ ...inputStyle, flex: 1 }} />
              <input placeholder="CVV" type="password" value={card.cvv} onChange={e => handleCardChange(e, 'cvv')} style={{ ...inputStyle, flex: 1 }} />
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <input placeholder="example@upi" value={upi} onChange={e => setUpi(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-8px', marginBottom: '20px' }}>
              Enter any valid UPI ID structure for this mock payment.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <button onClick={onClose} disabled={processing} className="btn-secondary" style={{ flex: 1, padding: '12px', justifyContent: 'center' }}>
            Cancel
          </button>
          <button onClick={processPayment} disabled={!isFormValid() || processing} className="btn-primary" style={{ flex: 1, padding: '12px', justifyContent: 'center' }}>
            {processing ? 'Processing...' : `Pay ₹${(paymentData.amount / 100).toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MockPayModal;
