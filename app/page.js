'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

const ENV_VIDEO_URLS = {
  'rearranged': process.env.NEXT_PUBLIC_REARRANGED_VIDEO_URL || '',
  'ai-manipulated': process.env.NEXT_PUBLIC_AI_MANIPULATED_VIDEO_URL || '',
  'pirated-ai-4': process.env.NEXT_PUBLIC_PIRATED_AI4_VIDEO_URL || ''
};
const MASTER_URL = process.env.NEXT_PUBLIC_MASTER_VIDEO_URL || '';

function fmt(v) {
  const s=Math.max(0,Number(v)||0), m=Math.floor(s/60), sec=(s-m*60).toFixed(2).padStart(5,'0');
  return `${String(m).padStart(2,'0')}:${sec}`;
}
function badgeClass(status='') { const s=status.toLowerCase(); if(s.includes('forward')) return 'badge forward'; if(s.includes('backward')) return 'badge backward'; if(s.includes('start')) return 'badge start'; return 'badge sequential'; }

export default function Page(){
  const [data,setData]=useState(null); const [candidateId,setCandidateId]=useState('rearranged'); const [selected,setSelected]=useState(0); const [query,setQuery]=useState('');
  const masterRef=useRef(null), candRef=useRef(null), stopTimer=useRef(null);
  useEffect(()=>{ fetch('/data/analysis.json').then(r=>r.json()).then(setData); },[]);
  const candidate=useMemo(()=>data?.candidates.find(c=>c.id===candidateId),[data,candidateId]);
  useEffect(()=>setSelected(0),[candidateId]);
  const match=candidate?.matches[selected];
  const filtered=useMemo(()=>{ if(!candidate) return []; const q=query.trim().toLowerCase(); if(!q) return candidate.matches; return candidate.matches.filter(x=>x.candidateTimestamp.includes(q)||x.masterTimestamp.includes(q)||x.status.toLowerCase().includes(q)||String(x.similarity).includes(q)); },[candidate,query]);
  function seekTo(m){ if(!m) return; if(masterRef.current){masterRef.current.currentTime=m.masterTime; masterRef.current.pause();} if(candRef.current){candRef.current.currentTime=m.candidateTime; candRef.current.pause();} }
  function selectMatch(m){ const i=candidate.matches.indexOf(m); if(i>=0)setSelected(i); seekTo(m); }
  async function syncPlay(duration=null){ if(!match)return; clearTimeout(stopTimer.current); masterRef.current.currentTime=match.masterTime; candRef.current.currentTime=match.candidateTime; await Promise.allSettled([masterRef.current.play(),candRef.current.play()]); if(duration){ stopTimer.current=setTimeout(()=>{masterRef.current.pause();candRef.current.pause();},duration*1000); } }
  async function playChunk(ch){ clearTimeout(stopTimer.current); masterRef.current.currentTime=ch.masterStart; candRef.current.currentTime=ch.candidateStart; await Promise.allSettled([masterRef.current.play(),candRef.current.play()]); const duration=Math.min(ch.masterEnd-ch.masterStart,ch.candidateEnd-ch.candidateStart); stopTimer.current=setTimeout(()=>{masterRef.current.pause();candRef.current.pause();},duration*1000); }
  if(!data||!candidate) return <main className="loading">Loading fingerprint evidence…</main>;
  const videoUrl=ENV_VIDEO_URLS[candidate.id];
  return <main className="shell">
    <header className="hero"><div><div className="eyebrow">FORENSIC POC · {data.caseId}</div><h1>{data.title}</h1><p>Timestamp-level perceptual fingerprint evidence with synchronized visual verification.</p></div><div className="heroTag">PUBLIC POC</div></header>

    <nav className="tabs">{data.candidates.map(c=><button key={c.id} className={candidateId===c.id?'tab active':'tab'} onClick={()=>setCandidateId(c.id)}>{c.label}</button>)}</nav>

    <section className="metrics">
      <div className="metric"><span>Fingerprint similarity</span><strong>{candidate.similarity}%</strong></div>
      <div className="metric"><span>Robust-match coverage</span><strong>{candidate.coverage}%</strong></div>
      <div className="metric"><span>Confidence</span><strong>{candidate.confidence}</strong></div>
      <div className="metric wide"><span>Classification</span><strong>{candidate.classification}</strong></div>
    </section>

    {(!MASTER_URL||!videoUrl)&&<div className="notice"><strong>Video URLs not configured.</strong> The analysis UI is fully loaded. Add the four public Blob/storage URLs in Vercel Environment Variables to activate playback.</div>}

    <section className="panel"><div className="sectionTitle"><div><span className="kicker">VISUAL VERIFICATION</span><h2>Synchronized player view</h2></div><div className="controls"><button onClick={()=>setSelected(Math.max(0,selected-1))}>Previous</button><button className="primary" onClick={()=>syncPlay()}>Sync Play</button><button onClick={()=>{masterRef.current?.pause();candRef.current?.pause();}}>Pause</button><button onClick={()=>setSelected(Math.min(candidate.matches.length-1,selected+1))}>Next</button></div></div>
      <div className="players">
        <div className="playerCard"><div className="playerLabel"><b>MASTER</b><span>{data.master.filename}</span></div><video ref={masterRef} controls preload="metadata" src={MASTER_URL||undefined}/><div className="timeLine">Evidence time <b>{match?.masterTimestamp}</b></div></div>
        <div className="playerCard"><div className="playerLabel"><b>CANDIDATE</b><span>{candidate.label}</span></div><video ref={candRef} controls preload="metadata" src={videoUrl||undefined}/><div className="timeLine">Evidence time <b>{match?.candidateTimestamp}</b></div></div>
      </div>
    </section>

    <section className="evidenceGrid">
      <div className="panel"><span className="kicker">CURRENT EVIDENCE</span><h2>Fingerprint proof</h2>
        <div className="proof"><div><span>Similarity</span><strong>{match?.similarity.toFixed(2)}%</strong></div><div><span>Hamming distance</span><strong>{match?.hamming} / 64</strong></div><div><span>Mapping</span><strong className={badgeClass(match?.status)}>{match?.status}</strong></div><div><span>Robust match</span><strong>{match?.robust?'YES':'NO'}</strong></div></div>
        <div className="hashBox"><span>Master pHash</span><code>{match?.masterPhash}</code><span>Candidate pHash</span><code>{match?.candidatePhash}</code></div>
        <button className="primary full" onClick={()=>{seekTo(match);}}>Seek both players to this evidence</button>
      </div>
      <div className="panel"><span className="kicker">FILE IDENTITY</span><h2>Reference integrity</h2><div className="meta"><span>SHA-256</span><code>{data.master.sha256}</code><span>Resolution</span><b>{data.master.resolution}</b><span>Frame rate</span><b>{data.master.fps} fps</b><span>Codec</span><b>{data.master.codec}</b><span>Duration</span><b>{data.master.duration.toFixed(3)} s</b></div></div>
    </section>

    <section className="panel"><div className="sectionTitle"><div><span className="kicker">MATCHED CHUNKS</span><h2>High-confidence content segments</h2></div></div><div className="chunks">{candidate.chunks.length?candidate.chunks.map((ch,i)=><button className="chunk" key={i} onClick={()=>playChunk(ch)}><span>Chunk {String(i+1).padStart(2,'0')}</span><b>{fmt(ch.masterStart)} → {fmt(ch.masterEnd)}</b><small>Master</small><b>{fmt(ch.candidateStart)} → {fmt(ch.candidateEnd)}</b><small>Candidate</small><strong>{ch.similarity}% · {ch.samples} samples</strong></button>):<p>No long contiguous chunks generated for this candidate.</p>}</div></section>

    <section className="panel"><div className="sectionTitle"><div><span className="kicker">TIMESTAMP EVIDENCE</span><h2>Frame-by-frame fingerprint mapping</h2></div><input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter time, status, score…"/></div>
      <div className="tableWrap"><table><thead><tr><th>Candidate</th><th>Matched master</th><th>Similarity</th><th>Hamming</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map((m,i)=><tr key={`${m.candidateTimestamp}-${i}`} className={m===match?'selectedRow':''}><td>{m.candidateTimestamp}</td><td>{m.masterTimestamp}</td><td><b>{m.similarity.toFixed(2)}%</b></td><td>{m.hamming}</td><td><span className={badgeClass(m.status)}>{m.status}</span></td><td><button className="linkBtn" onClick={()=>selectMatch(m)}>View evidence</button></td></tr>)}</tbody></table></div>
    </section>

    <section className="evidenceGrid"><div className="panel"><span className="kicker">METHODOLOGY</span><h2>Fingerprint analysis</h2><div className="meta"><span>Sampling</span><b>{data.methodology.sampling}</b><span>Fingerprint</span><b>{data.methodology.fingerprint}</b><span>Comparison</span><b>{data.methodology.comparison}</b><span>Similarity</span><b>{data.methodology.similarity}</b><span>Robust threshold</span><b>{data.methodology.robustThreshold}</b></div></div>
      <div className="panel"><span className="kicker">EXPORTS</span><h2>Evidence package</h2><div className="downloads"><a href="/downloads/Timestamp_by_Timestamp_Digital_Fingerprint_Report.docx">Timestamp report <span>DOCX</span></a><a href="/downloads/Detailed_Digital_Fingerprinting_Forensic_Report.docx">Detailed forensic report <span>DOCX</span></a><a href="/downloads/Timestamp_Fingerprint_Evidence.csv">Machine-readable evidence <span>CSV</span></a></div></div></section>
    <footer>This interface is a technical proof-of-concept. Fingerprint similarity demonstrates content relationship; legal ownership or infringement requires separate evidence.</footer>
  </main>
}
