const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const viewBtn = document.getElementById('viewBtn');
const status = document.getElementById('status');
const tableContainer = document.getElementById('tableContainer');

let globalPoints = [];

uploadBtn.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  status.innerText = "جاري معالجة البيانات...";
  const reader = new FileReader();

  reader.onload = (event) => {
    const lines = event.target.result.split(/\r?\n/);
    let entities = "";
    globalPoints = [];

    lines.forEach(line => {
      // البحث عن السطور التي تحتوي على نقاط (08TP أو 08KI)
      if (line.startsWith('08TP') || line.startsWith('08KI')) {
        const pId = line.substring(4, 20).trim();      
        // الـ East هو الذي يبدأ بـ 616 (الخانة من 20 لـ 36)
        const east = parseFloat(line.substring(20, 36).trim());  
        // الـ North هو الذي يبدأ بـ 343 (الخانة من 36 لـ 52)
        const north = parseFloat(line.substring(36, 52).trim()); 
        const elev = parseFloat(line.substring(52, 68).trim());  
        const pCode = line.substring(68, 84).trim() || "TE";

        if (!isNaN(east) && !isNaN(north)) {
          globalPoints.push({ pId, east, north, elev, pCode });

          const s = 0.15; // حجم علامة X
          const textHeight = 0.20;

          // رسم علامة X للنقطة في أوتوكاد
          entities += `0\nLINE\n8\nPoints\n62\n2\n10\n${east-s}\n20\n${north-s}\n11\n${east+s}\n21\n${north+s}\n`;
          entities += `0\nLINE\n8\nPoints\n62\n2\n10\n${east-s}\n20\n${north+s}\n11\n${east+s}\n21\n${north-s}\n`;

          // كتابة النصوص (رقم، منسوب، كود)
          entities += `0\nTEXT\n8\nNames\n62\n2\n10\n${east + 0.2}\n20\n${north + 0.2}\n40\n${textHeight}\n1\n${pId}\n`;
          entities += `0\nTEXT\n8\nElevations\n62\n2\n10\n${east + 0.2}\n20\n${north - 0.2}\n40\n${textHeight}\n1\n${elev.toFixed(3)}\n`;
          entities += `0\nTEXT\n8\nCodes\n62\n2\n10\n${east + 1.2}\n20\n${north - 0.2}\n40\n${textHeight}\n1\n${pCode}\n`;
        }
      }
    });

    if (globalPoints.length > 0) {
      viewBtn.style.display = "inline-block";
      status.innerText = `✅ تم التحويل بنجاح! عدد النقاط: ${globalPoints.length}`;

      // بناء ملف DXF النهائي
      let dxf = `0\nSECTION\n2\nENTITIES\n${entities}0\nENDSEC\n0\nEOF`;

      const blob = new Blob([dxf], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Survey_Output_Hassan.dxf`;
      a.click();
    } else {
      status.innerText = "❌ لم يتم العثور على نقاط صالحة في الملف.";
    }
  };
  reader.readAsText(file);
};

// وظيفة عرض الجدول (الشيت)
viewBtn.onclick = () => {
  let html = `<table><thead><tr>
    <th>رقم النقطة</th>
    <th>East (616...)</th>
    <th>North (343...)</th>
    <th>المنسوب (Z)</th>
    <th>الوصف (Code)</th>
  </tr></thead><tbody>`;
  
  globalPoints.forEach(p => {
    html += `<tr>
      <td>${p.pId}</td>
      <td>${p.east.toFixed(3)}</td>
      <td>${p.north.toFixed(3)}</td>
      <td>${p.elev.toFixed(3)}</td>
      <td>${p.pCode}</td>
    </tr>`;
  });
  
  html += `</tbody></table>`;
  tableContainer.innerHTML = html;
};
