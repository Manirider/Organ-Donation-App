from typing import Dict, Set, Optional, Any
from uuid import UUID
import asyncio
import json
import logging
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from starlette.websockets import WebSocketState

from app.core.auth import AuthService
from app.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["WebSocket"])


class ConnectionManager:

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[str, Set[str]] = {}
        self.room_connections: Dict[str, Set[str]] = {}

    async def connect(
        self,
        websocket: WebSocket,
        connection_id: str,
        user_id: Optional[str] = None,
        rooms: Optional[list] = None
    ):
        await websocket.accept()
        self.active_connections[connection_id] = websocket

        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(connection_id)

        if rooms:
            for room in rooms:
                if room not in self.room_connections:
                    self.room_connections[room] = set()
                self.room_connections[room].add(connection_id)

        logger.info(f"WebSocket connected: {connection_id}")

    def disconnect(self, connection_id: str):
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]

        for user_id, connections in list(self.user_connections.items()):
            if connection_id in connections:
                connections.discard(connection_id)
                if not connections:
                    del self.user_connections[user_id]

        for room, connections in list(self.room_connections.items()):
            if connection_id in connections:
                connections.discard(connection_id)
                if not connections:
                    del self.room_connections[room]

        logger.info(f"WebSocket disconnected: {connection_id}")

    async def send_personal(self, connection_id: str, message: Dict[str, Any]):
        if connection_id in self.active_connections:
            ws = self.active_connections[connection_id]
            if ws.client_state == WebSocketState.CONNECTED:
                await ws.send_json(message)

    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        if user_id in self.user_connections:
            for conn_id in self.user_connections[user_id]:
                await self.send_personal(conn_id, message)

    async def send_to_room(self, room: str, message: Dict[str, Any]):
        if room in self.room_connections:
            for conn_id in self.room_connections[room]:
                await self.send_personal(conn_id, message)

    async def broadcast(self, message: Dict[str, Any], exclude: Optional[Set[str]] = None):
        exclude = exclude or set()
        for conn_id, ws in list(self.active_connections.items()):
            if conn_id not in exclude and ws.client_state == WebSocketState.CONNECTED:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.error(f"Broadcast error to {conn_id}: {e}")

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_connections": len(self.active_connections),
            "users_connected": len(self.user_connections),
            "rooms": list(self.room_connections.keys()),
            "connections_per_room": {
                room: len(conns) for room, conns in self.room_connections.items()
            }
        }


manager = ConnectionManager()


async def broadcast_notification(user_id: str, data: Dict[str, Any]):
    await manager.send_to_user(user_id, data)


async def broadcast_emergency(
    emergency_type: str,
    blood_type: Optional[str],
    location: Dict[str, float],
    hospital: str,
    urgency: int
):
    message = {
        "type": "emergency",
        "emergency_type": emergency_type,
        "blood_type": blood_type,
        "location": location,
        "hospital": hospital,
        "urgency": urgency,
        "timestamp": datetime.utcnow().isoformat()
    }

    room = f"emergency_{location.get('city', 'all')}"
    await manager.send_to_room(room, message)

    if urgency >= 8:
        await manager.broadcast(message)


@router.websocket("/connect")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    import uuid
    connection_id = str(uuid.uuid4())
    user_id = None

    try:
        async with AsyncSessionLocal() as db:
            payload = AuthService.decode_token(token)
            if payload:
                user_id = payload.get("sub")

        rooms = []
        if user_id:
            rooms = [f"user_{user_id}"]

        await manager.connect(websocket, connection_id, user_id, rooms)

        await websocket.send_json({
            "type": "connected",
            "connection_id": connection_id,
            "user_id": user_id
        })

        while True:
            data = await websocket.receive_json()

            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})

            elif data.get("type") == "subscribe":
                room = data.get("room")
                if room:
                    if room not in manager.room_connections:
                        manager.room_connections[room] = set()
                    manager.room_connections[room].add(connection_id)
                    await websocket.send_json({"type": "subscribed", "room": room})

            elif data.get("type") == "unsubscribe":
                room = data.get("room")
                if room and room in manager.room_connections:
                    manager.room_connections[room].discard(connection_id)
                    await websocket.send_json({"type": "unsubscribed", "room": room})

    except WebSocketDisconnect:
        manager.disconnect(connection_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(connection_id)


@router.get("/stats")
async def get_websocket_stats():
    return manager.get_stats()
