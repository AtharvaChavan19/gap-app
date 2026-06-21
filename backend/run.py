import uvicorn

if __name__ == "__main__":
    # Reload=True watches code updates during development
    # Host='0.0.0.0' binds to all network interfaces so local network devices can connect
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
