import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Tables } from "@/integrations/supabase/types";

const formatCurrency = (val: number | null) =>
  val ? `$${val.toLocaleString("es-CL")}` : "—";

const COLORS = {
  primary: [15, 23, 42] as [number, number, number],      // Darker Slate (for text mostly)
  accent: [59, 130, 246] as [number, number, number],     // Blue 500
  text: [51, 65, 85] as [number, number, number],         // Slate 700
  textLight: [100, 116, 139] as [number, number, number], // Slate 500
  bgLight: [248, 250, 252] as [number, number, number],   // Slate 50
  bgGrayHeader: [160, 160, 160] as [number, number, number], // Neutral solid Gray
  white: [255, 255, 255] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
};

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

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const xOffset = (img.width - size) / 2;
        const yOffset = (img.height - size) / 2;
        ctx.drawImage(img, xOffset, yOffset, size, size, 0, 0, size, size);

        // Draw border
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, (size / 2) - 2, 0, Math.PI * 2);
        ctx.lineWidth = size * 0.05;
        ctx.strokeStyle = "rgb(0, 0, 0)";
        ctx.stroke();

        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  } catch (error) {
    console.warn("Could not load image:", error);
    return null;
  }
};

const getSilhouetteBase64 = (): string => {
  const size = 120;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = "rgb(226, 232, 240)";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "rgb(148, 163, 184)";
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.35, size * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(size / 2, size * 0.9, size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Draw border
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, (size / 2) - 2, 0, Math.PI * 2);
  ctx.lineWidth = size * 0.05;
  ctx.strokeStyle = "rgb(0, 0, 0)";
  ctx.stroke();

  return canvas.toDataURL("image/png");
};

