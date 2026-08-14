import { Injectable } from '@nestjs/common';
// Voir la note dans create-app.ts : "import * as X" casse au runtime sur le bundler
// serverless de Vercel pour un module CJS à export unique. Style require() sans ambiguïté.
import PDFDocument = require('pdfkit');
import { CompanyEntity } from '../../entities/company.entity';
import { InvoiceEntity } from '../../entities/invoice.entity';
import { BusinessPlanEntity } from '../../entities/business-plan.entity';
import { FinancialReportBilan, CompteDeResultat } from '@financepro/shared';
import { FiscalDeclaration } from '../../modules/reports/reports.service';

function toBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

function formatMoney(value: number, currency: string): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} ${currency}`;
}

function drawHeader(doc: PDFKit.PDFDocument, company: CompanyEntity, title: string) {
  doc.fontSize(16).font('Helvetica-Bold').text(company.name || 'Société', { align: 'left' });
  doc.fontSize(9).font('Helvetica').fillColor('#444444');
  const infoParts = [company.address, company.city, company.country].filter(Boolean);
  if (infoParts.length) doc.text(infoParts.join(', '));
  if (company.rccm) doc.text(`RCCM: ${company.rccm}`);
  if (company.nif) doc.text(`NIF: ${company.nif}`);
  doc.moveDown(1);
  doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown(1);
  doc.strokeColor('#0f2d5e').lineWidth(1.5).moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
  doc.moveDown(1);
}

@Injectable()
export class PdfService {
  async generateInvoicePdf(invoice: InvoiceEntity, company: CompanyEntity): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4', info: { Title: invoice.invoiceNumber, Author: company.name || 'FinancePro' } }) as unknown as PDFKit.PDFDocument;
    const currency = company.currency || 'FCFA';
    const PAGE_W = doc.page.width;
    const MARGIN = 50;
    const INNER_W = PAGE_W - MARGIN * 2;

    const colorPrimary = '#00a8c6';
    const colorDark    = '#1a1a2e';
    const colorGray    = '#6b7280';
    const colorLight   = '#f8fafc';
    const colorLine    = '#e2e8f0';

    const fmtMoney = (v: number) =>
      new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v || 0) + ' ' + currency;

    // ── Bande de couleur en haut ─────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 8).fill(colorPrimary);

    // ── En-tête : Titre + Logo cercle ────────────────────────────────────────
    const titleY = 30;
    doc.fillColor(colorPrimary)
       .font('Helvetica-Bold')
       .fontSize(28)
       .text(`Facture n° ${invoice.invoiceNumber.replace('FAC-', '')}`, MARGIN, titleY, { width: 350 });

    // Cercle logo (simulation)
    const circleX = PAGE_W - MARGIN - 35;
    const circleY = titleY + 20;
    doc.save()
       .circle(circleX, circleY, 32)
       .fill('#f59e0b');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text('LOGO', circleX - 14, circleY - 6);
    doc.restore();

    // Badge statut si payée
    const inv = invoice as any;
    if (invoice.status === 'PAYE') {
      const badgeY = titleY + 45;
      doc.fontSize(8).font('Helvetica').fillColor(colorPrimary)
         .text(`Acquittée le ${inv.paymentDate || invoice.date}${inv.paymentMode ? ' · ' + inv.paymentMode : ''}${inv.paymentReference ? ' n°' + inv.paymentReference : ''}`, MARGIN, badgeY);
    }

    // ── Ligne séparatrice ────────────────────────────────────────────────────
    const sep1Y = 100;
    doc.strokeColor(colorLine).lineWidth(1).moveTo(MARGIN, sep1Y).lineTo(PAGE_W - MARGIN, sep1Y).stroke();

    // ── Bloc Émetteur / Destinataire ─────────────────────────────────────────
    const blockY = sep1Y + 15;
    const col2X  = MARGIN + INNER_W / 2 + 10;

    // Émetteur
    doc.fillColor(colorGray).font('Helvetica').fontSize(7.5).text('DE', MARGIN, blockY, { characterSpacing: 2 });
    doc.fillColor(colorDark).font('Helvetica-Bold').fontSize(11).text(company.name || 'VOTRE ENTREPRISE', MARGIN, blockY + 12);
    doc.fillColor(colorGray).font('Helvetica').fontSize(8.5);
    if (company.address) doc.text(company.address, MARGIN, doc.y);
    if (company.city || company.country) doc.text([company.city, company.country].filter(Boolean).join(', '), MARGIN, doc.y);
    if (company.phone) doc.text(`Tél : ${company.phone}`, MARGIN, doc.y);
    if (company.nif)   doc.text(`NIU : ${company.nif}`, MARGIN, doc.y);
    if (company.rccm)  doc.text(`RCCM : ${company.rccm}`, MARGIN, doc.y);

    // Destinataire
    doc.fillColor(colorGray).font('Helvetica').fontSize(7.5).text('À', col2X, blockY, { characterSpacing: 2 });
    doc.fillColor(colorDark).font('Helvetica-Bold').fontSize(11).text(invoice.tierName || 'CLIENT', col2X, blockY + 12);
    doc.fillColor(colorGray).font('Helvetica').fontSize(8.5).text('Douala, Cameroun', col2X, blockY + 28);

    // ── Grille Métadonnées ───────────────────────────────────────────────────
    const metaY = blockY + 85;
    doc.rect(MARGIN, metaY, INNER_W, 28).fill(colorLight);
    const metaCols = [
      { label: 'Date', value: invoice.date || '—' },
      { label: 'Échéance', value: invoice.dueDate || '—' },
      { label: 'Mode de règlement', value: inv.paymentMode || '—' },
      { label: 'Référence', value: inv.paymentReference || '—' },
    ];
    const metaColW = INNER_W / metaCols.length;
    metaCols.forEach((m, i) => {
      const mx = MARGIN + i * metaColW + 8;
      doc.fillColor(colorGray).font('Helvetica').fontSize(7).text(m.label.toUpperCase(), mx, metaY + 5, { width: metaColW - 16 });
      doc.fillColor(colorDark).font('Helvetica-Bold').fontSize(8.5).text(m.value, mx, metaY + 14, { width: metaColW - 16 });
    });

    // ── Tableau des lignes articles ───────────────────────────────────────────
    const tblY  = metaY + 38;
    const tblHdrH = 20;
    const cols = {
      desc:  { x: MARGIN,       w: 180 },
      qty:   { x: MARGIN + 185, w: 40  },
      unit:  { x: MARGIN + 230, w: 50  },
      pu:    { x: MARGIN + 285, w: 75  },
      tva:   { x: MARGIN + 365, w: 40  },
      total: { x: MARGIN + 410, w: 85  },
    };

    // Header du tableau
    doc.rect(MARGIN, tblY, INNER_W, tblHdrH).fill(colorDark);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
    doc.text('DÉSIGNATION', cols.desc.x + 4, tblY + 6, { width: cols.desc.w });
    doc.text('QTÉ',  cols.qty.x,   tblY + 6, { width: cols.qty.w,   align: 'center' });
    doc.text('UNITÉ',cols.unit.x,  tblY + 6, { width: cols.unit.w,  align: 'center' });
    doc.text('PU HT ('+currency+')', cols.pu.x, tblY + 6, { width: cols.pu.w, align: 'right' });
    doc.text('TVA%', cols.tva.x,   tblY + 6, { width: cols.tva.w,   align: 'right' });
    doc.text('TOTAL TTC', cols.total.x, tblY + 6, { width: cols.total.w, align: 'right' });

    // Lignes
    let rowY = tblY + tblHdrH;
    const items = invoice.items || [];
    items.forEach((item, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : colorLight;
      const rowH = 22;
      doc.rect(MARGIN, rowY, INNER_W, rowH).fill(bg);
      doc.fillColor(colorDark).font('Helvetica').fontSize(8);
      doc.text(item.description || '—', cols.desc.x + 4, rowY + 7, { width: cols.desc.w - 8 });
      doc.text(String(item.quantity), cols.qty.x, rowY + 7, { width: cols.qty.w, align: 'center' });
      doc.text((item as any).unit || 'u', cols.unit.x, rowY + 7, { width: cols.unit.w, align: 'center' });
      doc.text(fmtMoney(Number(item.unitPrice)), cols.pu.x, rowY + 7, { width: cols.pu.w, align: 'right' });
      doc.text(`${item.tvaRate || 0} %`, cols.tva.x, rowY + 7, { width: cols.tva.w, align: 'right' });
      doc.font('Helvetica-Bold').text(fmtMoney(Number(item.totalTTC)), cols.total.x, rowY + 7, { width: cols.total.w, align: 'right' });
      rowY += rowH;
    });
    if (items.length === 0) {
      doc.rect(MARGIN, rowY, INNER_W, 22).fill('#ffffff');
      doc.fillColor(colorGray).font('Helvetica').fontSize(8).text('Aucune ligne', MARGIN + 4, rowY + 7);
      rowY += 22;
    }

    // Ligne de fin tableau
    doc.strokeColor(colorLine).lineWidth(1).moveTo(MARGIN, rowY).lineTo(PAGE_W - MARGIN, rowY).stroke();

    // ── Décompte financier (bas droite) ──────────────────────────────────────
    const sumX    = PAGE_W - MARGIN - 220;
    const sumW    = 220;
    let   sumY    = rowY + 12;
    const lineH   = 16;

    const subHT    = Number(invoice.subtotalHT)   || 0;
    const remAmt   = Number(inv.remiseAmount)  || 0;
    const eAmt     = Number(inv.escompteAmount)|| 0;
    const portHT   = Number(inv.transportHT)   || 0;
    const totalTVA = Number(invoice.totalTVA)      || 0;
    const totalTTC = Number(invoice.totalTTC)      || 0;
    const totalAIR = Number(invoice.totalAIR)      || 0;
    const netAPayer= Number(inv.netAPayer) || (totalTTC - totalAIR);

    const summaryRows: { label: string; value: string; bold?: boolean; color?: string }[] = [];
    summaryRows.push({ label: 'Sous-total HT', value: fmtMoney(subHT) });
    if (remAmt > 0) summaryRows.push({ label: `Remise (${inv.remiseRate || 0} %)`, value: `-${fmtMoney(remAmt)}`, color: '#059669' });
    if (eAmt   > 0) summaryRows.push({ label: `Escompte (${inv.escompteRate || 0} %)`, value: `-${fmtMoney(eAmt)}`, color: '#059669' });
    if (portHT > 0) summaryRows.push({ label: 'Transport & frais', value: `+${fmtMoney(portHT)}`, color: '#4f46e5' });
    summaryRows.push({ label: 'TVA', value: `+${fmtMoney(totalTVA)}`, color: '#059669' });
    summaryRows.push({ label: 'Total TTC', value: fmtMoney(totalTTC), bold: true });
    if (totalAIR > 0) summaryRows.push({ label: `Retenue AIR (${invoice.airRate || 0} %)`, value: `-${fmtMoney(totalAIR)}`, color: '#d97706' });

    summaryRows.forEach(row => {
      doc.fillColor(row.color || colorGray).font(row.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5);
      doc.text(row.label, sumX, sumY, { width: 140 });
      doc.text(row.value, sumX + 140, sumY, { width: 80, align: 'right' });
      sumY += lineH;
    });

    // Ligne double NET À PAYER
    sumY += 4;
    doc.strokeColor(colorPrimary).lineWidth(1.5).moveTo(sumX, sumY).lineTo(sumX + sumW, sumY).stroke();
    sumY += 6;
    doc.fillColor(colorPrimary).font('Helvetica-Bold').fontSize(11);
    doc.text('NET À PAYER', sumX, sumY, { width: 130 });
    doc.text(fmtMoney(netAPayer), sumX + 130, sumY, { width: 90, align: 'right' });

    // ── Pied de page : coordonnées bancaires ─────────────────────────────────
    const footerY = doc.page.height - 75;
    doc.rect(MARGIN, footerY - 5, INNER_W, 1).fill(colorLine);

    const footerCols = [
      { title: 'Siège social', lines: [company.address || '—', [company.city, company.country].filter(Boolean).join(', ')] },
      { title: 'Coordonnées', lines: [company.phone ? `Tél : ${company.phone}` : '—', company.email || '—'] },
      { title: 'Coordonnées bancaires', lines: [company.bankName ? `Banque : ${company.bankName}` : '—', company.bankAccount ? `N° compte : ${company.bankAccount}` : '—'] },
    ];
    const fcW = INNER_W / 3;
    footerCols.forEach((fc, i) => {
      const fx = MARGIN + i * fcW;
      doc.fillColor(colorDark).font('Helvetica-Bold').fontSize(7.5).text(fc.title, fx, footerY + 2, { width: fcW - 10 });
      doc.fillColor(colorGray).font('Helvetica').fontSize(7);
      fc.lines.forEach(l => { doc.text(l, fx, doc.y, { width: fcW - 10 }); });
    });

    doc.fillColor(colorGray).font('Helvetica').fontSize(6.5)
       .text('Document généré automatiquement par FinancePro · Conforme SYSCOHADA Révisé', MARGIN, doc.page.height - 20, { align: 'center', width: INNER_W });

    return toBuffer(doc);
  }



  async generateBilanPdf(bilan: FinancialReportBilan, company: CompanyEntity): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' }) as unknown as PDFKit.PDFDocument;
    const currency = company.currency || 'XAF';
    drawHeader(doc, company, 'BILAN (SYSCOHADA)');

    const renderColumn = (title: string, items: { label: string; net: number }[], total: number) => {
      doc.font('Helvetica-Bold').fontSize(10).text(title);
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(8);
      for (const item of items) {
        if (Math.abs(item.net) < 0.01) continue;
        doc.text(item.label, 50, doc.y, { continued: true, width: 350 });
        doc.text(formatMoney(item.net, currency), { align: 'right' });
      }
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').text(`Total : ${formatMoney(total, currency)}`);
      doc.moveDown(1);
    };

    renderColumn('ACTIF IMMOBILISÉ', bilan.actif.immobilise, bilan.actif.immobilise.reduce((s, i) => s + i.net, 0));
    renderColumn('ACTIF CIRCULANT', bilan.actif.circulant, bilan.actif.circulant.reduce((s, i) => s + i.net, 0));
    renderColumn('TRÉSORERIE ACTIF', bilan.actif.tresorerie, bilan.actif.tresorerie.reduce((s, i) => s + i.net, 0));
    doc.font('Helvetica-Bold').fontSize(11).text(`TOTAL ACTIF : ${formatMoney(bilan.actif.totalActif, currency)}`);
    doc.moveDown(1.5);

    renderColumn('CAPITAUX PROPRES', bilan.passif.capitauxPropres, bilan.passif.capitauxPropres.reduce((s, i) => s + i.net, 0));
    renderColumn('DETTES FINANCIÈRES', bilan.passif.dettesFinancieres, bilan.passif.dettesFinancieres.reduce((s, i) => s + i.net, 0));
    renderColumn('PASSIF CIRCULANT', bilan.passif.passifCirculant, bilan.passif.passifCirculant.reduce((s, i) => s + i.net, 0));
    renderColumn('TRÉSORERIE PASSIF', bilan.passif.tresoreriePassif, bilan.passif.tresoreriePassif.reduce((s, i) => s + i.net, 0));
    doc.font('Helvetica-Bold').fontSize(11).text(`TOTAL PASSIF : ${formatMoney(bilan.passif.totalPassif, currency)}`);

    return toBuffer(doc);
  }

  async generateCompteResultatPdf(cr: CompteDeResultat, company: CompanyEntity): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' }) as unknown as PDFKit.PDFDocument;
    const currency = company.currency || 'XAF';
    drawHeader(doc, company, 'COMPTE DE RÉSULTAT (SYSCOHADA)');

    const rows: [string, number, boolean?][] = [
      ["Chiffre d'affaires", cr.chiffreAffaires],
      ['Achats de marchandises', -cr.achatsMarchandises],
      ['Marge brute', cr.margeBrute, true],
      ['Consommations intermédiaires', -cr.consommationsIntermediaires],
      ['Valeur ajoutée', cr.valeurAjoutee, true],
      ['Charges de personnel', -cr.chargesPersonnel],
      ["Excédent Brut d'Exploitation (EBE)", cr.ebe, true],
      ['Dotations aux amortissements', -cr.dotationsAmortissements],
      ["Résultat d'exploitation", cr.resultatExploitation, true],
      ['Charges financières', -cr.chargesFinancieres],
      ['Produits financiers', cr.produitsFinanciers],
      ['Résultat financier', cr.resultatFinancier, true],
      ['Résultat HAO', cr.resultatHAO, true],
      ['Impôt sur les bénéfices', -cr.impotSurBenefices],
      ['RÉSULTAT NET', cr.resultatNet, true],
    ];

    doc.fontSize(9);
    for (const [label, value, isTotal] of rows) {
      doc.font(isTotal ? 'Helvetica-Bold' : 'Helvetica');
      doc.text(label, 50, doc.y, { continued: true, width: 350 });
      doc.text(formatMoney(value, currency), { align: 'right' });
      if (isTotal) doc.moveDown(0.3);
    }

    return toBuffer(doc);
  }

  async generateFiscalDeclarationPdf(declaration: FiscalDeclaration, company: CompanyEntity): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' }) as unknown as PDFKit.PDFDocument;
    const currency = company.currency || 'XAF';
    drawHeader(doc, company, `DÉCLARATION FISCALE — ${declaration.periodLabel}`);

    doc.font('Helvetica-Bold').fontSize(11).text('TVA (Taxe sur la Valeur Ajoutée)');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9);
    doc.text(`TVA collectée (compte 443) : ${formatMoney(declaration.tvaCollectee, currency)}`);
    doc.text(`TVA récupérable (compte 445) : ${formatMoney(declaration.tvaRecuperable, currency)}`);
    doc.font('Helvetica-Bold').text(
      declaration.tvaAPayer >= 0
        ? `TVA à reverser : ${formatMoney(declaration.tvaAPayer, currency)}`
        : `Crédit de TVA à reporter : ${formatMoney(-declaration.tvaAPayer, currency)}`,
    );
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(11).text('AIR (Acompte sur Impôt sur le Revenu / Retenue à la source)');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9);
    doc.text(`Retenues subies sur ventes (à valoir sur l'IS, non reversées par l'entreprise) : ${formatMoney(declaration.airSurVentes, currency)}`);
    doc.text(`Retenues opérées sur achats (à reverser par l'entreprise) : ${formatMoney(declaration.airSurAchats, currency)}`);
    doc.font('Helvetica-Bold').text(`AIR à reverser au Trésor : ${formatMoney(declaration.airTotal, currency)}`);

    doc.moveDown(2);
    doc.font('Helvetica').fontSize(8).fillColor('#888888').text(
      "Déclaration indicative générée à partir du Grand Livre et des factures validées — à vérifier avant transmission à l'administration fiscale.",
      { width: 495 },
    );

    return toBuffer(doc);
  }

  async generateBusinessPlanPdf(plan: BusinessPlanEntity, company: CompanyEntity): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true }) as unknown as PDFKit.PDFDocument;
    const currency = company.currency || 'XAF';
    drawHeader(doc, company, plan.title);

    doc.font('Helvetica-Bold').fontSize(11).text('Description du projet');
    doc.font('Helvetica').fontSize(9).text(plan.projectDescription, { width: 495 });
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(11).text('Hypothèses du porteur de projet');
    doc.font('Helvetica').fontSize(9);
    doc.text(`Investissement recherché : ${formatMoney(Number(plan.investmentAmount), currency)}`);
    doc.text(`Chiffre d'affaires prévisionnel année 1 : ${formatMoney(Number(plan.year1Revenue), currency)}`);
    doc.text(`Croissance annuelle prévue : ${plan.revenueGrowthRatePercent}%`);
    doc.text(`Charges variables : ${plan.variableCostPercent}% du CA`);
    doc.text(`Charges fixes annuelles : ${formatMoney(Number(plan.fixedCostsAnnual), currency)}`);
    doc.text(`Taux d'actualisation retenu : ${plan.discountRatePercent}%`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(11).text('Projections financières');
    doc.moveDown(0.3);
    const tableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Année', 50, tableTop);
    doc.text('CA', 130, tableTop);
    doc.text('Charges var.', 250, tableTop);
    doc.text('Charges fixes', 370, tableTop);
    doc.text('Flux net', 470, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();
    let y = tableTop + 22;
    doc.font('Helvetica').fontSize(9);
    for (const p of plan.projections) {
      doc.text(`An ${p.year}`, 50, y);
      doc.text(formatMoney(p.revenue, currency), 130, y);
      doc.text(formatMoney(p.variableCosts, currency), 250, y);
      doc.text(formatMoney(p.fixedCosts, currency), 370, y);
      doc.text(formatMoney(p.netCashFlow, currency), 470, y);
      y += 18;
    }
    doc.moveDown(2);

    doc.font('Helvetica-Bold').fontSize(11).text('Indicateurs de viabilité');
    doc.font('Helvetica').fontSize(9);
    doc.text(`VAN (au taux de ${plan.discountRatePercent}%) : ${formatMoney(Number(plan.van), currency)}`);
    doc.text(`TRI : ${plan.tri !== null ? Number(plan.tri).toFixed(1) + '%' : 'non calculable avec ces hypothèses'}`);
    doc.text(
      `Seuil de rentabilité : ${Number.isFinite(Number(plan.seuilRentabilite)) ? formatMoney(Number(plan.seuilRentabilite), currency) + ' de CA annuel' : 'non atteignable avec ces hypothèses'}`,
    );
    doc.font('Helvetica-Bold').text(`Score de crédibilité indicatif : ${plan.creditScore}/100`);
    doc.font('Helvetica').fontSize(7).fillColor('#888888').text('(indicateur interne, ne constitue pas une notation bancaire officielle)');
    doc.fillColor('#000000');
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(13).text('Business Plan Détaillé');
    doc.moveDown(0.5);
    const narrativeLines = plan.narrative.split('\n');
    for (const line of narrativeLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('## ')) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f2d5e').text(trimmed.substring(3), { width: 495 });
        doc.fillColor('#000000');
        doc.moveDown(0.2);
      } else {
        // Retire les marqueurs markdown **gras** que le modèle ajoute parfois (ex: dans le SWOT) :
        // pdfkit ne supporte pas le gras inline sans découper le texte en runs, donc on affiche du
        // texte propre plutôt que des astérisques littéraux.
        doc.font('Helvetica').fontSize(9).text(trimmed.replace(/\*\*/g, ''), { width: 495 });
        doc.moveDown(0.2);
      }
    }

    doc.fontSize(8).fillColor('#888888').text(
      'Document généré automatiquement à partir des données réelles de l\'entreprise et des hypothèses fournies — à faire relire avant transmission à un partenaire financier.',
      50,
      doc.page.height - 60,
      { align: 'center', width: 495 },
    );

    return toBuffer(doc);
  }

  async generateManagementReportPdf(
    company: CompanyEntity,
    bilan: FinancialReportBilan,
    cr: CompteDeResultat,
    aiSummary: string,
  ): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' }) as unknown as PDFKit.PDFDocument;
    const currency = company.currency || 'XAF';
    
    drawHeader(doc, company, 'RAPPORT MENSUEL DE GESTION');
    
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1E1060').text('Synthèse des Performances Financières');
    doc.moveDown(0.5);
    
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text('Indicateurs Clés :');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9);
    doc.text(`- Chiffre d'Affaires de la période : ${formatMoney(cr.chiffreAffaires, currency)}`);
    doc.text(`- Marge Brute : ${formatMoney(cr.margeBrute, currency)}`);
    doc.text(`- Excédent Brut d'Exploitation (EBITDA) : ${formatMoney(cr.ebe, currency)}`);
    doc.text(`- Résultat d'Exploitation : ${formatMoney(cr.resultatExploitation, currency)}`);
    doc.text(`- Résultat Net de l'exercice : ${formatMoney(cr.resultatNet, currency)}`);
    
    doc.moveDown(1.5);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1E1060').text('Analyse Stratégique & Recommandations IA');
    doc.moveDown(0.5);
    
    doc.font('Helvetica').fontSize(9.5).fillColor('#333333');
    doc.text(aiSummary.replace(/\*\*/g, ''), { align: 'justify', width: 495 });
    
    doc.fontSize(8).fillColor('#888888').text(
      'Document confidentiel à usage interne généré automatiquement par FinancePro IA.',
      50,
      doc.page.height - 60,
      { align: 'center', width: 495 },
    );

    return toBuffer(doc);
  }
}
