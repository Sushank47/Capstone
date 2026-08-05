# MediPro AI - Dataset Training & Ingestion Directory

Place all your raw medical datasets, report PDFs, clinical notes, laboratory test results, and training document files in this folder (`/dataset`).

---

## 📁 Supported Dataset File Types

- **PDF Documents** (`.pdf`): Blood reports, discharge summaries, radiology scans, pathology test sheets.
- **Text Files** (`.txt`, `.md`): Clinical transcripts, patient notes, doctor notes.
- **Images** (`.png`, `.jpg`, `.jpeg`, `.tiff`): Scanned reports, photos of handwritten prescriptions.
- **Data Files** (`.json`, `.csv`): Structured lab result tables and dataset rows.

---

## 🚀 How to Index / Train the AI Agent on New Dataset Files

Whenever you add new dataset files to this directory, run the automated ingestion script:

```bash
cd backend
./venv/bin/python scripts/ingest_dataset_folder.py
```

### What Happens During Ingestion:
1. **Azure AI Vision (OCR)**: Scans and extracts text and tables from PDFs, scanned images, and text files.
2. **Azure AI Language (Medical Entities)**: Extracts lab parameters, dosages, reference ranges, and clinical terms.
3. **Azure OpenAI (GPT-4 Breakdown)**: Creates empathetic plain-English patient summaries.
4. **Azure AI Search (Vector RAG Indexing)**: Indexes document vector chunks so the Conversational AI Assistant can instantly retrieve grounded answers with citations.
