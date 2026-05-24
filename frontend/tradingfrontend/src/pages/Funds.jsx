import { useState, useEffect } from "react";
import API from "../services/api";
import * as ui from "../styles/style";
import toast from "react-hot-toast";

function Funds() {
    const [balance, setBalance] = useState(0);
    const [usedMargin, setUsedMargin] = useState(0);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        fetchProfileAndHistory();
    }, []);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const fetchProfileAndHistory = async () => {
        try {
            const [profileRes, historyRes, holdingsRes] = await Promise.all([
                API.get("/api/user/profile"),
                API.get("/api/user/funds/history"),
                API.get("/api/holdings")
            ]);

            setBalance(profileRes.data.balance);
            setTransactions(historyRes.data);

            const lockedMoney = holdingsRes.data.reduce((total, stock) => total + (stock.qty * stock.avg), 0);
            setUsedMargin(lockedMoney);
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    const initiateDeposit = async () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount to deposit.");
            return;
        }

        const toastId = toast.loading("Securely connecting to payment gateway...");

        const res = await loadRazorpayScript();
        if (!res) {
            toast.error("Razorpay SDK failed to load. Are you online?", { id: toastId });
            return;
        }

        try {
            const orderRes = await API.post("/api/user/funds/create-razorpay-order", { amount: Number(amount) });
            toast.dismiss(toastId);

            const options = {
                key: import.meta.env.VITE_RAZORPAY_API_KEY,
                amount: orderRes.data.amount,
                currency: "INR",
                name: "TradeX",
                description: "Add funds to margin",
                order_id: orderRes.data.orderId,
                theme: { color: ui.theme.primary },
                handler: async function (response) {
                    const verifyToast = toast.loading("Verifying payment...");
                    try {
                        const depositRes = await API.post("/api/user/funds", { amount: Number(amount), action: "DEPOSIT" });
                        setBalance(depositRes.data.newBalance);
                        setAmount("");
                        toast.success("Payment Successful! Funds added.", { id: verifyToast });
                        fetchProfileAndHistory();
                    } catch (err) {
                        toast.error("Failed to update ledger.", { id: verifyToast });
                    }
                },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (err) {
            toast.error(err.response?.data || "Could not initialize payment.", { id: toastId });
        }
    };

    const handleWithdraw = async () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }
        if (Number(amount) > balance) {
            toast.error(`You can only withdraw up to ₹${balance.toLocaleString('en-IN')}. Please sell stocks to free up margin.`);
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Processing withdrawal...");
        try {
            const res = await API.post("/api/user/funds", { amount: Number(amount), action: "WITHDRAW" });
            setBalance(res.data.newBalance);
            setAmount("");
            toast.success(res.data.message, { id: toastId });
            fetchProfileAndHistory();
        } catch (err) {
            toast.error(err.response?.data || "Transaction failed", { id: toastId });
            fetchProfileAndHistory();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto", color: ui.theme.textMain }}>
            <h2 style={{ marginBottom: "30px", color: ui.theme.textLight }}>Funds Management</h2>

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "40px" }}>
                {/* Margin Summary */}
                <div style={{
                    flex: "1 1 400px", background: "linear-gradient(135deg, #1e1e1e 0%, #2c2c2e 100%)",
                    padding: "30px", borderRadius: "12px", boxShadow: "0 10px 20px rgba(0,0,0,0.2)", border: `1px solid ${ui.theme.border}`
                }}>
                    <p style={{ margin: "0 0 5px 0", color: "#888", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>Available Margin (Cash)</p>
                    <h1 style={{ margin: "0 0 25px 0", fontSize: "42px", color: ui.theme.primary }}>
                        ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h1>

                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #333", paddingTop: "20px" }}>
                        <div>
                            <p style={{ margin: "0 0 5px 0", color: "#888", fontSize: "12px" }}>Used Margin (Invested)</p>
                            <h3 style={{ margin: 0, color: ui.theme.textLight }}>₹{usedMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ margin: "0 0 5px 0", color: "#888", fontSize: "12px" }}>Total Account Value</p>
                            <h3 style={{ margin: 0, color: ui.theme.textMain }}>₹{(balance + usedMargin).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                        </div>
                    </div>
                </div>

                {/* Update funds */}
                <div style={{ flex: "1 1 300px", backgroundColor: ui.theme.cardBg, padding: "30px", borderRadius: "12px", border: `1px solid ${ui.theme.border}` }}>
                    <label style={{ display: "block", marginBottom: "10px", color: ui.theme.textLight, fontSize: "14px" }}>
                        Enter Amount (₹)
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        style={{ ...ui.input, fontSize: "24px", padding: "15px", marginBottom: "25px" }}
                    />

                    <div style={{ display: "flex", gap: "15px" }}>
                        <button onClick={initiateDeposit} disabled={loading} style={{ ...ui.button, backgroundColor: ui.theme.success, margin: 0, fontSize: "16px", padding: "15px" }}>
                            Add Funds
                        </button>
                        <button onClick={handleWithdraw} disabled={loading} style={{ ...ui.button, backgroundColor: "transparent", border: `1px solid ${ui.theme.border}`, margin: 0, fontSize: "16px", padding: "15px" }}
                            onMouseOver={(e) => { e.target.style.borderColor = ui.theme.danger; e.target.style.color = ui.theme.danger; }}
                            onMouseOut={(e) => { e.target.style.borderColor = ui.theme.border; e.target.style.color = ui.theme.textMain; }}
                        >
                            Withdraw
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction Ledger */}
            <div>
                <h3 style={{ borderBottom: `1px solid ${ui.theme.border}`, paddingBottom: "10px", marginBottom: "20px" }}>Recent Transactions</h3>

                {transactions.length === 0 ? (
                    <p style={{ color: "#888", textAlign: "center", padding: "20px" }}>No recent transactions.</p>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ color: "#888", fontSize: "13px", borderBottom: `1px solid ${ui.theme.border}` }}>
                                <th style={{ padding: "12px 10px" }}>Time</th>
                                <th style={{ padding: "12px 10px" }}>Type</th>
                                <th style={{ padding: "12px 10px" }}>Transaction ID</th>
                                <th style={{ padding: "12px 10px" }}>Amount</th>
                                <th style={{ padding: "12px 10px" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((txn, index) => (
                                <tr key={index} style={{ borderBottom: `1px solid #222`, fontSize: "14px" }}>
                                    <td style={{ padding: "15px 10px", color: "#aaa" }}>{txn.date}</td>
                                    <td style={{ padding: "15px 10px", color: txn.type === "DEPOSIT" ? ui.theme.success : ui.theme.primary, fontWeight: "600" }}>
                                        {txn.type}
                                    </td>
                                    <td style={{ padding: "15px 10px", fontFamily: "monospace", color: "#888" }}>{txn.txnId}</td>
                                    <td style={{ padding: "15px 10px", fontWeight: "bold" }}>
                                        ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: "15px 10px" }}>
                                        <span style={{
                                            padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold",
                                            backgroundColor: txn.status === "SUCCESS" ? "rgba(40, 167, 69, 0.1)" : "rgba(220, 53, 69, 0.1)",
                                            color: txn.status === "SUCCESS" ? ui.theme.success : ui.theme.danger
                                        }}>
                                            {txn.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Funds;