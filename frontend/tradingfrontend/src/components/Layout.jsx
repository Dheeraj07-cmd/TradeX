import React, { useState } from "react";
import Navbar from "./Navbar";
import Watchlist from "./Watchlist";
import OrderModal from "./OrderModal";
import * as ui from "../styles/style";

function Layout({ children }) {
  const [modalState, setModalState] = useState({ isOpen: false, instrument: "", mode: "BUY" });

  const openOrderModal = (instrument, mode) => {
    setModalState({ isOpen: true, instrument, mode });
  };

  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { openOrderModal });
    }
    return child;
  });

  return (
    <div style={{ backgroundColor: ui.theme?.bg || "#121212", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ display: "flex", maxWidth: "1600px", margin: "0 auto" }}>

        <Watchlist openOrderModal={openOrderModal} />

        <div style={{ flex: 1, overflowY: "auto", paddingBottom: "50px" }}>
          {childrenWithProps}
        </div>
      </div>

      {/* Global Order Modal */}
      <OrderModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        instrument={modalState.instrument}
        initialMode={modalState.mode}
      />
    </div>
  );
}

export default Layout;