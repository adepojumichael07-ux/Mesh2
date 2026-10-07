# MeshAlert

Offline-first emergency communication page for network blackout areas.

Open `index.html` in a browser (Chrome or Edge recommended so the service worker can cache the page).

## What it does
- Incident type dropdown
- Emergency number
- Location, with a GPS button
- Send stores the report on the device first
- Offline: report is marked for mesh relay
- Online: report is marked cloud synced
- Page still opens after the first visit if the network drops

This is a working front-end prototype. It does not place a real phone call or talk to nearby phones over Bluetooth. A field system would add BLE/Wi-Fi Direct peers and a responder cloud API.
