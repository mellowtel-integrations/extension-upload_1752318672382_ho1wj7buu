// Stores order data scraped from the content script
let detectedOrders = [];
// Stores the IDs of invoices that have already been downloaded to avoid duplicates
let downloadedInvoices = new Set();

// Load downloaded invoices from storage on startup
chrome.storage.local.get('downloadedInvoices', (result) => {
  if (result.downloadedInvoices) {
    downloadedInvoices = new Set(result.downloadedInvoices);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'storeOrders') {
    detectedOrders = message.orders;
    console.log('Stored detected orders:', detectedOrders);
    sendResponse({ status: 'Orders stored successfully' });
  } else if (message.action === 'downloadInvoices') {
    downloadMissingInvoices();
  }
  return true; // Indicates that the response is sent asynchronously
});

function downloadMissingInvoices() {
  const invoicesToDownload = detectedOrders.filter(order => !downloadedInvoices.has(order.id));
  console.log(`Found ${invoicesToDownload.length} new invoices to download.`);
  chrome.runtime.sendMessage({ action: 'updateStatus', text: `Downloading ${invoicesToDownload.length} invoices...`, inProgress: true });

  if (invoicesToDownload.length === 0) {
    chrome.runtime.sendMessage({ action: 'updateStatus', text: 'All invoices are up to date.' });
    return;
  }

  invoicesToDownload.forEach((order, index) => {
    // Add a random delay to avoid being blocked by Amazon
    setTimeout(() => {
      fetchAndProcessInvoice(order);
    }, index * Math.floor(Math.random() * 5000) + 2000); // Random delay between 2-7 seconds
  });
}

/**
 * Fetches an invoice as a blob, sends it to configured endpoints (webhook/SMTP),
 * and then saves it locally.
 * @param {object} order The order object containing invoice details.
 */
async function fetchAndProcessInvoice(order) {
  try {
    const response = await fetch(order.invoiceUrl);
    const blob = await response.blob();

    // 1. Send to Webhook or SMTP
    await sendInvoice(blob, order);

    // 2. Save locally
    saveInvoiceFile(blob, order);

  } catch (error) {
    console.error(`Failed to process invoice for order ${order.id}:`, error);
  }
}

async function sendInvoice(blob, order) {
  const { webhookUrl, smtpConfig } = await getSettings();

  if (smtpConfig && smtpConfig.host && smtpConfig.recipient) {
    await sendToSmtp(blob, order, smtpConfig);
  } else if (webhookUrl) {
    await sendToWebhook(blob, order, webhookUrl);
  }
}

async function sendToSmtp(blob, order, smtpConfig) {
  // This is a placeholder for a real SMTP implementation.
  // In a real extension, you would use a library like SMTP.js or a server-side proxy.
  console.log(`Simulating sending email for order ${order.id} via SMTP.`);

  // Convert blob to base64 to simulate attachment
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = function() {
    const base64data = reader.result;
    console.log('Email details:');
    console.log(`  To: ${smtpConfig.recipient}`)
    console.log(`  Subject: Invoice for Amazon Order ${order.id}`)
    console.log(`  Body: Please find attached the invoice for your recent Amazon order ${order.id}.`)
    console.log(`  Attachment: ${order.id}.pdf (base64 encoded)`);

    // Here you would make the actual SMTP call.
    // For example, using a library:
    // Email.send({
    //   Host: smtpConfig.host,
    //   Username: smtpConfig.user,
    //   Password: smtpConfig.pass,
    //   To: smtpConfig.recipient,
    //   From: smtpConfig.user,
    //   Subject: `Invoice for Amazon Order ${order.id}`,
    //   Body: `Attached is the invoice for order ${order.id}.`,
    //   Attachments: [{
    //     name: `${order.id}.pdf`,
    //     data: base64data
    //   }]
    // }).then(message => console.log(message));
  }
}

async function sendToWebhook(blob, order, webhookUrl) {
  const formData = new FormData();
  formData.append('file', blob, `${order.id}.pdf`);
  formData.append('orderId', order.id);
  formData.append('orderDate', order.date);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      console.log(`Successfully sent invoice for order ${order.id} to webhook.`);
    } else {
      console.error(`Webhook failed for order ${order.id} with status:`, response.status);
    }
  } catch (error) {
    console.error(`Error sending to webhook for order ${order.id}:`, error);
  }
}

function saveInvoiceFile(blob, order) {
  const year = new Date(order.date).getFullYear();
  const month = String(new Date(order.date).getMonth() + 1).padStart(2, '0');
  const filename = `${year}/${month} - Amazon - ${order.id}.pdf`;

  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: false
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('Download failed:', chrome.runtime.lastError);
    } else {
      console.log(`Successfully started download for order ${order.id}`);
      downloadedInvoices.add(order.id);
      chrome.storage.local.set({ downloadedInvoices: Array.from(downloadedInvoices) });

      chrome.runtime.sendMessage({ 
        action: 'updateCounts', 
        detectedOrders: detectedOrders.length,
        downloadedInvoices: downloadedInvoices.size
      });
    }
    // Revoke the object URL to free up memory
    URL.revokeObjectURL(url);

    // Check if all downloads are complete
    if (downloadedInvoices.size === detectedOrders.length) {
      chrome.runtime.sendMessage({ action: 'updateStatus', text: 'All downloads complete!' });
    }
  });
}

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['webhookUrl', 'smtpConfig'], (result) => {
      resolve(result);
    });
  });
}