export class Sound{
 constructor(){this.muted=false;this.ctx=null;this.step=0;}
 start(){try{this.ctx??=new AudioContext();this.ctx.resume();if(!this.timer)this.timer=setInterval(()=>{if(!this.muted&&this.ctx.state==='running'){const notes=[196,246.94,293.66,369.99,293.66,246.94,220,293.66];this.tone(notes[this.step++%notes.length],1.7,.025,'sine');}},1000);}catch{}}
 tone(freq,duration=.2,volume=.1,type='sine',delay=0){if(this.muted||!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g).connect(this.ctx.destination);o.start(t);o.stop(t+duration+.02);}
 collect(){this.tone(587,.35,.1);this.tone(880,.65,.08,'sine',.1);}
 dash(){this.tone(147,.3,.06,'triangle');this.tone(294,.25,.04,'triangle',.08);}
 hit(){this.tone(90,.3,.08,'triangle');}
 win(){[293.66,369.99,440,587.33].forEach((f,i)=>this.tone(f,1.2,.1,'sine',i*.16));}
 pause(){this.ctx?.suspend();}resume(){if(!this.muted)this.ctx?.resume();}
}
