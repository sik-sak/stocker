import React, { useState, useEffect } from 'react';
import ApexCharts from 'react-apexcharts';
import Papa from 'papaparse';

const RealData = () => {
  const [lineSeries, setLineSeries] = useState([]);
  const now = new Date();
  const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 15, 0); // 9:15 AM
  const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30, 0); // 3:30 PM

  const parseTime = (time) => {
    if (!time) {
      console.error('Invalid time:', time);
      return new Date(); // Return a default date if the time is invalid
    }
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds);
  };

  useEffect(() => {
    Papa.parse('/Realtime.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data;
        console.log('Raw Data:', data); // Log raw data

        // Check if the current time is beyond 3:30 PM
        const isPastEndTime = now > endTime;

        const filteredData = data
          .filter(item => {
            const itemTime = parseTime(item.TIMESTAMP);
            // If the current time is beyond 3:30 PM, filter between 9:15 AM and 3:30 PM
            return isPastEndTime
              ? itemTime >= startTime && itemTime <= endTime
              : itemTime >= startTime && itemTime <= now; // Otherwise, filter up to the current time
          })
          .map(item => ({
            x: parseTime(item.TIMESTAMP).getTime(), // Convert to timestamp in milliseconds
            y: parseFloat(item.CLOSE), // Use CLOSE price for the line chart
          }));

        console.log('Filtered Data:', filteredData); // Log filtered data
        setLineSeries([{ name: 'Close Price', data: filteredData }]);
      },
    });
  }, []);

  const lineOptions = {
    chart: {
      type: 'line',
      height: 500,
      zoom: { enabled: true },
      toolbar: { show: true },
    },
    xaxis: {
      type: 'datetime',
      title: { text: 'Time' },
      labels: {
        format: 'HH:mm:ss',
      },
      min: startTime.getTime(),
      max: now > endTime ? endTime.getTime() : now.getTime(), // Set max to current time if it's before 3:30 PM
    },
    yaxis: {
      title: { text: 'Price' },
    },
    tooltip: {
      x: { format: 'HH:mm:ss' },
      y: { formatter: value => `$${value.toFixed(2)}` },
    },
    title: {
      text: 'Stock Line Chart',
      align: 'left',
    },
    colors: ['#34a853'],
    stroke: {
      curve: 'smooth',
      width: 2,
    },
  };

  return (
    <div>
      <ApexCharts
        type="line"
        options={lineOptions}
        series={lineSeries}
        height={500}
      />
    </div>
  );
};

export default RealData;
