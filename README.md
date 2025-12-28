# DocuScan – Document Scanner & Search Desk (Demo)

DocuScan ist eine Fullstack-App zum Erfassen (Scan/Upload), Speichern und schnellen Wiederfinden von Dokumenten inkl. PDF-Preview und Metadatenpflege – optimiert für kleine Teams (2–5 Nutzer).

> ⚠️ Dieses Repository ist eine **Dummy-/Demo-Version** für Portfolio & Interviews.  
> Alle Daten (Kunden, Verträge, PDFs) sind **synthetisch** und enthalten **keine echten personenbezogenen Informationen**.

---

## Features

- Login mit Cookie-Auth + CSRF-Handshake
- Dashboard: Kundensuche + schnelle Navigation
- Kunden-Detail: Dokumentliste, Status, Metadaten bearbeiten
- PDF Preview + Download
- (Optional/Geplant) OCR/Extraktion & Volltextsuche

---

## Screenshots
> Füge hier 3–6 Screenshots ein (Login, Dashboard, Customer Detail, PDF Preview).
- `docs/screens/login.png`
- `docs/screens/dashboard.png`
- `docs/screens/customer-detail.png`

---

## Demo (optional)
**Demo Login (Dummy):**
- User: `demo`
- Passwort: `demo1234`

---

## Architektur (kurz)

Frontend (Angular 21) → Backend (Django REST Framework) → SQLite (Metadaten)  
Dokument-Dateien: lokal im Dev-Setup (MEDIA_ROOT), in Produktion optional S3/Storage.

Datenfluss:
1) Upload/Scan → Backend speichert Datei + Metadaten  
2) UI listet Dokumente pro Kunde  
3) PDF wird über `/file/` gestreamt/gedownloadet  
4) Metadaten-Änderungen via `PATCH`

---

## Tech Stack

### Frontend
- Angular 21 (standalone components + signals)
- Tailwind CSS v4
- RxJS
- ngx-extended-pdf-viewer

### Backend
- Django + Django REST Framework
- SQLite (Dev/Demo)
- Session/Cookie Auth + CSRF
- (Optional) django-cors-headers, drf-spectacular

---

## Projektstruktur

