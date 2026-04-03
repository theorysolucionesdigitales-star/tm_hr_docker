import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ArrowRight, Loader2, Maximize2, FileText, CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";
import { generateReportPDF } from "@/lib/pdfReport";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ReportData {
  proceso: any;
  cliente: any;
  perfiles_cargo: any[];
  postulantes: any[];
  observaciones?: any[];
  observaciones_research?: any[];
}

export default function PublicReport() {
  const { token } = useParams<{ token: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Force Light mode strictly for this public report
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme("light");
    
    // Optional cleanup logic, but since this report covers the entire view, 
    // it's fine for it to take over until they close the tab.
  }, [setTheme]);
  
  // Auth and Data state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // PDF state
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [generating, setGenerating] = useState(false);
  const [pageWidth, setPageWidth] = useState<number>(1000);

  // Resize listener for responsive PDF rendering
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setPageWidth(isMobile ? window.innerWidth - 32 : Math.min(window.innerWidth - 64, 1100));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 5) {
      toast.error("El código debe tener 5 caracteres");
      return;
    }

    setLoading(true);
    try {
      // @ts-ignore
      const { data, error } = await supabase.rpc("get_public_report_data", {
        p_token: token!,
        p_code: code.toUpperCase(),
      });

      if (error) throw error;
      
      if (!data) {
        toast.error("Código incorrecto o enlace expirado");
        setReportData(null);
      } else {
        toast.success("Acceso concedido");
        setIsAuthenticated(true);
        
        let reportDataWithObs = (data as any) as ReportData & { observaciones_research?: any[] };
        
        // Failsafe: Si la BD no nos devolvió observaciones_research en el RPC, las buscamos manualmente
        if (!reportDataWithObs.observaciones_research && reportDataWithObs.proceso?.id) {
            console.log("Fetching observaciones manually...");
            const { data: cols } = await supabase
              .from("observaciones_research")
              .select("*")
              .eq("proceso_id", reportDataWithObs.proceso.id)
              .order("orden");
              
            if (cols) {
                reportDataWithObs.observaciones_research = cols;
            }
        }
        
        setReportData(reportDataWithObs);
        await handleGeneratePDF(reportDataWithObs);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Ocurrió un error al verificar el acceso");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (data: ReportData & { observaciones_research?: any[] }) => {
    setGenerating(true);
    try {
      // Inyectar la información del cliente, ya que el PDF espera 'proceso.clientes'
      const procesoWithCliente = {
        ...data.proceso,
        clientes: data.cliente
      };

      const blob = await generateReportPDF(
        procesoWithCliente,
        data.postulantes,
        data.perfiles_cargo,
        data.observaciones_research || data.observaciones || [],
        true
      ) as unknown as Blob; // cast assuming generateReportPDF returns blob when true
      setPdfBlob(blob);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el documento");
    } finally {
      setGenerating(false);
    }
  };

  function onDocumentLoadSuccess(settings: { numPages: number }) {
    setNumPages(settings.numPages);
  }

  const candidatesForCV = useMemo(() => {
    if (!reportData?.postulantes) return [];
    return reportData.postulantes.filter(p => p.status === "Perfila" || p.status === "Plan B");
  }, [reportData]);

  const handleDownloadCV = async (cvUrl: string, candidateName: string) => {
    // If it's already a full URL, use it. Otherwise, get the public URL from storage.
    const finalUrl = cvUrl.startsWith('http') 
      ? cvUrl 
      : supabase.storage.from('cvs').getPublicUrl(cvUrl).data.publicUrl;
    
    try {
      // Fetch the file as a blob to force a real download
      const response = await fetch(finalUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `CV_${candidateName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab if fetch fails (e.g. CORS)
      window.open(finalUrl, '_blank');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold tracking-tight mb-2 text-foreground">Acceso Seguro</h1>
            <p className="text-muted-foreground text-sm">
              Ingrese el código proporcionado por el consultor para visualizar este reporte de <strong>Tailor Made</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
            <div className="space-y-2 relative">
              <label htmlFor="code" className="text-xs font-semibold uppercase text-muted-foreground">Código PIN</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="code"
                  type="text"
                  maxLength={5}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Inserte Pin"
                  className="pl-10 h-14 text-center text-xl font-mono font-bold tracking-[0.2em] transition-all focus:ring-2 focus:ring-primary/50"
                  autoComplete="off"
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-md transition-transform active:scale-[0.98]" disabled={loading || code.length !== 5}>
              {loading ? "Verificando..." : (
                <>
                  Ver Reporte <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Loading state while PDF logic generates blob locally
  if (generating || !pdfBlob) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Preparando visualización 100% idéntica al original...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Banner Sticky */}
      <header className="w-full bg-white border-b p-4 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <img src="/logo-tailor-made.png" alt="Tailor Made" className="h-7 object-contain drop-shadow-sm" />
          <div className="hidden sm:block border-l pl-4 ml-2 border-slate-300">
            <h2 className="font-display font-bold text-sm leading-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Reporte de {reportData?.proceso?.nombre_cargo}
            </h2>
            <p className="text-xs text-slate-500 font-medium">{reportData?.cliente?.nombre}</p>
          </div>
        </div>
        <div className="flex gap-2">
           {/* Not providing a download button ensures it's read only visualizer */}
           <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-3 py-1.5 flex items-center gap-2 rounded-md font-medium border border-slate-200 dark:border-slate-700">
             <Lock className="w-3.5 h-3.5" /> Lectura Protegida
           </div>
        </div>
      </header>

      {/* Main Document Viewer */}
      <main 
        className="flex-1 w-full flex flex-col items-center py-8"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .react-pdf__Page__canvas {
            max-width: 100%;
            height: auto !important;
            margin: 0 auto;
            border-radius: 6px;
            pointer-events: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          .react-pdf__Page__textContent, .react-pdf__Page__annotations {
            display: none !important;
          }
        `}} />
        <Document
          file={pdfBlob}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col gap-8 w-full items-center"
          loading={
            <div className="flex items-center justify-center p-12 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> 
              Cargando documento...
            </div>
          }
          error={
            <div className="text-red-500 bg-red-50 p-6 rounded-md border border-red-200">
              Ocurrió un error al cargar el formato del documento.
            </div>
          }
        >
          {Array.from(new Array(numPages), (el, index) => {
            const pageNumber = index + 1;
            // The candidate pages start after: 1 (Cover) + 1 (Summary) + 1 (Job Desc) = Page 4
            const candidateIndex = pageNumber - 4;
            const candidate = (candidateIndex >= 0 && candidateIndex < candidatesForCV.length) 
                ? candidatesForCV[candidateIndex] 
                : null;

            return (
              <div 
                key={`page_${pageNumber}`} 
                onContextMenu={(e) => e.preventDefault()}
                className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] rounded-md select-none shrink-0 relative overflow-hidden ring-1 ring-slate-900/5 group"
              >
                <Page 
                  pageNumber={pageNumber} 
                  width={pageWidth}
                  renderTextLayer={false} 
                  renderAnnotationLayer={false} 
                  className="transition-opacity duration-500"
                />
                
                {/* CV Download Button Overlay for Candidate Pages */}
                {candidate && candidate.cv_url && (
                  <div className="absolute right-3 bottom-14 z-10 animate-fade-in">
                    <Button
                      onClick={() => handleDownloadCV(candidate.cv_url, candidate.nombre)}
                      className="bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-lg flex items-center gap-2 h-9 px-4 rounded-full transition-all hover:scale-105 active:scale-95 text-sm"
                    >
                      <Download className="w-4 h-4" /> Descargar CV
                    </Button>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                <div className="absolute bottom-2 right-4 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                   {pageNumber} / {numPages}
                </div>
              </div>
            );
          })}
        </Document>

        {numPages > 0 && (
          <div className="mt-8 text-center text-slate-400 text-sm font-medium flex items-center gap-2 pb-12">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Fin del Documento ({numPages} páginas)
          </div>
        )}
      </main>
    </div>
  );
}
