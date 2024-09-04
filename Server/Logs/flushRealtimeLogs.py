import os

with open(os.path.join("Server/Logs", "realtimeFetchLogs.log"), "r+") as logfile:
    logfile.truncate(0)
