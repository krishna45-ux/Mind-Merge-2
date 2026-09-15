let pdfjsPromise: Promise<any> | null = null;

function loadPdfJS(): Promise<any> {
  if (pdfjsPromise) return pdfjsPromise;
  
  pdfjsPromise = new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = (err) => {
      pdfjsPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });
  
  return pdfjsPromise;
}

export async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdfjsLib = await loadPdfJS();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let text = '';
    
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      text += strings.join(' ') + '\n\n';
    }
    
    return text.trim();
  } catch (error) {
    console.error('Failed to extract text from PDF via PDF.js:', error);
    return extractTextFromPdfFallback(arrayBuffer);
  }
}

function extractTextFromPdfFallback(arrayBuffer: ArrayBuffer): string {
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(new Uint8Array(arrayBuffer));
  const matches = text.match(/\(([^)]+)\)/g);
  if (!matches) return '';
  return matches
    .map(m => m.slice(1, -1))
    .filter(t => t.length > 3 && !t.includes('\\') && !/^[0-9\s.-]+$/.test(t))
    .join(' ')
    .replace(/\s+/g, ' ')
    .substring(0, 5000);
}
