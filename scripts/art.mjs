import {chromium} from 'playwright';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
for(const [kind,width,height] of [['icon',1024,1024],['cover',1536,1024],['banner',2560,1280],['poster',1024,1536],['splash',1920,1080]]){const p=await b.newPage({viewport:{width,height},deviceScaleFactor:1});await p.goto(`http://localhost:5173/tools/art.html?kind=${kind}`);await p.waitForFunction(()=>window.ready);await p.waitForTimeout(500);await p.screenshot({path:`.arcadible/${kind}.png`});console.log(kind);await p.close();}await b.close();
