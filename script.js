const input = document.getElementById('imageInput');
const canvas = document.getElementById('canvas');
const svg = document.getElementById('svgOutput');
const downloadBtn = document.getElementById('downloadSVG');

input.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = async () => {
    // Draw image to canvas
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Setup SVG view
    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${img.width} ${img.height}`);
    svg.setAttribute('width', img.width);
    svg.setAttribute('height', img.height);

    // OCR Text Detection
    const result = await Tesseract.recognize(img.src, 'eng');
    result.data.words.forEach(w => {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", w.bbox.x0);
      rect.setAttribute("y", w.bbox.y0);
      rect.setAttribute("width", w.bbox.x1 - w.bbox.x0);
      rect.setAttribute("height", w.bbox.y1 - w.bbox.y0);
      rect.setAttribute("stroke", "#000");
      rect.setAttribute("fill", "none");
      svg.appendChild(rect);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", w.bbox.x0 + 2);
      text.setAttribute("y", w.bbox.y1 - 2);
      text.setAttribute("font-size", "12");
      text.setAttribute("fill", "#333");
      text.textContent = "Lorem";
      svg.appendChild(text);
    });

    // Layout Detection with OpenCV
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    const edges = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(gray, edges, 100, 200);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); i++) {
      const rect = cv.boundingRect(contours.get(i));
      if (rect.width > 50 && rect.height > 20) {
        const box = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        box.setAttribute("x", rect.x);
        box.setAttribute("y", rect.y);
        box.setAttribute("width", rect.width);
        box.setAttribute("height", rect.height);
        box.setAttribute("stroke", "#999");
        box.setAttribute("fill", "none");
        box.setAttribute("stroke-dasharray", "4 2");
        svg.appendChild(box);
      }
    }

    src.delete(); gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
  };
});

downloadBtn.addEventListener('click', () => {
  const data = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([data], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "wireframe.svg";
  a.click();
});