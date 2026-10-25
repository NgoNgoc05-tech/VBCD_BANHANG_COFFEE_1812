Start-Process powershell -ArgumentList '-NoExit','-ExecutionPolicy','Bypass','-Command',"Set-Location '$PSScriptRoot\backend'; .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload"
Start-Process powershell -ArgumentList '-NoExit','-ExecutionPolicy','Bypass','-Command',"Set-Location '$PSScriptRoot\frontend'; npm run dev"
