import yfinance as yf
import pandas as pd
import snowflake.connector
import os
import datetime
import logging

# logging.basicConfig(
#     filename=os.path.join("Server/Logs", "historicalUpdateLogs.log"),
#     level=logging.INFO,
#     format='%(asctime)s - %(levelname)s - %(message)s'
# )

snowflake_conn_params = {
    'user': os.getenv('SNOWFLAKE_USER'),
    'password': os.getenv('SNOWFLAKE_PASSWORD'),
    'account': os.getenv('SNOWFLAKE_ACCOUNT'),
    'warehouse': os.getenv('SNOWFLAKE_WAREHOUSE'),
    'database': os.getenv('SNOWFLAKE_DATABASE'),
    'schema': os.getenv('SNOWFLAKE_SCHEMA_HISTORICAL')
}

conn = snowflake.connector.connect(**snowflake_conn_params)
logging.info("Connection established with snowflake")

snowflake_table = os.getenv('SNOWFLAKE_TABLE_HISTORICAL')

updated_at = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).strftime("%Y-%m-%d %H:%M:%S")

query_hd = f"""
    UPDATE {snowflake_table}
    SET
        company_name = %s,
        current_price = %s,
        market_capital = %s,
        pe_ratio = %s,
        dividend_yield = %s,
        historical_data = %s,
        updated_at = '{updated_at}'
    WHERE symbol = %s
"""

query_nhd = f"""
    UPDATE {snowflake_table}
    SET
        company_name = %s,
        current_price = %s,
        market_capital = %s,
        pe_ratio = %s,
        dividend_yield = %s,
        updated_at = '{updated_at}'
    WHERE symbol = %s
"""

def format_market_cap(market_cap):
    """
    Converts a market capitalization value into a human-readable string in the Indian numbering format.

    This function formats the market capitalization into units such as Lakhs (L) and Crores (Cr) based on the size of the input value.

    Parameters:
    market_cap (int or float): The market capitalization value to be formatted.

    Returns:
    str: A string representing the formatted market capitalization.
         - Below 1,00,000: Returns "Rs. {market_cap}"
         - Between 1,00,000 and 1,00,00,000: Returns "{value} L"
         - Above 1,00,00,000: Returns "{value} Cr"
         If the input is None or empty, an empty string is returned.
    """
    if market_cap:
        if market_cap < 1_00_000:
            return f"{market_cap}"
        elif market_cap < 1_00_00_000:
            return f"{market_cap / 1_00_000:.2f} L"
        else:
            return f"{market_cap / 1_00_00_000:.2f} Cr"
    else:
        return ""
    
def current_price(instrument):
    """
    Fetches the current price of a given financial instrument.

    This function retrieves the most recent closing price for the specified instrument using the Yahoo Finance API.

    Parameters:
    instrument (str): The ticker symbol of the financial instrument.

    Returns:
    float: The most recent closing price of the instrument, rounded to three decimal places.
    """
    data = yf.Ticker(instrument).history(period="1d", interval="1m")
    return round(data["Close"].iloc[-1], 3)

def fetch_data(symbol):
    """
    Fetches real-time and historical data for a given stock symbol.

    This function collects various details such as the company name, current price, market capitalization, P/E ratio, dividend yield, and historical price data for the past year.

    Parameters:
    symbol (str): The ticker symbol of the stock.

    Returns:
    dict: A dictionary containing the fetched data, including:
        - "Symbol": The ticker symbol.
        - "Company Name": The full name of the company.
        - "Current Price": The latest closing price.
        - "Market Cap": The formatted market capitalization.
        - "PE Ratio": The forward P/E ratio.
        - "Dividend Yield": The dividend yield percentage.
        - "Historical Data": A nested dictionary of historical price data keyed by Unix timestamp.
    """
    newData = {}
    data = {}
    ticker = yf.Ticker(symbol)
    
    # Fetch real-time data
    real_time_data = ticker.info

    data["Symbol"] = symbol
    data["Company Name"] = ticker.info.get('longName', 'NULL')
    data["Current Price"] = current_price(symbol)
    data["Market Cap"] = format_market_cap(real_time_data.get('marketCap', None))
    data["PE Ratio"] = real_time_data.get('forwardEps', None)
    data["Dividend Yield"] = real_time_data.get('dividendYield', None)
    
    # Fetch historical data
    hist_data = ticker.history(period="1y")  # Fetch last 1 year of data
    if not hist_data.empty:
        tsList = list(hist_data["Open"].keys())
        for i in tsList:
            key = str(int(i.timestamp()))
            newData[key] = {}
            newData[key]["Open"] = round(hist_data["Open"][i], 2)
            newData[key]["High"] = round(hist_data["High"][i], 2)
            newData[key]["Low"] = round(hist_data["Low"][i], 2)
            newData[key]["Close"] = round(hist_data["Close"][i], 2)
            data['Historical Data'] = newData
    else:
        data['Historical Data'] = None
    

    
    return data

def replace_quotes(string):
    """
    Replaces single quotes with double quotes in a string.

    This function is useful for converting JSON-like strings that use single quotes to standard JSON format with double quotes.

    Parameters:
    string (str): The input string where single quotes need to be replaced.

    Returns:
    str: The modified string with single quotes replaced by double quotes.
    """
    return string.replace("'", '"')

def upload(symbol, companyName, currentPrice, marketCap, pe_ratio, dividend_yield, historical_data):
    """
    Updates the stock data in the Snowflake database.

    This function updates the current price, market capitalization, P/E ratio, dividend yield, and historical data for a given stock symbol in the database.

    Parameters:
    symbol (str): The ticker symbol of the stock.
    companyName (str): The full name of the company.
    currentPrice (float): The current stock price.
    marketCap (str): The formatted market capitalization.
    pe_ratio (float or None): The forward P/E ratio.
    dividend_yield (float or None): The dividend yield percentage.
    historical_data (dict): A dictionary containing historical price data.

    Returns:
    None

    Raises:
    Exception: If the database update fails, the exception is caught and an error message is printed.
    """
    if historical_data:
        try:
            conn.cursor().execute(query_hd, (
                "companyName",
                0.00,
                "marketCap",
                0.00,
                0.00,
                "Updated",
                #replace_quotes(str(historical_data)),
                symbol
            ))
        except Exception as e:
            logging.error(f"Failed to update data for {stock}: {e}")
    else:
        try:
            conn.cursor().execute(query_nhd, (
                "companyName",
                0.00,
                0.00,
                0.00,
                0.00,
                symbol
            ))
        except Exception as e:
            logging.error(f"Failed to update data for {stock}: {e}")

    conn.commit()
    

# Read stock tickers from stock file and process them
with open(os.path.join('Server/Data_Files', 'stock_list.txt'), 'r') as file:
    for line in file:
        stock = line.strip()  # Read each line and strip whitespace
        if not stock:  # Skip empty lines
            continue
        stock_data = fetch_data(stock+'.NS')
        upload(stock_data["Symbol"], stock_data["Company Name"], stock_data["Current Price"], stock_data["Market Cap"], stock_data["PE Ratio"], stock_data["Dividend Yield"], stock_data["Historical Data"])
        
        
# Close the connection
conn.close()