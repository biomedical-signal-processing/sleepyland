from fastapi import FastAPI, File, UploadFile
from manager import revert_file  
app = FastAPI()

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Access the uploaded file content
    content_bytes = await file.read()
    content = content_bytes.decode() 
    reversed_content = revert_file(content)  # Call the function
    # Return the reversed content as a response
    return Response(content=reversed_content.encode(), media_type="text/plain")
