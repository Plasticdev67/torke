---
status: testing
phase: 04-portals-marketing-polish
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md]
started: 2026-03-05T10:45:00Z
updated: 2026-03-05T10:45:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Certifications Tab & Search
expected: |
  Navigate to /account while logged in. A tab bar shows Dashboard, Orders, Addresses, Certifications. Click Certifications. You see a search form with fields for order number, batch ID, product code, and date range. Enter a search term and submit. Matching orders appear in a results list.
awaiting: user response

## Tests

### 1. Certifications Tab & Search
expected: Navigate to /account while logged in. A tab bar shows Dashboard, Orders, Addresses, Certifications. Click Certifications. You see a search form with fields for order number, batch ID, product code, and date range. Enter a search term and submit. Matching orders appear in a results list.
result: [pending]

### 2. Individual Cert Download
expected: On the certifications page, expand an order row. You see per-allocation line items with batch IDs. Each allocation has a "Download 3.1 Cert" link. Clicking it downloads a PDF certificate for that specific batch.
result: [pending]

### 3. Bulk ZIP Download
expected: On the certifications page, select multiple orders using checkboxes. A "Download Selected (ZIP)" button appears. Clicking it downloads a ZIP file containing cert packs for all selected orders.
result: [pending]

### 4. Share Link Generation
expected: On the certifications page, each order row has a "Share" button. Clicking it opens a dialog where you can optionally enter a project name. Click "Generate Link" to get a shareable URL and QR code. You can copy the link and see it listed with options to revoke.
result: [pending]

### 5. Public Verification Page
expected: Open a generated share link (/v/[token]) in an incognito browser (not logged in). The page shows a light-themed, co-branded verification view with the contractor's company name, order details, product list with quantities, batch IDs, supplier, heat numbers, goods-in date, and downloadable 3.1 cert PDFs.
result: [pending]

### 6. QR-to-Cert Verification
expected: Visit an existing /t/[token] verification link (from a product QR code). The page loads showing batch details including product name, batch ID, supplier, and a link to view/download the 3.1 certificate.
result: [pending]

### 7. Blog Listing Page
expected: Visit /blog. You see a listing of technical articles displayed as cards with title, description, category badge, reading time, and date. A category filter (pills) lets you filter articles. Navigation includes Blog, Resources, Glossary links.
result: [pending]

### 8. Blog Post Page
expected: Click on a blog article (e.g., "Understanding Embedment Depth"). The full article renders with proper headings, paragraphs, and prose styling. The page includes Article structured data visible in page source.
result: [pending]

### 9. Product Page Schema Markup
expected: Visit a product detail page (e.g., /products/[any-slug]). View page source or inspect the HTML. You see a JSON-LD script tag containing Product and BreadcrumbList structured data with product name, description, and pricing.
result: [pending]

### 10. Resource Library
expected: Visit /resources. You see products grouped by category (Chemical/Mechanical/General) with search and category filters. Products with datasheets show a download button. Clicking download opens/saves the PDF.
result: [pending]

### 11. Technical Glossary
expected: Visit /glossary. You see a searchable list of engineering terms (e.g., "embedment depth", "characteristic resistance"). Typing in the search box filters terms in real-time. Clicking a term expands its definition. Category filters let you narrow by topic.
result: [pending]

### 12. Product Page Technical Documents
expected: Visit a product detail page. Below the main product info, a "Technical Documents" section appears with a download link for the product datasheet (if available) and a link to /resources.
result: [pending]

### 13. Design Tool Soft Prompt
expected: Visit /design in an incognito browser (not logged in). Run 3 or more calculations. After the 3rd calculation, a non-blocking banner appears suggesting you create an account to save your work. Dismissing it keeps it hidden for 24 hours.
result: [pending]

### 14. Company Name in Design Signup
expected: On the design tool, trigger the auth gate (e.g., click Save or Export PDF). The signup form includes a "Company Name" field alongside email, name, and password.
result: [pending]

### 15. Unified Account Dashboard
expected: Log in to an account that has both saved calculations and orders. Visit /account. The dashboard shows a "Torke TRACE" section with your calculation count and a prompt to explore the shop, alongside your existing orders summary.
result: [pending]

### 16. Admin Lead List
expected: Log in as a warehouse/admin user. In the WMS sidebar, click "Leads". You see stat cards (total leads, weekly, monthly, converted), date and status filters, and a paginated table of recent signups showing name, email, company, date, and calculation count.
result: [pending]

## Summary

total: 16
passed: 0
issues: 0
pending: 16
skipped: 0

## Gaps

[none yet]
