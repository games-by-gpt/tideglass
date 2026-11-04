import {chromium} from 'playwright';
import fs from 'node:fs/promises';
await fs.mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto('http://localhost:5173');await page.locator('#start').waitFor();await page.waitForTimeout(1500);await page.screenshot({path:'artifacts/home.png'});await page.locator('#start').click();await page.waitForTimeout(1000);await page.screenshot({path:'artifacts/play.png'});console.log('state',await page.evaluate(()=>window.__tideglass.snapshot()));console.log('errors',errors);await browser.close();
