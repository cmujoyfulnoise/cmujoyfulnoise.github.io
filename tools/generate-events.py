#!/usr/bin/env python3
"""Generate the marked event list in events.html from assets/events.json.

Edit the JSON, then run from the repository root:
    python3 tools/generate-events.py        # write updated event rows
    python3 tools/generate-events.py --check  # check only; exit 1 if stale

Example event object to add to assets/events.json:
{
    "title": "Fall Concert",
    "startDate": "2026-11-21",
    "endDate": "2026-11-22", # Optional, doing this will make the displayed date a range.
    "time": "7:00 PM",
    "location": "Porter 100",
    "description": "Join us for our fall concert!",
    "accent": "green",
    "links": [
        {"label": "More info", "href": "https://example.com"}
    ],
    "button": {
        "label": "Buy tickets",
        "href": "https://example.com/tickets",
        "variant": "outline"
    }
}
Dates use YYYY-MM-DD. Accent values are "green" or "gold"; button variants
are "outline", "solid", or "outline-light". Links and buttons accept http(s),
mailto, or relative URLs.

Only the content between <!-- EVENTS:START --> and <!-- EVENTS:END --> is replaced.
"""

import html
import json
import sys
from datetime import date
from pathlib import Path
from typing import Dict, Mapping, Optional, Set, Tuple, Union
from urllib.parse import urlsplit

ROOT: Path = Path(__file__).resolve().parents[1]
DATA_FILE: Path = ROOT / "assets" / "events.json"
HTML_FILE: Path = ROOT / "events.html"
START = "<!-- EVENTS:START -->"
END = "<!-- EVENTS:END -->"

BUTTON_CLASSES: Dict[str, str] = {
    "outline": "btn-outline",
    "solid": "btn-solid",
    "outline-light": "btn-outline-light",
}
ACCENTS: Set[str] = {"green", "gold"}

CALENDAR_ICON: str = (
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path '
    'd="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 '
    '2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2zm12 8H5v10h14z"/></svg>'
)
LOCATION_ICON: str = (
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path '
    'd="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 '
    '7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 '
    '0 1 0 5z"/></svg>'
)


def required_text(item: Mapping[str, object], field: str, index: Union[int, str]) -> str:
    """Return a required event field as trimmed, non-empty text."""
    value = item.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Event {index}: '{field}' must be a non-empty string")
    return value.strip()


def parse_date(value: object, field: str, index: Union[int, str]) -> date:
    """Parse a strict ISO date and identify invalid event fields clearly."""
    if not isinstance(value, str):
        raise ValueError(f"Event {index}: '{field}' must use YYYY-MM-DD format")
    try:
        parsed = date.fromisoformat(value)
    except ValueError as error:
        raise ValueError(f"Event {index}: invalid '{field}' date: {value}") from error
    if parsed.isoformat() != value:
        raise ValueError(f"Event {index}: '{field}' must use YYYY-MM-DD format")
    return parsed


