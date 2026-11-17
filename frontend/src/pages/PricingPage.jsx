import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MockPayModal from '../components/MockPayModal';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    icon: '🌱',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Get started and explore the basics.',
    color: '#64748b',
    accent: 'rgba(100,116,139,0.12)',
    border: 'rgba(100,116,139,0.2)',
    features: [
      { text: '5 AI generations / month', included: true },
      { text: 'Up to 3 custom roadmaps', included: true },
      { text: 'Progress tracking', included: true },
      { text: 'Access all public roadmaps', included: true },
      { text: 'AI Smart Flood (enrich nodes)', included: false },
      { text: 'Export roadmap (PDF / PNG)', included: false },
      { text: 'Priority AI model', included: false },
      { text: 'AI Tutor per node', included: false },
      { text: 'Unlimited custom roadmaps', included: false },
    ],
    cta: 'Get Started Free',
    ctaLink: '/login',
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: '⚡',
    monthlyPrice: 399,
    annualPrice: 3199,
    description: 'For serious learners who want the full experience.',
    color: '#3b82f6',
    accent: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.3)',
    badge: 'Most Popular',
    features: [
      { text: '50 AI generations / month', included: true },
      { text: 'Unlimited custom roadmaps', included: true },
      { text: 'Progress tracking', included: true },
      { text: 'Access all public roadmaps', included: true },
      { text: 'AI Smart Flood (enrich nodes)', included: true },
      { text: 'Export roadmap (PDF / PNG)', included: true },
      { text: 'Priority AI model (70B)', included: true },
      { text: 'AI Tutor per node', included: true },
      { text: 'Remove SkillKart branding', included: true },
    ],
    cta: 'Upgrade to Pro',
    razorpayPlan: 'pro',
  },
  {
    id: 'team',
    name: 'Team',
    icon: '🚀',
    monthlyPrice: 999,
    annualPrice: 7999,
    description: 'For teams, bootcamps, and power users.',
    color: '#a855f7',
    accent: 'rgba(168,85,247,0.1)',
    border: 'rgba(168,85,247,0.3)',
    features: [
      { text: 'Unlimited AI generations', included: true },
      { text: 'Unlimited custom roadmaps', included: true },
      { text: 'Progress tracking', included: true },
      { text: 'Access all public roadmaps', included: true },
      { text: 'AI Smart Flood (enrich nodes)', included: true },
      { text: 'Export roadmap (PDF / PNG)', included: true },
      { text: 'Best AI model (max quality)', included: true },
      { text: 'AI Tutor per node', included: true },
      { text: 'Custom branding & white-label', included: true },
    ],
    cta: 'Upgrade to Team',
    razorpayPlan: 'team',
  },
];

const COMPARISON_FEATURES = [
  { feature: 'AI Generations / Month', free: '5', pro: '50', team: 'Unlimited' },
  { feature: 'Custom Roadmaps', free: '3', pro: 'Unlimited', team: 'Unlimited' },
  { feature: 'Nodes per AI Generation', free: '22', pro: '35', team: '50' },
  { feature: 'AI Model Quality', free: 'Standard (8B)', pro: 'High (70B)', team: 'Best (70B)' },
  { feature: 'AI Smart Flood', free: '❌', pro: '✅', team: '✅' },
  { feature: 'Export (PDF / PNG)', free: '❌', pro: '✅', team: '✅' },
  { feature: 'AI Tutor per Node', free: '❌', pro: '✅', team: '✅' },
  { feature: 'Remove Branding', free: '❌', pro: '✅', team: '✅' },
  { feature: 'Custom Branding', free: '❌', pro: '❌', team: '✅' },
  { feature: 'Priority Support', free: '❌', pro: '✅', team: '✅' },
];

