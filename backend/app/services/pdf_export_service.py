import io
import logging
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

logger = logging.getLogger("medipro.pdf")

def generate_pdf_summary(doc_data: dict) -> bytes:
    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=colors.HexColor('#0F766E'),
        spaceAfter=10
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#334155'),
        leading=14
    )
    disclaimer_style = ParagraphStyle(
        'DocDisclaimer',
        parent=styles['Italic'],
        fontSize=8,
        textColor=colors.HexColor('#DC2626'),
        leading=11
    )

    story = []

    # Header
    story.append(Paragraph("MediPro AI - Patient Medical Summary", title_style))
    story.append(Paragraph(f"<b>Document:</b> {doc_data.get('file_name', 'Report')} | <b>Category:</b> {doc_data.get('category', 'Medical')}", body_style))
    story.append(Paragraph(f"<b>Generated On:</b> {doc_data.get('uploaded_at', '2026-07-31')}", body_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F766E'), spaceAfter=15))

    # Overview
    ai_summary = doc_data.get("ai_summary", {})
    story.append(Paragraph("Overview & Key Breakdown", subtitle_style))
    story.append(Paragraph(ai_summary.get("overview", "No summary available."), body_style))
    story.append(Spacer(1, 10))

    # Key Findings
    story.append(Paragraph("Key Findings", subtitle_style))
    findings = ai_summary.get("key_findings", [])
    for f in findings:
        story.append(Paragraph(f"• {f}", body_style))
    story.append(Spacer(1, 10))

    # Abnormal Values Table
    abnormals = ai_summary.get("abnormal_values", [])
    if abnormals:
        story.append(Paragraph("Abnormal / Out-of-Range Parameters", subtitle_style))
        table_data = [["Parameter", "Result Value", "Clinical Significance"]]
        for item in abnormals:
            table_data.append([
                item.get("parameter", ""),
                item.get("value", ""),
                item.get("meaning", "")
            ])
        t = Table(table_data, colWidths=[150, 100, 270])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#CCFBF1')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0F766E')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 15))

    # Patient Recommended Actions
    actions = ai_summary.get("patient_actions", [])
    if actions:
        story.append(Paragraph("Suggested Patient Actions", subtitle_style))
        for act in actions:
            story.append(Paragraph(f"✓ {act}", body_style))
        story.append(Spacer(1, 10))

    # Questions for Healthcare Provider
    questions = ai_summary.get("questions_for_doctor", [])
    if questions:
        story.append(Paragraph("Questions to Ask Your Doctor", subtitle_style))
        for q in questions:
            story.append(Paragraph(f"? {q}", body_style))
        story.append(Spacer(1, 15))

    # Disclaimer Footer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceAfter=10))
    story.append(Paragraph(
        "<b>MEDICAL SAFETY NOTICE:</b> " + ai_summary.get("medical_disclaimer", "For educational purposes only."),
        disclaimer_style
    ))

    pdf.build(story)
    return buffer.getvalue()