def safe_url(value: object, label: str) -> str:
    """Validate a link target before placing it in generated HTML."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{label}: URL must be a non-empty string")
    value = value.strip()
    if any(ord(char) < 32 for char in value) or value.startswith("//"):
        raise ValueError(f"{label}: invalid URL: {value}")
    # Only allow URL schemes that are safe to render as links.
    parts = urlsplit(value)
    if parts.scheme and parts.scheme not in {"http", "https", "mailto"}:
        raise ValueError(f"{label}: unsupported URL scheme: {parts.scheme}")
    if parts.scheme in {"http", "https"} and not parts.netloc:
        raise ValueError(f"{label}: URL must include a host")
    return value


def date_label(start: date, end: Optional[date]) -> Tuple[str, str]:
    """Format a single date or date range for the event calendar badge."""
    if not end:
        return start.strftime("%b"), str(start.day)
    if start.year == end.year and start.month == end.month:
        return start.strftime("%b"), f"{start.day}-{end.day}"
    month = f"{start:%b}-{end:%b}"
    if start.year != end.year:
        month = f"{start:%b} {start.year}-{end:%b} {end.year}"
    return month, f"{start.day}-{end.day}"


def render_link(label: str, href: object, class_name: str) -> str:
    """Build an escaped HTML link with a validated destination."""
    label = html.escape(label)
    href = html.escape(safe_url(href, f"Link '{label}'"), quote=True)
    return f'<a class="{class_name}" href="{href}">{label}</a>'


def render_event(item: object, index: int) -> str:
    """Render one event record as an HTML row after validating its fields."""
    if not isinstance(item, dict):
        raise ValueError(f"Event {index}: each event must be an object")

    title = html.escape(required_text(item, "title", index))
    time = html.escape(required_text(item, "time", index))
    location = html.escape(required_text(item, "location", index))
    description = html.escape(required_text(item, "description", index))
    start = parse_date(item.get("startDate"), "startDate", index)
    end = parse_date(item["endDate"], "endDate", index) if item.get("endDate") is not None else None
    if end and end < start:
        raise ValueError(f"Event {index}: endDate must not be before startDate")

    month, day = date_label(start, end)
    accent = item.get("accent")
    if accent is not None and (not isinstance(accent, str) or accent not in ACCENTS):
        raise ValueError(f"Event {index}: accent must be one of {', '.join(sorted(ACCENTS))}")
    accent_attr = f' data-accent="{accent}"' if accent else ""

    row = [f'    <div class="event-row reveal"{accent_attr}>']
    row.extend([
        f'      <div class="event-date"><span class="month">{html.escape(month)}</span>',
        f'        <span class="day">{html.escape(day)}</span></div>',
        '      <div class="event-main">',
        f'        <h3>{title}</h3>',
        '        <div class="event-meta">',
        f'          <span>{CALENDAR_ICON}{time}</span>',
        f'          <span>{LOCATION_ICON}{location}</span>',
        '        </div>',
        f'        <p>{description}</p>',
    ])

    links = item.get("links", [])
    if not isinstance(links, list):
        raise ValueError(f"Event {index}: 'links' must be a list")
    if links:
        row.append('        <div class="event-links">')
        for link_index, link in enumerate(links, start=1):
            if not isinstance(link, dict):
                raise ValueError(f"Event {index}, link {link_index}: expected an object")
            label = required_text(link, "label", f"{index}, link {link_index}")
            row.append(f'          {render_link(label, link.get("href"), "inline-link")}')
        row.append('        </div>')

    row.append('      </div>')
    button = item.get("button")
    if button is not None:
        if not isinstance(button, dict):
            raise ValueError(f"Event {index}: 'button' must be an object")
        label = required_text(button, "label", index)
        variant = button.get("variant", "outline")
        if not isinstance(variant, str) or variant not in BUTTON_CLASSES:
            raise ValueError(f"Event {index}: unsupported button variant: {variant}")
        row.append(f'      {render_link(label, button.get("href"), f"btn {BUTTON_CLASSES[variant]} event-cta")}')
    row.append('    </div>')
    return "\n".join(row)


def main() -> int:
    """Load event data and update only the marked section of events.html."""
    check_only = "--check" in sys.argv[1:]
    unknown = set(sys.argv[1:]) - {"--check"}
    if unknown:
        raise ValueError(f"Unknown option: {sorted(unknown)[0]}")

    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    events = data.get("events") if isinstance(data, dict) else None
    if not isinstance(events, list):
        raise ValueError("events.json must contain an 'events' array")
    rendered = "\n\n".join(render_event(event, index) for index, event in enumerate(events, 1))

    original = HTML_FILE.read_bytes().decode("utf-8")
    if original.count(START) != 1 or original.count(END) != 1:
        raise ValueError("events.html must contain exactly one EVENTS:START and EVENTS:END marker")
    start_at = original.index(START) + len(START)
    marker_at = original.index(END)
    end_line = original.rfind("\n", start_at, marker_at) + 1
    end_indent = original[end_line:marker_at]
    if end_indent.strip():
        raise ValueError("EVENTS:END must be on its own line")
    if marker_at <= start_at:
        raise ValueError("events.html event markers are out of order")

    # Keep all page content outside the explicit event markers unchanged.
    updated = original[:start_at] + "\n" + rendered + "\n" + end_indent + original[marker_at:]
    if updated == original:
        print("events.html is up to date.")
    elif check_only:
        print("events.html needs updating. Run: python3 tools/generate-events.py")
        return 1
    else:
        HTML_FILE.write_bytes(updated.encode("utf-8"))
        print(f"Rendered {len(events)} event(s) into events.html.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, json.JSONDecodeError, ValueError) as error:
        sys.exit(f"Error: {error}")