
const theme = {
  primary: "#387ed1", 
  bg: "#121212",      
  cardBg: "#1e1e1e",  
  textMain: "#e0e0e0", 
  textLight: "#a0a0a0", 
  border: "#333333",  
  success: "#28a745", 
  danger: "#dc3545",  
};

export const page = {
  padding: "30px",
  minHeight: "100vh",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  backgroundColor: theme.bg,
  color: theme.textMain,
  boxSizing: "border-box",
};

export const container = {
  maxWidth: "1100px",
  margin: "0 auto",
  width: "100%",
};

export const card = {
  backgroundColor: theme.cardBg,
  padding: "24px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.3)", 
  border: `1px solid ${theme.border}`,
  marginBottom: "20px",
};

export const row = {
  display: "flex",
  gap: "20px",
  flexWrap: "wrap", 
  alignItems: "stretch",
};

export const flexItem = {
  flex: "1 1 280px", 
};

export const title = {
  fontSize: "13px",
  textTransform: "uppercase",
  color: theme.textLight,
  fontWeight: "500",
  margin: "0 0 8px 0",
};

export const value = {
  fontSize: "24px",
  fontWeight: "500",
  margin: "0",
  color: theme.textMain, 
};

// Table Styles
export const tableContainer = {
  overflowX: "auto",
  width: "100%",
};

export const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
};

export const th = {
  textAlign: "left",
  padding: "12px",
  borderBottom: `1px solid ${theme.border}`,
  color: theme.textLight,
  fontWeight: "500",
};

export const td = {
  padding: "12px",
  borderBottom: `1px solid ${theme.border}`,
  color: theme.textMain, 
};

// Inputs & Buttons
export const input = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "4px",
  border: `1px solid ${theme.border}`,
  backgroundColor: "#2c2c2e", 
  color: "#fff", 
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

export const button = {
  width: "100%",
  padding: "12px",
  border: "none",
  borderRadius: "4px",
  backgroundColor: theme.primary,
  color: "#fff",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  marginTop: "10px",
};