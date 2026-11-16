import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ShieldCheck, CreditCard, Lock, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Checkout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, setPlan, topUpCredits, currentRole } = useStore();

  const planKey = searchParams.get('plan') || 'growth';
  const cycle = searchParams.get('cycle') || 'monthly';

  const planName = planKey === 'enterprise' ? 'Enterprise Plan' : planKey === 'starter' ? 'Starter Plan' : 'Growth Plan';
  const basePrice = planKey === 'enterprise' ? (cycle === 'annual' ? 649 : 799) : planKey === 'starter' ? (cycle === 'annual' ? 79 : 99) : (cycle === 'annual' ? 199 : 249);
  const tax = Math.round(basePrice * 0.1);
  const total = basePrice + tax;

  const [paymentState, setPaymentState] = useState<'review' | 'processing' | 'success' | 'failed'>('review');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('08/29');
  const [cvc, setCvc] = useState('312');

  const handlePay = (simulateFailure = false) => {
    setPaymentState('processing');

    setTimeout(() => {
      if (simulateFailure) {
        setPaymentState('failed');
      } else {
        setPaymentState('success');
        // Activate paid entitlement ONLY on verified success (Section 6.5)
        setPlan('growth');
        topUpCredits(500, total);
        try {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        } catch (e) {
          // ignore
        }
      }
    }, 1800);
  };

  const handleGoToWorkspace = () => {
    const rolePrefix = currentRole === 'manager' ? 'manager' : currentRole === 'sales_rep' ? 'sales' : 'admin';
    navigate(`/${rolePrefix}/dashboard`);
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Step Header */}
        <div className="px-8 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Order Summary & Entitlement Activation</h1>
            <p className="text-xs text-slate-500 mt-0.5">Workspace: {currentUser.companyName}</p>
          </div>
          <Link to="/pricing" className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Change Plan
          </Link>
        </div>

        <div className="p-8">
          {paymentState === 'review' && (
            <div className="space-y-6">
              {/* Plan Item Row */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{planName}</div>
                  <div className="text-xs text-slate-500 capitalize">{cycle} billing · Unlocks CRM, Live Assist, 500 AI credits</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900 text-base">${basePrice}/mo</div>
                  <div className="text-[10px] text-slate-400">Billed in advance</div>
                </div>
              </div>

              {/* Price Calculation Table */}
              <div className="space-y-2 text-xs border-b border-slate-100 pb-4">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono">${basePrice}.00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estimated VAT / Sales Tax (10%)</span>
                  <span className="font-mono">${tax}.00</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                  <span>Total Payable Today</span>
                  <span className="font-mono text-blue-600">${total}.00</span>
                </div>
              </div>

              {/* Simulated Card Form */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  Secure Payment Method
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Expiration</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={e => setExpiry(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">CVC Code</label>
                    <input
                      type="text"
                      value={cvc}
                      onChange={e => setCvc(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Actions: Normal or Test Failure */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => handlePay(false)}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authorize & Confirm Payment (${total}.00)</span>
                </button>

                <div className="text-center">
                  <button
                    onClick={() => handlePay(true)}
                    className="text-[11px] text-slate-400 hover:text-rose-600 underline"
                  >
                    Simulate Payment Gateway Failure (to test the error state)
                  </button>
                </div>
              </div>
            </div>
          )}

          {paymentState === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Verifying Transaction with Gateway...</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enforcing zero duplicate activation safety check. Please do not close this window.
                </p>
              </div>
            </div>
          )}

          {paymentState === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Payment Confirmed & Workspace Upgraded!</h3>
                <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto">
                  Your tenant has been promoted to <span className="font-semibold text-slate-900">{planName}</span>. 500 AI credits have been credited to your company balance.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left max-w-md mx-auto space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Transaction Ref:</span>
                  <span className="font-semibold text-slate-900">TXN-2026-94812</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Invoice Reference:</span>
                  <span className="font-semibold text-blue-600">INV-2026-004 (Generated)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Entitlements:</span>
                  <span className="text-emerald-700 font-semibold">Active & Verified</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleGoToWorkspace}
                  className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-2 shadow-xs"
                >
                  <span>Launch Workspace Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {paymentState === 'failed' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Payment Authorization Failed</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  The payment gateway declined this card. Your current subscription access remains unchanged and no features have been activated.
                </p>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => setPaymentState('review')}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Retry Payment
                </button>
                <Link
                  to="/pricing"
                  className="py-2 px-4 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Return to Pricing
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
