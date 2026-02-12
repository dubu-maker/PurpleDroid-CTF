from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# 정답 요청을 받을 데이터 모델
class FlagRequest(BaseModel):
    level: int
    flag: str

@app.get("/")
def read_root():
    return {"message": "Welcome to PurpleDroid Server! 🛡️⚔️"}

@app.post("/verify")
def verify_flag(req: FlagRequest):
    # Level 1 정답 등록!
    if req.level == 1 and req.flag == "FLAG{Always_Check_The_Logs_First}":
        return {"status": "success", "message": "Correct! Level 1 Cleared. 🔓"}
        
    # (나중에 Level 2, 3도 여기에 추가됨)

    else:
        # 틀렸을 때 (400 Bad Request)
        raise HTTPException(status_code=400, detail="Wrong Flag! Try harder.")