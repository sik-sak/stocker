// import React, { useState, useEffect } from 'react';
// import ApexCharts from 'react-apexcharts';
// import Papa from 'papaparse';

// const StockChart = () => {
//   const [candlestickSeries, setCandlestickSeries] = useState([]);
//   const [lineSeries, setLineSeries] = useState([]);
//   const [symbols, setSymbols] = useState([]);
//   const [selectedSymbol, setSelectedSymbol] = useState('BAJAJFINSV.NS');

//   // Function to replace single quotes with double quotes to make it JSON-compatible
//   function replaceQuotes(str) {
//     return str.replace(/'/g, '"');
//   }

//   useEffect(() => {
//     Papa.parse('/NIFTY50stocks.csv', {
//       download: true,
//       header: true,
//       complete: (results) => {
//         const data = results.data;
//         const uniqueSymbols = [...new Set(data.map(row => row.Symbol))];
//         setSymbols(uniqueSymbols);
//       },
//     });
//   }, []);

//   useEffect(() => {
//     if (selectedSymbol) {
//       Papa.parse('/NIFTY50stocks.csv', {
//         download: true,
//         header: true,
//         complete: (results) => {
//           const data = results.data;
//           const companyData = data.find(row => row.Symbol === selectedSymbol);

//           if (companyData && companyData["Historical Data"]) {
//             try {
//               const historicalData = replaceQuotes(companyData["Historical Data"]);
//               const parsedData = JSON.parse(historicalData);

//               const timestamps = Object.keys(parsedData).map(timestamp => parseInt(timestamp) * 1000); // Multiply by 1000 to convert to milliseconds

//               const formattedData = timestamps.map(timestamp => {
//                 const dataPoint = parsedData[Math.floor(timestamp / 1000)];
//                 return {
//                   x: timestamp,
//                   y: [
//                     dataPoint.Open,
//                     dataPoint.High,
//                     dataPoint.Low,
//                     dataPoint.Close
//                   ]
//                 };
//               });

//               setCandlestickSeries([{ name: 'Stock Price', data: formattedData }]);
//               setLineSeries([{ name: 'Close Price', data: formattedData.map(d => ({ x: d.x, y: d.y[3] })) }]);

//             } catch (error) {
//               console.error("Error parsing JSON data:", error);
//             }
//           }
//         },
//       });
//     }
//   }, [selectedSymbol]);

//   const candlestickOptions = {
//     chart: {
//       type: 'candlestick',
//       height: 500,
//       zoom: { enabled: true },
//       toolbar: { show: true },
//     },
//     xaxis: {
//       type: 'datetime',
//       labels: { format: 'MMM yyyy' },
//       title: { text: 'Date' },
//     },
//     yaxis: {
//       tooltip: { enabled: true },
//       title: { text: 'Price' },
//     },
//     tooltip: {
//       x: { format: 'dd MMM yyyy' },
//       y: { formatter: value => `$${value.toFixed(2)}` },
//     },
//     title: {
//       text: `Stock Candlestick Chart for ${selectedSymbol}`,
//       align: 'left',
//     },
//     colors: ['#34a853'],
//   };

//   const lineOptions = {
//     chart: {
//       type: 'line',
//       height: 500,
//       zoom: { enabled: true },
//       toolbar: { show: true },
//     },
//     xaxis: {
//       type: 'datetime',
//       labels: { format: 'MMM yyyy' },
//       title: { text: 'Date' },
//     },
//     yaxis: {
//       title: { text: 'Close Price' },
//     },
//     tooltip: {
//       x: { format: 'dd MMM yyyy' },
//       y: { formatter: value => `$${value.toFixed(2)}` },
//     },
//     title: {
//       text: `Stock Close Price Line Chart for ${selectedSymbol}`,
//       align: 'left',
//     },
//     colors: ['#34a853'],
//   };

