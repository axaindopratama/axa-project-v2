"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Camera, Image, FileText, Check, X, Loader2, AlertCircle, CircleCheck, CircleX, Plus } from "lucide-react";

interface Project {
  id: string;
  number: string;
  name: string;
}

interface Entity {
  id: string;
  name: string;
  type: string;
}

interface ScanResult {
  vendor: string;
  date: string;
  items: { description: string; qty: number; unitPrice: number; totalPrice: number }[];
  total: number;
  rawText: string;
}

interface ToastMessage {
  type: "success" | "error";
  message: string;
}

export default function ScannerPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [verifiedData, setVerifiedData] = useState<ScanResult | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [showNewEntityInput, setShowNewEntityInput] = useState(false);
  const [newEntityName, setNewEntityName] = useState("");
  const [isCreatingEntity, setIsCreatingEntity] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProjectsAndEntities();
  }, []);

  const fetchProjectsAndEntities = async () => {
    try {
      const [projectsRes, entitiesRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/entities?type=vendor"),
      ]);
      const projectsData = await projectsRes.json();
      const entitiesData = await entitiesRes.json();
      setProjects(projectsData.data || []);
      setEntities(entitiesData.data || []);
    } catch (err) {
      console.error("Error fetching projects/entities:", err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    setFile(selectedFile);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleScan = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ai/scan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP error: ${res.status}`);
      }

      setResult(data.data);
      setVerifiedData(data.data);
      setShowVerify(true);
      
      // Auto-select matching entity
      const scannedVendor = data.data.vendor?.toLowerCase().trim() || "";
      const matchingEntity = entities.find(
        e => e.name.toLowerCase().trim() === scannedVendor
      );
      if (matchingEntity) {
        setSelectedEntityId(matchingEntity.id);
      } else {
        setSelectedEntityId("");
        setNewEntityName(data.data.vendor || "");
      }
    } catch (err: any) {
      console.error("Scan error:", err);
      setError(err.message || "Failed to scan receipt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntity = async () => {
    if (!newEntityName.trim()) {
      setToast({ type: "error", message: "Nama vendor tidak boleh kosong" });
      return;
    }

    setIsCreatingEntity(true);
    try {
      const res = await fetch("/api/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEntityName.trim(),
          type: "vendor",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat vendor");
      }

      setEntities([...entities, data.data]);
      setSelectedEntityId(data.data.id);
      setShowNewEntityInput(false);
      setToast({ type: "success", message: `Vendor "${newEntityName}" berhasil dibuat!` });
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Gagal membuat vendor" });
    } finally {
      setIsCreatingEntity(false);
    }
  };

  const handleVerify = async () => {
    if (!verifiedData) return;

    // Validation
    if (!selectedProjectId) {
      setToast({ type: "error", message: "Silakan pilih project terlebih dahulu" });
      return;
    }

    if (!selectedEntityId && !showNewEntityInput) {
      setToast({ type: "error", message: "Silakan pilih vendor atau buat baru" });
      return;
    }

    // If user wants to create new entity
    if (showNewEntityInput && newEntityName.trim()) {
      await handleCreateEntity();
    }

    if (!selectedEntityId) {
      return; // Wait for entity creation
    }

    try {
      const totalAmount = verifiedData.items.reduce((sum, item) => sum + item.totalPrice, 0);

      const transactionData = {
        projectId: selectedProjectId,
        entityId: selectedEntityId,
        date: verifiedData.date,
        amount: totalAmount,
        type: "expense",
        paymentStatus: "lunas",
        paidAmount: totalAmount,
        paidDate: verifiedData.date,
        paymentMethod: "cash",
        notes: `Vendor: ${entities.find(e => e.id === selectedEntityId)?.name || newEntityName}`,
        items: verifiedData.items,
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat transaksi");
      }

      setShowVerify(false);
      setToast({ type: "success", message: `Transaksi berhasil dibuat! Total: ${formatCurrency(totalAmount)}` });
      
      setTimeout(() => {
        handleRetake();
      }, 3000);
    } catch (err: any) {
      console.error("Error creating transaction:", err);
      setToast({ type: "error", message: err.message || "Gagal membuat transaksi. Silakan coba lagi." });
    }
  };

  const handleRetake = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setVerifiedData(null);
    setError(null);
    setSelectedProjectId("");
    setSelectedEntityId("");
    setShowNewEntityInput(false);
    setNewEntityName("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="p-10 pt-24 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">
          AI Receipt Scanner
        </h1>
        <p className="text-zinc-500 mt-1">
          Upload or capture a receipt to automatically extract transaction data
        </p>
      </div>

      {!file ? (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive 
              ? "border-primary bg-primary/5" 
              : "border-surface-container-highest hover:border-zinc-600"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center">
              <Upload className="w-8 h-8 text-zinc-500" />
            </div>
            <div>
              <p className="text-lg font-headline font-bold text-on-surface">
                Taruh receipt di sini
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                atau pilih opsi di bawah
              </p>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg text-zinc-300 hover:bg-surface-container-high transition-colors"
              >
                <Image className="w-4 h-4" />
                Unggah Gambar
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg text-zinc-300 hover:bg-surface-container-high transition-colors"
              >
                <Camera className="w-4 h-4" />
                Ambil Foto
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            <p className="text-xs text-zinc-600 mt-4">
              Supported formats: JPG, PNG, WEBP
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-start gap-6">
              {preview && (
                <div className="w-48 h-48 rounded-lg overflow-hidden bg-surface-container-high">
                  <img src={preview} alt="Receipt" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-headline font-bold text-on-surface mb-2">
                  {file.name}
                </h3>
                <p className="text-sm text-zinc-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>

                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-500">{error}</span>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleRetake}
                    className="px-4 py-2 bg-surface-container-high rounded-lg text-zinc-400 hover:text-zinc-300 transition-colors"
                  >
                    Ambil Ulang
                  </button>
                  <button
                    onClick={handleScan}
                    disabled={loading}
                    className="gold-gradient px-6 py-2 rounded-lg font-headline font-bold text-on-primary hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Pindai Receipt
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6">
            <h3 className="font-headline font-bold text-on-surface mb-4">
              Tips untuk hasil terbaik
            </h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Ensure good lighting
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Keep receipt flat and centered
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                Include total amount in frame
              </li>
            </ul>
          </div>
        </div>
      )}

      {showVerify && verifiedData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-low p-6 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-headline font-bold text-on-surface">
                Verifikasi Hasil Scan
              </h2>
              <button onClick={() => setShowVerify(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {preview && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img src={preview} alt="Receipt" className="w-full max-h-48 object-contain bg-surface-container-high" />
              </div>
            )}

            <div className="space-y-4">
              {/* Project Selection */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-widest text-zinc-500 mb-2">
                  Pilih Project *
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-surface-container-high border-none text-zinc-300 py-2 px-3 rounded-lg"
                  required
                >
                  <option value="">-- Pilih Project --</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.number} - {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor/Entity Selection */}
              <div>
                <label className="block text-xs uppercase font-bold tracking-widest text-zinc-500 mb-2">
                  Vendor/Toko *
                </label>
                {!showNewEntityInput ? (
                  <div className="space-y-2">
                    <select
                      value={selectedEntityId}
                      onChange={(e) => setSelectedEntityId(e.target.value)}
                      className="w-full bg-surface-container-high border-none text-zinc-300 py-2 px-3 rounded-lg"
                    >
                      <option value="">-- Pilih Vendor yang sudah tersimpan --</option>
                      {entities.map((entity) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewEntityInput(true)}
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                    >
                      <Plus className="w-4 h-4" />
                      Buat vendor baru dari hasil scan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newEntityName}
                        onChange={(e) => setNewEntityName(e.target.value)}
                        className="flex-1 bg-surface-container-high border-none text-zinc-300 py-2 px-3 rounded-lg"
                        placeholder="Nama vendor baru"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewEntityInput(false);
                          setNewEntityName("");
                        }}
                        className="p-2 text-zinc-500 hover:text-zinc-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateEntity}
                      disabled={isCreatingEntity || !newEntityName.trim()}
                      className="text-sm text-emerald-500 hover:text-emerald-400 disabled:opacity-50"
                    >
                      {isCreatingEntity ? "Menyimpan..." : "Simpan vendor baru"}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold tracking-widest text-zinc-500 mb-2">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={verifiedData.date}
                    onChange={(e) => setVerifiedData({ ...verifiedData, date: e.target.value })}
                    className="w-full bg-surface-container-high border-none text-zinc-300 py-2 px-3 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-widest text-zinc-500 mb-2">
                  Items
                </label>
                <div className="space-y-2">
                  {verifiedData.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...verifiedData.items];
                          newItems[idx].description = e.target.value;
                          setVerifiedData({ ...verifiedData, items: newItems });
                        }}
                        className="flex-1 bg-surface-container-high border-none text-zinc-300 py-2 px-3 rounded-lg text-sm"
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => {
                          const newItems = [...verifiedData.items];
                          newItems[idx].qty = parseInt(e.target.value) || 1;
                          newItems[idx].totalPrice = newItems[idx].qty * newItems[idx].unitPrice;
                          setVerifiedData({ ...verifiedData, items: newItems });
                        }}
                        className="w-16 bg-surface-container-high border-none text-zinc-300 py-2 px-3 rounded-lg text-sm text-center"
                        placeholder="Qty"
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...verifiedData.items];
                          newItems[idx].unitPrice = parseInt(e.target.value) || 0;
                          newItems[idx].totalPrice = newItems[idx].qty * newItems[idx].unitPrice;
                          setVerifiedData({ ...verifiedData, items: newItems });
                        }}
                        className="w-24 bg-surface-container-high border-none text-zinc-300 py-2 px-3 rounded-lg text-sm text-right"
                        placeholder="Price"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-container-high p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-bold">Total</span>
                  <span className="text-2xl font-headline font-bold text-primary">
                    {formatCurrency(verifiedData.items.reduce((sum, item) => sum + item.totalPrice, 0))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowVerify(false)}
                className="flex-1 py-3 bg-surface-container-high rounded-lg text-zinc-400 hover:bg-surface-container-highest transition-colors font-headline font-bold"
              >
                Edit Manually
              </button>
              <button
                onClick={handleVerify}
                className="flex-1 gold-gradient py-3 rounded-lg font-headline font-bold text-on-primary hover:shadow-lg transition-all"
              >
                Buat Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 p-4 rounded-xl shadow-xl flex items-center gap-3 z-50 bg-surface-container-low border border-zinc-700">
          {toast.type === "success" ? (
            <CircleCheck className="w-6 h-6 text-emerald-500" />
          ) : (
            <CircleX className="w-6 h-6 text-red-500" />
          )}
          <span className="text-zinc-300">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}