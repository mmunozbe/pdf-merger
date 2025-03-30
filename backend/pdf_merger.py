from flask import Flask, request, send_file, jsonify, send_from_directory
from flask_cors import CORS
from PyPDF2 import PdfMerger, PdfReader, PdfWriter
import random, os, zipfile, re, shutil, sys, time, gc, threading, webbrowser
from pathlib import Path


# Detectar si se ejecuta desde un ejecutable empaquetado
if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
else:
    base_path = os.path.abspath(os.path.dirname(__file__))

# Carpeta de salida en "Downloads"
DOWNLOADS_DIR = str(Path.home() / "Downloads")
BASE_OUTPUT_DIR = os.path.join(DOWNLOADS_DIR, "PDF_Merger_Output")

app = Flask(__name__, static_folder=os.path.join(base_path, "frontend/dist"))
CORS(app, resources={r"/*": {"origins": "*"}})

LOVE_MESSAGES = [
    "Eres mi vida",
    "Te amo más de lo que las palabras pueden expresar.",
    "Volvemos posible lo imposible y los miedos un reto.",
    "Cada momento contigo es un tesoro.",
    "Tu amor es mi mayor fortaleza.",
    "Tu sonrisa precede la mía",
    "Que mi corazón sea tu hogar.",
    "Soy eterno contigo",
]

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

def safe_remove(path):
    """Intentar eliminar un archivo con reintento en caso de bloqueo."""
    retries = 5
    while os.path.exists(path) and retries > 0:
        try:
            os.remove(path)
            break
        except PermissionError:
            retries -= 1
            time.sleep(0.5)

@app.route('/merge', methods=['POST'])
def merge_pdfs():
    if 'pdf_files_0' not in request.files:
        return jsonify({"error": "No se enviaron archivos."}), 400

    files = [request.files[key] for key in request.files if key.startswith("pdf_files_")]
    if len(files) < 2:
        return jsonify({"error": "Se necesitan al menos dos archivos para unir."}), 400

    output_file = os.path.join(BASE_OUTPUT_DIR, "merged.pdf")
    temp_dir = os.path.join(BASE_OUTPUT_DIR, "temp")

    try:
        os.makedirs(temp_dir, exist_ok=True)
        os.makedirs(BASE_OUTPUT_DIR, exist_ok=True)
        merger = PdfMerger()

        for file in files:
            temp_path = os.path.join(temp_dir, file.filename)
            file.save(temp_path)
            merger.append(temp_path)

        merger.write(output_file)
        merger.close()
        del merger  # Liberar memoria
        gc.collect()

        return send_file(output_file, as_attachment=True)
    finally:
        time.sleep(0.5)
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.route('/split', methods=['POST'])
def split_pdf():
    if 'pdf_file' not in request.files:
        return jsonify({"error": "No se envió ningún archivo PDF."}), 400

    pdf_file = request.files['pdf_file']
    num_parts = request.form.get('num_parts')
    pages_per_part = request.form.get('pages_per_part')
    file_names = request.form.get('file_names')

    if not num_parts or not pages_per_part or not file_names:
        return jsonify({"error": "Faltan datos para dividir el PDF."}), 400

    output_dir = os.path.join(BASE_OUTPUT_DIR, "output")
    zip_path = os.path.join(BASE_OUTPUT_DIR, "split_files.zip")

    try:
        num_parts = int(num_parts)
        pages_per_part = list(map(int, eval(pages_per_part)))
        file_names = eval(file_names)

        reader = PdfReader(pdf_file)
        total_pages = len(reader.pages)

        if sum(pages_per_part) != total_pages:
            return jsonify({"error": "El número total de páginas no coincide con el original."}), 400

        os.makedirs(output_dir, exist_ok=True)
        original_name = os.path.splitext(pdf_file.filename)[0]
        output_files = []

        start_page = 0
        for i, num_pages in enumerate(pages_per_part):
            writer = PdfWriter()
            end_page = start_page + num_pages

            for page in range(start_page, end_page):
                writer.add_page(reader.pages[page])

            sanitized_filename = sanitize_filename(file_names[i] if file_names[i] else f"{original_name}_{i+1}.pdf")
            output_path = os.path.join(output_dir, sanitized_filename)
            with open(output_path, "wb") as output_file:
                writer.write(output_file)

            output_files.append(output_path)
            start_page = end_page

            del writer  # Liberar memoria
            gc.collect()

        with zipfile.ZipFile(zip_path, "w") as zipf:
            for file_path in output_files:
                zipf.write(file_path, os.path.basename(file_path))
                safe_remove(file_path)

        return send_file(zip_path, as_attachment=True)
    finally:
        time.sleep(0.5)
        safe_remove(zip_path)
        shutil.rmtree(output_dir, ignore_errors=True)

@app.route('/attach', methods=['POST'])
def attach_pdfs():
    if 'base_pdf' not in request.files:
        return jsonify({"error": "No se envió el PDF base."}), 400

    base_pdf = request.files['base_pdf']
    attachment_pdfs = [request.files[key] for key in request.files if key.startswith("attachment_pdf_")]
    position = request.form.get('position', 'after')

    if not attachment_pdfs:
        return jsonify({"error": "No se enviaron PDFs para adjuntar."}), 400

    base_reader = PdfReader(base_pdf)
    output_files = []

    os.makedirs(BASE_OUTPUT_DIR, exist_ok=True)
    zip_path = os.path.join(BASE_OUTPUT_DIR, "attached_files.zip")

    try:
        for attachment in attachment_pdfs:
            writer = PdfWriter()
            attachment_reader = PdfReader(attachment)

            if position == 'before':
                for page in base_reader.pages:
                    writer.add_page(page)
                for page in attachment_reader.pages:
                    writer.add_page(page)
            else:
                for page in attachment_reader.pages:
                    writer.add_page(page)
                for page in base_reader.pages:
                    writer.add_page(page)

            sanitized_filename = sanitize_filename(attachment.filename)
            output_path = os.path.join(BASE_OUTPUT_DIR, f"{os.path.splitext(sanitized_filename)[0]}.pdf")
            with open(output_path, "wb") as output_file:
                writer.write(output_file)

            output_files.append(output_path)

            del writer, attachment_reader  # Liberar memoria
            gc.collect()

        with zipfile.ZipFile(zip_path, "w") as zipf:
            for file_path in output_files:
                zipf.write(file_path, os.path.basename(file_path))
                safe_remove(file_path)

        return send_file(zip_path, as_attachment=True)
    finally:
        time.sleep(0.5)
        safe_remove(zip_path)

@app.route('/love-message', methods=['GET'])
def love_message():
    try:
        message = random.choice(LOVE_MESSAGES)
        return jsonify({"message": message})
    except Exception as e:
        return jsonify({"error": f"Error al obtener el mensaje de amor: {str(e)}"}), 500

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "Backend is running"})

def sanitize_filename(filename):
    return re.sub(r'[^\w\-_\. ]', '_', filename)

if __name__ == '__main__':
    # Iniciar el servidor Flask en un hilo separado
    threading.Thread(target=lambda: app.run(debug=False, host="0.0.0.0", port=5000), daemon=True).start()

    # Esperar un poco para que el servidor inicie
    time.sleep(1)

    # Abrir el navegador automáticamente
    webbrowser.open("http://localhost:5000")

    # Mantener la app en ejecución
    while True:
        time.sleep(1)
