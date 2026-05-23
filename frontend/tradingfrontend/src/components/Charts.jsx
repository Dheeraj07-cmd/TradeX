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
      data: holdings.map(h => h.qty * h.price),
      backgroundColor: ["#387ed1", "#28a745", "#ffc107", "#dc3545", "#17a2b8", "#6c757d"],
      borderWidth: 0,
    }],
  };

  const barData = {
    labels: ["Realized", "Unrealized"],
    datasets: [{
      label: "P&L Amount",
      data: [realizedPnl, unrealizedPnl],
      backgroundColor: [
        realizedPnl >= 0 ? "rgba(40, 167, 69, 0.8)" : "rgba(220, 53, 69, 0.8)",
        unrealizedPnl >= 0 ? "rgba(40, 167, 69, 0.8)" : "rgba(220, 53, 69, 0.8)",
      ],
      borderRadius: 4,
    }],
  };

  const options = {
    responsive: true,
    color: "#a0a0a0",
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: "#e0e0e0" }
      }
    },
    scales: {
      y: {
        ticks: { color: "#888" },
        grid: { color: "#333" }
      },
      x: {
        ticks: { color: "#a0a0a0" },
        grid: { display: false }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: "#e0e0e0" }
      }
    }
  };

  return (
    <div style={{ display: "flex", gap: "40px", flexWrap: "wrap", justifyContent: "center" }}>
      <div style={{ flex: "1 1 300px", maxWidth: "400px", padding: "10px" }}>
        <h4 style={{ textAlign: "center", color: "#a0a0a0", marginBottom: "20px" }}>Portfolio Mix</h4>
        {holdings.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666", marginTop: "50px" }}>No active holdings</p>
        ) : (
          <Pie data={pieData} options={pieOptions} />
        )}
      </div>
      <div style={{ flex: "1 1 300px", maxWidth: "400px", padding: "10px" }}>
        <h4 style={{ textAlign: "center", color: "#a0a0a0", marginBottom: "20px" }}>P&L Analysis</h4>
        <Bar data={barData} options={options} />
      </div>
    </div>
  );
}

export default Charts;