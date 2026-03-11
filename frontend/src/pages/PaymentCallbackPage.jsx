import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function PaymentCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Verifying your payment, please wait...');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // Paystack returns both reference and trxref
    const reference = params.get('reference');
    const trxref = params.get('trxref');
    
    // Use whichever is available
    const transactionReference = reference || trxref;

    if (!transactionReference) {
      setStatus('error');
      setMessage('Missing payment information. If you paid, please contact support.');
      return;
    }

    api
      .post('/payments/verify', {
        reference: transactionReference,
      })
      .then(() => {
        setStatus('success');
        setMessage('Payment verified! Redirecting to your bookings...');
        setTimeout(() => {
          navigate('/bookings');
        }, 2000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Could not verify payment. If you were charged, please contact support.');
      });
  }, [location.search, navigate]);

  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">
          {isSuccess ? 'Payment successful' : isError ? 'Payment issue' : 'Processing payment'}
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          {message}
        </p>
        {isError && (
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="mt-6 w-full rounded-lg bg-amber-500 py-2.5 font-medium text-white hover:bg-amber-600"
          >
            Go to my bookings
          </button>
        )}
      </div>
    </div>
  );
}