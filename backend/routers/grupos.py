from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_connection

router = APIRouter()

class Grupo(BaseModel):
    grupo: str
    esta_activo: Optional[bool] = True

@router.get("/")
def listar_grupos():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, grupo, esta_activo FROM grupos ORDER BY grupo")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [{"id": r[0], "grupo": r[1], "esta_activo": r[2]} for r in rows]

@router.post("/")
def crear_grupo(g: Grupo):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO grupos (grupo, esta_activo) VALUES (%s, %s) RETURNING id",
        (g.grupo, g.esta_activo)
    )
    new_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return {"id": new_id, "grupo": g.grupo}

@router.put("/{id}")
def editar_grupo(id: str, g: Grupo):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE grupos SET grupo=%s, esta_activo=%s WHERE id=%s",
        (g.grupo, g.esta_activo, id)
    )
    conn.commit(); cur.close(); conn.close()
    return {"mensaje": "Grupo actualizado"}

@router.delete("/{id}")
def eliminar_grupo(id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE grupos SET esta_activo=FALSE WHERE id=%s", (id,))
    conn.commit(); cur.close(); conn.close()
    return {"mensaje": "Grupo desactivado"}