const fs = require('fs');
const PDFDocument = require('pdfkit');

// Lire le markdown
const mdContent = fs.readFileSync('dossier_sgi_conformite.md', 'utf8');

const doc = new PDFDocument({ margin: 50, bufferPages: true });
const writeStream = fs.createWriteStream('dossier_sgi_conformite.pdf');
doc.pipe(writeStream);

// Dessiner le liseré de la Côte d'Ivoire en haut de chaque page
const drawHeaderDecor = () => {
  doc.rect(50, 30, 165, 8).fill('#ff8200');
  doc.rect(215, 30, 165, 8).fill('#ffffff');
  doc.rect(380, 30, 165, 8).fill('#10b981');
};

drawHeaderDecor();

// Titre Principal
doc.y = 60;
doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(20).text('BAOU FINANCE', { align: 'center' });
doc.fontSize(14).fillColor('#ff8200').text('DOSSIER STRATÉGIQUE & DE CONFORMITÉ', { align: 'center' });
doc.fontSize(9).fillColor('#64748b').text('À l\'attention des SGI, de la CDC-CI Capital et de l\'AMF-UMOA', { align: 'center' });
doc.moveDown(1.5);

// Ligne de séparation
doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
doc.moveDown(1);

// Parser le Markdown ligne par ligne
const lines = mdContent.split('\n');
let inTable = false;
let tableRows = [];

for (let line of lines) {
  line = line.trim();
  
  if (line.startsWith('# ')) {
    continue;
  }
  
  if (line.startsWith('## ')) {
    doc.moveDown(1.5);
    if (doc.y > 650) {
      doc.addPage();
      drawHeaderDecor();
      doc.y = 60;
    }
    const text = line.substring(3).replace(/\*\*/g, '');
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text(text);
    doc.moveDown(0.5);
    continue;
  }
  
  if (line.startsWith('### ')) {
    doc.moveDown(1);
    if (doc.y > 700) {
      doc.addPage();
      drawHeaderDecor();
      doc.y = 60;
    }
    const text = line.substring(4).replace(/\*\*/g, '');
    doc.fillColor('#ff8200').font('Helvetica-Bold').fontSize(11).text(text);
    doc.moveDown(0.4);
    continue;
  }

  if (line.startsWith('> [!')) {
    doc.moveDown(0.5);
    const text = line.replace(/>\s*\[!(NOTE|IMPORTANT|WARNING)\]\s*/, '').replace(/\*\*/g, '');
    doc.fillColor('#020617').font('Helvetica-Oblique').fontSize(9);
    doc.rect(50, doc.y, 495, 30).fill('#f8fafc');
    doc.fillColor('#475569').text(text, 60, doc.y + 8, { width: 475 });
    doc.moveDown(2);
    continue;
  }

  // Gérer les tableaux simples
  if (line.startsWith('|')) {
    if (line.includes('---')) continue;
    const cols = line.split('|').map(c => c.trim()).filter(c => c !== '');
    tableRows.push(cols);
    inTable = true;
    continue;
  } else if (inTable) {
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a');
    
    // Header
    const headers = tableRows[0];
    let currentY = doc.y;
    doc.text(headers[0], 50, currentY, { width: 240 });
    doc.text(headers[1], 300, currentY, { width: 245 });
    
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke();
    doc.moveDown(0.5);
    
    doc.font('Helvetica').fontSize(9).fillColor('#334155');
    for (let r = 1; r < tableRows.length; r++) {
      if (doc.y > 720) {
        doc.addPage();
        drawHeaderDecor();
        doc.y = 60;
      }
      const row = tableRows[r];
      let rowY = doc.y;
      doc.text(row[0].replace(/\*\*/g, ''), 50, rowY, { width: 240 });
      doc.text(row[1], 300, rowY, { width: 245 });
      doc.moveDown(1.2);
    }
    tableRows = [];
    inTable = false;
    doc.moveDown(1);
    continue;
  }

  if (line === '---' || line === '') {
    continue;
  }

  if (line.startsWith('* ') || line.startsWith('- ')) {
    const text = line.substring(2).replace(/\*\*/g, '');
    doc.fillColor('#334155').font('Helvetica').fontSize(10);
    doc.text('• ' + text, { paragraphGap: 4, indent: 15 });
    continue;
  }

  if (line) {
    const text = line.replace(/\*\*/g, '');
    doc.fillColor('#334155').font('Helvetica').fontSize(10);
    doc.text(text, { paragraphGap: 6 });
  }
}

// Rendre le footer et entêtes de pages
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  if (i > 0) {
    drawHeaderDecor();
  }
  doc.fillColor('#94a3b8').font('Helvetica').fontSize(8);
  doc.text(`BAOU Finance - Dossier Stratégique SGI & Conformité AMF-UMOA - Page ${i + 1} / ${range.count}`, 50, 780, { align: 'center' });
}

doc.end();
console.log('PDF généré avec succès.');
