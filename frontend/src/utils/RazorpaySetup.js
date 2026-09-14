/**
 * Razorpay Payment Gateway Helper
 * Dynamically loads script if missing and opens the Razorpay modal.
 */

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay checkout script.");
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

/**
 * Launch Razorpay Checkout Modal
 */
export const openRazorpayCheckout = async ({
  orderId,
  amount, // in paise (e.g. 900 for ₹9)
  key,
  user,
  onSuccess,
  onDismiss,
  onError,
}) => {
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded) {
    if (onError) onError(new Error("Unable to load Razorpay SDK. Please check your internet connection."));
    return;
  }

  const options = {
    key: key || "rzp_test_placeholder_key_id",
    amount: amount,
    currency: "INR",
    name: "Holy Guider | Sacred Wisdom",
    description: `Wallet Recharge: ₹${(amount / 100).toFixed(0)}`,
    image: "https://holyguider.com/favicon.svg",
    order_id: orderId,
    handler: function (response) {
      if (onSuccess) {
        onSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      }
    },
    prefill: {
      name: user?.name || "Seeker",
      email: user?.email || "seeker@holyguider.com",
      contact: "9999999999",
    },
    notes: {
      userId: user?.id || user?._id,
      service: "Spiritual Guidance Consultation",
    },
    theme: {
      color: "#d97706", // Sacred Golden Amber
      backdrop_color: "rgba(11, 9, 26, 0.9)",
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) onDismiss();
      },
      escape: true,
      animation: true,
    },
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response) {
      console.error("[Razorpay] Payment Failed:", response.error);
      if (onError) onError(response.error);
    });
    rzp.open();
  } catch (err) {
    console.error("[Razorpay] Error opening modal:", err);
    if (onError) onError(err);
  }
};
