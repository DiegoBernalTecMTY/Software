from __future__ import annotations

import time
import sys

sections = {
    "start": 0,
    "after_future": time.time(),
}

sections["after_imports_1"] = time.time()

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime, date, timedelta
import logging
import re

sections["after_imports_2"] = time.time()

from dotenv import load_dotenv

load_dotenv()

sections["after_dotenv"] = time.time()

logger = logging.getLogger(__name__)

import requests

sections["after_requests"] = time.time()

# Now try the problematic imports
try:
    from langchain_groq import ChatGroq
    sections["after_langchain_groq"] = time.time()
except Exception as e:
    sections["langchain_groq_error"] = str(e)
    sections["after_langchain_groq"] = time.time()

# Print timing
start = sections["start"]
for k, v in sorted(sections.items()):
    if isinstance(v, (int, float)):
        print(f"{k}: {v - start:.2f}s")
    else:
        print(f"{k}: {v}")
