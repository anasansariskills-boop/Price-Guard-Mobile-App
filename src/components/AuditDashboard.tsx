import React, { useState, useEffect } from 'react';
import { AuditSession, AgreedProduct, InvoiceDocument, DiscrepancyFinding, FindingStatus, UserAccount } from '../types/index.ts';
import { SAMPLE_RESTAURANT_AUDIT, SAMPLE_HOTEL_AUDIT, RESTAURANT_PRICELIST, HOTEL_PRICELIST } from '../fixtures/sampleAudits';
import { executeAudit, parsePriceList, extractInvoiceFromDocument, getSavedAudits, deleteAuditSession } from '../services/api';
import { generateSupplierEmailDraft, recalculateAuditSummary } from '../utils/auditEngine.ts';

interface AuditDashboardProps {
  initialMode?: 'dashboard' | 'new-audit';
  currentUser: UserAccount | null;
  onNavigateHome: () => void;
  onRequestPilot: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  initialMode = 'dashboard',
  currentUser,
  onNavigateHome,
  onRequestPilot,
  onOpenAuth,
  onLogout
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'wizard'>(
    initialMode === 'new-audit' ? 'wizard' : 'list'
  );
  const [audits, setAudits] = useState<AuditSession[]>([SAMPLE_RESTAURANT_AUDIT, SAMPLE_HOTEL_AUDIT]);
  const [activeAudit, setActiveAudit] = useState<AuditSession>(SAMPLE_RESTAURANT_AUDIT);
  const [filterTab, setFilterTab] = useState<'all' | 'overcharge' | 'review' | 'unmatched'>('all');

  // Modals inside dashboard
  const [evidenceFinding, setEvidenceFinding] = useState<DiscrepancyFinding | null>(null);
  const [emailFinding, setEmailFinding] = useState<DiscrepancyFinding | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [auditTitle, setAuditTitle] = useState<string>('Q4 Full Supplier Verification Audit');
  const [supplierName, setSupplierName] = useState<string>('Artisan Meats & Pacific Coast');
  const [industry, setIndustry] = useState<'restaurant' | 'hotel'>('restaurant');
  
  // Wizard Step 1: Agreed Price List
  const [priceListType, setPriceListType] = useState<'preset' | 'file' | 'custom'>('preset');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [customCsvText, setCustomCsvText] = useState<string>(
`SKU,Product Name,Agreed Price,Unit,Pack Size
POUL-001,Boneless Chicken Breast 1 KG,4.00,KG,1 KG Vac
BEEF-102,Grass-Fed Beef Tenderloin AAA,28.50,KG,2.5 KG Cryovac
BEEF-105,Ground Chuck 80/20 Fresh,6.20,KG,5 KG Coarse
OIL-012,Extra Virgin Olive Oil 4x5L,72.00,CASE,4 x 5L Tin Case
DAIRY-030,Whole Milk Mozzarella 2kg Block,12.00,BLOCK,2 KG Solid
PROD-091,San Marzano Style Tomatoes 6x#10,42.00,CASE,6 x #10 Tins
OIL-011,Canola Frying Oil 16L,32.00,CASE,16L JIB
SPEC-010,White Truffle Oil 250ml,19.50,EA,250ml Glass`
  );
  const [parsedPriceList, setParsedPriceList] = useState<AgreedProduct[]>(RESTAURANT_PRICELIST);
  const [isParsingPriceList, setIsParsingPriceList] = useState<boolean>(false);

