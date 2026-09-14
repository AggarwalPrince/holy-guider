import { useState } from "react";
import confetti from "canvas-confetti";
import { useWallet } from "../context/WalletContext";
import { api } from "../utils/api";
import { openRazorpayCheckout } from "../utils/RazorpaySetup";

const PRESET_AMOUNTS = [
  { amount: 9, label: "1 Consultation", badge: "Trial" },
  { amount: 49, label: "5 Consultations", badge: "Popular" },
  { amount: 99, label: "11 Consultations", badge: "+1 Free" },
];

export default function WalletModal() {
  const { user, walletBalance, updateBalance, isWalletModalOpen, closeWalletModal } = useWallet();
  const [amount, setAmount] = useState(49);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isWalletModalOpen) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#B08D3F", "#C1791F", "#E2E3DC", "#1B1F22"],
    });
  };

  const handleRecharge = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    const rechargeAmount = customAmount ? parseInt(customAmount, 10) : amount;

    if (isNaN(rechargeAmount) || rechargeAmount < 9) {
      setErrorMessage("Minimum top-up amount is ₹9 (1 consultation).");
      return;
    }

    setIsLoading(true);

    try {
      const orderData = await api.payments.createOrder(rechargeAmount, user?.id || user?._id || "dev_seeker");

      // In demo mode or if Razorpay credentials are placeholder, simulate immediate success
      if (orderData.isSimulated) {
        const verification = await api.payments.verify({
          userId: user?.id || user?._id || "dev_seeker",
          amount: rechargeAmount,
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: "simulated_signature",
        });

        triggerConfetti();
        setSuccessMessage(`₹${rechargeAmount} added to your wallet!`);
        updateBalance(verification.walletBalance);

        setTimeout(() => {
          setIsLoading(false);
          closeWalletModal();
        }, 1400);
        return;
      }

      // Real Razorpay flow
      await openRazorpayCheckout({
        orderId: orderData.order_id,
        amount: orderData.amount,
        key: orderData.key,
        user: user,
        onSuccess: async (paymentDetails) => {
          try {
            const verification = await api.payments.verify({
              userId: user?.id || user?._id,
              amount: rechargeAmount,
              razorpay_order_id: paymentDetails.razorpay_order_id,
              razorpay_payment_id: paymentDetails.razorpay_payment_id,
              razorpay_signature: paymentDetails.razorpay_signature,
            });

            triggerConfetti();
            setSuccessMessage(`₹${rechargeAmount} added to your wallet!`);
            updateBalance(verification.walletBalance);

            setTimeout(() => {
              setIsLoading(false);
              closeWalletModal();
            }, 1400);
          } catch (verifyErr) {
            setErrorMessage(verifyErr.message || "Payment verification failed.");
            setIsLoading(false);
          }
        },
        onDismiss: () => setIsLoading(false),
        onError: (err) => {
          setErrorMessage(err.message || "Payment transaction could not be completed.");
          setIsLoading(false);
        },
      });
    } catch (err) {
      setErrorMessage(err.message || "Failed to initiate payment.");
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(27, 31, 34, 0.45)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeWalletModal();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#FFFFFF",
          borderRadius: 20,
          padding: "28px 24px",
          border: "1px solid var(--stone-deep)",
          boxShadow: "0 20px 40px rgba(27, 31, 34, 0.15)",
          position: "relative",
          animation: "fadeIn 200ms ease",
        }}
      >
        {/* Close Button */}
        <button
          onClick={closeWalletModal}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            background: "none",
            border: "none",
            color: "var(--ink-soft)",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: "1.6rem", margin: "0 0 6px", color: "var(--ink)" }}>
            Sacred Wallet Top-Up
          </h2>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
            Current Balance: <strong style={{ color: "var(--accent)" }}>₹{walletBalance}</strong> (₹9 per inquiry)
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "#FDF2F2",
              border: "1px solid #F8B4B4",
              color: "#9B1C1C",
              fontSize: 12,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              color: "#166534",
              fontSize: 12,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Preset Chips */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
          {PRESET_AMOUNTS.map((preset) => {
            const isSelected = amount === preset.amount && !customAmount;
            return (
              <button
                key={preset.amount}
                type="button"
                onClick={() => {
                  setAmount(preset.amount);
                  setCustomAmount("");
                  setErrorMessage("");
                }}
                style={{
                  padding: "12px 8px",
                  borderRadius: 14,
                  border: isSelected ? "2px solid var(--accent)" : "1px solid var(--stone-deep)",
                  background: isSelected ? "var(--accent-soft)" : "#FAFAFA",
                  color: "var(--ink)",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 150ms ease",
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)" }}>₹{preset.amount}</div>
                <div style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600, marginTop: 2 }}>{preset.label}</div>
              </button>
            );
          })}
        </div>

        {/* Custom Amount */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink)", fontWeight: 700, marginBottom: 6 }}>
            Or Custom Amount (Min ₹9)
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: 12, fontWeight: 700, color: "var(--ink)" }}>₹</span>
            <input
              type="number"
              min="9"
              placeholder="Enter amount..."
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setErrorMessage("");
              }}
              style={{
                width: "100%",
                padding: "12px 14px 12px 30px",
                borderRadius: 12,
                border: "1.5px solid var(--stone-deep)",
                background: "#FAFAFA",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--ink)",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Proceed Button */}
        <button
          onClick={handleRecharge}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: 999,
            border: "none",
            background: "var(--accent)",
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(158, 116, 24, 0.25)",
            opacity: isLoading ? 0.7 : 1,
            transition: "opacity 150ms ease",
          }}
        >
          {isLoading ? "Invoking Payment..." : `Proceed to Pay ₹${customAmount || amount}`}
        </button>

        {/* Micro Footer */}
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>
          Secured by Razorpay · 100% Secure Checkout
        </div>
      </div>
    </div>
  );
}
