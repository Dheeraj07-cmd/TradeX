import React, { useState, useEffect } from 'react';
import * as ui from "../styles/style";

function AdminDashboard() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingKyc();
    }, []);

    const fetchPendingKyc = async () => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("jwt");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/kyc-pending`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.status === 403) {
                alert("Access Denied: You do not have ADMIN privileges.");
                setPendingUsers([]);
                return;
            }

            if (!res.ok) {
                console.error("Backend returned an error status:", res.status);
                setPendingUsers([]);
                return;
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                setPendingUsers(data);
            } else {
                console.error("Expected an array but received:", data);
                setPendingUsers([]);
            }

        } catch (err) {
            console.error("Failed to fetch pending KYC", err);
            setPendingUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (userId, status) => {
        let remarks = "";
        if (status === "REJECTED") {
            remarks = prompt("Please provide a reason for rejection (e.g., 'Image blurry', 'Name mismatch'):");
            if (!remarks) return;
        }

        try {
            const token = localStorage.getItem("token") || localStorage.getItem("jwt");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/kyc-review/${userId}?status=${status}&remarks=${encodeURIComponent(remarks)}`, {
                method: 'PUT',
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                alert(`User successfully ${status.toLowerCase()}!`);
                setPendingUsers(prev => prev.filter(user => user.id !== userId));
            }
        } catch (err) {
            console.error("Error processing KYC review", err);
            alert("Failed to update status.");
        }
    };

    if (loading) return <div style={{ color: "#fff", padding: "30px" }}>Loading secure admin portal...</div>;

    return (
        <div style={ui.page}>
            <div style={ui.container}>

                <div style={{ marginBottom: "25px", borderBottom: `1px solid ${ui.theme.border}`, paddingBottom: "15px" }}>
                    <h2 style={{ margin: 0, fontSize: "24px", color: ui.theme.primary }}>🛡️ Admin Operations Control</h2>
                    <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: ui.theme.textLight }}>Review and verify submitted client identification documents.</p>
                </div>

                {pendingUsers.length === 0 ? (
                    <div style={{ ...ui.card, textAlign: "center", padding: "50px", color: ui.theme.textLight }}>
                        Zero pending KYC applications. Queue is clear!
                    </div>
                ) : (
                    pendingUsers.map(user => (
                        <div key={user.id} style={{ ...ui.card, display: "flex", flexDirection: "column", gap: "20px" }}>

                            {/* User Data Banner */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", backgroundColor: "#111", padding: "15px", borderRadius: "8px" }}>
                                <div>
                                    <p style={{ margin: "0 0 5px 0", color: ui.theme.textLight, fontSize: "12px" }}>Applicant Name</p>
                                    <p style={{ margin: 0, color: "#fff", fontWeight: "bold" }}>{user.name} ({user.email})</p>
                                </div>

                                <div>
                                    <p style={{ margin: "0 0 5px 0", color: ui.theme.textLight, fontSize: "12px" }}>Phone / DOB</p>
                                    <p style={{ margin: 0, color: "#fff" }}>{user.phoneNumber} / {user.dateOfBirth}</p>
                                </div>

                                <div>
                                    <p style={{ margin: "0 0 5px 0", color: ui.theme.textLight, fontSize: "12px" }}>Declared PAN Number</p>
                                    <p style={{ margin: 0, color: "#fff", fontFamily: "monospace" }}>{user.panNumber}</p>
                                </div>

                                <div>
                                    <p style={{ margin: "0 0 5px 0", color: ui.theme.textLight, fontSize: "12px" }}>Declared Mapping</p>
                                    <p style={{ margin: 0, color: "#fff", fontFamily: "monospace" }}>{user.aadhaarNumber}</p>
                                </div>
                            </div>

                            {/* Cloudinary Documents */}
                            <h4 style={{ margin: 0, color: ui.theme.textMain, fontSize: "14px", borderBottom: `1px dashed ${ui.theme.border}`, paddingBottom: "10px" }}>Uploaded Documents</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                                <div>
                                    <p style={{ fontSize: "12px", color: ui.theme.textLight, textAlign: "center" }}>PAN Card</p>
                                    <a href={user.panDocUrl} target="_blank" rel="noreferrer">
                                        <img src={user.panDocUrl} alt="PAN Document" style={imageStyle} />
                                    </a>
                                </div>

                                <div>
                                    <p style={{ fontSize: "12px", color: ui.theme.textLight, textAlign: "center" }}>Front Mapping</p>
                                    <a href={user.aadhaarFrontUrl} target="_blank" rel="noreferrer">
                                        <img src={user.aadhaarFrontUrl} alt="Front Document" style={imageStyle} />
                                    </a>
                                </div>

                                <div>
                                    <p style={{ fontSize: "12px", color: ui.theme.textLight, textAlign: "center" }}>Back Mapping</p>
                                    <a href={user.aadhaarBackUrl} target="_blank" rel="noreferrer">
                                        <img src={user.aadhaarBackUrl} alt="Back Document" style={imageStyle} />
                                    </a>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px", marginTop: "10px" }}>
                                <button onClick={() => handleReview(user.id, "REJECTED")} style={{ ...ui.button, backgroundColor: "transparent", color: ui.theme.danger, border: `1px solid ${ui.theme.danger}`, width: "120px" }}>
                                    Reject
                                </button>
                                <button onClick={() => handleReview(user.id, "APPROVED")} style={{ ...ui.button, backgroundColor: ui.theme.success, width: "120px" }}>
                                    Approve
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const imageStyle = { width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px", border: "1px solid #333", cursor: "pointer", backgroundColor: "#161616" };

export default AdminDashboard;