  // Wizard Step 2 & 3: Invoices & Extracted Line Items
  const [uploadedFilesList, setUploadedFilesList] = useState<{ name: string; size: number }[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [extractedInvoices, setExtractedInvoices] = useState<InvoiceDocument[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  // Load server-saved audits on mount & on user change (strictly isolated)
  useEffect(() => {
    async function load() {
      if (currentUser && currentUser.id !== 'demo-user') {
        const serverAudits = await getSavedAudits();
        if (serverAudits && serverAudits.length > 0) {
          setAudits([...serverAudits, SAMPLE_RESTAURANT_AUDIT, SAMPLE_HOTEL_AUDIT]);
          return;
        }
      }
      // Demo samples for unauthenticated or public viewers (read-only)
      setAudits([SAMPLE_RESTAURANT_AUDIT, SAMPLE_HOTEL_AUDIT]);
    }
    load();
  }, [currentUser]);

  // Load pre-made 15-product test fixture into price list
  const handleLoadTestPriceListFixture = async () => {
    setIsParsingPriceList(true);
    try {
      const res = await fetch('/api/test-fixtures/supplier_pricelist_15_items.csv');
      const csvText = await res.text();
      const parseRes = await parsePriceList({ csvContent: csvText, supplierName: 'Artisan Meats & Pacific Coast' });
      setIsParsingPriceList(false);

      if (parseRes.success && parseRes.products) {
        setParsedPriceList(parseRes.products);
        setPriceListType('file');
        setSelectedFileName('supplier_pricelist_15_items.xlsx (15 items)');
        setWizardStep(2);
      }
    } catch {
      setIsParsingPriceList(false);
      setParsedPriceList(RESTAURANT_PRICELIST);
      setWizardStep(2);
    }
  };

  // Handle uploading local file (.xlsx, .csv)
  const handlePriceListFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsParsingPriceList(true);

    const reader = new FileReader();
    const isBinary = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isBinary) {
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await parsePriceList({
          fileData: base64,
          fileName: file.name,
          supplierName
        });
        setIsParsingPriceList(false);
        if (res.success && res.products && res.products.length > 0) {
          setParsedPriceList(res.products);
          setWizardStep(2);
        } else {
          alert(res.error || 'Failed to parse Excel file.');
        }
      };
    } else {
      reader.readAsText(file);
      reader.onload = async () => {
        const text = reader.result as string;
        const res = await parsePriceList({
          csvContent: text,
          fileName: file.name,
          supplierName
        });
        setIsParsingPriceList(false);
        if (res.success && res.products && res.products.length > 0) {
          setParsedPriceList(res.products);
          setWizardStep(2);
        } else {
          alert(res.error || 'Failed to parse CSV file.');
        }
      };
    }
  };

  // Handle parsing price list in step 1
  const handleProceedFromPriceList = async () => {
    if (priceListType === 'preset') {
      setParsedPriceList(industry === 'restaurant' ? RESTAURANT_PRICELIST : HOTEL_PRICELIST);
      setWizardStep(2);
      return;
    }

    if (priceListType === 'custom') {
      setIsParsingPriceList(true);
      const res = await parsePriceList({ csvContent: customCsvText, supplierName });
      setIsParsingPriceList(false);
      if (res.success && res.products && res.products.length > 0) {
        setParsedPriceList(res.products);
        setWizardStep(2);
      } else {
        alert(res.error || 'Failed to parse price list text.');
      }
    }
  };

  // Handle loading the 3 PDF test fixtures automatically
  const handleLoadTestInvoicesFixtures = async () => {
    setIsExtracting(true);
    try {
      const fixtures = [
        'invoice_1_artisan_meats.pdf',
        'invoice_2_pacific_coast.pdf',
        'invoice_3_duplicate_artisan_meats.pdf'
      ];

      const docs: InvoiceDocument[] = [];
      for (const f of fixtures) {
        const res = await fetch(`/api/test-fixtures/${f}`);
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onloadend = () => resolve((r.result as string).split(',')[1]);
          r.readAsDataURL(blob);
        });

        const extRes = await extractInvoiceFromDocument({
          fileName: f,
          fileData: base64,
          mimeType: 'application/pdf'
        });

        if (extRes.success && extRes.invoice) {
          docs.push(extRes.invoice);
        }
      }

      setIsExtracting(false);
      setExtractedInvoices(docs);
      setUploadedFilesList(fixtures.map(name => ({ name, size: 2048 })));
      setWizardStep(3);
    } catch {
      setIsExtracting(false);
      alert('Failed to load test fixtures from server.');
    }
  };

  // Handle uploading real invoice PDF files
  const handleInvoiceFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsExtracting(true);
    const newDocs: InvoiceDocument[] = [];
    const fileInfos: { name: string; size: number }[] = [];
    const newFileIds: string[] = [];
    let scannedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      fileInfos.push({ name: file.name, size: file.size });

      const base64 = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onloadend = () => resolve((r.result as string).split(',')[1]);
        r.readAsDataURL(file);
      });

      const res = await extractInvoiceFromDocument({
        fileName: file.name,
        fileData: base64,
        mimeType: file.type || 'application/pdf'
      });

      if (res.isScannedDocument) {
        scannedCount++;
      }

      if (res.success && res.invoice) {
        newDocs.push(res.invoice);
        if (res.fileId) newFileIds.push(res.fileId);
      }
    }

    setIsExtracting(false);
    if (scannedCount > 0) {
      alert(`${scannedCount} document(s) appear to be scanned images with no embedded text. Automated OCR requires an active GEMINI_API_KEY.`);
    }

    if (newDocs.length > 0) {
      setExtractedInvoices(newDocs);
      setUploadedFilesList(fileInfos);
      setUploadedFileIds(newFileIds);
      setWizardStep(3);
    } else if (scannedCount === 0) {
      alert('Unable to extract data from uploaded files. Please ensure documents are valid PDFs or images.');
    }
  };

  // Allow user to edit line item in review step before calculating
  const handleUpdateLineItem = (invIndex: number, lineIndex: number, field: string, value: any) => {
    const updated = [...extractedInvoices];
    const item = { ...updated[invIndex].lineItems[lineIndex], [field]: value };
    if (field === 'quantity' || field === 'invoicedUnitPrice') {
      item.lineTotal = Math.round(Number(item.quantity) * Number(item.invoicedUnitPrice) * 100) / 100;
    }
    updated[invIndex].lineItems[lineIndex] = item;
    updated[invIndex].totalAmount = updated[invIndex].lineItems.reduce((acc, cur) => acc + cur.lineTotal, 0);
    setExtractedInvoices(updated);
  };

  // Execute deterministic comparison in step 3
  const handleRunNewAudit = async () => {
    if (!currentUser || currentUser.id === 'demo-user') {
      onOpenAuth();
      return;
    }

    setIsAuditing(true);
    const res = await executeAudit({
      priceList: parsedPriceList,
      invoices: extractedInvoices,
      title: auditTitle,
      supplierName,
      industry,
      fileIds: uploadedFileIds
    });
    setIsAuditing(false);

    if (res.success && res.audit) {
      setAudits([res.audit, ...audits]);
      setActiveAudit(res.audit);
      setViewMode('detail');
      setWizardStep(1);
    } else {
      alert(res.error || 'Audit execution failed.');
    }
  };

  // Toggle finding status in active audit with full recalculation
  const handleStatusChange = (findingId: string, newStatus: FindingStatus) => {
    const updatedFindings = activeAudit.findings.map(f => {
      if (f.id === findingId) {
        return { ...f, status: newStatus };
      }
      return f;
    });

    const newSummary = recalculateAuditSummary(
      updatedFindings,
      activeAudit.summary.totalInvoices,
      activeAudit.summary.totalInvoiceAmount,
      activeAudit.summary.totalLinesProcessed
    );

    const updatedAudit: AuditSession = {
      ...activeAudit,
      findings: updatedFindings,
      summary: newSummary
    };

    setActiveAudit(updatedAudit);
    setAudits(audits.map(a => a.id === updatedAudit.id ? updatedAudit : a));
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Delete current audit
  const handleDeleteAudit = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this audit record?')) {
      const ok = await deleteAuditSession(id);
      if (ok) {
        const remaining = audits.filter(a => a.id !== id);
        setAudits(remaining);
        if (remaining.length > 0) {
          setActiveAudit(remaining[0]);
          setViewMode('list');
        } else {
          setActiveAudit(SAMPLE_RESTAURANT_AUDIT);
          setViewMode('list');
        }
      } else {
        alert('Could not delete audit.');
      }
    }
  };

  // Export CSV of current audit
  const handleExportCSV = () => {
    const rows = [
      ['Invoice #', 'Date', 'Supplier', 'Invoiced Item', 'Matched Agreed Product', 'Agreed Rate', 'Charged Rate', 'Qty', 'Unit', 'Unit Diff', 'Potential Overcharge', 'Finding Type', 'Status', 'Calculation Formula']
    ];

    activeAudit.findings.forEach(f => {
      rows.push([
        `"${f.invoiceNumber}"`,
        `"${f.invoiceDate}"`,
        `"${f.supplierName.replace(/"/g, '""')}"`,
        `"${f.invoiceItem.rawDescription.replace(/"/g, '""')}"`,
        `"${f.matchedAgreedProduct?.name?.replace(/"/g, '""') || 'Unmatched'}"`,
        f.agreedPrice.toFixed(2),
        f.invoicedPrice.toFixed(2),
        f.quantity.toString(),
        `"${f.invoiceItem.unit}"`,
        f.unitPriceDiff.toFixed(2),
        f.potentialOvercharge.toFixed(2),
        `"${f.findingType}"`,
        `"${f.status}"`,
        `"${f.evidence.calculationExplanation.replace(/"/g, '""')}"`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `priceguard_audit_${activeAudit.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter findings
  const displayedFindings = activeAudit.findings.filter(f => {
    if (filterTab === 'all') return true;
    if (filterTab === 'overcharge') return f.findingType === 'price_mismatch';
    if (filterTab === 'review') return f.findingType === 'potential_mismatch' || f.findingType === 'pack_size_discrepancy';
    if (filterTab === 'unmatched') return f.findingType === 'unmatched_product' || f.findingType === 'duplicate_invoice';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F7F3] pb-24">
      {/* Workspace Header Strip */}
      <div className="bg-white border-b border-[#E1E3DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-14 py-2 sm:py-0 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#202923]/70 font-medium">
            <button
              onClick={() => setViewMode('list')}
              className="hover:text-[#214B3D] transition-colors cursor-pointer"
            >
              Audits
            </button>
            <span>/</span>
            <span className="text-[#202923] font-semibold truncate max-w-[160px] sm:max-w-xs">
              {viewMode === 'wizard' ? 'New Invoice Audit' : activeAudit.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Pill */}
            {currentUser && currentUser.id !== 'demo-user' ? (
              <div className="flex items-center gap-2 text-[#202923]/80">
                <span className="font-medium">{currentUser.name}</span>
                <span className="text-[#202923]/40">·</span>
                <button
                  onClick={onLogout}
                  className="text-xs text-[#A7443E] hover:underline cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="text-xs font-medium text-[#214B3D] hover:underline cursor-pointer"
              >
                Sign In / Register
              </button>
            )}

            {viewMode === 'detail' && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 text-xs font-medium text-[#202923] bg-[#F8F7F3] hover:bg-[#E7EDE5] border border-[#E1E3DD] rounded-sm transition-colors cursor-pointer"
                >
                  Download CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-medium text-[#202923] bg-[#F8F7F3] hover:bg-[#E7EDE5] border border-[#E1E3DD] rounded-sm transition-colors cursor-pointer"
                >
                  Print Report
                </button>
                <button
                  onClick={() => handleDeleteAudit(activeAudit.id)}
                  className="px-2.5 py-1.5 text-xs font-medium text-[#A7443E] hover:bg-[#FBF1F0] border border-[#A7443E]/20 rounded-sm transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </>
            )}

            <button
              onClick={() => {
                setWizardStep(1);
                setViewMode('wizard');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-sm transition-colors cursor-pointer shadow-xs"
            >
              + New Audit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">
        {/* ========================================================= */}
        {/* VIEW 1: AUDIT LIST DASHBOARD */}
        {/* ========================================================= */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202923]">
                  Supplier Invoice Audits
                </h1>
                <p className="text-xs text-[#202923]/70 mt-1">
                  Inspect identified price variances, unverified line items, and duplicate billing.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleLoadTestPriceListFixture();
                    setViewMode('wizard');
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-[#202923] bg-white hover:bg-[#F2F5F0] border border-[#E1E3DD] rounded-md transition-colors cursor-pointer shadow-xs"
                >
                  Quick Test with Fixtures
                </button>
                <button
                  onClick={() => {
                    setWizardStep(1);
                    setViewMode('wizard');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors cursor-pointer shadow-xs"
                >
                  Start New Invoice Check
                </button>
              </div>
            </div>

            {/* Audits Table */}
            <div className="bg-white border border-[#E1E3DD] rounded-lg overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8F7F3] border-b border-[#E1E3DD] text-[#202923]/70 font-semibold">
                    <th className="py-3 px-4">Audit Title / Supplier</th>
                    <th className="py-3 px-4">Sector</th>
                    <th className="py-3 px-4">Audit Date</th>
                    <th className="py-3 px-4 text-right">Invoices</th>
                    <th className="py-3 px-4 text-right">Total Invoiced</th>
                    <th className="py-3 px-4 text-right">Rate Overcharge</th>
                    <th className="py-3 px-4 text-right">Duplicate Exposure</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E3DD]">
                  {audits.map((a) => (
                    <tr key={a.id} className="hover:bg-[#F8F7F3]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#202923]">{a.title}</div>
                        <div className="text-[11px] text-[#202923]/60 mt-0.5">{a.supplierName}</div>
                      </td>
                      <td className="py-3.5 px-4 capitalize text-[#202923]/80">
                        {a.industry}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#202923]/70">
                        {a.createdAt}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#202923]">
                        {a.summary.totalInvoices} ({a.summary.totalLinesProcessed} lines)
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-[#202923]">
                        ${a.summary.totalInvoiceAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-[#A7443E]">
                        +${(a.summary.potentialPriceOvercharge ?? a.summary.totalPotentialOvercharge).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-[#BE825B]">
                        {(a.summary.duplicateInvoiceExposure || 0) > 0 ? `$${(a.summary.duplicateInvoiceExposure || 0).toFixed(2)}` : '$0.00'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setActiveAudit(a);
                            setViewMode('detail');
                          }}
                          className="px-3 py-1 text-xs font-semibold text-[#214B3D] hover:text-[#1A3C31] bg-[#F2F5F0] hover:bg-[#E7EDE5] border border-[#214B3D]/20 rounded-sm transition-colors cursor-pointer"
                        >
                          View Results
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-white rounded-lg border border-[#E1E3DD] flex items-center justify-between text-xs text-[#202923]/70">
              <span>Looking for enterprise assistance across multiple distribution centres?</span>
              <button
                onClick={onRequestPilot}
                className="font-semibold text-[#214B3D] hover:underline cursor-pointer"
              >
                Schedule Consultation →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: AUDIT DETAIL INSPECTION */}
        {/* ========================================================= */}
        {viewMode === 'detail' && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white p-6 rounded-lg border border-[#E1E3DD] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#BE825B] mb-1">
                    Verified Audit Report
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202923]">
                    {activeAudit.title}
                  </h1>
                  <div className="text-xs text-[#202923]/70 mt-1 flex flex-wrap items-center gap-2">
                    <span>{activeAudit.supplierName}</span>
                    <span>·</span>
                    <span>Audit Date: {activeAudit.createdAt}</span>
                    <span>·</span>
                    <span className="capitalize">{activeAudit.industry} Sector</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className="px-3 py-1.5 text-xs font-medium text-[#202923] bg-[#F8F7F3] hover:bg-[#E7EDE5] border border-[#E1E3DD] rounded-sm transition-colors cursor-pointer"
                  >
                    All Audits
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 text-xs font-semibold text-[#214B3D] bg-[#F2F5F0] hover:bg-[#E7EDE5] border border-[#214B3D]/30 rounded-sm transition-colors cursor-pointer"
                    title="Download verified findings as CSV"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={handlePrintPDF}
                    className="px-3 py-1.5 text-xs font-semibold text-[#202923] bg-white hover:bg-[#F8F7F3] border border-[#E1E3DD] rounded-sm transition-colors cursor-pointer"
                    title="Print report or save as PDF via browser"
                  >
                    Print / PDF
                  </button>
                  {activeAudit.id !== 'sample-restaurant-session' && activeAudit.id !== 'sample-hotel-session' && (
                    <button
                      onClick={() => handleDeleteAudit(activeAudit.id)}
                      className="px-2.5 py-1.5 text-xs text-[#A7443E] hover:bg-[#A7443E]/10 border border-[#A7443E]/30 rounded-sm transition-colors cursor-pointer"
                      title="Permanently remove audit"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* KPI Strip: Strictly separates Verified Price Overcharges, Duplicate Exposure, and Review Spend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E1E3DD]">
                <div className="bg-[#FAF9F5] p-3.5 rounded border border-[#E1E3DD]">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-[#202923]/60">Verified Rate Overcharges</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#A7443E] mt-1">
                    ${(activeAudit.summary.potentialPriceOvercharge !== undefined ? activeAudit.summary.potentialPriceOvercharge : activeAudit.summary.totalPotentialOvercharge).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-[#A7443E]/80 mt-1">
                    {activeAudit.summary.discrepancyCount} rate mismatch(es) on matched items
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-3.5 rounded border border-[#E1E3DD]">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-[#BE825B]">Possible Duplicate Exposure</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#BE825B] mt-1">
                    ${(activeAudit.summary.duplicateInvoiceExposure || 0).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-[#202923]/70 mt-1">
                    {activeAudit.summary.duplicateInvoiceCount || 0} duplicate invoice document(s) flagged
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-3.5 rounded border border-[#E1E3DD]">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-[#202923]/60">Unmatched & Review Needed</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#202923] mt-1">
                    ${((activeAudit.summary.unmatchedTotalAmount || 0) + (activeAudit.summary.needsReviewTotalAmount || 0)).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-[#202923]/60 mt-1">
                    {activeAudit.summary.unmatchedProductsCount || 0} unmatched · {activeAudit.summary.needsReviewCount || 0} pack/unit reviews
                  </div>
                </div>

                <div className="bg-[#FAF9F5] p-3.5 rounded border border-[#E1E3DD]">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-[#202923]/60">Total Billed Analyzed</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#214B3D] mt-1">
                    ${activeAudit.summary.totalInvoiceAmount.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-[#202923]/60 mt-1">
                    {activeAudit.summary.totalInvoices} invoice(s) · {activeAudit.summary.matchedLinesCount}/{activeAudit.summary.totalLinesProcessed} lines matched
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Segmented Control */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1 p-1 bg-white rounded-md border border-[#E1E3DD]">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-[#214B3D] text-white shadow-xs font-semibold'
                      : 'text-[#202923]/70 hover:text-[#202923]'
                  }`}
                >
                  All Items ({activeAudit.findings.length})
                </button>
                <button
                  onClick={() => setFilterTab('overcharge')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                    filterTab === 'overcharge'
                      ? 'bg-[#214B3D] text-white shadow-xs font-semibold'
                      : 'text-[#202923]/70 hover:text-[#202923]'
                  }`}
                >
                  Overcharges
                </button>
                <button
                  onClick={() => setFilterTab('review')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                    filterTab === 'review'
                      ? 'bg-[#214B3D] text-white shadow-xs font-semibold'
                      : 'text-[#202923]/70 hover:text-[#202923]'
                  }`}
                >
                  Pack / Ambiguous
                </button>
                <button
                  onClick={() => setFilterTab('unmatched')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                    filterTab === 'unmatched'
                      ? 'bg-[#214B3D] text-white shadow-xs font-semibold'
                      : 'text-[#202923]/70 hover:text-[#202923]'
                  }`}
                >
                  Unmatched / Dups
                </button>
              </div>

              <div className="text-xs text-[#202923]/60">
                Click status button on any row to mark as Confirmed or Dismissed.
              </div>
            </div>

            {/* Findings Table */}
            <div className="bg-white border border-[#E1E3DD] rounded-lg overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8F7F3] border-b border-[#E1E3DD] text-[#202923]/70 font-semibold">
                      <th className="py-3 px-4">Invoice Line / Item</th>
                      <th className="py-3 px-4">Matched Agreed Product</th>
                      <th className="py-3 px-4 text-right">Agreed</th>
                      <th className="py-3 px-4 text-right">Charged</th>
                      <th className="py-3 px-4 text-right">Qty</th>
                      <th className="py-3 px-4 text-right">Variance</th>
                      <th className="py-3 px-4 text-right">Potential Overcharge</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E3DD]">
                    {displayedFindings.map((f) => {
                      const isOvercharge = f.potentialOvercharge > 0;
                      return (
                        <tr key={f.id} className="hover:bg-[#F8F7F3]/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#202923]">
                              {f.invoiceItem.rawDescription}
                            </div>
                            <div className="text-[11px] text-[#202923]/60 mt-0.5">
                              Inv #{f.invoiceNumber} · Line {f.lineIndex + 1}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {f.matchedAgreedProduct ? (
                              <div>
                                <div className="text-[#202923] font-medium">
                                  {f.matchedAgreedProduct.name}
                                </div>
                                <div className="text-[11px] text-[#202923]/60 mt-0.5">
                                  SKU: {f.matchedAgreedProduct.sku} · {f.matchMethod.replace('_', ' ')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[#BE825B] font-medium">
                                {f.findingType === 'duplicate_invoice' ? 'Duplicate Invoice' : 'Unmatched'}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#202923]">
                            {f.agreedPrice > 0 ? `$${f.agreedPrice.toFixed(2)}` : 'N/A'}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#202923]">
                            ${f.invoicedPrice.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#202923]">
                            {f.quantity} {f.invoiceItem.unit}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            {f.unitPriceDiff > 0 ? (
                              <span className="text-[#A7443E] font-semibold">+${f.unitPriceDiff.toFixed(2)}</span>
                            ) : f.unitPriceDiff === 0 ? (
                              <span className="text-[#214B3D]">$0.00</span>
                            ) : (
                              <span className="text-[#202923]/60">${f.unitPriceDiff.toFixed(2)}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold">
                            {isOvercharge ? (
                              <span className="text-[#A7443E]">+${f.potentialOvercharge.toFixed(2)}</span>
                            ) : (
                              <span className="text-[#202923]/60">$0.00</span>
                            )}
                          </td>

                          {/* Status Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <select
                              value={f.status}
                              onChange={(e) => handleStatusChange(f.id, e.target.value as FindingStatus)}
                              className={`text-[11px] px-2 py-1 rounded-sm border font-medium cursor-pointer ${
                                f.status === 'confirmed'
                                  ? 'bg-[#F2F5F0] text-[#214B3D] border-[#214B3D]/30'
                                  : f.status === 'dismissed'
                                  ? 'bg-neutral-100 text-neutral-500 border-neutral-300'
                                  : 'bg-[#FBF1F0] text-[#A7443E] border-[#A7443E]/30'
                              }`}
                            >
                              <option value="potential">Potential</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="dismissed">Dismissed</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setEvidenceFinding(f)}
                                className="px-2 py-1 text-[11px] text-[#202923] hover:text-[#214B3D] bg-[#F8F7F3] hover:bg-[#E7EDE5] border border-[#E1E3DD] rounded-sm transition-colors cursor-pointer"
                              >
                                Evidence
                              </button>
                              {isOvercharge && (
                                <button
                                  onClick={() => setEmailFinding(f)}
                                  className="px-2 py-1 text-[11px] font-medium text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-sm transition-colors cursor-pointer"
                                >
                                  Email
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: GUIDED NEW AUDIT WIZARD */}
        {/* ========================================================= */}
        {viewMode === 'wizard' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#202923]">
                  Create a New Invoice Audit
                </h1>
                <p className="text-xs text-[#202923]/70 mt-1">
                  Upload agreed supplier prices, add invoices, and inspect mathematical variances.
                </p>
              </div>

              <button
                onClick={handleLoadTestPriceListFixture}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#214B3D] bg-[#F2F5F0] hover:bg-[#E7EDE5] border border-[#214B3D]/25 rounded-md transition-colors cursor-pointer"
              >
                Load 15-Product Test Fixture
              </button>
            </div>

            {/* Stepper Bar */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className={`p-3 rounded-md border font-medium ${
                wizardStep === 1 ? 'border-[#214B3D] bg-[#F2F5F0] text-[#214B3D]' : 'border-[#E1E3DD] bg-white text-[#202923]/60'
              }`}>
                Step 1: Agreed Prices ({parsedPriceList.length} items)
              </div>
              <div className={`p-3 rounded-md border font-medium ${
                wizardStep === 2 ? 'border-[#214B3D] bg-[#F2F5F0] text-[#214B3D]' : 'border-[#E1E3DD] bg-white text-[#202923]/60'
              }`}>
                Step 2: Upload Invoices ({uploadedFilesList.length} files)
              </div>
              <div className={`p-3 rounded-md border font-medium ${
                wizardStep === 3 ? 'border-[#214B3D] bg-[#F2F5F0] text-[#214B3D]' : 'border-[#E1E3DD] bg-white text-[#202923]/60'
              }`}>
                Step 3: Review & Compare
              </div>
            </div>

            {/* STEP 1: AGREED PRICE LIST */}
            {wizardStep === 1 && (
              <div className="bg-white p-7 rounded-lg border border-[#E1E3DD] space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#202923]">Step 1: Set Up Agreed Contract Prices</h2>
                  <p className="text-xs text-[#202923]/70 mt-0.5">
                    Upload an Excel (.xlsx) / CSV file, use our 15-item benchmark fixture, or paste your schedule.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-medium text-[#202923] mb-1">Audit Project Name</label>
                    <input
                      type="text"
                      value={auditTitle}
                      onChange={(e) => setAuditTitle(e.target.value)}
                      className="w-full p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#202923] mb-1">Supplier Name</label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block font-medium text-xs text-[#202923]">Price List Source</label>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={priceListType === 'preset'}
                        onChange={() => setPriceListType('preset')}
                        className="accent-[#214B3D]"
                      />
                      <span>Hospitality Preset (8 lines)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={priceListType === 'file'}
                        onChange={() => setPriceListType('file')}
                        className="accent-[#214B3D]"
                      />
                      <span>Upload Excel (.xlsx) / CSV File</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={priceListType === 'custom'}
                        onChange={() => setPriceListType('custom')}
                        className="accent-[#214B3D]"
                      />
                      <span>Paste Raw CSV Text</span>
                    </label>
                  </div>
                </div>

                {priceListType === 'file' && (
                  <div className="space-y-3 p-5 bg-[#F8F7F3] rounded-md border border-[#E1E3DD]">
                    <div className="text-xs font-semibold text-[#202923]">Upload Price List Spreadsheet</div>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handlePriceListFileUpload}
                      className="text-xs text-[#202923] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#214B3D] file:text-white hover:file:bg-[#1A3C31] cursor-pointer"
                    />
                    {selectedFileName && (
                      <div className="text-xs text-[#214B3D] font-medium">
                        ✓ Loaded: {selectedFileName} ({parsedPriceList.length} products verified)
                      </div>
                    )}
                  </div>
                )}

                {priceListType === 'preset' && (
                  <div className="p-4 bg-[#F8F7F3] rounded-md border border-[#E1E3DD] text-xs space-y-2">
                    <div className="font-semibold text-[#202923]">Hospitality Food & Beverage Preset:</div>
                    <div className="text-[#202923]/70 leading-relaxed">
                      Pre-loaded with 8 standard restaurant contract lines (Chicken Breast $4.00/kg, Tenderloin $28.50/kg, EVOO $18.00/bottle, Mozzarella $6.00/kg).
                    </div>
                  </div>
                )}

                {priceListType === 'custom' && (
                  <div className="space-y-2 text-xs">
                    <label className="block font-medium text-[#202923]">Paste CSV Content (SKU, Name, Agreed Price, Unit, Pack)</label>
                    <textarea
                      rows={6}
                      value={customCsvText}
                      onChange={(e) => setCustomCsvText(e.target.value)}
                      className="w-full p-3 font-mono text-[11px] bg-[#F8F7F3] border border-[#E1E3DD] rounded-md resize-none"
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-[#E1E3DD] flex justify-between items-center">
                  <button
                    onClick={() => setViewMode('list')}
                    className="text-xs text-[#202923]/60 hover:text-[#202923] cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleProceedFromPriceList}
                    disabled={isParsingPriceList}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] disabled:opacity-50 rounded-md transition-colors cursor-pointer shadow-xs"
                  >
                    {isParsingPriceList ? 'Parsing...' : 'Next: Upload Invoices →'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: UPLOAD INVOICES */}
            {wizardStep === 2 && (
              <div className="bg-white p-7 rounded-lg border border-[#E1E3DD] space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#202923]">Step 2: Upload Supplier Invoices</h2>
                  <p className="text-xs text-[#202923]/70 mt-0.5">
                    Upload real PDF invoices or use our test batch (Artisan Meats & Pacific Coast).
                  </p>
                </div>

                {/* Quick Test Fixture Button */}
                <div className="p-4 bg-[#F2F5F0] rounded-md border border-[#214B3D]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-semibold text-[#214B3D]">Use 3 Pre-Generated Test PDF Invoices:</div>
                    <div className="text-[#202923]/70 mt-0.5">
                      Includes Invoice 1 ($4,620), Invoice 2 ($3,343), and Duplicate Invoice 3.
                    </div>
                  </div>
                  <button
                    onClick={handleLoadTestInvoicesFixtures}
                    disabled={isExtracting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] disabled:opacity-50 rounded-md transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                  >
                    {isExtracting ? 'Extracting Fixtures...' : 'Load 3 Test PDFs'}
                  </button>
                </div>

                {/* Real File Upload Dropzone */}
                <div className="space-y-3 p-5 bg-[#F8F7F3] rounded-md border border-[#E1E3DD]">
                  <div className="text-xs font-semibold text-[#202923]">Upload Custom PDF or Image Invoices</div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                    onChange={handleInvoiceFilesUpload}
                    className="text-xs text-[#202923] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#214B3D] file:text-white hover:file:bg-[#1A3C31] cursor-pointer"
                  />
                  <div className="text-[11px] text-[#202923]/60">
                    PDF files are processed directly on the server using binary PDF stream extraction.
                  </div>
                </div>

                {uploadedFilesList.length > 0 && (
                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-[#202923]">Loaded Documents:</div>
                    <div className="space-y-1">
                      {uploadedFilesList.map((f, i) => (
                        <div key={i} className="p-2 bg-white rounded border border-[#E1E3DD] flex items-center justify-between">
                          <span className="font-medium text-[#202923]">{f.name}</span>
                          <span className="text-[#202923]/60">{Math.round(f.size / 1024)} KB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-[#E1E3DD] flex justify-between items-center">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="text-xs text-[#202923]/60 hover:text-[#202923] cursor-pointer"
                  >
                    ← Back to Price List
                  </button>

                  {extractedInvoices.length > 0 && (
                    <button
                      onClick={() => setWizardStep(3)}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors cursor-pointer shadow-xs"
                    >
                      Next: Review Extracted Lines ({extractedInvoices.length} invoices) →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW EXTRACTED ITEMS & RUN AUDIT */}
            {wizardStep === 3 && (
              <div className="bg-white p-7 rounded-lg border border-[#E1E3DD] space-y-6">
                <div>
                  <h2 className="text-base font-bold text-[#202923]">Step 3: Review Extracted Line Items</h2>
                  <p className="text-xs text-[#202923]/70 mt-0.5">
                    Verify extracted items. You can adjust quantities, prices, or descriptions before running mathematical comparisons.
                  </p>
                </div>

                {extractedInvoices.map((inv, invIdx) => (
                  <div key={inv.id} className="border border-[#E1E3DD] rounded-md p-4 bg-[#F8F7F3] space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#202923]">
                      <span>Invoice #{inv.invoiceNumber} · {inv.supplierName}</span>
                      <span className="font-mono tabular-nums">${inv.totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="bg-white rounded border border-[#E1E3DD] overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-[#F8F7F3] border-b border-[#E1E3DD] text-[#202923]/60 text-[11px]">
                          <tr>
                            <th className="p-2">Item Description</th>
                            <th className="p-2 text-right">Qty</th>
                            <th className="p-2 text-right">Unit</th>
                            <th className="p-2 text-right">Invoiced Unit Rate</th>
                            <th className="p-2 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E1E3DD]">
                          {inv.lineItems.map((li, lineIdx) => (
                            <tr key={li.id}>
                              <td className="p-2 font-medium text-[#202923]">
                                <input
                                  type="text"
                                  value={li.rawDescription}
                                  onChange={(e) => handleUpdateLineItem(invIdx, lineIdx, 'rawDescription', e.target.value)}
                                  className="w-full p-1 border border-[#E1E3DD] rounded text-xs"
                                />
                              </td>
                              <td className="p-2 text-right font-mono tabular-nums">
                                <input
                                  type="number"
                                  value={li.quantity}
                                  onChange={(e) => handleUpdateLineItem(invIdx, lineIdx, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="w-16 p-1 border border-[#E1E3DD] rounded text-right text-xs"
                                />
                              </td>
                              <td className="p-2 text-right font-mono">
                                <input
                                  type="text"
                                  value={li.unit}
                                  onChange={(e) => handleUpdateLineItem(invIdx, lineIdx, 'unit', e.target.value.toUpperCase())}
                                  className="w-14 p-1 border border-[#E1E3DD] rounded text-right text-xs uppercase"
                                />
                              </td>
                              <td className="p-2 text-right font-mono tabular-nums">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={li.invoicedUnitPrice}
                                  onChange={(e) => handleUpdateLineItem(invIdx, lineIdx, 'invoicedUnitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-20 p-1 border border-[#E1E3DD] rounded text-right text-xs"
                                />
                              </td>
                              <td className="p-2 text-right font-mono tabular-nums font-semibold">
                                ${li.lineTotal.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-[#E1E3DD] flex justify-between items-center">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="text-xs text-[#202923]/60 hover:text-[#202923] cursor-pointer"
                  >
                    ← Back to Invoices
                  </button>

                  <button
                    onClick={handleRunNewAudit}
                    disabled={isAuditing}
                    className="px-6 py-2.5 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] disabled:opacity-50 rounded-md transition-colors cursor-pointer shadow-xs"
                  >
                    {isAuditing ? 'Auditing Prices...' : 'Run Audit Comparison'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evidence Inspector Modal in Dashboard */}
      {evidenceFinding && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-lg border border-[#E1E3DD] shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1E3DD] pb-3">
              <h4 className="text-sm font-bold text-[#202923]">Supporting Audit Evidence</h4>
              <button
                onClick={() => setEvidenceFinding(null)}
                className="text-xs text-[#202923]/60 hover:text-[#202923] p-1 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#202923]/50 uppercase tracking-wider block text-[10px] mb-1">Source Document</span>
                <div className="p-2.5 bg-[#F8F7F3] rounded-sm border border-[#E1E3DD] font-medium text-[#202923]">
                  {evidenceFinding.evidence.sourceDocument}
                </div>
              </div>

              <div>
                <span className="text-[#202923]/50 uppercase tracking-wider block text-[10px] mb-1">Invoiced Line Reference</span>
                <div className="p-2.5 bg-[#F8F7F3] rounded-sm border border-[#E1E3DD] text-[#202923]">
                  {evidenceFinding.evidence.sourceLineRef}
                </div>
              </div>

              <div>
                <span className="text-[#202923]/50 uppercase tracking-wider block text-[10px] mb-1">Contract Record Reference</span>
                <div className="p-2.5 bg-[#F8F7F3] rounded-sm border border-[#E1E3DD] text-[#202923]">
                  {evidenceFinding.evidence.agreedRecordRef}
                </div>
              </div>

              <div>
                <span className="text-[#202923]/50 uppercase tracking-wider block text-[10px] mb-1">Calculation Method</span>
                <div className="p-2.5 bg-[#F2F5F0] rounded-sm border border-[#E1E3DD] text-[#214B3D] font-mono">
                  {evidenceFinding.evidence.calculationExplanation}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setEvidenceFinding(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Email Draft Modal in Dashboard */}
      {emailFinding && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-lg border border-[#E1E3DD] shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1E3DD] pb-3">
              <div>
                <h4 className="text-sm font-bold text-[#202923]">Supplier Correction Request</h4>
                <p className="text-[11px] text-[#202923]/60 mt-0.5">Polite, pre-formatted draft ready for your review</p>
              </div>
              <button
                onClick={() => setEmailFinding(null)}
                className="text-xs text-[#202923]/60 hover:text-[#202923] p-1 cursor-pointer"
              >
                Close
              </button>
            </div>

            {(() => {
              const draft = generateSupplierEmailDraft(emailFinding);
              return (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#202923]/50 block mb-1">Subject</label>
                    <input
                      readOnly
                      value={draft.subject}
                      className="w-full p-2 bg-[#F8F7F3] border border-[#E1E3DD] rounded-sm text-[#202923] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#202923]/50 block mb-1">Email Body</label>
                    <textarea
                      readOnly
                      rows={10}
                      value={draft.body}
                      className="w-full p-3 bg-[#F8F7F3] border border-[#E1E3DD] rounded-sm text-[#202923] font-mono text-[11px] resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-[#202923]/60">
                      Does not contact suppliers automatically.
                    </span>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(draft.body);
                        setCopiedEmail(true);
                        setTimeout(() => setCopiedEmail(false), 2000);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors cursor-pointer shadow-xs"
                    >
                      {copiedEmail ? 'Copied to Clipboard!' : 'Copy Email Draft'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
