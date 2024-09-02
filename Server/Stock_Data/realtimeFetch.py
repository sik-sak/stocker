import pandas as pd
import yfinance as yf
import datetime
import snowflake.connector
import os
from dotenv import load_dotenv

load_dotenv("snowflakecreds.env")

# Define the stock ticker and the market open/close times
ticker = "^NSEI"
market_open = datetime.time(9, 15)
market_close = datetime.time(15, 30)

snowflake_conn_params = {
    'user': os.getenv('SNOWFLAKE_USER'),
    'password': os.getenv('SNOWFLAKE_PASSWORD'),
    'account': os.getenv('SNOWFLAKE_ACCOUNT'),
    'warehouse': os.getenv('SNOWFLAKE_WAREHOUSE'),
    'database': os.getenv('SNOWFLAKE_DATABASE'),
    'schema': os.getenv('SNOWFLAKE_SCHEMA')
}

snowflake_table = os.getenv('SNOWFLAKE_TABLE')

# Define the Ticker object using yfinance
nifty50 = yf.Ticker(ticker)

# Function to fetch and update OHLC data in Snowflake
def fetch_and_update_data():
    # Establish connection to Snowflake
    conn = snowflake.connector.connect(**snowflake_conn_params)

    # Get the current time in IST
    now_ist = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))

    # Define the start and end times
    if now_ist.time() >= market_close:
        data = nifty50.history(period="1d", interval="1m")
        print("Fetching all data")
    else:
        end_time = now_ist
        start_time = end_time - datetime.timedelta(minutes=5)
        data = nifty50.history(interval="1m", start=start_time, end=end_time)
        print("Fetching past 5 minutes data")
    

    if not data.empty:
        # Keep only the OHLC columns and reset the index to work with time
        data = data[['Open', 'High', 'Low', 'Close']]
        data.index = data.index.time  # Store only the time part of the index

        # Insert/update data in Snowflake
        with conn.cursor() as cursor:
            for time_index in data.index:
                row = data.loc[time_index]
                cursor.execute(f"""
                    UPDATE {snowflake_table}
                    SET Open = {round(row['Open'], 2)}, High = {round(row['High'], 2)}, Low = {round(row['Low'], 2)}, Close = {round(row['Close'], 2)}
                    WHERE Timestamp = '{time_index}'
                """)

    print("Database updated")
    # Close the connection
    conn.close()

# Run the function to fetch and update data
fetch_and_update_data()
