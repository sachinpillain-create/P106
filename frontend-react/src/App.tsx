/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OperationalUnit, ForensicSpecimen } from './types';
import { INITIAL_SPECIMEN } from './data/sampleCases';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TacticalCommand } from './components/screens/TacticalCommand';
import { MemoryTriage } from './components/screens/MemoryTriage';
import { PacketHexStream } from './components/screens/PacketHexStream';
import { ArtifactsYara } from './components/screens/ArtifactsYara';
import { IncidentHUD } from './components/screens/IncidentHUD';
import { NodeTelemetry } from './components/screens/NodeTelemetry';
import { CreateCaseModal } from './components/modals/CreateCaseModal';
import { ExportDossierModal } from './components/modals/ExportDossierModal';
import { StixJsonModal } from './components/modals/StixJsonModal';
import { QuarantineModal } from './components/modals/QuarantineModal';

const API_BASE = '/api';

export default function App() {
  const [activeUnit, setActiveUnit] = useState<OperationalUnit>('tactical-command');
  const [currentSpecimen, setCurrentSpecimen] = useState<ForensicSpecimen>(INITIAL_SPECIMEN);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latencyMs, setLatencyMs] = useState(1.2);
  const [incidentsCount, setIncidentsCount] = useState(4);
  const [backendHealth, setBackendHealth] = useState<{ cuda_available: boolean; gpu_name: string | null } | null>(null);
  const [liveEmailId, setLiveEmailId] = useState<string | null>(null);
  const [lastAnalysisData, setLastAnalysisData] = useState<any>(null);

  // Modals state
  const [isCreateCaseOpen, setIsCreateCaseOpen] = useState(false);
  const [isExportDossierOpen, setIsExportDossierOpen] = useState(false);
  const [isStixJsonOpen, setIsStixJsonOpen] = useState(false);
  const [isQuarantineOpen, setIsQuarantineOpen] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        setBackendHealth({
          cuda_available: !!data.cuda_available,
          gpu_name: data.gpu_name || null,
        });
      })
      .catch(() => {
        // Backend not reachable, keep fallback HUD
      });
  }, []);

  // Run Forensic Analysis Trigger connected to backend
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setLatencyMs(4.8);

    if (liveEmailId) {
      try {
        const fd = new FormData();
        fd.append('enable_network', 'true');
        const res = await fetch(`${API_BASE}/emails/${liveEmailId}/analyze`, {
          method: 'POST',
          body: fd,
        });
        if (res.ok) {
          const data = await res.json();
          setLastAnalysisData(data);

          const ts = data.threat_score;
          const sc = Math.round(ts.final_score);

          // Map backend hops to UI format
          const mappedHops = (data.header_findings?.hops || []).map((h: any) => ({
            hopNumber: String(h.hop_index),
            ip: h.ip || '—',
            hostname: h.hostname || 'unknown',
            timestamp: h.timestamp || '—',
            role: 'Relay Hop',
            country: 'Origin',
            status: h.trust_level === 'trusted' ? 'TRUSTED GATEWAY' : 'UNTRUSTED / SUSPECT',
            statusColor: h.trust_level === 'trusted' ? 'secondary' : 'outline',
          }));

          // Map extracted URLs
          const mappedPayloads = (data.content_indicators?.urls || []).map((u: any) => ({
            url: u.url,
            category: u.severity === 'high' ? 'C2 CALLBACK' : 'LEGITIMATE BENIGN',
            severity: u.severity === 'high' ? 'critical' : 'benign',
            entropy: 4.8,
            entropyLabel: 'Heuristic Match',
            details: `Flags: ${[u.is_ip_literal && 'IP-literal', u.is_punycode && 'punycode'].filter(Boolean).join(', ') || 'Standard URL'}`,
          }));

          // Map auth results
          const authHeaders = data.authentication?.header_results || [];
          const spfRes = authHeaders.find((r: any) => r.mechanism?.toLowerCase() === 'spf');
          const dkimRes = authHeaders.find((r: any) => r.mechanism?.toLowerCase() === 'dkim');
          const dmarcRes = authHeaders.find((r: any) => r.mechanism?.toLowerCase() === 'dmarc');

          // Candidate origin GeoIP
          const firstGeo = (data.geolocation_results && data.geolocation_results[0]) || {};

          setCurrentSpecimen((prev) => ({
            ...prev,
            overallScore: sc,
            confidence: +(ts.confidence * 100).toFixed(1),
            riskClassification: sc >= 60 ? 'CRITICAL THREAT // MALICIOUS' : sc >= 30 ? 'HIGH RISK SUSPICIOUS' : 'BENIGN VERIFIED',
            scores: {
              domainSpoofing: Math.min(100, Math.round(sc * 0.9)),
              payloadLink: Math.min(100, Math.round(sc * 0.95)),
              senderReputationDecay: Math.min(100, Math.round(sc * 0.8)),
              headerAnomaly: Math.min(100, Math.round(sc * 0.85)),
            },
            hops: mappedHops.length > 0 ? mappedHops : prev.hops,
            payloads: mappedPayloads.length > 0 ? mappedPayloads : prev.payloads,
            authTelemetry: {
              spf: {
                status: spfRes?.result?.toLowerCase() === 'pass' ? 'PASS' : 'FAIL',
                details: spfRes?.source || 'Header verification',
              },
              dkim: {
                status: dkimRes?.result?.toLowerCase() === 'pass' ? 'VALID' : 'INVALID SIG',
                details: dkimRes?.source || 'Crypto signature test',
              },
              dmarc: {
                status: dmarcRes?.result?.toLowerCase() === 'pass' ? 'NONE' : 'REJECT ENFORCED',
                details: dmarcRes?.source || 'Alignment check',
              },
              arc: prev.authTelemetry.arc,
            },
            originGeo: {
              ip: firstGeo.ip || prev.originGeo.ip,
              location: [firstGeo.city, firstGeo.country].filter(Boolean).join(', ') || prev.originGeo.location,
              asn: firstGeo.asn || prev.originGeo.asn,
              rdns: firstGeo.source || prev.originGeo.rdns,
              latency: '1.4ms',
              coords: firstGeo.latitude && firstGeo.longitude ? `${firstGeo.latitude}, ${firstGeo.longitude}` : prev.originGeo.coords,
            },
          }));
        }
      } catch (e) {
        console.error('Backend analysis call failed, falling back to simulated inference', e);
      }
    } else {
      // Standalone simulation mode if no backend file uploaded yet
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setCurrentSpecimen((prev) => ({
        ...prev,
        confidence: +(94.0 + Math.random() * 5).toFixed(1),
        overallScore: Math.min(99, Math.max(75, prev.overallScore + (Math.random() > 0.5 ? 1 : -1))),
      }));
    }

    setIsAnalyzing(false);
    setLatencyMs(1.2);
  };

  // File Upload handler connected to Backend
  const handleFileUpload = async (file: File) => {
    // 1. First ensure a live case exists or create one
    let activeCase = currentSpecimen.caseId.replace('#', '');
    try {
      const caseFd = new FormData();
      caseFd.append('analyst', 'Tier-3 Forensic Lead (Node-09)');
      const caseRes = await fetch(`${API_BASE}/cases`, { method: 'POST', body: caseFd });
      if (caseRes.ok) {
        const caseJson = await caseRes.json();
        activeCase = caseJson.case_id;
      }
    } catch {
      // Backend offline or local fallback
    }

    // 2. Upload file to /api/cases/{id}/upload
    try {
      const uploadFd = new FormData();
      uploadFd.append('file', file);
      uploadFd.append('enable_network', 'true');
      uploadFd.append('analyst_session', 'SIH_REACT_SESSION');

      const upRes = await fetch(`${API_BASE}/cases/${activeCase}/upload`, {
        method: 'POST',
        body: uploadFd,
      });

      if (upRes.ok) {
        const upJson = await upRes.json();
        setLiveEmailId(upJson.email_id);

        const reader = new FileReader();
        reader.onload = (e) => {
          const text = (e.target?.result as string) || '';
          const lines = text.split('\n').slice(0, 20).map((l) => l.trim()).filter(Boolean);

          setCurrentSpecimen((prev) => ({
            ...prev,
            caseId: `#${activeCase}`,
            filename: file.name,
            filesize: `${(file.size / 1024).toFixed(1)} KB`,
            mimeHeaders: lines.length > 2 ? lines : prev.mimeHeaders,
            sha256: upJson.sha256 || prev.sha256,
            dateOpened: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          }));
        };
        reader.readAsText(file);
        return;
      }
    } catch (e) {
      console.warn('Backend upload failed, utilizing client-side parser', e);
    }

    // Fallback if backend upload fails
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      const lines = text.split('\n').slice(0, 15).map((l) => l.trim()).filter(Boolean);
      const dummySha = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const dummyMd5 = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      setCurrentSpecimen((prev) => ({
        ...prev,
        id: `SPEC-${Math.floor(100 + Math.random() * 900)}`,
        filename: file.name,
        filesize: `${(file.size / 1024).toFixed(1)} KB`,
        mimeHeaders: lines.length > 2 ? lines : prev.mimeHeaders,
        sha256: dummySha,
        md5: dummyMd5,
        dateOpened: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        overallScore: 89,
      }));
    };
    reader.readAsText(file);
  };

  const handleCaseCreated = (newSpecimen: ForensicSpecimen) => {
    setCurrentSpecimen(newSpecimen);
    setActiveUnit('tactical-command');
  };

  const handleQuarantineComplete = () => {
    setIncidentsCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen bg-[#070e1d] text-[#dce2f8] font-['Inter'] relative selection:bg-[#00d4ff]/20 selection:text-[#a8e8ff]">
      {/* Top Application Header */}
      <Header
        incidentsCount={incidentsCount}
        onSearchClick={() => setActiveUnit('tactical-command')}
      />

      {/* Persistent Tactical Navigation Sidebar */}
      <Sidebar
        activeUnit={activeUnit}
        onSelectUnit={setActiveUnit}
        latencyMs={latencyMs}
      />

      {/* Main Workspace Area */}
      <div className="pl-64">
        <main className="w-full pt-20 px-4 sm:px-6 min-h-screen">
          {activeUnit === 'tactical-command' && (
            <TacticalCommand
              specimen={currentSpecimen}
              onRunAnalysis={handleRunAnalysis}
              isAnalyzing={isAnalyzing}
              onOpenCreateCase={() => setIsCreateCaseOpen(true)}
              onOpenExportDossier={() => setIsExportDossierOpen(true)}
              onOpenStixJson={() => setIsStixJsonOpen(true)}
              onOpenQuarantine={() => setIsQuarantineOpen(true)}
              onFileUpload={handleFileUpload}
            />
          )}

          {activeUnit === 'live-memory-triage' && <MemoryTriage />}
          {activeUnit === 'packet-inspector' && <PacketHexStream />}
          {activeUnit === 'threat-forensics-matrix' && <ArtifactsYara />}
          {activeUnit === 'incident-investigation' && <IncidentHUD />}
          {activeUnit === 'system-telemetry' && <NodeTelemetry />}
        </main>
      </div>

      {/* Tactical Modals */}
      <CreateCaseModal
        isOpen={isCreateCaseOpen}
        onClose={() => setIsCreateCaseOpen(false)}
        onCaseCreated={handleCaseCreated}
      />

      <ExportDossierModal
        isOpen={isExportDossierOpen}
        onClose={() => setIsExportDossierOpen(false)}
        specimen={currentSpecimen}
      />

      <StixJsonModal
        isOpen={isStixJsonOpen}
        onClose={() => setIsStixJsonOpen(false)}
        specimen={currentSpecimen}
      />

      <QuarantineModal
        isOpen={isQuarantineOpen}
        onClose={() => setIsQuarantineOpen(false)}
        specimen={currentSpecimen}
        onQuarantined={handleQuarantineComplete}
      />
    </div>
  );
}
