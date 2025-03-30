import React, { useState } from "react";
import "../index.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";

const Attach = () => {
  const [basePdf, setBasePdf] = useState(null);
  const [attachmentPdfs, setAttachmentPdfs] = useState([]);
  const [position, setPosition] = useState("before"); // Por defecto, el PDF base va al final

  // Manejar la selección del PDF base
  const handleBasePdfChange = (event) => {
    setBasePdf(event.target.files[0]);
  };

  // Manejar la selección de los PDFs a adjuntar
  const handleAttachmentPdfsChange = (event) => {
    setAttachmentPdfs(Array.from(event.target.files)); // Reemplaza los archivos seleccionados
  };

  // Manejar el envío de los PDFs al backend
  const handleAttachPdf = async () => {
    if (!basePdf) {
      alert("Por favor, selecciona un PDF base.");
      return;
    }

    if (attachmentPdfs.length === 0) {
      alert("Por favor, selecciona al menos un PDF para adjuntar.");
      return;
    }

    const formData = new FormData();
    formData.append("base_pdf", basePdf);
    attachmentPdfs.forEach((file, index) => {
      formData.append(`attachment_pdf_${index}`, file);
    });

    // Invertimos la lógica de las posiciones
    formData.append("position", position === "before" ? "after" : "before");

    try {
      const response = await fetch("http://127.0.0.1:5000/attach", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al adjuntar los PDFs.");
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "attached_files.zip";
      link.click();
    } catch (error) {
      console.error("Error al adjuntar los PDFs:", error);
      alert("Hubo un error al adjuntar los PDFs.");
    }
  };

  return (
    <div className="app-container">
      <h1>Adjuntar PDFs</h1>

      {/* Selector del PDF base */}
      <div className="file-upload-container">
        <input
          type="file"
          id="base-pdf-upload"
          accept="application/pdf"
          onChange={handleBasePdfChange}
        />
        <label htmlFor="base-pdf-upload" className="file-label">
          📂 Seleccionar PDF base
        </label>
        {basePdf && (
          <p className="file-name">
            <FontAwesomeIcon icon={faFilePdf} /> {basePdf.name}
          </p>
        )}
      </div>

      {/* Selector de los PDFs a adjuntar */}
      <div className="file-upload-container">
        <input
          type="file"
          id="attachment-pdfs-upload"
          multiple
          accept="application/pdf"
          onChange={handleAttachmentPdfsChange}
        />
        <label htmlFor="attachment-pdfs-upload" className="file-label">
          📂 Seleccionar PDFs a Adjuntar PDF base
        </label>
        {attachmentPdfs.length > 0 && (
          <ul className="file-list">
            {attachmentPdfs.map((file, index) => (
              <li key={index} className="file-name">
                <FontAwesomeIcon icon={faFilePdf} /> {file.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selector de posición */}
      <div className="checkbox-container">
        <label>
          <input
            type="radio"
            name="position"
            value="before"
            checked={position === "before"}
            onChange={() => setPosition("before")}
          />
          Antes del PDF Base (Base al final)
        </label>
        <label>
          <input
            type="radio"
            name="position"
            value="after"
            checked={position === "after"}
            onChange={() => setPosition("after")}
          />
          Después del PDF Base (Base al inicio)
        </label>
      </div>

      {/* Botón para adjuntar PDFs */}
      <button className="action-button" onClick={handleAttachPdf}>
        🔗 Adjuntar PDFs
      </button>
    </div>
  );
};

export default Attach;