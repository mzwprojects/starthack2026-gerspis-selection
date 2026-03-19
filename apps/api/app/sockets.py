"""
Socket.IO multiplayer handler – ported from server.js WebSocket section.
Uses python-socketio with ASGI integration.
"""
import random
import socketio

from sqlmodel import Session
from app.database import engine
from app.simulation import run_simulation

# Create Socket.IO server (async mode for ASGI)
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True,
)

# In-memory lobby store
lobbies: dict = {}


def generate_room_code() -> str:
    while True:
        code = str(random.randint(1000, 9999))
        if code not in lobbies:
            return code


def get_lobby_info(room_code: str) -> dict | None:
    lobby = lobbies.get(room_code)
    if not lobby:
        return None
    return {
        "code": lobby["code"],
        "state": lobby["state"],
        "settings": lobby["settings"],
        "players": [
            {
                "id": p["id"],
                "displayName": p["displayName"],
                "isHost": p["isHost"],
                "ready": p["ready"],
                "avatar": p.get("avatar", "🧢"),
            }
            for p in lobby["players"]
        ],
    }


# ── Events ────────────────────────────────────────────────────────────


@sio.event
async def connect(sid, environ):
    print(f"🔌 Player connected: {sid}")


@sio.event
async def create_lobby(sid, data):
    display_name = data.get("displayName", "Player")
    email = data.get("email", "")
    avatar = data.get("avatar", "🧢")
    room_code = generate_room_code()
    player = {
        "id": sid,
        "displayName": display_name,
        "email": email,
        "avatar": avatar,
        "isHost": True,
        "ready": False,
        "allocation": None,
    }
    lobbies[room_code] = {
        "code": room_code,
        "host": sid,
        "players": [player],
        "state": "waiting",
        "settings": {"years": 10, "totalBudget": 10000},
        "simResults": {},
    }
    await sio.enter_room(sid, room_code)
    # Store room on session
    async with sio.session(sid) as session:
        session["roomCode"] = room_code
    await sio.emit("lobby_created", {"roomCode": room_code}, room=sid)
    await sio.emit("lobby_update", get_lobby_info(room_code), room=room_code)
    print(f"🏠 Lobby {room_code} created by {display_name}")


@sio.event
async def join_lobby(sid, data):
    room_code = data.get("roomCode", "")
    display_name = data.get("displayName", "Player")
    email = data.get("email", "")

    lobby = lobbies.get(room_code)
    if not lobby:
        await sio.emit("error_msg", {"message": "Lobby not found"}, room=sid)
        return
    if lobby["state"] != "waiting":
        await sio.emit("error_msg", {"message": "Game already started"}, room=sid)
        return
    if len(lobby["players"]) >= 6:
        await sio.emit("error_msg", {"message": "Lobby is full (max 6)"}, room=sid)
        return

    player = {
        "id": sid,
        "displayName": display_name,
        "email": email,
        "avatar": data.get("avatar", "🧢"),
        "isHost": False,
        "ready": False,
        "allocation": None,
    }
    lobby["players"].append(player)
    await sio.enter_room(sid, room_code)
    async with sio.session(sid) as session:
        session["roomCode"] = room_code
    await sio.emit("lobby_joined", {"roomCode": room_code}, room=sid)
    await sio.emit("lobby_update", get_lobby_info(room_code), room=room_code)
    print(f"👋 {display_name} joined lobby {room_code}")


@sio.event
async def host_start_game(sid, data):
    async with sio.session(sid) as session:
        room_code = session.get("roomCode")
    if not room_code:
        return
    lobby = lobbies.get(room_code)
    if not lobby or lobby["host"] != sid:
        return
    if len(lobby["players"]) < 1:
        await sio.emit("error_msg", {"message": "Need at least 1 player"}, room=sid)
        return

    lobby["state"] = "setup"
    lobby["settings"] = {
        "years": data.get("years", 10),
        "totalBudget": data.get("totalBudget", 10000),
    }
    for p in lobby["players"]:
        p["ready"] = False
        p["allocation"] = None
    await sio.emit(
        "game_started",
        {"years": lobby["settings"]["years"], "totalBudget": lobby["settings"]["totalBudget"]},
        room=room_code,
    )
    print(f"🎮 Game started in lobby {room_code}")


@sio.event
async def submit_allocation(sid, data):
    async with sio.session(sid) as session:
        room_code = session.get("roomCode")
    if not room_code:
        return
    lobby = lobbies.get(room_code)
    if not lobby or lobby["state"] != "setup":
        return

    player = next((p for p in lobby["players"] if p["id"] == sid), None)
    if not player:
        return
    player["allocation"] = data.get("allocation")
    player["ready"] = True
    print(f"📝 {player['displayName']} submitted allocation in lobby {room_code}")

    await sio.emit("lobby_update", get_lobby_info(room_code), room=room_code)

    all_ready = all(p["ready"] for p in lobby["players"])
    if all_ready:
        print(f"✅ All players ready in lobby {room_code}! Emitting all_ready...")
        await sio.emit("all_ready", room=room_code)


