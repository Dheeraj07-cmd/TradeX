import React from "react";
import { useNavigate } from "react-router-dom";

function KycProgressBanner({ user }) {
    const navigate = useNavigate();

    // Check status based on the data the DTO actually sends
    const isVerified = user?.kycStatus === "APPROVED";
    const isPending = user?.kycStatus === "PENDING_REVIEW";
    const isRejected = user?.kycStatus === "REJECTED";
    const hasProfileData = user?.hasPan;

    if (!user || isVerified) return null;

    let progress = 25;
    let nextStepLabel = "Complete Profile Data";
    let messageText = "Complete profile forms to activate account features.";

    // Dynamic check
    let profileCheck = false;
    let docsCheck = false;

    // Based on actual DTO fields condition will true
    if (isRejected) {
        progress = 60;
        nextStepLabel = "Re-upload Documents";
        messageText = `Verification Rejected: ${user.adminRemarks || "Please update your documents."}`;
        profileCheck = true;
        docsCheck = false;
    } else if (isPending) {
        progress = 90;
        nextStepLabel = "Track Status";
        messageText = "Verification items received. Admin validation is currently in progress.";
        profileCheck = true;
        docsCheck = true;
    } else if (hasProfileData) {
        progress = 60;
        nextStepLabel = "Upload Identity Documents";
        messageText = "Profile captured. Please provide document records to advance.";
        profileCheck = true;
        docsCheck = false;
    }

    return (
        <div style={bannerStyle}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "15px" }}>
                <div style={{ padding: "8px 12px", backgroundColor: "rgba(255, 193, 7, 0.1)", color: "#ffc107", borderRadius: "50%", fontWeight: "bold" }}>⚠️</div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#fff" }}>Trading Capability Suspended</h4>
                    <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#aaa" }}>{messageText}</p>

                    {/* Profile completed status */}
                    <div style={{ display: "flex", gap: "15px", fontSize: "12px" }}>
                        <span style={{ color: profileCheck ? "#28a745" : "#666" }}>
                            {profileCheck ? "✔" : "○"} 1. Profile Data
                        </span>
                        <span style={{ color: docsCheck ? "#28a745" : "#666" }}>
                            {docsCheck ? "✔" : "○"} 2. File Uploads
                        </span>
                        <span style={{ color: "#666" }}>
                            ○ 3. System Approval
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Bars */}
            <div style={flexRow}>
                <div style={{ flex: "1", minWidth: "200px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                        <span>Onboarding Completeness</span>
                        <span>{progress}%</span>
                    </div>
                    <div style={{ width: "100%", backgroundColor: "#2c2c2e", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${progress}%`, backgroundColor: "#28a745", height: "6px", transition: "width 0.4s ease" }}></div>
                    </div>
                </div>

                <button onClick={() => navigate("/profile")}
                    style={{
                        backgroundColor: isPending ? "#2c2c2e" : "#28a745",
                        color: "#fff",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer"
                    }}
                >
                    {nextStepLabel}
                </button>
            </div>
        </div>
    );
}

const bannerStyle = { backgroundColor: "#1c1c1e", border: "1px solid #333", borderRadius: "8px", padding: "20px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "15px" };
const flexRow = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" };

export default KycProgressBanner;