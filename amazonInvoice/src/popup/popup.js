document.addEventListener('DOMContentLoaded', () => {
  const scanOrdersBtn = document.getElementById('scan-orders');
  const downloadInvoicesBtn = document.getElementById('download-invoices');
  const settingsBtn = document.getElementById('settings-button');
  const detectedOrdersSpan = document.getElementById('detected-orders');
  const downloadedInvoicesSpan = document.getElementById('downloaded-invoices');
  const statusDisplay = document.getElementById('status-display');

  // Load initial counts from storage
  chrome.storage.local.get(['detectedOrders', 'downloadedInvoices'], (result) => {
    detectedOrdersSpan.textContent = result.detectedOrders || 0;
    downloadedInvoicesSpan.textContent = result.downloadedInvoices || 0;
  });

  scanOrdersBtn.addEventListener('click', () => {
    updateStatus('Scanning orders...', true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'scanOrders' });
    });
  });

  downloadInvoicesBtn.addEventListener('click', () => {
    updateStatus('Downloading invoices...', true);
    chrome.runtime.sendMessage({ action: 'downloadInvoices' });
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Listen for updates from other scripts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateCounts') {
      detectedOrdersSpan.textContent = message.detectedOrders || 0;
      if (message.downloadedInvoices !== undefined) {
        downloadedInvoicesSpan.textContent = message.downloadedInvoices;
      }
    } else if (message.action === 'updateStatus') {
      updateStatus(message.text, message.inProgress);
    }
  });

  function updateStatus(text, inProgress = false) {
    statusDisplay.textContent = text;
    scanOrdersBtn.disabled = inProgress;
    downloadInvoicesBtn.disabled = inProgress;
    statusDisplay.classList.toggle('text-blue-500', inProgress);
    statusDisplay.classList.toggle('text-green-500', !inProgress && text.includes('Complete'));
  }
});