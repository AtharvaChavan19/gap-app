import os
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import placeholder gap detection service
from services.gap_detection_service import analyze_field

app = FastAPI(title="Agritech Gap Detection API", version="1.0.0")

# Enable CORS for frontend connection (crucial for React Native on local network)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Constants for directories
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
IMAGE_DIR = os.path.join(UPLOAD_DIR, "images")
KML_DIR = os.path.join(UPLOAD_DIR, "kml")
RESULTS_DIR = os.path.join(UPLOAD_DIR, "results")

# Expose the uploads directory statically on /static path
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

# Maximum permitted file sizes in bytes
MAX_IMAGE_SIZE = 15 * 1024 * 1024  # 15 MB
MAX_KML_SIZE = 5 * 1024 * 1024     # 5 MB

# Supported file extensions
SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
SUPPORTED_KML_EXTENSIONS = {".kml"}

@app.on_event("startup")
def startup_event():
    """Ensure upload directories exist on startup."""
    os.makedirs(IMAGE_DIR, exist_ok=True)
    os.makedirs(KML_DIR, exist_ok=True)
    os.makedirs(RESULTS_DIR, exist_ok=True)
    print(f"[Startup] Created upload directories:")
    print(f"  - Images: {IMAGE_DIR}")
    print(f"  - KML files: {KML_DIR}")
    print(f"  - Results: {RESULTS_DIR}")

@app.get("/api/health")
def health_check():
    """Health check endpoint to verify server accessibility."""
    return {"status": "ok", "message": "FastAPI Agritech server is up and running"}

@app.post("/api/gap-detection/analyze")
async def analyze_gap_detection(
    request: Request,
    image_file: UploadFile = File(...),
    kml_file: UploadFile = File(...)
):
    """
    Endpoint for uploading plantation images and KML boundaries.
    Saves the files locally, validates formats/sizes, calls analysis service, 
    and returns structured results with statically accessible image URL.
    """
    # 1. Validate Image format
    image_ext = os.path.splitext(image_file.filename)[1].lower()
    if image_ext not in SUPPORTED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{image_ext}'. Supported formats: JPG, JPEG, PNG."
        )

    # 2. Validate KML format
    kml_ext = os.path.splitext(kml_file.filename)[1].lower()
    if kml_ext not in SUPPORTED_KML_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported boundary format '{kml_ext}'. Supported format: .kml."
        )

    # 3. Create unique file names to prevent naming collisions
    unique_id = uuid.uuid4().hex
    saved_image_filename = f"{unique_id}_{image_file.filename}"
    saved_kml_filename = f"{unique_id}_{kml_file.filename}"
    
    saved_image_path = os.path.join(IMAGE_DIR, saved_image_filename)
    saved_kml_path = os.path.join(KML_DIR, saved_kml_filename)

    # 4. Save Image file & validate size
    try:
        image_size = 0
        with open(saved_image_path, "wb") as buffer:
            # Chunked writing to avoid memory issues with large files
            while chunk := await image_file.read(1024 * 1024):
                image_size += len(chunk)
                if image_size > MAX_IMAGE_SIZE:
                    buffer.close()
                    if os.path.exists(saved_image_path):
                        os.remove(saved_image_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Image size exceeds the maximum limit of 15MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save plantation image: {str(e)}"
        )

    # 5. Save KML file & validate size
    try:
        kml_size = 0
        with open(saved_kml_path, "wb") as buffer:
            while chunk := await kml_file.read(1024 * 1024):
                kml_size += len(chunk)
                if kml_size > MAX_KML_SIZE:
                    buffer.close()
                    # Clean up saved files
                    if os.path.exists(saved_kml_path):
                        os.remove(saved_kml_path)
                    if os.path.exists(saved_image_path):
                        os.remove(saved_image_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"KML boundary size exceeds the maximum limit of 5MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(saved_image_path):
            os.remove(saved_image_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save KML file: {str(e)}"
        )

    # 6. Call the dynamic analysis service
    try:
        analysis_result = analyze_field(
            image_path=saved_image_path,
            kml_path=saved_kml_path,
            results_dir=RESULTS_DIR
        )
        
        # 7. Construct static dynamic URL to fetch annotated image
        # request.base_url gets the schema + host ip + port dynamically (e.g. http://192.168.1.2:8000/)
        base_url = str(request.base_url).rstrip('/')
        annotated_image_url = f"{base_url}/static/results/{analysis_result['annotated_filename']}"
        
        return {
            "total_gaps": analysis_result["total_gaps"],
            "estimated_missing_plants": analysis_result["estimated_missing_plants"],
            "estimated_yield_loss": analysis_result["estimated_yield_loss"],
            "coordinates": analysis_result["coordinates"],
            "annotated_image_url": annotated_image_url
        }
        
    except Exception as e:
        # Cleanup saved files in case of error
        if os.path.exists(saved_image_path):
            os.remove(saved_image_path)
        if os.path.exists(saved_kml_path):
            os.remove(saved_kml_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model integration layer error: {str(e)}"
        )
