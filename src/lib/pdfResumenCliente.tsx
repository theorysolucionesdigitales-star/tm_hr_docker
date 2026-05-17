import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Tables } from "@/integrations/supabase/types";

const formatCurrency = (val: number | null) =>
  val ? `$${val.toLocaleString("es-CL")}` : "—";

const fetchRawImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Could not load image:", error);
    return null;
  }
};

const statusColorMapRGB: Record<string, [number, number, number]> = {
  "LinkedIn": [59, 130, 246],
  "Perfila": [16, 185, 129],
  "Llamar - Pendiente Contacto": [139, 92, 246],
  "No responde al perfil": [244, 63, 94],
  "Excede Renta": [249, 115, 22],
  "Placed": [20, 184, 166],
  "CO Aceptada": [20, 184, 166],
  "CO Entregada": [99, 102, 241],
  "Plan B": [245, 158, 11],
  "No interesado": [100, 116, 139],
  "CO Rechazada": [100, 116, 139],
};

const statusPriority: Record<string, number> = {
  "Placed": 1,
  "CO Aceptada": 2,
  "CO Entregada": 3,
  "Perfila": 4,
  "Plan B": 5,
  "Llamar - Pendiente Contacto": 6,
  "Excede Renta": 7,
  "No interesado": 8,
  "No responde al perfil": 9,
  "CO Rechazada": 10,
};

export const generateResumenClientePDF = async (
  proceso: Tables<"procesos"> & { clientes: { nombre: string; logo_url?: string | null } | null },
  postulantes: Tables<"postulantes">[]
) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;

  const officialLogoBase64 = await fetchRawImageAsBase64("/back-cover-v2.png");
  const clienteName = (proceso.clientes as any)?.nombre ?? "Cliente";

  const drawHeader = (doc: jsPDF) => {
    if (officialLogoBase64) {
      doc.addImage(officialLogoBase64, "PNG", 14, 10, 48, 12.92);
    }
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`CARGO ${proceso.nombre_cargo.toUpperCase()}`, W / 2, 14, { align: "center" });
    doc.text(clienteName.toUpperCase(), W / 2, 19, { align: "center" });
  };

  // Group candidates by status
  const grouped: Record<string, Tables<"postulantes">[]> = {};
  postulantes.forEach(p => {
    if (!grouped[p.status]) grouped[p.status] = [];
    grouped[p.status].push(p);
  });

  const statuses = Object.keys(grouped).sort((a, b) => {
    const valA = statusPriority[a] || 99;
    const valB = statusPriority[b] || 99;
    return valA - valB;
  });

  let currentY = 30;

  // We draw the header on the first page immediately
  drawHeader(doc);
  let pagesWithHeader = new Set([1]);

  statuses.forEach(status => {
    const candidates = grouped[status];
    if (!candidates || candidates.length === 0) return;

    const tableData = candidates.map(p => {
      const rentaActualNum = p.renta_actual ? formatCurrency(p.renta_actual) : "—";
      const hasBonos = p.benef_act && p.benef_act.toLowerCase().includes("bono"); 
      // If the user wants "+ Bonos" whenever benef_act is not empty, let's just use length > 0
      const appliesBonos = p.benef_act && p.benef_act.trim().length > 0;
      
      const rentaActual = (appliesBonos && p.renta_actual) ? `${rentaActualNum} + Bonos` : rentaActualNum;

      const pretensionRentaNum = p.pretension_renta ? formatCurrency(p.pretension_renta) : "—";
      const pretensionRenta = pretensionRentaNum;

      const estudiosParts = [p.estudios, p.institucion].filter(Boolean).join(", ");
      const estudios2Parts = [p.estudios_2, p.institucion_2].filter(Boolean).join(", ");
      const estudios3Parts = [p.estudios_3, p.institucion_3].filter(Boolean).join(", ");
      const allEstudios = [estudiosParts, estudios2Parts, estudios3Parts].filter(Boolean).join("\n");

      return [
        status.toUpperCase(),
        p.nombre || "—",
        p.cargo_actual || "—",
        p.empresa || "—",
        p.edad ? `${p.edad} Años` : "—",
        allEstudios || "—",
        rentaActual,
        pretensionRenta
      ];
    });

    const headColor = statusColorMapRGB[status] || [100, 116, 139];

    // If starting a new table and we are close to bottom, add a page
    if (currentY > 170) {
      doc.addPage();
      currentY = 30;
      drawHeader(doc);
      pagesWithHeader.add(doc.internal.getNumberOfPages());
    }

    autoTable(doc, {
      startY: currentY,
      head: [["STATUS", "NOMBRE", "CARGO ACTUAL", "EMPRESA", "EDAD", "ESTUDIOS", "RENTA ACTUAL", "PRETENSIONES DE RENTA"]],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: headColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: 0,
        valign: 'middle',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 32 },
        2: { cellWidth: 37 },
        3: { cellWidth: 35 },
        4: { cellWidth: 15 },
        5: { cellWidth: 60 },
        6: { cellWidth: 35 },
        7: { cellWidth: 35 },
      },
      styles: {
        lineWidth: 0.2,
        lineColor: 0,
      },
      margin: { top: 30, left: 14, right: 14, bottom: 15 },
      didDrawPage: (data) => {
        // If autoTable created a new page, draw header if not already drawn
        const pageNum = doc.internal.getNumberOfPages();
        if (!pagesWithHeader.has(pageNum)) {
          drawHeader(doc);
          pagesWithHeader.add(pageNum);
        }
      }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
  });

  doc.save(`Resumen_Cliente_${proceso.nombre_cargo.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
};
