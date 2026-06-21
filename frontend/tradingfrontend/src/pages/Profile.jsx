import React, { useState, useEffect } from 'react';
import * as ui from "../styles/style";

function Profile() {
    const [profile, setProfile] = useState({
        name: '', email: '', phoneNumber: '', address: '', nomineeName: '',
        panNumber: '', aadhaarNumber: '', bankAccountNumber: '', ifscCode: '',
        balance: 0, kycStatus: 'NOT_STARTED', adminRemarks: '',
        panDocUrl: '', aadhaarFrontUrl: '', aadhaarBackUrl: ''
    });

    const [files, setFiles] = useState({ panCard: null, aadhaarFront: null, aadhaarBack: null });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("jwt");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.status === 401) {
                alert("Your session token is outdated. Please logout and log back in.");
                return;
            }

            const data = await res.json();


            // Replace any null or undefined fields with an empty string.
            const sanitizedData = {
                name: data.name || '',
                email: data.email || '',
                phoneNumber: data.phoneNumber || '',
                address: data.address || '',
                nomineeName: data.nomineeName || '',
                panNumber: data.panNumber || '',
                aadhaarNumber: data.aadhaarNumber || '',
                bankAccountNumber: data.bankAccountNumber || '',
                ifscCode: data.ifscCode || '',
                balance: data.balance || 0,
                kycStatus: data.kycStatus || 'NOT_STARTED',
                adminRemarks: data.adminRemarks || '',
                panDocUrl: data.panDocUrl || '',
                aadhaarFrontUrl: data.aadhaarFrontUrl || '',
                aadhaarBackUrl: data.aadhaarBackUrl || ''
            };

            setProfile(sanitizedData);

        } catch (err) {
            console.error("Error retrieving user parameters", err);
        }
    };

    const handleInputChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const saveProfileData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("jwt");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profile)
            });
            if (res.ok) {
                setIsEditing(false);
                fetchProfileData();
            }
        } catch (err) {
            console.error("Error persisting user profile changes", err);
        } finally {
            setLoading(false);
        }
    };

    const submitKycDocuments = async (e) => {
        e.preventDefault();

        if (!files.panCard || !files.aadhaarFront || !files.aadhaarBack) {
            alert("Please upload all required verification documents.");
            return;
        }

        const totalSize = files.panCard.size + files.aadhaarFront.size + files.aadhaarBack.size;
        if (totalSize > 25 * 1024 * 1024) {
            alert("Total file size is too large. Please compress your images under 25MB total.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("panCard", files.panCard);
        formData.append("aadhaarFront", files.aadhaarFront);
        formData.append("aadhaarBack", files.aadhaarBack);

        try {
            const token = localStorage.getItem("token") || localStorage.getItem("jwt");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile/upload-docs`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                alert("KYC Package uploaded successfully for review!");
                fetchProfileData();
            } else {
                const errorText = await res.text();
                alert(`Upload failed: ${errorText}`);
            }
        } catch (err) {
            console.error("KYC File Transmission Interrupted", err);
            alert("Network error: The upload was interrupted. Check your backend console for Cloudinary credential errors or file size limits.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        let color = "#888";
        let text = "⚪ Verification Incomplete";

        if (status === "APPROVED") { color = ui.theme.success; text = "🟢 Verified Account"; }
        else if (status === "PENDING_REVIEW") { color = "#ff9800"; text = "🟡 Pending Review"; }
        else if (status === "REJECTED") { color = ui.theme.danger; text = "🔴 Verification Rejected"; }

        return (
            <span style={{
                padding: "6px 12px", borderRadius: "20px", fontSize: "12px",
                fontWeight: "bold", border: `1px solid ${color}`, color: color
            }}>
                {text}
            </span>
        );
    };

    return (
        <div style={ui.page}>
            <div style={ui.container}>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", borderBottom: `1px solid ${ui.theme.border}`, paddingBottom: "15px" }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "24px", color: ui.theme.textMain }}>Account Control Profile</h2>
                        <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: ui.theme.textLight }}>Manage credentials, verification state, and ledgers.</p>
                    </div>
                    <div>{getStatusBadge(profile.kycStatus)}</div>
                </div>

                {profile.kycStatus === 'REJECTED' && (
                    <div style={{ padding: "15px", backgroundColor: "rgba(220, 53, 69, 0.1)", border: `1px solid ${ui.theme.danger}`, color: ui.theme.danger, borderRadius: "6px", marginBottom: "20px" }}>
                        <strong>KYC Refusal Reason:</strong> {profile.adminRemarks || "Uploaded verification documentation was unreadable."}
                    </div>
                )}

                <div style={ui.row}>
                    {/* Forms */}
                    <div style={{ ...ui.flexItem, display: "flex", flexDirection: "column", gap: "20px" }}>

                        <div style={ui.card}>
                            <h3 style={{ ...ui.title, borderBottom: `1px solid ${ui.theme.border}`, paddingBottom: "10px", marginBottom: "15px" }}>Personal Details</h3>
                            <label style={labelStyle}>Full Legal Name</label>
                            <input type="text" name="name" disabled={!isEditing} value={profile.name} onChange={handleInputChange} style={{ ...ui.input, opacity: isEditing ? 1 : 0.6 }} />

                            <label style={labelStyle}>Registered Email Address</label>
                            <input type="email" name="email" disabled value={profile.email} style={{ ...ui.input, opacity: 0.5 }} />

                            <label style={labelStyle}>Mobile Contact</label>
                            <input type="text" name="phoneNumber" disabled={!isEditing} value={profile.phoneNumber} onChange={handleInputChange} style={{ ...ui.input, opacity: isEditing ? 1 : 0.6 }} />

                            <label style={labelStyle}>Date of Birth</label>
                            <input type="date" name="dateOfBirth" disabled={!isEditing} value={profile.dateOfBirth} onChange={handleInputChange} style={{ ...ui.input, opacity: isEditing ? 1 : 0.6 }} />

                            <label style={labelStyle}>Residential Address</label>
                            <input type="text" name="address" disabled={!isEditing} value={profile.address} onChange={handleInputChange} style={{ ...ui.input, opacity: isEditing ? 1 : 0.6 }} placeholder="e.g., 123 Main St, Mumbai" />

                            <label style={labelStyle}>Nominee Name</label>
                            <input type="text" name="nomineeName" disabled={!isEditing} value={profile.nomineeName} onChange={handleInputChange} style={{ ...ui.input, opacity: isEditing ? 1 : 0.6 }} placeholder="Name of your account nominee" />
                        </div>

                        <div style={ui.card}>
                            <h3 style={{ ...ui.title, borderBottom: `1px solid ${ui.theme.border}`, paddingBottom: "10px", marginBottom: "15px" }}>Banking & Settlement</h3>
                            <label style={labelStyle}>Bank Account Number</label>
                            <input type="text" name="bankAccountNumber" disabled={!isEditing} value={profile.bankAccountNumber} onChange={handleInputChange} style={{ ...ui.input, opacity: isEditing ? 1 : 0.6 }} />

                            <label style={labelStyle}>IFSC Routing Token</label>
                            <input type="text" name="ifscCode" disabled={!isEditing} value={profile.ifscCode} onChange={handleInputChange} style={{ ...ui.input, opacity: isEditing ? 1 : 0.6 }} />
                        </div>
                    </div>

                    {/* Documents */}
                    <div style={{ ...ui.flexItem, display: "flex", flexDirection: "column", gap: "20px" }}>

                        <div style={{ ...ui.card, backgroundColor: "#111", borderLeft: `4px solid ${ui.theme.primary}` }}>
                            <h3 style={ui.title}>Available Trading Capital</h3>
                            <h2 style={{ ...ui.value, color: ui.theme.success, fontSize: "32px", margin: "10px 0" }}>
                                ₹{profile.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h2>
                            <p style={{ fontSize: "12px", color: ui.theme.textLight, margin: 0 }}>Settlement Mode: T+1 Cash Base</p>
                        </div>

                        <div style={ui.card}>
                            <h3 style={{ ...ui.title, borderBottom: `1px solid ${ui.theme.border}`, paddingBottom: "10px", marginBottom: "15px" }}>Identity Credentials</h3>

                            <label style={labelStyle}>PAN Number</label>
                            <input type="text" name="panNumber" disabled={!isEditing || profile.kycStatus === 'APPROVED'} value={profile.panNumber} onChange={handleInputChange} style={{ ...ui.input, opacity: isEditing ? 1 : 0.6, textTransform: "uppercase" }} />

                            <label style={labelStyle}>National ID Mapping</label>
                            <input type="text" name="aadhaarNumber" disabled={!isEditing || profile.kycStatus === 'APPROVED'} value={profile.aadhaarNumber} onChange={handleInputChange} style={{ ...ui.input, opacity: isEditing ? 1 : 0.6 }} />

                            {(profile.kycStatus === 'NOT_STARTED' || profile.kycStatus === 'REJECTED') && (
                                <form onSubmit={submitKycDocuments} style={{ marginTop: "20px", paddingTop: "20px", borderTop: `1px dashed ${ui.theme.border}` }}>
                                    <h4 style={{ color: ui.theme.textMain, fontSize: "14px", marginBottom: "15px" }}>Submit Verification Enclosures</h4>

                                    <label style={labelStyle}>PAN Card Document (JPEG/PNG)</label>
                                    <input type="file" name="panCard" onChange={handleFileChange} style={{ ...ui.input, padding: "8px" }} accept="image/jpeg,image/png" />

                                    <label style={labelStyle}>ID Mapping Front Image</label>
                                    <input type="file" name="aadhaarFront" onChange={handleFileChange} style={{ ...ui.input, padding: "8px" }} accept="image/jpeg,image/png" />

                                    <label style={labelStyle}>ID Mapping Back Image</label>
                                    <input type="file" name="aadhaarBack" onChange={handleFileChange} style={{ ...ui.input, padding: "8px" }} accept="image/jpeg,image/png" />

                                    <button type="submit" disabled={loading} style={{ ...ui.button, backgroundColor: loading ? "#555" : ui.theme.primary }}>
                                        {loading ? "Transmitting Artifacts..." : "Submit KYC Package"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "15px", borderTop: `1px solid ${ui.theme.border}`, paddingTop: "20px" }}>
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} style={{ ...ui.button, width: "auto", padding: "10px 20px", backgroundColor: "transparent", border: `1px solid ${ui.theme.border}` }}>Cancel</button>
                            <button onClick={saveProfileData} disabled={loading} style={{ ...ui.button, width: "auto", padding: "10px 30px" }}>
                                {loading ? "Saving..." : "Commit Update"}
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} style={{ ...ui.button, width: "auto", padding: "10px 30px" }}>
                            Modify Profile
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}

const labelStyle = { display: "block", fontSize: "12px", color: ui.theme.textLight, marginBottom: "6px", fontWeight: "600" };

export default Profile;