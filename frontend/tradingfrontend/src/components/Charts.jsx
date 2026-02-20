import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

function Charts({ holdings, realizedPnl, unrealizedPnl }) {

  const pieData = {
    labels: holdings.map(h => h.name),
    datasets: [{
      data: holdings.map(h => h.qty),
      backgroundColor: ["#387ed1", "#28a745", "#ffc107", "#dc3545", "#6c757d"],
      borderWidth: 0,
    }],
  };

  const barData = {
    labels: ["Realized", "Unrealized"],
    datasets: [{
      label: "P&L",
      data: [realizedPnl, unrealizedPnl],
      backgroundColor: [
        realizedPnl >= 0 ? "#28a745" : "#dc3545",
        unrealizedPnl >= 0 ? "#28a745" : "#dc3545",
      ],
      borderRadius: 4,
    }],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };

  return (
    <div style={{ display: "flex", gap: "40px", flexWrap: "wrap", justifyContent: "center" }}>
      <div style={{ flex: "1 1 300px", maxWidth: "350px", padding: "10px" }}>
        <h4 style={{ textAlign: "center", color: "#666", marginBottom: "20px" }}>Portfolio Mix</h4>
        <Pie data={pieData} options={options} />
      </div>
      <div style={{ flex: "1 1 300px", maxWidth: "350px", padding: "10px" }}>
        <h4 style={{ textAlign: "center", color: "#666", marginBottom: "20px" }}>P&L Analysis</h4>
        <Bar data={barData} options={options} />
      </div>
    </div>
  );
}

export default Charts;