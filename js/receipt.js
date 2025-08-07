export function generatePDFReceipt(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });

    const logo = new Image();
    logo.src = "images/logo.png";
    const sideImg = new Image();
    sideImg.src = "images/side.png";

    logo.onload = () => {
        sideImg.onload = () => {
            drawReceipt(doc, data, logo, sideImg);
        };
        sideImg.onerror = () => drawReceipt(doc, data, logo, null);
    };
    logo.onerror = () => {
        sideImg.onload = () => drawReceipt(doc, data, null, sideImg);
        sideImg.onerror = () => drawReceipt(doc, data, null, null);
    };
}

function drawReceipt(doc, data, logo, sideImg) {
    const margin = 10;
    const pageWidth = 148; // A5 width in mm
    const contentWidth = pageWidth - 2 * margin;
    const midX = pageWidth / 2;

    // === HEADER SECTION ===
    const headerY = 20; // vertical center
    const headerLineY = 30;
    const logoWidth = 20;
    const logoHeight = 20;

    if (logo) {
        // Fixed left logo
        doc.addImage(logo, "PNG", margin, headerY - logoHeight / 2, logoWidth, logoHeight);
    }

    // Title: Centered horizontally and vertically
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("NAKURU HIGHWAY WEIGHBRIDGE", midX, headerY, { align: "center" });

    // Date and Time: Right-aligned, stacked, centered vertically
    const date = data.timestamp.split(",")[0];
    const time = data.timestamp.split(",")[1]?.trim() || '';

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const textRightX = pageWidth - margin;
    const textStartY = headerY - 3; // small shift up to allow 2 lines

    doc.text(`Date: ${date}`, textRightX, textStartY, { align: "right" });
    doc.text(`Time: ${time}`, textRightX, textStartY + 6, { align: "right" });

    // Horizontal divider after header
    doc.line(margin, headerLineY, pageWidth - margin, headerLineY);



    // === MAIN SECTION (flex layout) ===
    const topY = 35;
    const colWidth = (contentWidth / 2) - 5;

    // === LEFT COLUMN ===
    let leftX = margin;
    let yLeft = topY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Plate Number:", leftX, yLeft);
    doc.setFont("helvetica", "normal");
    doc.text(data.plate, leftX + 28, yLeft); yLeft += 6;

    // Side Image
    if (sideImg) {
        const imgW = colWidth;
        const imgH = imgW * (sideImg.height / sideImg.width); // keep aspect ratio
        doc.addImage(sideImg, "PNG", leftX, yLeft, imgW, imgH, undefined, 'FAST');

        // Overlay plate text
        const plateX = leftX + imgW / 2;
        const plateY = yLeft + imgH - 8;
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setDrawColor(0);
        doc.setTextColor(255, 255, 255);
        doc.setTextColor(0, 0, 0); // black shadow (double pass for shadow effect)
        doc.text(data.plate, plateX + 0.5, plateY + 0.5, { align: "center" });
        doc.setTextColor(255, 255, 255);
        doc.text(data.plate, plateX, plateY, { align: "center" });

        yLeft += imgH + 6;
    }

    // === RIGHT COLUMN ===
    let rightX = midX + 5;
    let yRight = yLeft - 60;

    doc.setTextColor(0, 0, 0); // reset to black

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Weight Details", rightX, yRight); yRight += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const frontAxle = data.frontAxle ?? data.axleWeight ?? 0;
    const rearAxle = data.rearAxle ?? data.rearAxleWeight ?? 0;
    const total = data.totalWeight ?? 0;

    doc.text(`Front Axle: ${frontAxle} kg`, rightX, yRight); yRight += 6;
    doc.text(`Rear Axle: ${rearAxle} kg`, rightX, yRight); yRight += 6;
    doc.text(`Total Weight: ${total} kg`, rightX, yRight); yRight += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Officer", rightX, yRight); yRight += 6;

    doc.setFont("helvetica", "normal");
    const officer = data.officer || data.user || "Unknown";
    const role = data.role || "N/A";
    const reweigh = data.reweighCount ?? 0;

    doc.text(`${officer} (${role})`, rightX, yRight); yRight += 6;
    doc.text(`Reweigh Count: ${reweigh}`, rightX, yRight);


    // === PAYMENT DETAILS SECTION ===
    doc.line(margin, 138, pageWidth - margin, 138); // section separator

    let paymentY = 142; // adjusted slightly down for spacing

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Payment Details", margin, paymentY); paymentY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9); // slightly smaller for fit

    doc.text("Service: Vehicle Weighing Completed", margin, paymentY); paymentY += 5;
    doc.text("Amount Due: KES 500", margin, paymentY); paymentY += 5;
    doc.text("Payment via: Pochi la Biashara", margin, paymentY); paymentY += 5;
    doc.text("Pay to Account: 11111111111", margin, paymentY);


    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("Thank you for using Nakuru Highway Weighbridge.", midX, 190, { align: "center" });




    // === FINALIZE PDF ===
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
}