export const generateReportPDF = async (
  proceso: Tables<"procesos"> & { clientes: { nombre: string; logo_url?: string | null } | null },
  postulantes: Tables<"postulantes">[],
  perfilesCargo: Tables<"perfiles_cargo">[],
  observaciones: Tables<"observaciones_research">[] = [],
  returnBlobOnly: boolean = false
) => {
  // Custom Landscape for Cover Page: 297mm x 155mm
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [297, 155] });
  const clienteName = (proceso.clientes as any)?.nombre ?? "Cliente";

  // Tailor Made logo small for footers
  const officialLogoBase64 = await fetchRawImageAsBase64("/back-cover-v2.png");
  const backCoverBase64 = await fetchRawImageAsBase64("/back-cover-v2.png");

  const addFooter = (pageNumber: number) => {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont("helvetica", "normal");
    // doc.text(`Página ${pageNumber}`, 148.5, 200, { align: "center" });

    // Official Footer logo (Tailor Made small) on bottom right
    if (officialLogoBase64) {
      doc.addImage(officialLogoBase64, "PNG", 250, 177, 48, 12);
    }
  };

  // === PAGE 1: Cover (Magazine Style) ===
  const W = 297;
  const coverH = 155;

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, coverH, "F");

  // Tailor Made logo large centered (scaled down to fit new height)
  if (officialLogoBase64) {
    // 130 width x 32 height, centered
    doc.addImage(officialLogoBase64, "PNG", 83.5, 12, 130, 32, undefined, "MEDIUM");
  }

  // Decorative double line
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.4);
  doc.line(60, 52, W - 60, 52);
  doc.line(60, 54, W - 60, 54);

  // Process text (dark over white)
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(18);
  doc.setFont("helvetica", "italic");
  doc.text("Proceso", W / 2, 85, { align: "center" });

  doc.setFontSize(28);
  doc.setFont("helvetica", "bolditalic");
  doc.text(proceso.nombre_cargo, W / 2, 100, { align: "center" });

  // Client logo in white rounded box, or text fallback
  const clienteLogoUrl = (proceso.clientes as any)?.logo_url;
  let clientLogoRendered = false;

  if (clienteLogoUrl) {
    try {
      const clientLogoBase64 = await fetchRawImageAsBase64(clienteLogoUrl);
      if (clientLogoBase64) {
        // Load image to get aspect ratio for perfect centering
        const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = clientLogoBase64;
        });

        const maxW = 100;
        const maxH = 32;
        let logoW = logoImg.naturalWidth || maxW;
        let logoH = logoImg.naturalHeight || maxH;

        const scale = Math.min(maxW / logoW, maxH / logoH);
        logoW *= scale;
        logoH *= scale;

        const logoX = (W - logoW) / 2;
        const logoY = 130 - (logoH / 2); // Vertically centered in the lower half of the new gray zone

        doc.addImage(clientLogoBase64, "PNG", logoX, logoY, logoW, logoH, undefined, "MEDIUM");
        clientLogoRendered = true;
      }
    } catch (e) {
      console.warn("Could not render client logo in PDF:", e);
    }
  }

  if (!clientLogoRendered) {
    doc.setTextColor(60, 60, 60); // Dark text fallback over grey (or black if needed, wait grey background is usually darker)
    // Actually the grey background is ...COLORS.bgGrayHeader ? No, wait.
    // The previous text was white on gray. In line 166: doctextColor(white)
    // Let's keep the fallback as it was just smaller
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(clienteName, W / 2, 132, { align: "center" });
  }

  // === PAGE 2: Summary table & Pie Chart ===
  doc.addPage([297, 190], "landscape");

  // Header Banner Gray
  doc.setFillColor(...COLORS.bgGrayHeader);
  doc.rect(0, 0, 297, 40, "F");

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen Proceso", 148.5, 25, { align: "center" });

  const pieRadius = 38;
  const pieCenterX = 60; // Moved left to make room for side notes
  const pieCenterY = 105; // Moved up from 120

  // Draw Box around Chart and Status only (reduced width)
  doc.setLineWidth(0.3);
  doc.setDrawColor(180, 180, 180);
  doc.rect(15, 47, 155, 125, "S"); // Narrowed slightly for balance

  // Título Contactados ahora dentro del recuadro
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Contactados", pieCenterX, 60, { align: "center" }); // Moved up from 75

  // Fixed color map per status (only affects PDF chart, not the app UI)
  const statusColorMap: Record<string, [number, number, number]> = {
    "LinkedIn": [0, 119, 181],                    // Azul LinkedIn
    "Llamar - Pendiente Contacto": [255, 193, 7], // Amarillo/Dorado
    "No responde Perfil": [155, 195, 75],         // Verde Lima
    "Perfila": [230, 140, 140],                   // Rosado/Coral
    "No interesado": [128, 128, 128],             // Gris
    "Plan B": [110, 170, 230],                    // Azul/Celeste
    "Excede Renta": [255, 150, 50],               // Naranja
  };

  // Count all statuses dynamically
  const groupedCounts: Record<string, number> = {};
  postulantes.forEach((curr) => {
    groupedCounts[curr.status] = (groupedCounts[curr.status] || 0) + 1;
  });

  const totalChartCandidates = Object.values(groupedCounts).reduce((a, b) => a + b, 0);

  if (totalChartCandidates > 0) {
    let currentAngle = 0;

    Object.entries(groupedCounts).forEach(([status, count], index) => {
      if (count === 0) return;

      const percentage = count / totalChartCandidates;
      const sliceAngle = percentage * 2 * Math.PI;
      const sliceColor = statusColorMap[status] || [127, 127, 127];

      // Draw Pie Slice
      doc.setFillColor(...sliceColor);
      // Aumentamos resolución para que los bordes simulados se vean como un circulo liso
      const segments = 60;
      const angleStep = sliceAngle / segments;

      const points: [number, number][] = [[pieCenterX, pieCenterY]];
      for (let i = 0; i <= segments; i++) {
        const a = currentAngle + (i * angleStep);
        points.push([
          pieCenterX + pieRadius * Math.cos(a),
          pieCenterY + pieRadius * Math.sin(a)
        ]);
      }

      // Usamos el mismo color temporalmente para que los bordes de los triángulos 
      // rellenen el hueco/aliasing entre sí en pdf. Evita ese look "difuminado"
      doc.setDrawColor(...sliceColor);
      doc.setLineWidth(0.8);

      // Draw triangles to simulate arc
      for (let i = 1; i < points.length - 1; i++) {
        doc.triangle(
          pieCenterX, pieCenterY,
          points[i][0], points[i][1],
          points[i + 1][0], points[i + 1][1],
          "FD"
        );
      }

      // Dibujar dos guías blancas limpias separando el slice y las proporciones
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1.5);
      doc.line(pieCenterX, pieCenterY, pieCenterX + pieRadius * Math.cos(currentAngle), pieCenterY + pieRadius * Math.sin(currentAngle));
      doc.line(pieCenterX, pieCenterY, pieCenterX + pieRadius * Math.cos(currentAngle + sliceAngle), pieCenterY + pieRadius * Math.sin(currentAngle + sliceAngle));

      // Add percentage text if >= 4% (5% included)
      if (percentage >= 0.04) {
        const textAngle = currentAngle + (sliceAngle / 2);
        const textX = pieCenterX + (pieRadius * 0.65) * Math.cos(textAngle);
        const textY = pieCenterY + (pieRadius * 0.65) * Math.sin(textAngle) + 2;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${Math.round(percentage * 100)}%`, textX, textY, { align: "center" });
      }

      // Draw Legend Entry next to chart
      const currentLegendX = 110;
      const currentLegendY = 73 + (index * 14); // Tighter spacing for up to 7 entries

      doc.setFillColor(...sliceColor);
      doc.rect(currentLegendX, currentLegendY - 3, 4, 4, "F");

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(status, currentLegendX + 8, currentLegendY + 1);

      currentAngle += sliceAngle;
    });

    // Total text
    doc.setTextColor(30, 80, 140);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Total candidatos contactados : ${totalChartCandidates}`, pieCenterX, 164, { align: "center" });
  }

  // --- Right Side Observations ---
  const obsStartX = 185;
  let obsStartY = 75;

  // Title for observations
  doc.setTextColor(30, 80, 140);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Observaciones", obsStartX, 60);

  const drawObservationBlock = (title: string, items: string[]) => {
    if (items.length === 0) return;

    doc.setFillColor(30, 80, 140);
    doc.circle(obsStartX + 1.5, obsStartY - 1, 1, "F");

    doc.setTextColor(30, 80, 140);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, obsStartX + 5, obsStartY);

    // Draw box for items
    const boxY = obsStartY + 2;
    // Calculate box height based on items
    let boxHeight = 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    const formattedLines: string[] = [];
    items.forEach(item => {
      const lines = doc.splitTextToSize(`• ${item}`, 100);
      formattedLines.push(...lines);
      boxHeight += lines.length * 5;
    });

    // Print text directly (no box)
    let textY = boxY + 3;
    items.forEach(item => {
      const lines = doc.splitTextToSize(`• ${item}`, 97);
      doc.text(lines, obsStartX + 5, textY, { align: "left", maxWidth: 97 });
      textY += lines.length * 5;
    });

    obsStartY += boxHeight + 12;
  };

  if (proceso.renta_obj) {
    drawObservationBlock("Excede renta.", [
      `Renta superior a ${formatCurrency(proceso.renta_obj)} líquidos.`
    ]);
  }

  const noInteresadoObs = observaciones.filter(o => o.tipo === 'no_interesado').map(o => o.descripcion);
  drawObservationBlock("No se interesa.", noInteresadoObs);

  const noRespondePerfilObs = observaciones.filter(o => o.tipo === 'no_responde_perfil').map(o => o.descripcion);
  drawObservationBlock("No responde perfil.", noRespondePerfilObs);

  // === PAGE 3: Job Description (Misión y Perfil) ===
  doc.addPage([297, 190], "landscape");

  // Top Dark Banner (reduced size as requested)
  doc.setFillColor(...COLORS.bgGrayHeader);
  doc.rect(0, 0, 297, 65, "F");

  // Title: Misión del Cargo
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Misión del Cargo", 20, 20);
  doc.setLineWidth(0.5);
  doc.setDrawColor(60, 60, 60);
  doc.line(20, 21, 65, 21); // underline

  if (proceso.mision_cargo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    const missionLines = doc.splitTextToSize(proceso.mision_cargo, 250);

    doc.setTextColor(255, 255, 255); // White text over gray
    doc.text(missionLines, 20, 28, { maxWidth: 250, align: "left" });
  }

  // --- Perfil del Cargo ---
  const profileStartY = 75;
  doc.setTextColor(15, 60, 85);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Perfil del Cargo", 20, profileStartY);
  doc.line(20, profileStartY + 1, 61, profileStartY + 1);

  if (perfilesCargo.length > 0) {
    let currentY = profileStartY + 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    perfilesCargo.forEach((p) => {
      // Small grey dot bullet
      doc.setFillColor(200, 200, 200);
      doc.circle(24, currentY - 1, 1, "F");

      const splitLines = doc.splitTextToSize(p.descripcion, 250);
      doc.setTextColor(15, 60, 85);
      doc.text(splitLines, 28, currentY, { maxWidth: 250, align: "left" });
      currentY += (splitLines.length * 6) + 4;
    });
  }

  // === Individual pages per candidate (only "Perfila" status) ===
  const perfilaCandidates = postulantes.filter(p => p.status === "Perfila");

  for (const p of perfilaCandidates) {
    doc.addPage([297, 190], "landscape");

    // --- Collect academic studies first to calculate banner height ---
    const studies: string[] = [];
    const addStudy = (est: string | null, inst: string | null) => {
      if (!est && !inst) return;
      let line = "";
      if (est) line += est;
      if (inst) line += `; ${inst}`;
      studies.push(line + ".");
    };
    addStudy(p.estudios, p.institucion);
    addStudy(p.estudios_2, p.institucion_2);
    addStudy(p.estudios_3, p.institucion_3);

    const studyLines = studies.slice(0, 3); // User requested 3 records
    const studyLineH = 5;
    const bannerHeight = 58; // Reduced height

    // --- Top Grey Banner (Name + Age + Studies) ---
    doc.setFillColor(...COLORS.bgGrayHeader);
    doc.rect(0, 0, 297, bannerHeight, "F");

    // Name
    doc.setTextColor(15, 60, 85);
    doc.setFontSize(28); // Increased from 26
    doc.setFont("helvetica", "bold");
    doc.text(`${p.nombre}.`, 20, 18);

    // Age
    if (p.edad) {
      doc.setTextColor(15, 60, 85);
      doc.setFontSize(15); // Increased from 13
      doc.setFont("helvetica", "bold");
      doc.text(`(${p.edad} años).`, 20, 28);
    }

    // Academic records inside banner
    if (studyLines.length > 0) {
      doc.setTextColor(15, 60, 85);
      doc.setFontSize(12); // Increased from 10
      doc.setFont("helvetica", "bold");

      let studyY = 36;
      const studyLineH_increased = 6;
      studyLines.forEach(line => {
        const wrapped = doc.splitTextToSize(line, 200);
        doc.text(wrapped, 20, studyY);
        studyY += wrapped.length * studyLineH_increased;
      });
    }

    // --- Profile Image (top right, centered vertically in banner) ---
    let imgAdded = false;
    if (p.foto_url) {
      const base64Img = await fetchImageAsBase64(p.foto_url);
      if (base64Img) {
        doc.addImage(base64Img, "PNG", 242, 5, 48, 48);
        imgAdded = true;
      }
    }
    if (!imgAdded) {
      const sil = getSilhouetteBase64();
      if (sil) {
        doc.addImage(sil, "PNG", 242, 5, 48, 48);
      }
    }

    // --- EXPERIENCIA LABORAL (text header only, no dark box) ---
    let rowY = bannerHeight + 10;

    doc.setTextColor(15, 60, 85);
    doc.setFontSize(13); // Increased from 11
    doc.setFont("helvetica", "bold");
    doc.text("EXPERIENCIA LABORAL", 20, rowY);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.line(20, rowY + 2, 140, rowY + 2);

    rowY += 10;

    // Collect experiences
    const experiences: { cargo: string; empresa: string; inicio: string; fin: string }[] = [];
    const addExp = (cargo: string | null, empresa: string | null, inicio: string | null, fin: string | null) => {
      if (!cargo && !empresa) return;
      experiences.push({
        cargo: cargo || "Cargo",
        empresa: empresa || "Empresa",
        inicio: inicio || "",
        fin: fin || "Actualidad",
      });
    };

    addExp(p.cargo_actual, p.empresa, p.fecha_inicio_1, p.fecha_fin_1);
    addExp(p.cargo_2, p.empresa_2, p.fecha_inicio_2, p.fecha_fin_2);
    addExp(p.cargo_3, p.empresa_3, p.fecha_inicio_3, p.fecha_fin_3);
    addExp(p.cargo_4, p.empresa_4, p.fecha_inicio_4, p.fecha_fin_4);
    addExp(p.cargo_5, p.empresa_5, p.fecha_inicio_5, p.fecha_fin_5);
    addExp(p.cargo_6, p.empresa_6, p.fecha_inicio_6, p.fecha_fin_6);

    // Only last 3 (most recent first, they are already ordered newest first)
    const last3Exp = experiences.slice(0, 3);

    if (last3Exp.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Sin experiencia registrada.", 20, rowY);
      rowY += 15;
    } else {
      last3Exp.forEach(exp => {
        // Dates
        doc.setTextColor(15, 60, 85);
        doc.setFontSize(11); // Increased from 9
        doc.setFont("helvetica", "bold");
        doc.text(`${exp.inicio}  –  ${exp.fin}`, 20, rowY);

        // Company (bold)
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12); // Increased from 10
        doc.setFont("helvetica", "bold");
        doc.text(`${exp.empresa}.`, 75, rowY);

        // Cargo (normal, below)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11); // Increased from 9
        doc.setTextColor(60, 60, 60);
        doc.text(exp.cargo, 75, rowY + 6);

        rowY += 18; // Increased from 16
      });
    }

    rowY += 10;

    // --- Bottom Row: Motivación + Renta Actual + Pretensión ---
    // Draw a subtle separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.line(15, rowY, 282, rowY);
    rowY += 6;

    // Three columns
    const col1X = 15;
    const col2X = 95;
    const col3X = 95;

    // Column 1: Motivación
    doc.setTextColor(15, 60, 85);
    doc.setFontSize(11); // Increased from 9
    doc.setFont("helvetica", "bold");
    doc.text("Motivación:", col1X, rowY);

    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11); // Increased from 9
    const motText = p.motivacion || p.observaciones || "Sin comentarios adicionales.";
    const motLines = doc.splitTextToSize(motText, 60);
    doc.text(motLines, col1X, rowY + 6, { maxWidth: 60, align: "left" });

    // Column 2: Renta actual / última renta
    doc.setTextColor(15, 60, 85);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11); // Increased from 9
    doc.text("Renta actual/ última renta", col2X, rowY);

    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`${p.renta_actual ? formatCurrency(p.renta_actual) + " líquidos." : "—"}`, col2X, rowY + 6);

    // Column 3: Pretensión de renta (below renta actual)
    doc.setTextColor(15, 60, 85);
    doc.setFont("helvetica", "bold");
    doc.text("Pretensión de renta", col3X, rowY + 14); // Spacing adjusted

    doc.setTextColor(60, 60, 60);
    doc.text(`${p.pretension_renta ? formatCurrency(p.pretension_renta) + " líquidos." : "—"}`, col3X, rowY + 20);

    // Beneficios Actuales — Column 3 (right side)
    // Solo mostrar para candidatos que perfilan y que tengan contenido
    if (p.status === "Perfila" && p.benef_act) {
      const col4X = 165;
      doc.setTextColor(15, 60, 85);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Beneficios Actuales", col4X, rowY);

      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      const benefText = p.benef_act;
      const benefLines = doc.splitTextToSize(benefText, 85);
      doc.text(benefLines, col4X, rowY + 6, { maxWidth: 85, align: "left" });
    }
  }

  // === Final summary by status (Only show specific requested statuses) ===
  const orderedStatuses = ["Perfila", "Plan B", "Excede Renta"];

  orderedStatuses.forEach((status) => {
    const candidates = postulantes.filter(p => p.status === status);
    if (candidates.length === 0) return;

    doc.addPage([297, 190], "landscape");

    autoTable(doc, {
      startY: 35,
      head: [["NOMBRE", "CARGO/ÚLTIMO CARGO", "EMPRESA/ÚLTIMA EMPRESA", "EDAD", "ESTUDIOS", "RENTA ACTUAL / ÚLTIMA", "PRETENSIÓN"]],
      body: candidates.map((p) => {
        let estudiosStr = "";

        const tryAddStudy = (est: string | null, inst: string | null) => {
          if (!est && !inst) return;
          let block = est || "—";
          if (inst) block = est ? `${est}\n${inst}` : inst;
          if (estudiosStr.length > 0) estudiosStr += "\n"; // Reduced from \n\n to save space
          estudiosStr += block;
        };

        tryAddStudy(p.estudios, p.institucion);
        tryAddStudy(p.estudios_2, p.institucion_2);
        tryAddStudy(p.estudios_3, p.institucion_3);

        if (!estudiosStr) estudiosStr = "—";

        return [
          p.nombre,
          p.cargo_actual ?? "—",
          p.empresa ?? "—",
          p.edad?.toString() ?? "—",
          estudiosStr,
          formatCurrency(p.renta_actual),
          formatCurrency(p.pretension_renta),
        ];
      }),
      columnStyles: {
        0: { cellWidth: 38 }, // Nombre
        1: { cellWidth: 48 }, // Cargo
        2: { cellWidth: 43 }, // Empresa
        3: { cellWidth: 16 }, // Edad (Increased to fit header)
        4: { cellWidth: 80 }, // Estudios
        5: { cellWidth: 30 }, // Renta (Increased to fit header)
        6: { cellWidth: 32 }, // Pretension (Increased to fit header)
      },
      didDrawPage: (data) => {
        // Draw Header Banner and Titles on every page of this status
        doc.setFillColor(...COLORS.bgGrayHeader);
        doc.rect(0, 0, 297, 30, "F");

        doc.setTextColor(60, 60, 60);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Presentación candidatos", 148.5, 12, { align: "center" });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(22);
        doc.text(status.toUpperCase(), 148.5, 23, { align: "center" });
      },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: [50, 50, 50],
        font: "helvetica",
        lineWidth: 0.1,
        lineColor: [255, 255, 255] // White borders for the whole table
      },
      headStyles: {
        fillColor: COLORS.black,
        textColor: COLORS.white,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
      },
      alternateRowStyles: { fillColor: [225, 225, 225] }, // Darker grey for alternating rows
      bodyStyles: {
        fillColor: [240, 240, 240], // Light grey for base rows
        halign: 'center',
        valign: 'middle',
      },
      margin: { left: 5, right: 5, top: 35 } // Maximum width (5mm margins)
    });
  });

  // === Back Cover ===
  doc.addPage([297, 190], "landscape");
  const backW = 297;
  const backH = 190;
  doc.setFillColor(...COLORS.bgGrayHeader);
  doc.rect(0, 0, backW, backH, "F");

  if (backCoverBase64) {
    const imgW = 160;
    const imgH = 60;
    doc.addImage(backCoverBase64, "PNG", (backW - imgW) / 2, (backH - imgH) / 2, imgW, imgH, undefined, "MEDIUM");
  }

  // Apply footers to all pages except cover (1) and back cover (last)
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i < totalPages; i++) {
    doc.setPage(i);
    addFooter(i);
  }


  // Direct download to prevent popup blockers on iPad/iOS
  const blob = doc.output("blob");
  if (returnBlobOnly) {
    return blob;
  }
  doc.save(`Reporte_${proceso.nombre_cargo.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
};
