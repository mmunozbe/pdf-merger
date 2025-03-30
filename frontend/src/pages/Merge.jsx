import React, { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "../components/SortableItem";
import "../index.css";

const Merge = () => {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  // Manejar la selección de archivos
  const handleFileChange = (event) => {
    setFiles([...files, ...Array.from(event.target.files)]);
  };

  // Manejar el reordenamiento de archivos
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = files.findIndex((file) => file.name === active.id);
      const newIndex = files.findIndex((file) => file.name === over.id);
      setFiles(arrayMove(files, oldIndex, newIndex));
    }
  };

  // Manejar la unión de PDFs
  const handleMergePdf = async () => {
    if (files.length === 0) {
      alert("Por favor, selecciona al menos un archivo PDF.");
      return;
    }

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`pdf_files_${index}`, file);
    });

    // Nombre de archivo de salida predeterminado
    formData.append("output_file", "merged.pdf");

    try {
      const response = await fetch("http://127.0.0.1:5000/merge", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al unir los PDFs.");
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "merged.pdf";
      link.click();

      setMessage("PDFs unidos exitosamente. El archivo se descargará automáticamente.");
    } catch (error) {
      console.error("Error al unir los PDFs:", error);
      alert("Hubo un error al unir los PDFs.");
    }
  };

  return (
    <div className="app-container">
      <h1>Unir PDFs</h1>

      {/* Selector de archivos */}
      <div className="file-upload-container">
        <input
          type="file"
          id="merge-file-upload"
          multiple
          accept="application/pdf"
          onChange={handleFileChange}
        />
        <label htmlFor="merge-file-upload" className="file-label">
          📂 Seleccionar Archivos
        </label>
      </div>

      {/* Lista de archivos reordenables */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={files.map((file) => file.name)}
          strategy={verticalListSortingStrategy}
        >
          <div className="uploaded-files">
            {files.map((file) => (
              <SortableItem key={file.name} id={file.name} fileName={file.name} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Botón para unir PDFs */}
      <button className="action-button" onClick={handleMergePdf}>
        🔗 Unir PDFs
      </button>

      {/* Mensaje de estado */}
      {message && <p>{message}</p>}
    </div>
  );
};

export default Merge;