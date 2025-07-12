
# Invoice Downloader for Amazon Business

This Chrome extension automates the process of downloading and organizing your Amazon Business invoices.

## Features

- Scan your Amazon Business order history.
- Identify orders for which you haven't downloaded the invoice yet.
- Download the PDF invoices.
- Organize the downloaded files locally using the following structure:
  `/YYYY/MM - Supplier - OrderNumber.pdf`
- Automatically send the invoices to your accountant (via SMTP or webhook).

## How to Use

1.  Load the extension in Chrome.
2.  Navigate to your Amazon Business order history page.
3.  Click the extension icon to open the popup.
4.  Click "Scan My Orders" to find all your orders.
5.  Click "Download Missing Invoices" to download the invoices you haven't saved yet.

## Development

This project is open source (MIT license). Contributions are welcome!

### Project Structure

- `/src`: Contains the source code for the extension.
  - `/popup`: HTML, CSS, and JS for the extension's popup.
  - `/background`: The background service worker for handling downloads and other tasks.
  - `/content`: The content script for interacting with the Amazon website.
  - `/assets`: Icons and other static assets.
- `/dist`: Contains the packaged extension.
- `/docs`: Contains project documentation.
