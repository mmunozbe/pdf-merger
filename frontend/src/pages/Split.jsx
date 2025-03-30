import React, { useState } from "react";
import "../index.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";

const Split = () => {
  const [file, setFile] = useState(null);
  const [numParts, setNumParts] = useState("");
  const [pagesPerPart, setPagesPerPart] = useState([]);
  const [fileNames, setFileNames] = useState([]);
  const [zipName, setZipName] = useState("split_files.zip"); // Nombre del archivo ZIP

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleNumPartsChange = (event) => {
    const value = event.target.value;
    if (value > 0) {
      setNumParts(value);
      setPagesPerPart(Array(Number(value)).fill(""));
      setFileNames(Array(Number(value)).fill(""));
    }
  };

  const handlePageCountChange = (index, value) => {
    const newPages = [...pagesPerPart];
    newPages[index] = value;
    setPagesPerPart(newPages);
  };

  const handleFileNameChange = (index, value) => {
    const newNames = [...fileNames];
    newNames[index] = value;
    setFileNames(newNames);
  };

  const handleSplitPdf = async () => {
    if (!file || numParts === "" || pagesPerPart.includes("")) {
      alert("Por favor, selecciona un PDF y define correctamente todas las partes.");
      return;
    }

    const totalPages = pagesPerPart.reduce((sum, num) => sum + Number(num), 0);
    if (isNaN(totalPages) || totalPages <= 0) {
      alert("Las páginas asignadas no son válidas.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf_file", file);
    formData.append("num_parts", numParts);
    formData.append("pages_per_part", JSON.stringify(pagesPerPart));
    formData.append("file_names", JSON.stringify(fileNames));

    try {
      const response = await fetch("http://127.0.0.1:5000/split", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error desconocido al dividir el PDF.");
      }

      // Descargar el archivo ZIP
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = zipName; // Usar el nombre especificado por el usuario
      link.click();
    } catch (error) {
      console.error("Error al dividir el PDF:", error);
      alert(error.message || "Hubo un error al dividir el PDF.");
    }
  };

  return (
    <div className="app-container">
      <h1>Dividir PDF</h1>

      {/* Selector del PDF */}
      <div className="file-upload-container">
        <input type="file" id="split-pdf-upload" accept="application/pdf" onChange={handleFileChange} />
        <label htmlFor="split-pdf-upload" className="file-label">
          📂 Seleccionar PDF a dividir
        </label>
        {file && (
          <p className="file-name">
            <FontAwesomeIcon icon={faFilePdf} /> {file.name}
          </p>
        )}
      </div>

      {/* Número de partes */}
      <div className="input-container">
        <label>✂️ ¿En cuántos archivos quieres dividirlo?</label>
        <input
          type="number"
          min="1"
          value={numParts}
          onChange={handleNumPartsChange}
          className="styled-input number-input"
        />
      </div>

      {/* Detalles de las partes */}
      {pagesPerPart.length > 0 && (
        <div className="split-details">
          {pagesPerPart.map((_, index) => (
            <div key={index} className="split-section">
              <label>📑 Páginas en el PDF {index + 1}:</label>
              <input
                type="number"
                min="1"
                value={pagesPerPart[index]}
                onChange={(e) => handlePageCountChange(index, e.target.value)}
                className="styled-input"
              />
              <label>📜 Nombre del PDF {index + 1}:</label>
              <input
                type="text"
                placeholder="Opcional: Nombre del archivo"
                value={fileNames[index]}
                onChange={(e) => handleFileNameChange(index, e.target.value)}
                className="styled-input"
              />
            </div>
          ))}
        </div>
      )}

      {/* Nombre del archivo ZIP */}
      <div className="input-container">
        <label>📦 Nombre del archivo ZIP:</label>
        <input
          type="text"
          value={zipName}
          onChange={(e) => setZipName(e.target.value)}
          className="styled-input"
          placeholder="split_files.zip"
        />
      </div>

      <button className="action-button" onClick={handleSplitPdf}>
        ✂️ Dividir PDF
      </button>
    </div>
  );
};

export default Split;

