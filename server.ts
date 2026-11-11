import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { PDFParse } from 'pdf-parse';
import * as XLSX from 'xlsx';
import { runInvoiceAudit } from './src/utils/auditEngine.ts';
import { AgreedProduct, InvoiceDocument, LeadSubmission, AuditSession, UserAccount } from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

import {
  createUser,
  authenticateUser,
  getUserById,
  validateSession,
  destroySession,
  saveAuditSession,
  getAuditsForUser,
  getAuditById,
  deleteAuditById,
  registerUploadedFile,
  linkFilesToAudit,
  saveLead,
  getAllLeads,
  getDatabaseStats
} from './src/db/database.ts';

// Authentication middleware helper (Strict: returns null when unauthenticated, NO demo-user fallback)
function getAuthenticatedUserId(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const userId = validateSession(token);
    if (userId) return userId;
  }
  return null;
}

// Server-Side Gemini Initialization
const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' && process.env.GEMINI_API_KEY.length > 10);
const ai = hasApiKey
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    })
  : null;

let isGeminiAvailable = false;
// Non-blocking connectivity probe
if (ai) {
  Promise.race([
    ai.models.generateContent({ model: 'gemini-3.8-flash', contents: 'test' }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini probe timeout')), 2500))
  ]).then(() => {
    isGeminiAvailable = true;
    console.log('[PriceGuard] Gemini 3.8 Flash model verified and ready.');
  }).catch((err) => {
    isGeminiAvailable = false;
    console.warn('[PriceGuard] Gemini API key scope/connectivity unverified, defaulting to native parser engine:', err.message || 'Scope error');
  });
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name, businessName, businessType } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const { user, token } = createUser({
      email,
      password,
      name,
      businessName,
      businessType
    });

    return res.status(201).json({ success: true, token, user });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(400).json({ error: err.message || 'Failed to create account.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const authResult = authenticateUser(email, password);
    if (!authResult) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    return res.json({ success: true, token: authResult.token, user: authResult.user });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to authenticate.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated. Please sign in.' });
  }
  const user = getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }
  return res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    destroySession(token);
  }
  return res.json({ success: true });
});

// ==========================================
// HEALTH & TEST FIXTURES
// ==========================================

app.get('/api/health', (req, res) => {
  const stats = getDatabaseStats();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!ai,
    geminiVerified: isGeminiAvailable,
    geminiModel: 'gemini-3.8-flash',
    geminiStatus: isGeminiAvailable ? 'READY' : 'BLOCKED (ACCESS_TOKEN_SCOPE_INSUFFICIENT)',
    parsers: ['pdf-parse', 'xlsx', 'regex-tabular'],
    database: stats
  });
});

app.get('/api/test-fixtures/files', (req, res) => {
  const fixturesDir = path.resolve('./test_fixtures');
  if (fs.existsSync(fixturesDir)) {
    const files = fs.readdirSync(fixturesDir).map(file => {
      const stat = fs.statSync(path.join(fixturesDir, file));
      return {
        fileName: file,
        sizeBytes: stat.size,
        downloadUrl: `/api/test-fixtures/${file}`
      };
    });
    return res.json({ files });
  }
  return res.json({ files: [] });
});

app.get('/api/test-fixtures/:filename', (req, res) => {
  const filePath = path.resolve('./test_fixtures', path.basename(req.params.filename));
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).send('Test fixture not found.');
});

// ==========================================
// PARSING & EXTRACTION ENGINES
// ==========================================

/**
 * Robust deterministic parser for invoice text extracted from PDFs or plaintext
 */
