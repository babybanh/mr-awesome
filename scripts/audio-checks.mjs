import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFile} from 'node:fs/promises';
const source = await readFile(new URL('../src/game/MusicManager.ts', import.meta.url), 'utf8');
const emitted = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext}}).outputText;
const {MusicManager} = await import('data:text/javascript;base64,' + Buffer.from(emitted).toString('base64'));
const document=new EventTarget();document.hidden=false;globalThis.document=document;
const players=[];
globalThis.Audio=class extends EventTarget {
 paused=true;ended=false;currentTime=0;volume=0;calls=0;
 constructor(src){super();this.src=src;players.push(this)}
 load(){}pause(){this.paused=true}
 play(){this.paused=false;this.calls++;return Promise.resolve()}
};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const manager=new MusicManager();
let state={runId:1,time:0,phase:'running',stage:{mode:'introPancakes'}};
const sync=()=>manager.sync(state,{cheatMode:false});
sync();manager.unlock();await flush();
for(let i=0;i<60;i++)sync();await flush();assert.equal(players[0].calls,1,'playing music is not restarted every frame');
players[0].currentTime=12;document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));
for(let i=0;i<60;i++)sync();await flush();assert.equal(players[0].paused,true,'hidden sync cannot restart playback');
document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));await flush();assert.equal(players[0].paused,false);assert.equal(players[0].currentTime,12);
state={...state,stage:{mode:'summoning'},time:1};sync();state.time=3;sync();await flush();
assert.equal(players[1].paused,false);players[1].currentTime=4;
state.phase='paused';sync();state.phase='running';sync();await flush();
assert.equal(players[1].paused,false,'villain reveal resumes after pause');assert.equal(players[1].currentTime,4);
players[1].ended=true;players[1].paused=true;players[1].dispatchEvent(new Event('ended'));
state={...state,time:6,stage:{mode:'chase'}};sync();await flush();assert.equal(players[2].paused,false);
players[2].currentTime=9;state.phase='paused';sync();state.phase='running';sync();await flush();
assert.equal(players[2].paused,false,'route music resumes after pause');assert.equal(players[2].currentTime,9);
manager.setEnabled(false);assert.equal(players[2].paused,true);manager.setEnabled(true);await flush();assert.equal(players[2].paused,false,'route music resumes after toggle');assert.equal(players[2].currentTime,9);
manager.dispose();console.log('Audio checks passed: frame deduplication, hidden silence, intro/reveal/route recovery, mute recovery.');
