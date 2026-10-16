import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
export async function exportGroup(res, group, members, format) {
  const columns = [
    "Nom et prénoms",
    "Sexe",
    "Téléphone",
    "Quartier",
    "Commune",
    "Profession",
    "Adhésion",
  ];
  const rows = members.map((m) => [
    m.full_name,
    m.sex === "male" ? "Homme" : "Femme",
    m.phone,
    m.neighborhood,
    m.municipality,
    m.profession,
    new Date(m.joined_on).toISOString().slice(0, 10),
  ]);
  res.set("Cache-Control", "no-store");
  res.attachment(`groupe-${group.id}.${format}`);
  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Membres");
    sheet.columns = columns.map((header, i) => ({
      header,
      key: String(i),
      width: i === 0 ? 32 : 22,
    }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF006B61" },
    };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = { from: "A1", to: `G${rows.length + 1}` };
    sheet.pageSetup = {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    };
    res.type(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.send(Buffer.from(await workbook.xlsx.writeBuffer()));
  } else {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 32,
      bufferPages: true,
    });
    res.type("application/pdf");
    doc.pipe(res);
    const widths = [175, 48, 103, 105, 105, 122, 76];
    const renderHeader = () => {
      doc.font("Helvetica-Bold").fontSize(17).text(group.name, { width: 770 });
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(
          `${members.length} membre(s) • Liste du ${new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Brussels" })}`,
        );
      doc.moveDown();
      const y = doc.y;
      let x = 32;
      doc.font("Helvetica-Bold").fontSize(9);
      columns.forEach((c, i) => {
        doc.text(c, x, y, { width: widths[i] - 8 });
        x += widths[i];
      });
      doc.y = y + 30;
      doc.font("Helvetica").fontSize(9);
    };
    renderHeader();
    for (const row of rows) {
      const height = Math.max(
        24,
        ...row.map(
          (c, i) =>
            doc.heightOfString(String(c), { width: widths[i] - 8 }) + 12,
        ),
      );
      if (doc.y + height > 540) {
        doc.addPage();
        renderHeader();
      }
      const y = doc.y;
      let x = 32;
      row.forEach((c, i) => {
        doc.text(String(c), x, y, { width: widths[i] - 8 });
        x += widths[i];
      });
      doc
        .strokeColor("#dddddd")
        .moveTo(32, y + height - 5)
        .lineTo(806, y + height - 5)
        .stroke();
      doc.y = y + height;
    }
    const range = doc.bufferedPageRange();
    for (let page = 0; page < range.count; page++) {
      doc.switchToPage(page);
      doc
        .fontSize(8)
        .text(`${page + 1} / ${range.count}`, 32, 550, {
          width: 770,
          align: "right",
        });
    }
    doc.end();
  }
}