@sio.event
async def start_simulation(sid, data=None):
    async with sio.session(sid) as session_data:
        room_code = session_data.get("roomCode")
    if not room_code:
        return
    lobby = lobbies.get(room_code)
    if not lobby or lobby["host"] != sid:
        return
    if not all(p["ready"] for p in lobby["players"]):
        return

    lobby["state"] = "simulating"
    print(f"🚀 Host starting simulation for lobby {room_code}")

    try:
        years = lobby["settings"]["years"]
        total_budget = lobby["settings"]["totalBudget"]
        results = {}

        with Session(engine) as db_session:
            for player in lobby["players"]:
                result = run_simulation(db_session, years, total_budget, player["allocation"])
                if "error" in result:
                    raise Exception(result["error"])
                results[player["id"]] = {
                    "displayName": player["displayName"],
                    "portfolioHistory": result["portfolioHistory"],
                    "summary": result["summary"],
                    "yearlyData": result["yearlyData"],
                    "saverHistory": result["saverHistory"],
                    "traderHistory": result["traderHistory"],
                    "assetHistories": result["assetHistories"],
                }

        lobby["simResults"] = results

        # Build year-by-year combined data
        year_by_year = []
        for y in range(years + 1):
            year_data = {}
            for p in lobby["players"]:
                year_data[p["id"]] = {
                    "displayName": p["displayName"],
                    "value": results[p["id"]]["portfolioHistory"][y],
                }
            year_by_year.append(year_data)

        shared_yearly_data = results[lobby["players"][0]["id"]]["yearlyData"]

        await sio.emit(
            "simulation_data",
            {
                "years": years,
                "totalBudget": total_budget,
                "yearByYear": year_by_year,
                "saverHistory": results[lobby["players"][0]["id"]]["saverHistory"],
                "traderHistory": results[lobby["players"][0]["id"]]["traderHistory"],
                "yearlyData": shared_yearly_data,
                "playerResults": results,
                "players": [
                    {"id": p["id"], "displayName": p["displayName"]}
                    for p in lobby["players"]
                ],
            },
            room=room_code,
        )
        print(f"📊 Simulation running for lobby {room_code} with {len(lobby['players'])} players")
    except Exception as err:
        print(f"Simulation Error: {err}")
        await sio.emit("error_msg", {"message": f"Simulation failed: {str(err)}"}, room=room_code)


@sio.event
async def get_results(sid, data=None):
    async with sio.session(sid) as session_data:
        room_code = session_data.get("roomCode")
    if not room_code:
        return
    lobby = lobbies.get(room_code)
    if not lobby:
        return

    rankings = []
    for p in lobby["players"]:
        sim = lobby["simResults"].get(p["id"], {})
        summary = sim.get("summary", {})
        rankings.append({
            "id": p["id"],
            "displayName": p["displayName"],
            "finalValue": summary.get("finalValue", 0),
            "totalReturnPct": summary.get("totalReturnPct", 0),
            "sharpeRatio": summary.get("sharpeRatio", 0),
            "portfolioHistory": sim.get("portfolioHistory", []),
        })
    rankings.sort(key=lambda x: x["finalValue"], reverse=True)

    first_player_sim = lobby["simResults"].get(lobby["players"][0]["id"], {})
    await sio.emit(
        "results_data",
        {
            "rankings": rankings,
            "years": lobby["settings"]["years"],
            "totalBudget": lobby["settings"]["totalBudget"],
            "saverHistory": first_player_sim.get("saverHistory", []),
        },
        room=sid,
    )


@sio.event
async def disconnect(sid):
    async with sio.session(sid) as session_data:
        room_code = session_data.get("roomCode")
    if not room_code or room_code not in lobbies:
        return

    lobby = lobbies[room_code]
    lobby["players"] = [p for p in lobby["players"] if p["id"] != sid]
    print(f"❌ Player disconnected from lobby {room_code}")

    if not lobby["players"]:
        del lobbies[room_code]
        print(f"🗑️ Lobby {room_code} deleted (empty)")
    else:
        if lobby["host"] == sid:
            lobby["host"] = lobby["players"][0]["id"]
            lobby["players"][0]["isHost"] = True
        await sio.emit("lobby_update", get_lobby_info(room_code), room=room_code)
        await sio.emit("player_left", {"message": "A player has left the lobby"}, room=room_code)
