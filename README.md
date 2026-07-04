# WNY Traffic Wall

A small static traffic camera wall for U.S.-side public commuter cameras around
Buffalo, Niagara Falls, and surrounding suburbs.

The dashboard intentionally excludes Canada, raw IP-camera links, and cameras
that only appear in sketchy IP-camera directories. It loads official active U.S.
camera records from NITTEC and uses their public thumbnails and HLS streams.

## Use

Open `index.html` in a browser, or serve the folder with any static web server.
The wall shows official thumbnails and refreshes them every 15 seconds. NITTEC
does not reliably cold-load individual camera modals from a URL, so the dashboard
keeps one global NITTEC link and shows the NITTEC camera ID on each card.

## Sources

- NITTEC: https://www.nittec.org/cameras/
- NITTEC public data feed: https://www.nittec.org/content/json/nittec.js
- NYSTA/Thruway cameras appear in the NITTEC feed with NYSTA agency labels.

## Notes

Many NITTEC/NYSTA cameras expose live HLS video streams, but those streams were
unreliable when embedded directly in this static page. The dashboard therefore
uses official auto-refreshing thumbnails and links to NITTEC for live playback.