const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [billing, setBilling] = useState('monthly');
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const currentPlan = user?.subscription?.plan || 'free';

  const handleUpgrade = async (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (plan === currentPlan) return;

    setLoadingPlan(plan);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/payment/create-order', { plan, billingCycle: billing }, config);

      // ── MOCK/BEECEPTOR BYPASS ──
      if (data.isMock) {
        setPaymentData({
          orderId: data.orderId,
          plan,
          billingCycle: billing,
          amount: data.amount
        });
        setShowPaymentModal(true);
        setLoadingPlan(null);
        return;
      }

      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'SkillKart',
          description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — ${billing}`,
          order_id: data.orderId,
          prefill: { name: user.name, email: user.email },
          theme: { color: '#3b82f6' },
          handler: async (response) => {
            try {
              const verifyRes = await axios.post('/api/payment/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
                billingCycle: billing,
              }, config);
              toast.success(verifyRes.data.message || 'Subscription activated! 🎉');
              setTimeout(() => navigate('/dashboard'), 1500);
            } catch (err) {
              toast.error('Payment verification failed. Contact support.');
            }
          },
          modal: { ondismiss: () => setLoadingPlan(null) },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment.');
      setLoadingPlan(null);
    }
  };

  const getPrice = (plan) => {
    if (plan.monthlyPrice === 0) return 'Free';
    const price = billing === 'monthly' ? plan.monthlyPrice : Math.round(plan.annualPrice / 12);
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getSavings = (plan) => {
    if (plan.monthlyPrice === 0) return null;
    const monthlyCost = plan.monthlyPrice * 12;
    const annualCost = plan.annualPrice;
    const savings = Math.round((1 - annualCost / monthlyCost) * 100);
    return savings;
  };

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh' }}>
      {/* Hero Header */}
      <div style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--card-border)', paddingTop: '64px', paddingBottom: '56px', textAlign: 'center' }}>
        <div className="container">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px',
            borderRadius: '100px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
            marginBottom: '20px', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '600',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            Simple, transparent pricing
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '12px' }}>
            Invest in your learning
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
            Start free. Upgrade when you're ready. Cancel anytime. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => setBilling('monthly')}
              style={{
                padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: '600',
                background: billing === 'monthly' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                color: billing === 'monthly' ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              style={{
                padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: '600',
                background: billing === 'annual' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                color: billing === 'annual' ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              Annual
              <span style={{ fontSize: '0.65rem', background: '#22c55e', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontWeight: '700' }}>
                SAVE 33%
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '48px', paddingBottom: '80px' }}>
        {/* Plan Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '80px' }}>
          {PLANS.map((plan) => {
            const planHierarchy = { free: 0, pro: 1, team: 2 };
            const currentLevel = planHierarchy[currentPlan] || 0;
            const thisLevel = planHierarchy[plan.id] || 0;
            const isCurrentPlan = currentPlan === plan.id;
            const isLowerPlan = currentLevel > thisLevel;
            const savings = getSavings(plan);

            return (
              <div
                key={plan.id}
                className="card"
                style={{
                  padding: '32px',
                  border: plan.badge ? `2px solid ${plan.color}` : '1px solid var(--card-border)',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  background: plan.badge ? plan.accent : 'var(--card)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.3)`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                    background: plan.color, color: '#fff',
                    padding: '4px 14px', borderRadius: '100px',
                    fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                  }}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan Header */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: `${plan.color}18`, border: `1px solid ${plan.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                    }}>
                      {plan.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)' }}>{plan.name}</div>
                      {isCurrentPlan && (
                        <div style={{ fontSize: '0.65rem', color: plan.color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Current Plan
                        </div>
                      )}
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>{plan.description}</p>
                </div>

                {/* Price */}
                <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text)' }}>
                      {getPrice(plan)}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>/month</span>
                    )}
                  </div>
                  {billing === 'annual' && savings && (
                    <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '4px', fontWeight: '600' }}>
                      Save {savings}% vs monthly (billed ₹{plan.annualPrice.toLocaleString('en-IN')}/yr)
                    </div>
                  )}
                  {plan.monthlyPrice === 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Forever free</div>
                  )}
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map((feat, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem' }}>
                      <span style={{
                        flexShrink: 0, width: '18px', height: '18px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: '700', marginTop: '1px',
                        background: feat.included ? `${plan.color}20` : 'rgba(255,255,255,0.03)',
                        color: feat.included ? plan.color : 'var(--text-muted)',
                        border: `1px solid ${feat.included ? plan.border : 'rgba(255,255,255,0.06)'}`,
                      }}>
                        {feat.included ? '✓' : '×'}
                      </span>
                      <span style={{ color: feat.included ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight: '1.4' }}>
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.ctaLink ? (
                  <Link to={plan.ctaLink} style={{ display: 'block' }}>
                    <button
                      className="btn-secondary"
                      style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '700' }}
                      id={`plan-cta-${plan.id}`}
                    >
                      {plan.cta}
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan || isLowerPlan || loadingPlan === plan.id}
                    className="btn-primary"
                    style={{
                      width: '100%', padding: '12px',
                      justifyContent: 'center', fontSize: '0.9rem', fontWeight: '700',
                      background: (isCurrentPlan || isLowerPlan) ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                      opacity: (isCurrentPlan || isLowerPlan) ? 0.6 : 1,
                      cursor: (isCurrentPlan || isLowerPlan) ? 'default' : 'pointer',
                    }}
                    id={`plan-cta-${plan.id}`}
                  >
                    {loadingPlan === plan.id ? 'Opening payment...' : isCurrentPlan ? 'Current Plan' : isLowerPlan ? 'Included in Plan' : plan.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '32px', fontWeight: '800' }}>
            Full Feature Comparison
          </h2>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feature</th>
                  {PLANS.map(p => (
                    <th key={p.id} style={{ padding: '16px 20px', textAlign: 'center', color: p.id === currentPlan ? p.color : 'var(--text-secondary)', fontWeight: '700' }}>
                      {p.name} {p.id === currentPlan ? '✓' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontWeight: '500' }}>{row.feature}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>{row.free}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', color: row.pro.startsWith('✅') ? '#22c55e' : row.pro.startsWith('❌') ? '#ef4444' : 'var(--text-secondary)', fontWeight: row.pro === '✅' || row.pro === '❌' ? '700' : '500' }}>{row.pro}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', color: row.team.startsWith('✅') ? '#22c55e' : row.team.startsWith('❌') ? '#ef4444' : 'var(--text-secondary)', fontWeight: row.team === '✅' || row.team === '❌' ? '700' : '500' }}>{row.team}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '32px', fontWeight: '800' }}>
            Frequently asked questions
          </h2>
          {[
            { q: 'Can I cancel anytime?', a: 'Yes — cancel anytime from your dashboard. You keep Pro access until the end of your billing period.' },
            { q: 'What are AI Credits?', a: 'Each AI generation (creating a full roadmap) costs 1 credit. Credits reset every month on your billing date.' },
            { q: 'Is my payment secure?', a: 'All payments are processed by Razorpay, a PCI-DSS compliant payment gateway. We never store your card details.' },
            { q: 'Can I upgrade or downgrade?', a: 'Yes — upgrade instantly. Downgrade takes effect at the end of your current billing period.' },
            { q: 'Is there a student discount?', a: 'Email us at support@skillskart.dev with your student ID for 50% off any plan.' },
          ].map((faq, i) => (
            <div key={i} className="card" style={{ padding: '20px 24px', marginBottom: '10px' }}>
              <div style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '8px', fontSize: '0.95rem' }}>{faq.q}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
      
      <MockPayModal 
        show={showPaymentModal} 
        paymentData={paymentData} 
        onClose={() => setShowPaymentModal(false)} 
      />
    </div>
  );
};

export default PricingPage;
