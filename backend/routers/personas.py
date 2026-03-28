from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from database import get_connection
import shutil, os, uuid

router = APIRouter()

@router.get("/")
def listar_personas():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.id, p.nombres, p.apellidos, p.correo, p.nro_celular,
               p.direccion, p.observaciones, p.fotografia, p.esta_activo,
               p.grupo_id, g.grupo
        FROM personas p
        LEFT JOIN grupos g ON p.grupo_id = g.id
        ORDER BY p.apellidos, p.nombres
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [{"id": r[0], "nombres": r[1], "apellidos": r[2], "correo": r[3],
             "nro_celular": r[4], "direccion": r[5], "observaciones": r[6],
             "fotografia": r[7], "esta_activo": r[8],
             "grupo_id": r[9], "grupo": r[10]} for r in rows]

@router.get("/{id}")
def obtener_persona(id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.id, p.nombres, p.apellidos, p.correo, p.nro_celular,
               p.direccion, p.observaciones, p.fotografia, p.esta_activo,
               p.grupo_id, g.grupo
        FROM personas p
        LEFT JOIN grupos g ON p.grupo_id = g.id
        WHERE p.id = %s
    """, (id,))
    r = cur.fetchone()
    cur.close(); conn.close()
    if not r:
        raise HTTPException(status_code=404, detail="No encontrado")
    return {"id": r[0], "nombres": r[1], "apellidos": r[2], "correo": r[3],
            "nro_celular": r[4], "direccion": r[5], "observaciones": r[6],
            "fotografia": r[7], "esta_activo": r[8],
            "grupo_id": r[9], "grupo": r[10]}

@router.post("/")
async def crear_persona(
    nombres: str = Form(...),
    apellidos: str = Form(...),
    correo: str = Form(""),
    nro_celular: str = Form(""),
    direccion: str = Form(""),
    observaciones: str = Form(""),
    esta_activo: bool = Form(True),
    grupo_id: str = Form(...),
    fotografia: Optional[UploadFile] = File(None)
):
    foto_path = None
    if fotografia and fotografia.filename:
        ext = fotografia.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        path = f"uploads/{filename}"
        with open(path, "wb") as f:
            shutil.copyfileobj(fotografia.file, f)
        foto_path = f"/uploads/{filename}"

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO personas (nombres, apellidos, correo, nro_celular,
            direccion, observaciones, fotografia, esta_activo, grupo_id)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
    """, (nombres, apellidos, correo, nro_celular, direccion,
          observaciones, foto_path, esta_activo, grupo_id))
    new_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return {"id": new_id, "nombres": nombres}

@router.put("/{id}")
async def editar_persona(
    id: str,
    nombres: str = Form(...),
    apellidos: str = Form(...),
    correo: str = Form(""),
    nro_celular: str = Form(""),
    direccion: str = Form(""),
    observaciones: str = Form(""),
    esta_activo: bool = Form(True),
    grupo_id: str = Form(...),
    fotografia: Optional[UploadFile] = File(None)
):
    conn = get_connection()
    cur = conn.cursor()

    foto_path = None
    if fotografia and fotografia.filename:
        ext = fotografia.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        path = f"uploads/{filename}"
        with open(path, "wb") as f:
            shutil.copyfileobj(fotografia.file, f)
        foto_path = f"/uploads/{filename}"
        cur.execute("""
            UPDATE personas SET nombres=%s, apellidos=%s, correo=%s,
            nro_celular=%s, direccion=%s, observaciones=%s,
            fotografia=%s, esta_activo=%s, grupo_id=%s WHERE id=%s
        """, (nombres, apellidos, correo, nro_celular, direccion,
              observaciones, foto_path, esta_activo, grupo_id, id))
    else:
        cur.execute("""
            UPDATE personas SET nombres=%s, apellidos=%s, correo=%s,
            nro_celular=%s, direccion=%s, observaciones=%s,
            esta_activo=%s, grupo_id=%s WHERE id=%s
        """, (nombres, apellidos, correo, nro_celular, direccion,
              observaciones, esta_activo, grupo_id, id))

    conn.commit(); cur.close(); conn.close()
    return {"mensaje": "Persona actualizada"}

@router.delete("/{id}")
def eliminar_persona(id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE personas SET esta_activo=FALSE WHERE id=%s", (id,))
    conn.commit(); cur.close(); conn.close()
    return {"mensaje": "Persona desactivada"}