//   return (
//     <div>
//       <h2>Stock Data Charts</h2>
//       <div>
//         <label htmlFor="symbol-select">Select Company Symbol: </label>
//         <select
//           id="symbol-select"
//           value={selectedSymbol}
//           onChange={(e) => setSelectedSymbol(e.target.value)}
//         >
//           <option value="">--Select a symbol--</option>
//           {symbols.map(symbol => (
//             <option key={symbol} value={symbol}>
//               {symbol}
//             </option>
//           ))}
//         </select>
//       </div>

//       {selectedSymbol && (
//         <>
//           <div>
//             <h3>Candlestick Chart</h3>
//             <ApexCharts
//               type="candlestick"
//               options={candlestickOptions}
//               series={candlestickSeries}
//               height={500}
//             />
//           </div>
//           <div>
//             <h3>Line Chart</h3>
//             <ApexCharts
//               type="line"
//               options={{
//                 ...lineOptions,
//                 stroke: {
//                   width: 2 // Set the width to your desired value
//                 }
//               }}
//               series={lineSeries}
//               height={500}
//             />
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default StockChart;

import React, { useState, useEffect } from 'react';
import ApexCharts from 'react-apexcharts';
import Papa from 'papaparse';

const StockChart = () => {
  const [candlestickSeries, setCandlestickSeries] = useState([]);
  const [lineSeries, setLineSeries] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BAJAJFINSV.NS');
  const [selectedChartType, setSelectedChartType] = useState('candlestick');
  const [selectedDateRange, setSelectedDateRange] = useState('1m');

  function replaceQuotes(str) {
    return str.replace(/'/g, '"');
  }

  const filterDataByDate = (data) => {
    const endDate = Date.now();
    let startDate;

    switch (selectedDateRange) {
      case '1d':
        startDate = endDate - 1 * 24 * 60 * 60 * 1000;
        break;
      case '5d':
        startDate = endDate - 5 * 24 * 60 * 60 * 1000;
        break;
      case '1w':
        startDate = endDate - 7 * 24 * 60 * 60 * 1000;
        break;
      case '1m':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        startDate = startDate.getTime();
        break;
      case '6m':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        startDate = startDate.getTime();
        break;
      case '1y':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate = startDate.getTime();
        break;
      default:
        startDate = endDate - 30 * 24 * 60 * 60 * 1000;
    }

    return data.filter(d => d.x >= startDate && d.x <= endDate);
  };

  const getXAxisLabelsFormat = () => {
    switch (selectedDateRange) {
      case '1d':
      case '5d':
      case '1w':
      case '1m':
        return 'dd MMM yyyy';
      case '6m':
      case '1y':
        return 'MMM yyyy';
      default:
        return 'MMM yyyy';
    }
  };

  useEffect(() => {
    Papa.parse('/NIFTY50stocks.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data;
        const uniqueSymbols = [...new Set(data.map(row => row.Symbol))];
        setSymbols(uniqueSymbols);
      },
    });
  }, []);

  useEffect(() => {
    if (selectedSymbol) {
      Papa.parse('/NIFTY50stocks.csv', {
        download: true,
        header: true,
        complete: (results) => {
          const data = results.data;
          const companyData = data.find(row => row.Symbol === selectedSymbol);

          if (companyData && companyData["Historical Data"]) {
            try {
              const historicalData = replaceQuotes(companyData["Historical Data"]);
              const parsedData = JSON.parse(historicalData);

              const timestamps = Object.keys(parsedData).map(timestamp => parseInt(timestamp) * 1000);

              let formattedData = timestamps.map(timestamp => {
                const dataPoint = parsedData[Math.floor(timestamp / 1000)];
                return {
                  x: timestamp,
                  y: [
                    dataPoint.Open,
                    dataPoint.High,
                    dataPoint.Low,
                    dataPoint.Close
                  ]
                };
              });

              formattedData = filterDataByDate(formattedData);

              setCandlestickSeries([{ name: 'Stock Price', data: formattedData }]);
              setLineSeries([{ name: 'Close Price', data: formattedData.map(d => ({ x: d.x, y: d.y[3] })) }]);

            } catch (error) {
              console.error("Error parsing JSON data:", error);
            }
          }
        },
      });
    }
  }, [selectedSymbol, selectedDateRange]);

  const candlestickOptions = {
    chart: {
      type: 'candlestick',
      height: 500,
      zoom: { enabled: true },
      toolbar: { show: true },
    },
    xaxis: {
      type: 'datetime',
      labels: { format: getXAxisLabelsFormat() },
      title: { text: 'Date' },
    },
    yaxis: {
      tooltip: { enabled: true },
      title: { text: 'Price' },
    },
    tooltip: {
      x: { format: 'dd MMM yyyy' },
      y: { formatter: value => `$${value.toFixed(2)}` },
    },
    title: {
      text: `Stock Candlestick Chart for ${selectedSymbol}`,
      align: 'left',
    },
    colors: ['#34a853'],
  };

  const lineOptions = {
    chart: {
      type: 'line',
      height: 500,
      zoom: { enabled: true },
      toolbar: { show: true },
    },
    xaxis: {
      type: 'datetime',
      labels: { format: getXAxisLabelsFormat() },
      title: { text: 'Date' },
    },
    yaxis: {
      title: { text: 'Close Price' },
    },
    tooltip: {
      x: { format: 'dd MMM yyyy' },
      y: { formatter: value => `$${value.toFixed(2)}` },
    },
    title: {
      text: `Stock Close Price Line Chart for ${selectedSymbol}`,
      align: 'left',
    },
    colors: ['#34a853'],
  };

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div style={{ flex: '3', paddingRight: '10px' }}>
        {selectedSymbol && (
          <>
            {selectedChartType === 'candlestick' && (
              <div>
                <h3>Candlestick Chart</h3>
                <ApexCharts
                  type="candlestick"
                  options={candlestickOptions}
                  series={candlestickSeries}
                  height={500}
                />
              </div>
            )}
            {selectedChartType === 'line' && (
              <div>
                <h3>Line Chart</h3>
                <ApexCharts
                  type="line"
                  options={{
                    ...lineOptions,
                    stroke: {
                      width: 2
                    }
                  }}
                  series={lineSeries}
                  height={500}
                />
              </div>
            )}
          </>
        )}
      </div>
      <div style={{ flex: '1', paddingLeft: '10px' }}>
        <h2>Stock Data Filters</h2>
        <div>
          <label htmlFor="symbol-select">Select Company Symbol: </label>
          <select
            id="symbol-select"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
          >
            <option value="">--Select a symbol--</option>
            {symbols.map(symbol => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="chart-type-select">Select Chart Type: </label>
          <select
            id="chart-type-select"
            value={selectedChartType}
            onChange={(e) => setSelectedChartType(e.target.value)}
          >
            <option value="candlestick">Candlestick</option>
            <option value="line">Line</option>
          </select>
        </div>

        <div>
          {/* <label htmlFor="date-range-select">Select Date Range: </label>
          <select
            id="date-range-select"
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
          >
            <option value="1d">1 Day</option>
            <option value="5d">5 Days</option>
            <option value="1w">1 Week</option>
            <option value="1m">1 Month</option>
            <option value="6m">6 Months</option>
            <option value="1y">1 Year</option>
          </select> */}
          {['1d', '5d', '1w', '1m', '6m', '1y'].map(range => (
      <button
        key={range}
        onClick={() => setSelectedDateRange(range)}
        style={{
          padding: '10px',
          marginRight: '10px',
          backgroundColor: selectedDateRange === range ? '#34a853' : '#f0f0f0',
          color: selectedDateRange === range ? '#fff' : '#000',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        {range === '1d' ? '1d' : 
         range === '5d' ? '5d' : 
         range === '1w' ? '1w' : 
         range === '1m' ? '1m' : 
         range === '6m' ? '6m' : 
         '1y'}
      </button>
    ))}

        </div>
      </div>
    </div>
  );
};

export default StockChart;

