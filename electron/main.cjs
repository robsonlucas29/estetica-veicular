const { app, BrowserWindow } = require('electron');
const path = require('path');
function createWindow(){
  const win = new BrowserWindow({width:1440,height:900,minWidth:1100,minHeight:700,backgroundColor:'#0b0b0d',webPreferences:{contextIsolation:true,nodeIntegration:false}});
  if(!app.isPackaged){ win.loadURL('http://127.0.0.1:5173'); }
  else { win.loadFile(path.join(__dirname,'../dist/index.html')); }
}
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
