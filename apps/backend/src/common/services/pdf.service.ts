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
    const doc = new PDFDocument({ margin: 50, size: 'A4' }) as unknown as PDFKit.PDFDocument;
    const currency = company.currency || 'XAF';

    drawHeader(doc, company, invoice.type === 'VENTE' ? 'FACTURE DE VENTE' : invoice.type === 'ACHAT' ? "FACTURE D'ACHAT" : 'AVOIR');

    doc.fontSize(10).font('Helvetica-Bold').text(`N° ${invoice.invoiceNumber}`);
    doc.font('Helvetica').text(`Date : ${invoice.date}`);
    doc.text(`Échéance : ${invoice.dueDate}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text(invoice.type === 'VENTE' ? 'Client :' : 'Fournisseur :');
    doc.font('Helvetica').text(invoice.tierName);
    doc.moveDown(1);

    const tableTop = doc.y;
    const colX = { desc: 50, qty: 260, pu: 320, tva: 390, total: 450 };
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Désignation', colX.desc, tableTop);
    doc.text('Qté', colX.qty, tableTop);
    doc.text('P.U.', colX.pu, tableTop);
    doc.text('TVA %', colX.tva, tableTop);
    doc.text('Total TTC', colX.total, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    let y = tableTop + 22;
    doc.font('Helvetica').fontSize(9);
    for (const item of invoice.items) {
      doc.text(item.description, colX.desc, y, { width: 200 });
      doc.text(String(item.quantity), colX.qty, y);
      doc.text(formatMoney(Number(item.unitPrice), currency), colX.pu, y);
      doc.text(`${item.tvaRate}%`, colX.tva, y);
      doc.text(formatMoney(Number(item.totalTTC), currency), colX.total, y);
      y += 20;
    }

    doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();
    y += 15;
    doc.font('Helvetica').text(`Sous-total HT : ${formatMoney(Number(invoice.subtotalHT), currency)}`, 350, y, { align: 'right', width: 195 });
    y += 15;
    doc.text(`TVA : ${formatMoney(Number(invoice.totalTVA), currency)}`, 350, y, { align: 'right', width: 195 });
    if (Number(invoice.totalAIR) > 0) {
      y += 15;
      doc.text(`Retenue AIR (${invoice.airRate}%) : -${formatMoney(Number(invoice.totalAIR), currency)}`, 350, y, { align: 'right', width: 195 });
    }
    y += 18;
    doc.font('Helvetica-Bold').fontSize(11).text(`Net à payer TTC : ${formatMoney(Number(invoice.totalTTC), currency)}`, 350, y, { align: 'right', width: 195 });

    if (invoice.notes) {
      doc.moveDown(3);
      doc.font('Helvetica').fontSize(9).text(`Notes : ${invoice.notes}`);
    }

    doc.fontSize(8).fillColor('#888888').text(
      'Document généré automatiquement — Conforme au plan comptable SYSCOHADA révisé.',
      50,
      doc.page.height - 60,
      { align: 'center', width: 495 },
    );

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
