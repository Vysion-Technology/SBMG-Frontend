#!/usr/bin/env python3
"""
Extract images, icons, and logos from Figma design.
Exports logos/icons as SVG, images as PNG.
"""
import json
import os
import re
import urllib.request
import urllib.parse

FILE_KEY = "6wGbZHesOn5qBiWy8TYVlY"
TOKEN = os.environ.get("FIGMA_API_KEY", "")
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets")
BASE_URL = f"https://api.figma.com/v1/images/{FILE_KEY}"

# Unique nodes: (node_id, display_name, format, subfolder)
# Format: svg for vector icons/logos, png for raster images
ASSETS = [
    # Logos (SVG when vector, PNG when bitmap)
    ("1:10494", "logo-sbmg", "svg", "logos"),  # Logo GROUP
    ("1:10495", "logo-rectangle", "png", "logos"),  # Rectangle 2 - logo image
    ("2:863", "logo-sbmg-alt", "svg", "logos"),  # Logo GROUP alternate
    # Header/hero images (PNG)
    ("96:2164", "image-header-1", "png", "images"),
    ("96:2815", "image-header-2", "png", "images"),
    ("107:7101", "image-2", "png", "images"),
    ("96:2023", "frame-header", "png", "images"),  # Frame 1814109087
    # Scheme/event photos (PNG)
    ("1:11912", "scheme-event-photo", "png", "images"),
    ("96:3722", "scheme-event-photo-2", "png", "images"),
    # Avatar placeholder (PNG)
    ("I1:10490;324:7268", "avatar-placeholder", "png", "images"),
    # Complaints legend icons (SVG)
    ("1:11378", "complaints-legend-total-icon", "svg", "icons"),
    ("1:11382", "complaints-legend-closed-icon", "svg", "icons"),
    ("1:11386", "complaints-legend-open-icon", "svg", "icons"),
    # Generic icons - pick one instance of each type (SVG)
    ("1:11344", "icon-progress", "svg", "icons"),
    ("1:11883", "icon-top3", "svg", "icons"),
    ("1:10243", "icon-generic", "svg", "icons"),
    ("5:8579", "icon-nav-1", "svg", "icons"),
    ("5:8645", "icon-nav-2", "svg", "icons"),
    ("5:8707", "icon-nav-3", "svg", "icons"),
    ("5:8819", "icon-nav-4", "svg", "icons"),
    ("96:3276", "content-text-icon", "svg", "icons"),
]


def sanitize_filename(name):
    """Convert to safe filename."""
    s = re.sub(r"[^\w\-.]", "-", name)
    return re.sub(r"-+", "-", s).strip("-").lower() or "asset"


def fetch_export_urls(node_ids, fmt):
    """Get Figma export URLs for given node IDs."""
    ids_param = urllib.parse.quote(",".join(node_ids), safe="")
    url = f"{BASE_URL}?ids={ids_param}&format={fmt}&scale=2"
    req = urllib.request.Request(url, headers={"X-Figma-Token": TOKEN})
    with urllib.request.urlopen(req) as resp:
        data = json.load(resp)
    if data.get("err"):
        raise RuntimeError(f"Figma API error: {data['err']}")
    return data.get("images", {})


def download_file(url, dest_path):
    """Download URL to file."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        with open(dest_path, "wb") as f:
            f.write(resp.read())
    return dest_path


def main():
    if not TOKEN:
        print("Set FIGMA_API_KEY environment variable")
        return 1

    results = []
    # Group by format to batch API calls
    by_format = {}
    for node_id, name, fmt, subfolder in ASSETS:
        by_format.setdefault(fmt, []).append((node_id, name, subfolder))

    for fmt, items in by_format.items():
        node_ids = [x[0] for x in items]
        urls = fetch_export_urls(node_ids, fmt)
        ext = fmt
        for node_id, name, subfolder in items:
            url = urls.get(node_id)
            if not url:
                print(f"  [skip] {name} ({node_id}) - no URL")
                continue
            fname = f"{sanitize_filename(name)}.{ext}"
            dest = os.path.join(ASSETS_DIR, subfolder, fname)
            download_file(url, dest)
            rel = os.path.relpath(dest, os.path.dirname(ASSETS_DIR))
            results.append(rel)
            print(f"  [ok] {rel}")

    # Summary
    print("\n--- Extracted assets ---")
    for r in sorted(results):
        print(r)
    return 0


if __name__ == "__main__":
    exit(main())
