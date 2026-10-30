"""
Utility script to generate large-scale benchmark datasets (up to 1,000,000 US phone numbers).
Supports CSV, TXT, and XLSX formats.
"""
import os
import sys
import random
import csv
import argparse

AREA_CODES = [
    # California
    "209", "213", "310", "323", "408", "415", "510", "530", "559", "619", "626", "650", "661", "707", "714", "760", "805", "818", "831", "858", "909", "916", "925", "949", "951",
    # New York
    "212", "315", "516", "518", "585", "607", "631", "646", "716", "718", "845", "914", "917", "929",
    # Texas
    "210", "214", "254", "281", "325", "361", "409", "430", "432", "469", "512", "682", "713", "737", "806", "817", "830", "832", "903", "915", "936", "940", "956", "972", "979",
    # Florida
    "239", "305", "321", "352", "386", "407", "561", "727", "772", "786", "813", "850", "863", "904", "941", "954",
    # Illinois
    "217", "224", "309", "312", "331", "618", "630", "708", "773", "815", "847", "872",
    # Toll-Free
    "800", "888", "877", "866", "855", "844", "833"
]

FORMATS = [
    lambda a, p, s: f"({a}) {p}-{s}",
    lambda a, p, s: f"+1{a}{p}{s}",
    lambda a, p, s: f"1-{a}-{p}-{s}",
    lambda a, p, s: f"{a}.{p}.{s}",
    lambda a, p, s: f"{a}{p}{s}",
]

def generate_numbers(count: int, output_file: str):
    print(f"Generating {count:,} US phone numbers to {output_file}...")
    ext = os.path.splitext(output_file)[1].lower()

    if ext == ".csv":
        with open(output_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Phone Number", "Record ID", "Tag"])
            for i in range(1, count + 1):
                # 90% valid, 10% invalid
                if random.random() < 0.90:
                    area = random.choice(AREA_CODES)
                    prefix = random.randint(200, 998)
                    subscriber = f"{random.randint(0, 9999):04d}"
                    fmt_fn = random.choice(FORMATS)
                    phone = fmt_fn(area, prefix, subscriber)
                else:
                    # Invalid number
                    phone = random.choice([
                        f"0{random.randint(10, 99)}-{random.randint(200, 999)}-{random.randint(1000, 9999)}",
                        f"123-456-{random.randint(1000, 9999)}",
                        f"{random.randint(1000, 99999)}",
                        f"999-{random.randint(200, 999)}-{random.randint(1000, 9999)}"
                    ])

                writer.writerow([phone, f"REC-{i:07d}", "benchmark"])
                if i % 100000 == 0:
                    print(f"  ...generated {i:,} / {count:,} records")

    elif ext == ".txt":
        with open(output_file, "w", encoding="utf-8") as f:
            for i in range(1, count + 1):
                area = random.choice(AREA_CODES)
                prefix = random.randint(200, 998)
                subscriber = f"{random.randint(0, 9999):04d}"
                fmt_fn = random.choice(FORMATS)
                phone = fmt_fn(area, prefix, subscriber)
                f.write(f"{phone}\n")
                if i % 100000 == 0:
                    print(f"  ...generated {i:,} / {count:,} records")

    print(f"Successfully generated {count:,} records in {output_file}!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate large-scale benchmark US phone numbers")
    parser.add_argument("--count", type=int, default=1000, help="Number of records to generate (e.g. 1000, 50000, 1000000)")
    parser.add_argument("--output", type=str, default="sample_benchmark.csv", help="Output file path (.csv or .txt)")
    args = parser.parse_args()

    generate_numbers(args.count, args.output)