export function parseInvoiceTextToDocument(rawText: string, fileName: string): InvoiceDocument {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  let supplierName = 'Supplier Document';
  let invoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
  let invoiceDate = new Date().toISOString().split('T')[0];
  let currency = 'USD';
  let totalAmount = 0;
  const lineItems: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    // Detect Invoice Number (avoiding lines containing 'total', 'amount', 'date')
    if (!/total|amount|date/i.test(l) && /invoice\s*(?:number|#|no\.?|id|code)?\s*[:\-]?\s*([A-Za-z0-9\-]+)/i.test(l)) {
      const m = l.match(/invoice\s*(?:number|#|no\.?|id|code)?\s*[:\-]?\s*([A-Za-z0-9\-]+)/i);
      if (m && m[1] && m[1].toUpperCase() !== 'TOTAL') {
        invoiceNumber = m[1];
      }
    }

    // Detect Invoice Date
    if (/invoice\s*date\s*[:\-]?\s*([0-9]{4}[-/][0-9]{2}[-/][0-9]{2}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})/i.test(l)) {
      const m = l.match(/invoice\s*date\s*[:\-]?\s*([0-9]{4}[-/][0-9]{2}[-/][0-9]{2}|[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})/i);
      if (m && m[1]) invoiceDate = m[1];
    }

    // Detect Supplier Name (typically in top 6 lines)
    if (i < 6 && /^[A-Z][A-Za-z0-9 &.,'-]+(?:Co\.|LLC|Inc\.|Produce|Meats|Hospitality|Supply|Chemicals|Linen)/i.test(l)) {
      supplierName = l.replace(/^supplier\s*[:\-]?\s*/i, '').trim();
    } else if (i < 6 && /^supplier\s*[:\-]?\s*([A-Za-z0-9 &.,'-]+)/i.test(l)) {
      const m = l.match(/^supplier\s*[:\-]?\s*([A-Za-z0-9 &.,'-]+)/i);
      if (m && m[1]) supplierName = m[1].trim();
    }

    // Detect Total Amount
    if (/(?:total(?:\s*amount|\s*due)?|subtotal|balance\s*due)\s*[:\$]?\s*([0-9,]+\.[0-9]{2})/i.test(l)) {
      const m = l.match(/(?:total(?:\s*amount|\s*due)?|subtotal|balance\s*due)\s*[:\$]?\s*([0-9,]+\.[0-9]{2})/i);
      if (m && m[1]) totalAmount = parseFloat(m[1].replace(/,/g, ''));
    }

    // Parse Tabular Line Items
    // Format A: Pipe-separated: SKU | Description | Qty | Unit | Unit Price | Total
    if (l.includes('|')) {
      const parts = l.split('|').map(p => p.trim());
      if (parts.length >= 4) {
        if (/description|unit price|item code|qty/i.test(parts[0]) || /description|unit price/i.test(parts[1])) {
          continue;
        }
        let code = '';
        let desc = '';
        let qty = 1;
        let unit = 'EA';
        let price = 0;
        let lineTotal = 0;

        if (parts.length >= 6) {
          code = parts[0];
          desc = parts[1];
          qty = parseFloat(parts[2]);
          unit = parts[3].toUpperCase();
          price = parseFloat(parts[4]);
          lineTotal = parseFloat(parts[5]);
        } else if (parts.length >= 4) {
          desc = parts[0];
          qty = parseFloat(parts[1]);
          unit = parts[2].toUpperCase();
          price = parseFloat(parts[3]);
          lineTotal = parts[4] ? parseFloat(parts[4]) : qty * price;
        }

        if (!isNaN(qty) && !isNaN(price)) {
          lineItems.push({
            id: `li-${lineItems.length}`,
            lineIndex: lineItems.length,
            rawCode: code,
            rawDescription: desc,
            quantity: qty,
            unit: unit || 'UNIT',
            invoicedUnitPrice: price,
            lineTotal: isNaN(lineTotal) ? qty * price : lineTotal,
            sourceTextRef: l
          });
        }
      }
    }
    // Format B: Comma or tab separated
    else if (l.includes(',') || l.includes('\t')) {
      const parts = l.split(/[,\t]/).map(p => p.trim());
      if (parts.length >= 4 && !/description|item/i.test(parts[0])) {
        const code = parts.length >= 5 ? parts[0] : '';
        const desc = parts.length >= 5 ? parts[1] : parts[0];
        const qty = parseFloat(parts.length >= 5 ? parts[2] : parts[1]);
        const unit = parts.length >= 5 ? parts[3] : 'UNIT';
        const price = parseFloat(parts.length >= 5 ? parts[4] : parts[2]);
        const total = parts.length >= 6 ? parseFloat(parts[5]) : qty * price;

        if (!isNaN(qty) && !isNaN(price)) {
          lineItems.push({
            id: `li-${lineItems.length}`,
            lineIndex: lineItems.length,
            rawCode: code,
            rawDescription: desc,
            quantity: qty,
            unit: unit.toUpperCase() || 'UNIT',
            invoicedUnitPrice: price,
            lineTotal: isNaN(total) ? qty * price : total,
            sourceTextRef: l
          });
        }
      }
    }
    // Format C: Multi-space column separated (common in plain PDF text layouts)
    else if (/\s{2,}/.test(l)) {
      const parts = l.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 4 && !/description|item|quantity|unit|amount|subtotal/i.test(parts[0])) {
        const code = parts.length >= 5 ? parts[0] : '';
        const desc = parts.length >= 5 ? parts[1] : parts[0];
        const qty = parseFloat(parts.length >= 5 ? parts[2] : parts[1]);
        const unit = parts.length >= 5 ? parts[3] : 'UNIT';
        const price = parseFloat(parts.length >= 5 ? parts[4] : parts[2]);
        const total = parts.length >= 6 ? parseFloat(parts[5]) : qty * price;

        if (!isNaN(qty) && !isNaN(price) && price > 0) {
          lineItems.push({
            id: `li-${lineItems.length}`,
            lineIndex: lineItems.length,
            rawCode: code,
            rawDescription: desc,
            quantity: qty,
            unit: unit.toUpperCase() || 'UNIT',
            invoicedUnitPrice: price,
            lineTotal: isNaN(total) ? qty * price : total,
            sourceTextRef: l
          });
        }
      }
    }
    // Format D: Key-value or narrative item format (e.g. "Item: Wagyu Beef, Qty: 4, Rate: $45.00")
    else if (/qty|quantity/i.test(l) && /(?:price|rate|\$)/i.test(l)) {
      const descMatch = l.match(/(?:item|product|desc)?\s*[:\-]?\s*([A-Za-z0-9\s/]+?)(?:,|qty|\$|\b[0-9])/i);
      const qtyMatch = l.match(/(?:qty|quantity)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i);
      const priceMatch = l.match(/(?:rate|price|unit\s*price)?\s*[:\$]?\s*([0-9]+\.[0-9]{2})/i);
      const totalMatch = l.match(/(?:total|amount)\s*[:\$]?\s*([0-9]+\.[0-9]{2})/i);

      if (priceMatch) {
        const desc = descMatch ? descMatch[1].trim() : 'Unspecified Item';
        const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
        const price = parseFloat(priceMatch[1]);
        const lineTotal = totalMatch ? parseFloat(totalMatch[1]) : qty * price;

        if (!isNaN(qty) && !isNaN(price)) {
          lineItems.push({
            id: `li-${lineItems.length}`,
            lineIndex: lineItems.length,
            rawCode: '',
            rawDescription: desc,
            quantity: qty,
            unit: 'UNIT',
            invoicedUnitPrice: price,
            lineTotal,
            sourceTextRef: l
          });
        }
      }
    }
  }

  if (totalAmount === 0 && lineItems.length > 0) {
    totalAmount = Math.round(lineItems.reduce((acc, cur) => acc + cur.lineTotal, 0) * 100) / 100;
  }

  return {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    supplierName,
    invoiceDate,
    currency,
    subtotal: totalAmount,
    totalAmount,
    sourceFileName: fileName,
    lineItems,
    extractionEngine: 'native_pdf_parser'
  };
}

// ==========================================
// INVOICE EXTRACTION ENDPOINT
// ==========================================
app.post('/api/extract/invoice', async (req, res) => {
  try {
    const { text, fileData, mimeType, fileName } = req.body;

    if (!text && !fileData) {
      return res.status(400).json({ error: 'Either document text or fileData must be provided.' });
    }

    let extractedText = text || '';

    // If PDF fileData (base64) was provided, extract text with PDFParse
    const isPDF = (mimeType && mimeType.includes('pdf')) || (fileName && fileName.toLowerCase().endsWith('.pdf'));
    let registeredFileId: string | null = null;

    if (fileData && isPDF) {
      try {
        const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');
        const pdfBuffer = Buffer.from(cleanBase64, 'base64');
        const parser = new PDFParse({ data: pdfBuffer });
        await (parser as any).load();
        const pdfTextResult = await parser.getText();
        extractedText = pdfTextResult.text || '';

        // Check for scanned image documents (PDF with zero/minimal extractable text)
        if (!extractedText || extractedText.trim().length < 25 || !/[a-zA-Z]{3,}/.test(extractedText)) {
          return res.status(422).json({
            success: false,
            error: 'Document appears to be a scanned image with no embedded text layer. OCR processing is required.',
            isScannedDocument: true,
            ocrStatus: 'BLOCKED (GEMINI_API_KEY required for vision OCR)'
          });
        }

        // Securely register upload in private database-tracked storage
        const userId = getAuthenticatedUserId(req);
        if (userId) {
          const registered = registerUploadedFile(userId, fileName || 'invoice.pdf', pdfBuffer, mimeType || 'application/pdf');
          registeredFileId = registered.fileId;
        }
      } catch (pdfErr) {
        console.error('PDFParse extraction error:', pdfErr);
      }
    }

    // Try Gemini AI extraction if verified and available
    if (ai && isGeminiAvailable && extractedText) {
      try {
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Extract the supplier invoice into structured JSON from this text:\n\n${extractedText}`,
          config: {
            systemInstruction: 'You extract hotel and restaurant supplier invoices into structured JSON. Always provide accurate arithmetic.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                supplierName: { type: Type.STRING },
                invoiceNumber: { type: Type.STRING },
                invoiceDate: { type: Type.STRING },
                currency: { type: Type.STRING },
                totalAmount: { type: Type.NUMBER },
                lineItems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      rawCode: { type: Type.STRING },
                      rawDescription: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                      unit: { type: Type.STRING },
                      invoicedUnitPrice: { type: Type.NUMBER },
                      lineTotal: { type: Type.NUMBER }
                    },
                    required: ['rawDescription', 'quantity', 'invoicedUnitPrice', 'lineTotal']
                  }
                }
              },
              required: ['supplierName', 'invoiceNumber', 'lineItems', 'totalAmount']
            }
          }
        });

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI extraction timeout')), 4000));
        const geminiResponse = await Promise.race([geminiPromise, timeoutPromise]) as any;

        const jsonText = geminiResponse.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          const doc: InvoiceDocument = {
            id: `inv-${Date.now()}`,
            invoiceNumber: parsed.invoiceNumber || 'INV-001',
            supplierName: parsed.supplierName || 'Supplier',
            invoiceDate: parsed.invoiceDate || new Date().toISOString().split('T')[0],
            currency: parsed.currency || 'USD',
            subtotal: parsed.totalAmount || 0,
            totalAmount: parsed.totalAmount || 0,
            sourceFileName: fileName || 'uploaded_invoice.pdf',
            lineItems: (parsed.lineItems || []).map((li: any, idx: number) => ({
              id: `li-${Date.now()}-${idx}`,
              lineIndex: idx,
              rawCode: li.rawCode || '',
              rawDescription: li.rawDescription || 'Unnamed Item',
              quantity: Number(li.quantity) || 1,
              unit: li.unit || 'UNIT',
              invoicedUnitPrice: Number(li.invoicedUnitPrice) || 0,
              lineTotal: Number(li.lineTotal) || (Number(li.quantity) * Number(li.invoicedUnitPrice)),
              sourceTextRef: `Line ${idx + 1}: ${li.rawDescription} - ${li.quantity} @ $${li.invoicedUnitPrice}`
            })),
            extractionEngine: 'gemini_3.8_flash'
          };
          return res.json({ success: true, invoice: doc, fileId: registeredFileId, method: 'gemini' });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini extraction unavailable or failed, using native parser:', geminiErr.message || geminiErr);
      }
    }

    // Deterministic parser execution
    const invoiceDoc = parseInvoiceTextToDocument(extractedText, fileName || 'invoice.pdf');
    return res.json({ success: true, invoice: invoiceDoc, fileId: registeredFileId, method: 'native_pdf_parser' });
  } catch (err: any) {
    console.error('Invoice extraction route error:', err);
    return res.status(500).json({ error: 'Failed to extract invoice.' });
  }
});

// ==========================================
// PRICE LIST EXTRACTION ENDPOINT (CSV / XLSX)
// ==========================================
app.post('/api/extract/pricelist', (req, res) => {
  try {
    const { fileData, fileName, csvContent, textContent, supplierName } = req.body;
    let products: AgreedProduct[] = [];

    // Check if XLSX or XLS fileData provided
    const isExcel = fileName && (fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls'));
    if (fileData && isExcel) {
      const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');
      const excelBuffer = Buffer.from(cleanBase64, 'base64');
      const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

      rawRows.forEach((row, idx) => {
        // Find price field
        let agreedPrice = 0;
        let sku = `SKU-${idx + 1}`;
        let name = `Product ${idx + 1}`;
        let unit = 'UNIT';
        let packSize = '';
        let effectiveFrom = '2020-01-01';
        let effectiveTo: string | undefined = undefined;

        for (const [key, val] of Object.entries(row)) {
          const k = key.toLowerCase();
          const strVal = String(val).trim();

          if (/sku|code|item\s*no|prod\s*id/i.test(k)) {
            sku = strVal;
          } else if (/name|description|item|product/i.test(k)) {
            name = strVal;
          } else if (/price|rate|agreed|contract/i.test(k)) {
            const num = parseFloat(strVal.replace(/[$,]/g, ''));
            if (!isNaN(num)) agreedPrice = num;
          } else if (/unit|uom/i.test(k)) {
            unit = strVal.toUpperCase();
          } else if (/pack|size|case|packaging/i.test(k)) {
            packSize = strVal;
          } else if (/effective.*from|start.*date|valid.*from/i.test(k)) {
            effectiveFrom = strVal;
          } else if (/effective.*to|end.*date|valid.*to|expires/i.test(k)) {
            effectiveTo = strVal;
          }
        }

        if (agreedPrice > 0) {
          products.push({
            id: `prod-${Date.now()}-${idx}`,
            sku,
            name,
            category: 'Agreed Contract Catalog',
            agreedPrice,
            unit,
            packSize,
            effectiveFrom,
            effectiveTo
          });
        }
      });

      return res.json({ success: true, productsCount: products.length, products, format: 'xlsx' });
    }

    // Otherwise process CSV or text
    const content = csvContent || textContent || '';
    if (!content) {
      return res.status(400).json({ error: 'Price list content or file is required.' });
    }

    const lines = content.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const separator = content.includes(';') ? ';' : content.includes('\t') ? '\t' : ',';
    
    // Check if first row is a header
    const hasHeader = /sku|price|item|product|code|unit|rate|name/i.test(lines[0]);
    let skuCol = -1;
    let nameCol = -1;
    let priceCol = -1;
    let unitCol = -1;
    let packCol = -1;
    let effectiveFromCol = -1;
    let effectiveToCol = -1;

    if (hasHeader) {
      const headerCols = lines[0].split(separator).map((c: string) => c.replace(/^["']|["']$/g, '').trim().toLowerCase());
      headerCols.forEach((h: string, idx: number) => {
        if (/sku|code|item\s*#|prod\s*id/i.test(h)) skuCol = idx;
        else if (/name|description|product|item/i.test(h)) nameCol = idx;
        else if (/price|rate|agreed|cost/i.test(h)) priceCol = idx;
        else if (/unit|uom/i.test(h)) unitCol = idx;
        else if (/pack|size|packaging/i.test(h)) packCol = idx;
        else if (/effective.*from|start.*date|valid.*from/i.test(h)) effectiveFromCol = idx;
        else if (/effective.*to|end.*date|valid.*to|expires/i.test(h)) effectiveToCol = idx;
      });
    }

    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(separator).map((c: string) => c.replace(/^["']|["']$/g, '').trim());

      if (cols.length >= 2) {
        let sku = '';
        let name = '';
        let agreedPrice = 0;
        let unit = 'UNIT';
        let packSize = '';
        let effectiveFrom = '2020-01-01';
        let effectiveTo: string | undefined = undefined;

        if (priceCol !== -1 && cols[priceCol] !== undefined) {
          const cleanNum = cols[priceCol].replace(/[$,]/g, '').trim();
          const parsedNum = parseFloat(cleanNum);
          if (!isNaN(parsedNum) && parsedNum > 0) {
            agreedPrice = parsedNum;
            sku = skuCol !== -1 ? cols[skuCol] : `SKU-${i}`;
            name = nameCol !== -1 ? cols[nameCol] : cols[0];
            unit = unitCol !== -1 && cols[unitCol] ? cols[unitCol] : 'UNIT';
            packSize = packCol !== -1 && cols[packCol] ? cols[packCol] : '';
            if (effectiveFromCol !== -1 && cols[effectiveFromCol]) effectiveFrom = cols[effectiveFromCol];
            if (effectiveToCol !== -1 && cols[effectiveToCol]) effectiveTo = cols[effectiveToCol];
          }
        } else {
          // Fallback: look for strictly numeric price column (e.g. 120.00, not '10 KG Box')
          let detectedPriceIdx = -1;
          for (let c = cols.length - 1; c >= 0; c--) {
            const cleanVal = cols[c].replace(/[$,]/g, '').trim();
            if (/^[0-9]+(?:\.[0-9]{1,4})?$/.test(cleanVal)) {
              detectedPriceIdx = c;
              break;
            }
          }

          if (detectedPriceIdx !== -1) {
            agreedPrice = parseFloat(cols[detectedPriceIdx].replace(/[$,]/g, '').trim());
            name = cols[detectedPriceIdx === 1 ? 0 : 1] || cols[0];
            sku = detectedPriceIdx > 1 ? cols[0] : `SKU-${i + 1}`;
            unit = cols[detectedPriceIdx + 1] || 'UNIT';
            packSize = cols[detectedPriceIdx + 2] || '';
          }
        }

        if (agreedPrice > 0) {
          products.push({
            id: `prod-${Date.now()}-${i}`,
            sku: sku || `SKU-${i + 1}`,
            name: name || `Product ${i + 1}`,
            category: 'Agreed Catalog',
            agreedPrice,
            unit: unit.toUpperCase() || 'UNIT',
            packSize,
            effectiveFrom,
            effectiveTo
          });
        }
      }
    }

    return res.json({ success: true, productsCount: products.length, products, format: 'csv' });
  } catch (err: any) {
    console.error('Price list parsing error:', err);
    return res.status(500).json({ error: 'Failed to parse price list.' });
  }
});

// ==========================================
// AUDIT EXECUTION & PERSISTENCE
// ==========================================
app.post('/api/audit/run', (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Please sign in to run and save audits.' });
    }

    const { priceList, invoices, title, supplierName, industry, fileIds } = req.body;

    if (!Array.isArray(priceList) || priceList.length === 0) {
      return res.status(400).json({ error: 'Valid agreed price list is required.' });
    }
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ error: 'At least one invoice is required.' });
    }

    const { findings, summary } = runInvoiceAudit(priceList, invoices);

    const newAuditSession: AuditSession = {
      id: `audit-${Date.now()}`,
      userId,
      title: title || `${supplierName || 'Supplier'} Invoice Audit`,
      supplierName: supplierName || 'Hospitality Supplier',
      industry: industry || 'restaurant',
      createdAt: new Date().toISOString().split('T')[0],
      priceList,
      invoices,
      findings,
      summary
    };

    saveAuditSession(newAuditSession);

    // Explicitly link uploaded private files to this audit session
    if (Array.isArray(fileIds) && fileIds.length > 0) {
      linkFilesToAudit(newAuditSession.id, userId, fileIds);
    }

    return res.json({ success: true, audit: newAuditSession });
  } catch (err: any) {
    console.error('Audit execution error:', err);
    return res.status(500).json({ error: 'Failed to run audit comparison.' });
  }
});

app.get('/api/audits', (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  const userAudits = getAuditsForUser(userId);
  res.json({ audits: userAudits });
});

app.get('/api/audits/:id', (req, res) => {
  const { id } = req.params;
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  const audit = getAuditById(id, userId);
  if (!audit) {
    return res.status(404).json({ error: 'Audit session not found or unauthorized.' });
  }
  return res.json({ audit });
});

app.delete('/api/audits/:id', (req, res) => {
  const { id } = req.params;
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  const deleted = deleteAuditById(id, userId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Audit not found, unauthorized, or read-only.' });
  }
  res.json({ success: true, message: 'Audit session and associated documents deleted.' });
});

app.get('/api/audits/:id/export.csv', (req, res) => {
  const { id } = req.params;
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).send('Authentication required. Please sign in.');
  }
  const audit = getAuditById(id, userId);

  if (!audit) {
    return res.status(404).send('Audit session not found or unauthorized.');
  }

  const csvRows: string[] = [
    ['Invoice Number', 'Invoice Date', 'Supplier', 'Invoiced Item', 'Matched Agreed Product', 'Agreed SKU', 'Agreed Rate', 'Charged Rate', 'Quantity', 'Unit', 'Unit Diff', 'Potential Overcharge', 'Finding Type', 'Status', 'Evidence Calculation'].join(',')
  ];

  audit.findings.forEach(f => {
    const row = [
      `"${f.invoiceNumber}"`,
      `"${f.invoiceDate}"`,
      `"${f.supplierName.replace(/"/g, '""')}"`,
      `"${f.invoiceItem.rawDescription.replace(/"/g, '""')}"`,
      `"${f.matchedAgreedProduct?.name?.replace(/"/g, '""') || 'Unmatched'}"`,
      `"${f.matchedAgreedProduct?.sku || 'N/A'}"`,
      f.agreedPrice.toFixed(2),
      f.invoicedPrice.toFixed(2),
      f.quantity.toString(),
      `"${f.invoiceItem.unit}"`,
      f.unitPriceDiff.toFixed(2),
      f.potentialOvercharge.toFixed(2),
      `"${f.findingType}"`,
      `"${f.status}"`,
      `"${f.evidence.calculationExplanation.replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(','));
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="priceguard_audit_${id}.csv"`);
  res.send(csvRows.join('\n'));
});

// ==========================================
// LEADS SUBMISSION
// ==========================================
app.post('/api/leads', (req, res) => {
  try {
    const { name, email, businessName, businessType, locationsCount, estimatedMonthlySpend, reviewMethod, message } = req.body;

    if (!name || !email || !businessName) {
      return res.status(400).json({ error: 'Name, email, and business name are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid work email address.' });
    }

    const leadId = saveLead({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      businessName: businessName.trim(),
      businessType: businessType || 'Restaurant',
      locationsCount: locationsCount || '1',
      estimatedMonthlySpend: estimatedMonthlySpend || 'Not specified',
      message: [
        reviewMethod ? `Current Review Method: ${reviewMethod}` : '',
        message ? message.trim() : ''
      ].filter(Boolean).join('\n')
    });

    return res.status(201).json({
      success: true,
      leadId,
      message: 'Thank you. Your request for a supplier invoice audit has been received.'
    });
  } catch (err: any) {
    console.error('Lead submission error:', err);
    return res.status(500).json({ error: 'Internal server error processing lead request.' });
  }
});

// ==========================================
// AI ASSISTANT NAVIGATION & GUIDANCE ROUTE
// ==========================================
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { message, history, currentView } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Try Gemini AI only if configured and verified available
    if (ai && isGeminiAvailable) {
      try {
        const systemInstruction = `You are the friendly, intelligent in-app AI Assistant & Navigator for PriceGuard (Hospitality Supplier Invoice Auditing).
Your main job is to guide users on where every option, feature, and workflow is located in the application, and explain how to use it.
You can communicate in Urdu, Roman Urdu, or English depending on how the user addresses you. If the user writes in Urdu or Roman Urdu, reply warmly in natural Roman Urdu with clear steps!

Application Map & Options Guide:
1. "New Audit" (Naya Audit shuru karna):
   - Location: Click "Check Invoices" on the Hero page OR click "New Audit" in the top navigation bar.
   - Step 1: Upload Agreed Price List (CSV or Excel) or paste text / use sample catalog.
   - Step 2: Upload Supplier Invoices (PDF files or paste invoice text).
   - Step 3: Review Extracted Line Items & click "Run Deterministic Audit".
2. "Dashboard" (Audit Results & History dekhna):
   - Location: Click "Dashboard" in the top navigation bar.
   - Metric Cards: Strictly separates "Verified Rate Overcharges" ($) from "Possible Duplicate Exposure" ($) and "Unmatched & Review Needed".
   - Findings Table: Filter by "All", "Rate Overcharges", "Needs Review", or "Unmatched".
   - "Export CSV": Top right of audit detail screen, downloads the verified breakdown.
   - "Print / PDF": Top right of audit detail screen, opens browser print / PDF export.
   - "Evidence": Click the "Evidence" button on any row in the findings table to inspect exact rate math.
   - "Delete": Permanently removes the audit record.
3. "Sample Audit" (Bina files ke live demo try karna):
   - Location: Scroll down on the Home page to the "Interactive Sample Audit" section, or click "Explore Sample Audit" in the hero.
4. "Cost Calculator" (Estimated savings check karna):
   - Location: Scroll down on the Home page to the "Cost Exposure Calculator" section.
5. "Account Login / Register":
   - Location: Top right of navbar, click "Sign In" or user icon. All audits and uploaded files are securely tied to the user account in SQLite.

Navigation tags:
When you suggest a destination, you can append a tag on a new line:
[ACTION:NAVIGATE:new-audit] -> if advising them to start a new audit
[ACTION:NAVIGATE:dashboard] -> if advising them to check the dashboard
[ACTION:NAVIGATE:landing] -> if advising them to go to home/landing page
[ACTION:SCROLL:sample-audit] -> if advising them to check sample audit
[ACTION:SCROLL:calculator] -> if advising them to check calculator
[ACTION:OPEN:auth] -> if advising them to sign in or register

Keep your guidance clear, scannable, and helpful with bullet points where appropriate.`;

        const contents: any[] = [];
        if (Array.isArray(history)) {
          for (const h of history.slice(-6)) {
            contents.push({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            });
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: `Current User View: ${currentView || 'unknown'}\n\nUser Question: ${message}` }]
        });

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction
          }
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI Assistant timeout')), 6000)
        );

        const geminiRes = await Promise.race([geminiPromise, timeoutPromise]) as any;

        const reply = geminiRes.text;
        if (reply) {
          let action: { type: string; target: string } | null = null;
          const actionMatch = reply.match(/\[ACTION:([A-Z]+):([a-z\-]+)\]/);
          if (actionMatch) {
            action = { type: actionMatch[1], target: actionMatch[2] };
          }
          const cleanReply = reply.replace(/\[ACTION:[A-Z]+:[a-z\-]+\]/g, '').trim();

          return res.json({
            success: true,
            reply: cleanReply,
            action,
            source: 'gemini'
          });
        }
      } catch {
        // Fall back gracefully to local navigation guide without throwing errors
      }
    }

    // Contextual deterministic fallback guide (fluent Roman Urdu / English)
    const lower = message.toLowerCase();
    let reply = '';
    let action: { type: string; target: string } | null = null;

    if (lower.includes('dashboard') || lower.includes('history') || lower.includes('result') || lower.includes('findings')) {
      reply = `**Dashboard aur Audit History dekhne ke liye:**\n\n- Top Navbar mein **"Dashboard"** par click karein.\n- Wahan aapko:\n  1. **Audit Summary:** Verified Rate Overcharges, Duplicate Exposure, aur Total Spend ke cards dikhenge.\n  2. **Findings Table:** Har line item ki comparison, agreed rate, invoiced rate aur exact difference.\n  3. **Evidence Math:** Kisi bhi row par **"Evidence"** button dabane se calculation formula khul jayega.\n  4. **Export CSV / PDF:** Top right buttons se complete report download ho jati hai.`;
      action = { type: 'NAVIGATE', target: 'dashboard' };
    } else if (lower.includes('audit') && (lower.includes('kahan') || lower.includes('kaise') || lower.includes('start') || lower.includes('shuru') || lower.includes('new') || lower.includes('run'))) {
      reply = `**Naya Audit shuru karne ke liye:**\n\n1. **Top Navbar** mein **"New Audit"** par click karein (ya neeche diye gaye button par click karein).\n2. **Step 1 (Price List):** Apna agreed supplier catalog CSV/Excel format mein upload karein ya text paste karein.\n3. **Step 2 (Invoices):** Supplier ki PDF invoices upload karein.\n4. **Step 3 (Review & Run):** Extracted items check karke **"Run Deterministic Audit"** dabayein.\n\nAapko foran rate overcharges aur duplicate detection mil jayegi!`;
      action = { type: 'NAVIGATE', target: 'new-audit' };
    } else if (lower.includes('price list') || lower.includes('pricelist') || lower.includes('rate list') || lower.includes('catalog') || lower.includes('contract')) {
      reply = `**Supplier Price List kahan upload karni hai?**\n\n- Top bar mein **"New Audit"** par jayein.\n- **Step 1: Agreed Price List** screen par aapko do options milenge:\n  1. **Upload File:** Apna CSV ya XLSX file choose karein.\n  2. **Paste CSV Text:** Direct product SKU, name, agreed rate paste karein.\n- Upload hone ke baad **"Proceed to Step 2"** click karein.`;
      action = { type: 'NAVIGATE', target: 'new-audit' };
    } else if (lower.includes('invoice') || lower.includes('pdf') || lower.includes('bill')) {
      reply = `**Supplier Invoices (PDF/Bills) kahan upload karein?**\n\n- **New Audit Wizard** ke **Step 2** par jayein.\n- Wahan **"Drop supplier invoice PDFs"** ka section hai jahan aap aik ya aik se ziyaada PDF invoices upload kar sakte hain.\n- Native parser invoice number, date, line items aur total amounts extract karega.`;
      action = { type: 'NAVIGATE', target: 'new-audit' };
    } else if (lower.includes('duplicate') || lower.includes('farq') || lower.includes('difference') || lower.includes('separation')) {
      reply = `**Price Overcharges vs Duplicate Invoices mein kya farq hai?**\n\nPriceGuard dono ko strictly separate rakhta hai:\n\n1. **Verified Rate Overcharges (Red Card):** Yeh woh items hain jahan supplier ne contract price se ziyaada unit rate charge kiya hai (e.g. $120 ki jagah $135).\n2. **Possible Duplicate Exposure (Amber Card):** Agar wahi invoice number dobara submit ho gaya ho, to poora invoice amount duplicate exposure mein alag show hota hai.\n\nDuplicate raqam ko line-item overcharge mein merge nahi kiya jata taake accurate financial reporting rahay!`;
      action = { type: 'NAVIGATE', target: 'dashboard' };
    } else if (lower.includes('export') || lower.includes('download') || lower.includes('csv') || lower.includes('pdf') || lower.includes('report') || lower.includes('print')) {
      reply = `**Audit Report download ya export kahan se hoti hai?**\n\n1. **Dashboard** mein ja kar kisi bhi audit ke **"View Results"** par click karein.\n2. Screen ke top-right par aapko do buttons milenge:\n   - **"Export CSV":** Tamam line items, calculated unit differences aur evidence formula ke sath spreadsheet download karta hai.\n   - **"Print / PDF":** Browser print dialog kholta hai jahan se aap report ko PDF save kar sakte hain.`;
      action = { type: 'NAVIGATE', target: 'dashboard' };
    } else if (lower.includes('login') || lower.includes('sign in') || lower.includes('account') || lower.includes('register') || lower.includes('logout')) {
      reply = `**User Account & Authentication:**\n\n- Top right navbar mein **"Sign In"** button par click karein.\n- Agar pehle se account hai to Login karein, warna **"Create Account"** tab par click karke naya account banayein.\n- Login hone ke baad aapke tamam audit reports aur files secure SQLite database mein store rehti hain aur refresh/logout ke baad bhi safe rehti hain.`;
      action = { type: 'OPEN', target: 'auth' };
    } else if (lower.includes('sample') || lower.includes('demo') || lower.includes('test')) {
      reply = `**Interactive Sample Audit kahan hai?**\n\n- Home page par scroll karein ya Hero section mein **"Explore Sample Audit"** button dabayein.\n- Yeh aapko live demo par le jayega jahan bina koi file upload kiye Restaurant aur Hotel sample audits inspect kar sakte hain!`;
      action = { type: 'SCROLL', target: 'sample-audit' };
    } else if (lower.includes('calculator') || lower.includes('saving') || lower.includes('bachat') || lower.includes('spend')) {
      reply = `**Cost Exposure Calculator:**\n\n- Home page par scroll karein, Problem section ke foran baad **Cost Exposure Calculator** mojood hai.\n- Wahan aap apna monthly supplier spend select karke estimated annual overcharge exposure check kar sakte hain.`;
      action = { type: 'SCROLL', target: 'calculator' };
    } else if (lower.includes('delete') || lower.includes('remove') || lower.includes('khatam')) {
      reply = `**Audit Record Delete karna:**\n\n- **Dashboard** mein ja kar mutaliqa audit open karein.\n- Header ke right side par laal rang ka **"Delete"** button mojood hai.\n- Confirm karne par audit database se permanently remove ho jayega.`;
      action = { type: 'NAVIGATE', target: 'dashboard' };
    } else {
      reply = `Assalam-o-Alaikum! Main **PriceGuard AI Guide** hoon.\n\nMain aapko guide kar sakta hoon ke app ka har option kahan hai:\n- **"Naya audit kahan se shuru karein?"**\n- **"Price list kahan upload karni hai?"**\n- **"PDF invoices kahan daalni hain?"**\n- **"Audit report CSV/PDF kahan se download hogi?"**\n- **"Overcharges aur duplicates ka farq kahan dikhta hai?"**\n\nAap jis option ke baray mein bhi poochenge, main aapko step-by-step bataonga aur direct wahan le jaonga!`;
    }

    return res.json({
      success: true,
      reply,
      action,
      source: 'local_guide'
    });
  } catch (err: any) {
    console.error('Assistant chat route error:', err);
    return res.status(500).json({ error: 'Failed to process assistant request.' });
  }
});

// ==========================================
// VITE OR STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PriceGuard server active on http://0.0.0.0:${PORT}`);
  });
}

const isMain = process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'));
if (isMain) {
  startServer();
}
