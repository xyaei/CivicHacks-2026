import os
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

# Use certifi's CA bundle so TLS validation succeeds on macOS/Linux
client = MongoClient(MONGODB_URI, tlsCAFile=certifi.where())
# Names must match the cluster: database = "bailinfo", collection = "cases"
db = client["bailinfo"]
bail_collection = db["cases"]
