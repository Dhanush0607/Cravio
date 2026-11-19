export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-cravio-razorpay]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Razorpay could not be loaded.')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.cravioRazorpay = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay could not be loaded.'));
    document.body.appendChild(script);
  });
}
