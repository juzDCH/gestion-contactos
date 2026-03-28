from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import personas, grupos
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(personas.router, prefix="/personas", tags=["Personas"])
app.include_router(grupos.router, prefix="/grupos", tags=["Grupos"])

@app.get("/")
def root():
    return {"mensaje": "API Gestión de Contactos funcionando"}