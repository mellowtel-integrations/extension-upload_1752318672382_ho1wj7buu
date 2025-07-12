document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('save-settings');
  const webhookUrlInput = document.getElementById('webhook-url');
  const smtpHostInput = document.getElementById('smtp-host');
  const smtpPortInput = document.getElementById('smtp-port');
  const smtpUserInput = document.getElementById('smtp-user');
  const smtpPassInput = document.getElementById('smtp-pass');
  const smtpRecipientInput = document.getElementById('smtp-recipient');

  // Load saved settings
  chrome.storage.sync.get(['webhookUrl', 'smtpConfig'], (result) => {
    if (result.webhookUrl) {
      webhookUrlInput.value = result.webhookUrl;
    }
    if (result.smtpConfig) {
      smtpHostInput.value = result.smtpConfig.host || '';
      smtpPortInput.value = result.smtpConfig.port || '';
      smtpUserInput.value = result.smtpConfig.user || '';
      smtpPassInput.value = result.smtpConfig.pass || '';
      smtpRecipientInput.value = result.smtpConfig.recipient || '';
    }
  });

  saveBtn.addEventListener('click', () => {
    const webhookUrl = webhookUrlInput.value.trim();
    const smtpConfig = {
      host: smtpHostInput.value.trim(),
      port: parseInt(smtpPortInput.value, 10),
      user: smtpUserInput.value.trim(),
      pass: smtpPassInput.value, // Do not trim password
      recipient: smtpRecipientInput.value.trim(),
    };

    chrome.storage.sync.set({ 
      webhookUrl: webhookUrl,
      smtpConfig: smtpConfig
    }, () => {
      console.log('Settings saved.');
      alert('Settings have been saved successfully!');
      window.close();
    });
  });
});