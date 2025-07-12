chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scanOrders') {
    console.log('Scanning orders on the page...');
    const orders = scrapeOrderData();
    
    console.log(`Found ${orders.length} orders.`);

    // Send the scraped data to the background script
    chrome.runtime.sendMessage({ action: 'storeOrders', orders: orders }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        return;
      }
      console.log(response.status);
      
      // Also update the popup directly
      chrome.runtime.sendMessage({ 
        action: 'updateCounts', 
        detectedOrders: orders.length 
      });
      chrome.runtime.sendMessage({ action: 'updateStatus', text: `Scan Complete: ${orders.length} orders found.` });
    });
  }
});

/**
 * Scrapes the Amazon order history page to extract order details.
 * Note: The selectors used here are placeholders and need to be verified
 * against the live Amazon page structure.
 * @returns {Array<object>} A list of order objects.
 */
function scrapeOrderData() {
  // This is a placeholder selector. We'll need to inspect the actual Amazon
  // page to get the correct selectors for the order cards.
  const orderElements = document.querySelectorAll('.order-card, .js-order-card');
  const scrapedOrders = [];

  orderElements.forEach(orderElement => {
    // These selectors are hypothetical and need to be verified on a real page.
    const orderIdElement = orderElement.querySelector('.order-header .a-col-right .a-size-base');
    const orderDateElement = orderElement.querySelector('.order-header .a-col-left .a-size-base');
    const invoiceLinkElement = orderElement.querySelector('a[href*="invoice"]');

    if (orderIdElement && orderDateElement && invoiceLinkElement) {
      const orderId = orderIdElement.innerText.trim().replace('Order #', '').trim();
      const orderDate = orderDateElement.innerText.trim().replace('Order Placed:', '').trim();
      const invoiceLink = invoiceLinkElement.href;

      scrapedOrders.push({
        id: orderId,
        date: orderDate,
        invoiceUrl: invoiceLink,
        status: 'pending' // To track download status
      });
    }
  });

  return scrapedOrders;
}