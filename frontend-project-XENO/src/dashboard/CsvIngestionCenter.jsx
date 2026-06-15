import React, { useCallback, useMemo, useRef, useState } from 'react';
import { importAPI } from '../utils/api';
import {
  CUSTOMER_FIELD_DEFS,
  ORDER_FIELD_DEFS,
  autoMapColumns,
  buildSampleFiles,
  detectFileType,
  formatFileSize,
  getMappingScore,
  parseCsvText,
} from './csvIngestionUtils';

const MAX_BYTES = 10 * 1024 * 1024;

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });

const buildStagedFile = async (file) => {
  const text = await readFile(file);
  const { headers, rows } = parseCsvText(text, 500);
  const type = detectFileType(headers, file.name);
  const fieldDefs = type === 'orders' ? ORDER_FIELD_DEFS : CUSTOMER_FIELD_DEFS;
  const mappings = autoMapColumns(headers, fieldDefs);
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    type,
    headers,
    rows,
    totalRows: rows.length,
    mappings,
    fieldDefs,
    mappingScore: getMappingScore(mappings, fieldDefs),
  };
};

export default function CsvIngestionCenter({
  workspaceId = null,
  onImportComplete,
  onContinue,
  onCancel,
  continueLabel = 'Analyze Datasets',
  showCancel = true,
  compact = false,
}) {
  const inputRef = useRef(null);
  const [phase, setPhase] = useState('upload');
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [activeFileId, setActiveFileId] = useState(null);
  const [error, setError] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const activeFile = stagedFiles.find((f) => f.id === activeFileId) || stagedFiles[0];

  const customersFile = stagedFiles.find((f) => f.type === 'customers')?.file || null;
  const ordersFile = stagedFiles.find((f) => f.type === 'orders')?.file || null;
  const canProceed = stagedFiles.length > 0 && stagedFiles.every((f) => f.mappingScore >= 34);

  const filteredRows = useMemo(() => {
    if (!activeFile) return [];
    if (!filterText.trim()) return activeFile.rows.slice(0, 8);
    const q = filterText.toLowerCase();
    return activeFile.rows
      .filter((row) => Object.values(row).some((val) => String(val).toLowerCase().includes(q)))
      .slice(0, 8);
  }, [activeFile, filterText]);

  const addFiles = useCallback(async (fileList) => {
    setError(null);
    const incoming = Array.from(fileList || []);
    const csvFiles = incoming.filter((f) => f.name.toLowerCase().endsWith('.csv'));

    if (!csvFiles.length) {
      setError('Only CSV files are supported.');
      return;
    }

    const tooLarge = csvFiles.find((f) => f.size > MAX_BYTES);
    if (tooLarge) {
      setError(`${tooLarge.name} exceeds the 10MB limit.`);
      return;
    }

    try {
      const parsed = await Promise.all(csvFiles.map(buildStagedFile));
      setStagedFiles((prev) => {
        const map = new Map(prev.map((f) => [f.type, f]));
        for (const item of parsed) {
          map.set(item.type, item);
        }
        return Array.from(map.values());
      });
      setActiveFileId(parsed[0]?.id || null);
      setPhase('review');
    } catch (err) {
      setError(err.message || 'Failed to parse CSV file.');
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleMappingChange = (header, value) => {
    setStagedFiles((prev) =>
      prev.map((item) => {
        if (item.id !== activeFile?.id) return item;
        const mappings = { ...item.mappings, [header]: value };
        return {
          ...item,
          mappings,
          mappingScore: getMappingScore(mappings, item.fieldDefs),
        };
      })
    );
  };

  const handleLoadSamples = async () => {
    const samples = buildSampleFiles();
    await addFiles([samples.customers, samples.orders]);
  };

  const handleRemoveFile = (type) => {
    setStagedFiles((prev) => {
      const next = prev.filter((f) => f.type !== type);
      if (!next.length) setPhase('upload');
      return next;
    });
  };

  const uploadToBackend = async () => {
    if (!workspaceId) return null;
    const formData = new FormData();
    if (customersFile) formData.append('customers', customersFile, customersFile.name);
    if (ordersFile) formData.append('orders', ordersFile, ordersFile.name);
    return importAPI.uploadCsv(workspaceId, formData);
  };

  const handlePrimaryAction = async () => {
    if (!canProceed) return;
    setError(null);
    setIsBusy(true);

    try {
      if (workspaceId) {
        setPhase('importing');
        const result = await uploadToBackend();
        setImportResult(result?.importJob || result);
        setPhase('done');
        onImportComplete?.(result);
      } else {
        onContinue?.({ customersFile, ordersFile, stagedFiles });
      }
    } catch (err) {
      setError(err.message || 'Import failed. Please try again.');
      setPhase('review');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className={`w-full ${compact ? '' : 'max-w-4xl mx-auto'}`}>
      {/* Header */}
      <div className="mb-5 text-left">
        <h2 className="text-xl md:text-2xl font-bold text-gray-950">Import CSV Dataset</h2>
        <p className="text-xs text-gray-500 font-medium mt-1 max-w-2xl leading-relaxed">
          Upload customer sales CSV exports. The AI engine automatically parses columns, maps attributes,
          and highlights conflicts before ingestion.
        </p>
      </div>

      {phase === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-[1.75rem] border border-dashed transition-all duration-300 overflow-hidden ${
            isDragging
              ? 'border-indigo-500 bg-indigo-950/90 scale-[1.01]'
              : 'border-zinc-800 bg-zinc-950'
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
          <div className="relative px-8 py-14 md:py-16 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[24px] text-white">upload</span>
            </div>
            <h3 className="text-sm font-extrabold text-white mb-2 tracking-wide">Drag &amp; Drop CSV File</h3>
            <p className="text-xs text-gray-400 font-semibold max-w-md mb-6 leading-relaxed">
              Supports messy transaction reports from direct sales channels. Max file size: 10MB.
            </p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Browse Files
            </button>

            <button
              type="button"
              onClick={handleLoadSamples}
              className="mt-4 text-[11px] font-bold text-indigo-300 hover:text-indigo-200 transition-colors"
            >
              Or load sample customer + order datasets
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
        </div>
      )}

      {phase === 'review' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Staged files */}
          <div className="flex flex-wrap gap-2">
            {stagedFiles.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  activeFile?.id === item.id
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-200'
                }`}
                onClick={() => setActiveFileId(item.id)}
              >
                <span className={`material-symbols-outlined text-[16px] ${item.type === 'orders' ? 'text-purple-500' : 'text-emerald-500'}`}>
                  {item.type === 'orders' ? 'receipt_long' : 'groups'}
                </span>
                <span className="truncate max-w-[140px]">{item.file.name}</span>
                <span className="text-[10px] text-gray-400 font-semibold">{formatFileSize(item.file.size)}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider ${
                  item.mappingScore >= 67 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {item.mappingScore}% mapped
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveFile(item.type); }}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-2 rounded-xl border border-dashed border-gray-300 text-[11px] font-bold text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              + Add CSV
            </button>
          </div>

          {/* Column mapping */}
          {activeFile && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 bg-gray-950 rounded-[1.5rem] border border-gray-800 p-5 text-left">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">AI Column Mapping</h4>
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    {activeFile.type === 'orders' ? 'Orders' : 'Customers'}
                  </span>
                </div>
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                  {activeFile.headers.map((header) => (
                    <div key={header} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-500 w-[38%] truncate" title={header}>
                        {header}
                      </span>
                      <span className="material-symbols-outlined text-[12px] text-gray-600">arrow_forward</span>
                      <select
                        value={activeFile.mappings[header] || ''}
                        onChange={(e) => handleMappingChange(header, e.target.value)}
                        className="flex-1 text-[11px] font-semibold bg-gray-900 border border-gray-700 text-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">Ignore column</option>
                        {activeFile.fieldDefs.map((field) => (
                          <option key={field.key} value={field.key}>{field.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 bg-white border border-gray-200 rounded-[1.5rem] p-5 text-left">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Live Preview &amp; Filter</h4>
                  <div className="relative flex-1 max-w-[220px]">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-gray-400">search</span>
                    <input
                      type="text"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="Filter rows..."
                      className="w-full pl-8 pr-3 py-1.5 text-[11px] font-semibold border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        <th className="px-2 py-2 text-left font-bold">#</th>
                        {activeFile.headers.slice(0, 5).map((h) => (
                          <th key={h} className="px-2 py-2 text-left font-bold truncate max-w-[100px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr key={row._row} className="border-t border-gray-100 hover:bg-indigo-50/30">
                          <td className="px-2 py-2 text-gray-400 font-bold">{row._row}</td>
                          {activeFile.headers.slice(0, 5).map((h) => (
                            <td key={h} className="px-2 py-2 text-gray-700 font-medium truncate max-w-[100px]">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                      {!filteredRows.length && (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-gray-400 font-semibold">
                            No rows match your filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-gray-400 font-semibold mt-2">
                  Showing {filteredRows.length} of {activeFile.totalRows}+ parsed rows
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80">
            <span className="material-symbols-outlined text-indigo-500 text-[18px]">auto_awesome</span>
            <p className="text-[11px] text-indigo-900 font-semibold flex-1">
              {customersFile && ordersFile
                ? 'Customer profiles and order history detected. Ready for AI behavioral modeling.'
                : customersFile
                  ? 'Customer file detected. Add an orders CSV for full revenue attribution.'
                  : 'Order transactions detected. Add a customers CSV for richer segmentation.'}
            </p>
          </div>
        </div>
      )}

      {phase === 'importing' && (
        <div className="rounded-[1.5rem] bg-gray-950 border border-gray-800 p-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mb-4" />
          <h3 className="text-white font-bold text-sm">Ingesting dataset into workspace...</h3>
          <p className="text-gray-400 text-xs font-medium mt-1">Parsing rows, upserting customers, and recalculating CLV metrics.</p>
        </div>
      )}

      {phase === 'done' && importResult && (
        <div className="rounded-[1.5rem] bg-emerald-50 border border-emerald-100 p-6 text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <h3 className="text-sm font-bold text-emerald-900">Import completed successfully</h3>
          </div>
          <p className="text-xs text-emerald-800 font-medium">
            {importResult.successfulRows ?? 0} rows imported
            {importResult.failedRows ? ` · ${importResult.failedRows} rows skipped` : ''}.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex justify-between items-center mt-6 pt-5 border-t border-gray-100">
        <div className="flex gap-2">
          {showCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors px-3 py-2"
            >
              Cancel
            </button>
          )}
          {phase === 'review' && (
            <button
              type="button"
              onClick={() => { setPhase('upload'); setStagedFiles([]); setFilterText(''); }}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors px-3 py-2"
            >
              Re-upload
            </button>
          )}
        </div>

        {phase !== 'importing' && phase !== 'done' && (
          <button
            type="button"
            disabled={!canProceed || isBusy}
            onClick={handlePrimaryAction}
            className="px-8 py-3.5 creative-btn rounded-xl font-bold text-xs disabled:opacity-50 flex items-center gap-2"
          >
            {isBusy ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {workspaceId ? 'Import to Workspace' : continueLabel}
                <span className="material-symbols-outlined text-[16px]">
                  {workspaceId ? 'cloud_upload' : 'insights'}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
    </div>
  );
}
