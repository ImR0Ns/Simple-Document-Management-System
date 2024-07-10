import './assets/pspdfkit.js';

const baseUrl = `${window.location.protocol}//${window.location.host}/assets/`;

let pspdfkitInstance = null;

function loadPDF(arrayBuffer) {
  if (pspdfkitInstance) {
    PSPDFKit.unload(pspdfkitInstance);
  }

  PSPDFKit.load({
    baseUrl,
    container: '#pspdfkit',
    document: arrayBuffer,
  })
  .then((instance) => {
    pspdfkitInstance = instance;
    console.log('PSPDFKit loaded', instance);
  })
  .catch((error) => {
    console.error(error.message);
  });
}

document.getElementById('file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const arrayBuffer = event.target.result;
      loadPDF(arrayBuffer);
      
      // Hide the div with class fullContainer
      document.querySelector('.containerTOHide').style.display = 'none';
    };
    reader.readAsArrayBuffer(file);
  }
});

// Open the modal when Save button is clicked
document.getElementById('save-btn').addEventListener('click', () => {
  $('#modalSavePDF').modal('show');
});

// Handle the form submission within the modal
document.getElementById('savePDFButton').addEventListener('click', async () => {
  const documentTitle = document.getElementById('documentTitle').value;
  const documentType = document.getElementById('documentType').value;

  if (pspdfkitInstance && documentTitle && documentType) {
    const pdfData = await pspdfkitInstance.exportPDF();
    savePDF(pdfData, documentTitle, documentType);
  } else {
    alert('Please complete all fields and upload a document.');
  }
});

async function savePDF(pdfData, documentTitle, documentType) {
  try {
      // Convert ArrayBuffer to Blob
      const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });

      // Create FormData object and append necessary fields
      const formData = new FormData();
      formData.append('pdf', pdfBlob, 'document.pdf'); // 'document.pdf' is the filename
      formData.append('userId', new URLSearchParams(window.location.search).get('userId'));
      formData.append('documentType', documentType);
      formData.append('documentTitle', documentTitle);

      // Send FormData to server via fetch API
      const response = await fetch('/save-pdf', {
          method: 'POST',
          body: formData,
      });

      if (response.ok) {
          window.location.href = '/dashboard';
          $('#modalSavePDF').modal('hide'); // Hide the modal after successful save
      } else {
          alert('Failed to save PDF.');
      }
  } catch (error) {
      console.error('Error saving PDF:', error);
      alert('Failed to save PDF.');
  }
}
