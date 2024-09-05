import pandas as pd
import yfinance as yf
import datetime
import snowflake.connector
import os
import logging
import json

logging.basicConfig(
    filename=os.path.join("Server/Logs", "realtimeFetchLogs.log"),
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

with open(os.path.join("Server/Data_Files", "last_run.json"), "r") as jsonFile:
    jsonData = json.load(jsonFile)

last_run = jsonData['last_updated_at']

# Defining IST timezone
IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

# Define the stock ticker and the market open/close times
ticker = "^NSEI"
market_open = datetime.datetime.combine(datetime.date.today(), datetime.time(9, 15), IST)
market_close = datetime.datetime.combine(datetime.date.today(), datetime.time(15, 30), IST)

snowflake_conn_params = {
    'user': os.getenv('SNOWFLAKE_USER'),
    'password': os.getenv('SNOWFLAKE_PASSWORD'),
    'account': os.getenv('SNOWFLAKE_ACCOUNT'),
    'warehouse': os.getenv('SNOWFLAKE_WAREHOUSE'),
    'database': os.getenv('SNOWFLAKE_DATABASE'),
    'schema': os.getenv('SNOWFLAKE_SCHEMA_REALTIME')
}

snowflake_table = os.getenv('SNOWFLAKE_TABLE_REALTIME')

nifty50 = yf.Ticker(ticker)

def fetch_and_update_data():
    """
    Fetches OHLC (Open, High, Low, Close) data for NIFTY50 and updates it in the Snowflake database.

    This function connects to the Snowflake database and fetches either all the data for the current day or just the last 5 minutes of data based on the current time in IST. The fetched data is then updated in the Snowflake database.

    Workflow:
    1. Establishes a connection to Snowflake using the provided connection parameters.
    2. Fetches the current time in IST.
    3. Determines whether to fetch the entire day's data or just the last 5 minutes based on the current time relative to the market close time.
    4. If data is fetched, it is processed to retain only the OHLC values and update the corresponding entries in the Snowflake table.
    5. The connection to Snowflake is closed after updating the database.

    Parameters:
    None

    Returns:
    None

    Raises:
    Exception: Any issues related to Snowflake connection, data fetching, or SQL execution will be caught and logged.
    """
    # Establish connection to Snowflake
    conn = snowflake.connector.connect(**snowflake_conn_params)

    # Get the current time in IST
    now_ist = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))

    # Define the start and end times
    if not last_run or datetime.strptime(last_run, "%Y-%m-%d %H:%M:%S").date() < now_ist.date():
        data = nifty50.history(interval="1m", start=market_open, end=now_ist)
        logging.info(f"First run - {now_ist.time().strftime('%H:%M:%S')} - Fetching data from {market_open.time()} to {now_ist.time().strftime('%H:%M:%S')}")
        jsonData['last_updated_at'] = now_ist.strftime('%Y-%m-%d %H:%M:%S')
    else:
        fetch_time = market_open + datetime.timedelta(minutes=5)
        if now_ist.time() < fetch_time.time():
            pass
        elif fetch_time.time() <= now_ist.time() <= market_close.time():
            end_time = now_ist
            data = nifty50.history(interval="1m", start=last_run.strptime("%Y-%m-%d %H:%M:%S"), end=end_time)
            logging.info(f"Timestamp - {end_time.strftime('%Y-%m-%d %H:%M:%S')} - Data fetched from {last_run} to {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
            jsonData['last_updated_at'] = end_time.strftime('%Y-%m-%d %H:%M:%S')
        else:
            if last_run > market_close.strftime('%Y-%m-%d %H:%M:%S'):
                logging.info(f"Last run at {last_run}. Skipping data load")
                quit()
            else:
                data = nifty50.history(period="1d", interval="1m")
                logging.info(f"Timestamp - {now_ist.time().strftime('%H:%M:%S')} - Fetching all data")
                jsonData['last_updated_at'] = now_ist.strftime('%Y-%m-%d %H:%M:%S')

    with open(os.path.join("Server/Data_Files", "last_run.json"), "w") as jsonFile:
        json.dump(jsonData, jsonFile, indent=4)    

    if not data.empty:
        # Keep only the OHLC columns and reset the index to work with time
        data = data[['Open', 'High', 'Low', 'Close']]
        data.index = data.index.time  # Store only the time part of the index

        # Insert/update data in Snowflake
        try:
            with conn.cursor() as cursor:
                for time_index in data.index:
                    row = data.loc[time_index]
                    cursor.execute(f"""
                        UPDATE {snowflake_table}
                        SET Open = {float(round(row['Open'], 2))}, High = {float(round(row['High'], 2))}, Low = {float(round(row['Low'], 2))}, Close = {float(round(row['Close'], 2))}, updated_at = '{now_ist.strftime('%Y-%m-%d %H:%M:%S')}'
                        WHERE Timestamp = '{time_index}'
                    """)
        except Exception as e:
            logging.error(f"Failed to update data for {time_index}: {e}")

    logging.info(f"Timestamp - {now_ist.time()} - Database updated")
    # Close the connection
    conn.close()

# Run the function to fetch and update data
fetch_and_update_data()
