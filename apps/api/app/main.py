from contextlib import asynccontextmanager

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables
from app.seed import seed_database
from app.sockets import sio

from app.routers.auth_router import router as auth_router
from app.routers.quiz_router import router as quiz_router
from app.routers.tips_router import router as tips_router
from app.routers.assets_router import router as assets_router
from app.routers.sim_router import router as sim_router
from app.routers.user_router import router as user_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables & seed
    create_db_and_tables()
    seed_database()
    print("\n🎮 Wealth Manager Arena API ready!")
    print("   ⚡ Socket.IO multiplayer enabled\n")
    yield
    # Shutdown
    pass


app = FastAPI(
    title="Wealth Manager Arena API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
app.include_router(auth_router)
app.include_router(quiz_router)
app.include_router(tips_router)
app.include_router(assets_router)
app.include_router(sim_router)
app.include_router(user_router)


@app.get("/")
async def root():
    return {"message": "Wealth Manager Arena API v1.0.0"}


# Mount Socket.IO as ASGI sub-application
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# The combined app: use `socket_app` as the ASGI entry point
app = socket_app
