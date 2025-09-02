import React, { useEffect, useState } from 'react';
import { getMetrics } from '../services/api.js';
import { FiTrendingUp, FiClock, FiDollarSign, FiCheckCircle } from 'react-icons/fi';

function Card({ icon, title, value, hint }){
  return (
    <div className="feature" style={{ display:'grid', gridTemplateColumns:'32px 1fr', gap:12, alignItems:'center' }}>
      <div className="feature-icon">{icon}</div>
      <div>
        <div style={{ fontWeight:700 }}>{title}</div>
        <div style={{ fontSize:20 }}>{value}</div>
        {hint ? <div className="muted" style={{ fontSize:12 }}>{hint}</div> : null}
      </div>
    </div>
  );
}

export default function KPICards(){
  const [m, setM] = useState(null);
  useEffect(() => {
    let t;
    const load = async () => {
      try{
        const res = await getMetrics();
        setM(res);
      }catch(e){
        // keep polling, show zeros
        setM(m => m || { apiCalls:0, apiCallsGemini:0, apiCallsGroq:0, timeSavedSec:0, estCost:0, successRate:0, successes:0, attempts:0, outTokensGemini:0, outTokensGroq:0 });
      }
      t = setTimeout(load, 4000);
    };
    load();
    return () => clearTimeout(t);
  }, []);
  const data = m || { apiCalls:0, apiCallsGemini:0, apiCallsGroq:0, timeSavedSec:0, estCost:0, successRate:0, successes:0, attempts:0, outTokensGemini:0, outTokensGroq:0 };

  const apiCalls = data.apiCalls;
  const timeSaved = data.timeSavedSec;
  const cost = data.estCost;
  const successPct = data.successRate ? Math.round(data.successRate * 100) : 0;

  return (
    <div className="landing-section" style={{ paddingTop: 0 }}>
      <h3 className="section-title">Your KPIs</h3>
      <div className="section-grid">
        <Card icon={<FiTrendingUp />} title="API Calls" value={`${apiCalls}`} hint={`Gemini ${data.apiCallsGemini} · GROQ ${data.apiCallsGroq}`} />
        <Card icon={<FiClock />} title="Time Saved" value={`${timeSaved}s`} hint="Estimated typing time avoided" />
        <Card icon={<FiDollarSign />} title={`Est. Cost`} value={`$${cost}`} hint={`Tokens G:${data.outTokensGemini} · GR:${data.outTokensGroq}`} />
        <Card icon={<FiCheckCircle />} title="Successful Executions" value={`${successPct}%`} hint={`${data.successes}/${data.attempts} success`} />
      </div>
    </div>
  );
}
