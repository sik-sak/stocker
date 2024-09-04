import React, { useState, useEffect } from 'react';
import ApexCharts from 'react-apexcharts';
import Papa from 'papaparse';
import Card from '../Components/Card';
import './StockChart.css';

const StockChart = () => {
  const [candlestickSeries, setCandlestickSeries] = useState([]);
  const [lineSeries, setLineSeries] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BAJAJFINSV.NS');
  const [selectedChartType, setSelectedChartType] = useState('candlestick');
  const [selectedDateRange, setSelectedDateRange] = useState('1m');

  const [currentPrice, setCurrentPrice] = useState('');
  const [marketCap, setMarketCap] = useState('');
  const [dividendYield, setDividendYield] = useState('');
  const [peRatio, setPeRatio] = useState('');


  const replaceQuotes = (str) => str.replace(/'/g, '"');

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

              setCurrentPrice(companyData['Current Price'] || 'N/A');
              setMarketCap(companyData['Market Cap'] || 'N/A'); // Example field
              setDividendYield(companyData['Dividend Yield'] || 'N/A'); // Example field
              setPeRatio(companyData['PE Ratio'] || 'N/A'); 

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
      zoom: { enabled: false },
      toolbar: { show: false },
  
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
      zoom: { enabled: false },
      toolbar: { show: false },
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
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <Card title="Current Price" value={`$${currentPrice}`} />
          <Card title="Market Cap" value={marketCap} />
          <Card title="Dividend Yield" value={`${dividendYield}%`} />
          <Card title="P/E Ratio" value={peRatio} />
      </div>

        {selectedSymbol && (
          <>
            {selectedChartType === 'candlestick' && (
              <div>
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
                <ApexCharts
                  type="line"
                  options={{
                    ...lineOptions,
                    stroke: { width: 2 },
                  }}
                  series={lineSeries}
                  height={500}
                />
              </div>
            )}
          </>
        )}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ marginBottom: '10px' }}>
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
                {range}
              </button>
            ))}
          </div>
          <div>
            {selectedChartType === 'candlestick' && (
              <button
                onClick={() => setSelectedChartType('line')}
                style={{
                  padding: '9px 11px',
                  marginRight: '10px',
                  border: '1px solid gainsboro',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 23 12" height="18" width="18">
                  <path stroke="#00B386" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.16" d="m1.4 5.212 3.732 4.183 3.603-4.713 4.045 5.913 5.3-9.395 3.212 6.299" />
                </svg>
              </button>
            )}
            {selectedChartType === 'line' && (
              <button
                onClick={() => setSelectedChartType('candlestick')}
                style={{
                  padding: '9px 11px',
                  marginRight: '10px',
                  border: '1px solid gainsboro',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="18" width="18">
                  <rect width="2.16" height="12.96" x="6.72" y="6.72" fill="#EB5B3C" rx="1.08" />
                  <rect width="2.16" height="12.96" x="15.36" y="8.16" fill="#EB5B3C" rx="1.08" />
                  <rect width="2.16" height="10.08" x="11.04" y="2.4" fill="#00B386" rx="1.08" />
                  <rect width="2.16" height="5.76" x="19.68" y="5.28" fill="#00B386" rx="1.08" />
                  <rect width="2.16" height="8.64" x="2.4" y="3.84" fill="#00B386" rx="1.08" />
                </svg>
              </button>
            )}
          </div>
        </div>
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
      </div>
    </div>
  );
};

export default StockChart;
