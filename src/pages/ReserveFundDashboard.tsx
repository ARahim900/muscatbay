
import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { faker } from '@faker-js/faker/locale/en';
import Layout from '@/components/layout/Layout';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return typeof value === 'number' 
            ? formatter.format(value) 
            : value;
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
};

const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const data = {
  labels,
  datasets: [
    {
      label: 'Reserve Fund Contributions',
      data: labels.map(() => faker.number.int({ min: 1000, max: 5000 })),
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
    },
  ],
};

const ReserveFundDashboard = () => {
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Reserve Fund Dashboard</h1>
        <div className="h-[500px]">
          <Bar options={options} data={data} />
        </div>
      </div>
    </Layout>
  );
};

export default ReserveFundDashboard;
