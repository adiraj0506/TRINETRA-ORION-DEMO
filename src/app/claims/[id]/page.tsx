"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { fetchClaimDetails, executeClaimAction, fetchSchemes } from "@/lib/queries";
import { evaluateSchemes, type SchemeRow } from "@/lib/dss";
import type { FullClaimDetails } from "@/lib/services/claim-service";
import { CLAIM_TYPE_LABELS, STATUS_LABELS } from "@/lib/types";
import { ConvergenceCardModal } from "@/components/dss/convergence-card-modal";

export default function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [details, setDetails] = useState<FullClaimDetails | null>(null);
  const [schemes, setSchemes] = useState<SchemeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "documents" | "ocr" | "verification" | "spatial" | "workflow" | "dss" | "audit"
  >("overview");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showWelfareModal, setShowWelfareModal] = useState(false);

  const loadClaim = () => {
    setLoading(true);
    Promise.all([fetchClaimDetails(id), fetchSchemes()])
      .then(([claimData, schemesData]) => {
        setDetails(claimData);
        setSchemes(schemesData);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load claim details.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClaim();
  }, [id]);

  const handleQuickAction = async (action: "approve" | "reject") => {
    try {
      await executeClaimAction(id, action, {
        notes: action === "approve" ? "Approved from Claim Dossier." : undefined,
        reason: action === "reject" ? "Rejected from Claim Dossier." : undefined,
      });
      setActionSuccess(`Claim ${action === "approve" ? "approved" : "rejected"} successfully.`);
      loadClaim();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-ink-soft animate-pulse">
          Loading comprehensive claim dossier…
        </p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="rounded-xl border border-rejected/30 bg-rejected/5 p-6 text-rejected">
          <h2 className="font-display text-lg font-semibold">Claim Not Found</h2>
          <p className="mt-1 text-xs">{error || "Could not retrieve claim record."}</p>
          <Link
            href="/admin"
            className="mt-4 inline-block rounded-full bg-forest text-paper-raised px-4 py-2 font-mono text-xs uppercase tracking-wider"
          >
            ← Return to Verification Queue
          </Link>
        </div>
      </div>
    );
  }

  const { claim, claimant, documents, ocrJobs, reviews, statusHistory, workflowTasks, fieldVerifications, spatialConflicts, landParcel } = details;

  // Evaluate DSS schemes for this claim
  const claimMapRowFormat: any = {
    claim_id: claim.id,
    state_code: claim.state_code,
    state_name: claim.state_code === "OD" ? "Odisha" : claim.state_code === "MP" ? "Madhya Pradesh" : claim.state_code === "TS" ? "Telangana" : "Tripura",
    claim_type: claim.claim_type,
    area_claimed_hectares: claim.area_claimed_hectares,
    status: claim.status,
    submitted_on: claim.submitted_on,
    decided_on: claim.decided_on,
    rejection_reason: claim.rejection_reason,
    digitized: claim.digitized,
    full_name: claimant.full_name,
    village: claimant.village,
    district: claimant.district,
    category: claimant.category,
    household_size: claimant.household_size,
    lat: landParcel?.lat || 20.9517,
    lng: landParcel?.lng || 85.0985,
    ulpin: landParcel?.ulpin,
  };

  const schemeResults = evaluateSchemes(claimMapRowFormat, schemes);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Back link & breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 font-mono text-xs text-ink-soft">
          <Link href="/admin" className="hover:text-forest">
            Admin Console
          </Link>
          <span>/</span>
          <span>Claim Dossier</span>
          <span>/</span>
          <span className="text-ink font-semibold">{claim.id.slice(0, 8)}...</span>
        </div>

        <div className="flex items-center gap-3">
          {claim.status !== "approved" && (
            <button
              onClick={() => handleQuickAction("approve")}
              type="button"
              className="rounded-full bg-approved text-paper-raised px-4 py-1.5 font-mono text-xs uppercase tracking-wider font-bold transition-all hover:bg-approved-deep cursor-pointer"
            >
              ✓ Approve Title
            </button>
          )}
          {claim.status !== "rejected" && (
            <button
              onClick={() => handleQuickAction("reject")}
              type="button"
              className="rounded-full bg-rejected/10 text-rejected border border-rejected/30 px-4 py-1.5 font-mono text-xs uppercase tracking-wider font-bold hover:bg-rejected/20 cursor-pointer"
            >
              ✗ Reject
            </button>
          )}
          <button
            onClick={() => setShowWelfareModal(true)}
            type="button"
            className="rounded-full border border-forest/30 bg-forest/5 text-forest px-4 py-1.5 font-mono text-xs uppercase tracking-wider font-bold hover:bg-forest/10 cursor-pointer"
          >
            📄 Welfare Card
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 rounded-xl bg-approved/10 border border-approved/30 p-4 text-xs font-semibold text-approved">
          ✓ {actionSuccess}
        </div>
      )}

      {/* Main Title & Key Specs Header */}
      <div className="rounded-2xl border border-line bg-paper-raised p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-ink">
                {claimant.full_name}
              </h1>
              <span
                className={`rounded-full px-3 py-1 font-mono text-xs uppercase tracking-wider font-bold ${
                  claim.status === "approved"
                    ? "bg-approved/15 text-approved"
                    : claim.status === "rejected"
                    ? "bg-rejected/15 text-rejected"
                    : "bg-pending/15 text-pending"
                }`}
              >
                {STATUS_LABELS[claim.status] || claim.status}
              </span>
            </div>
            <p className="text-sm text-ink-soft mt-1">
              {claimant.village}, {claimant.district} · {claim.state_code} · Application Number:{" "}
              <span className="font-mono font-bold text-ink">{claim.application_number || claim.claim_number || "AWAITING-GEN"}</span>
            </p>
          </div>

          <div className="rounded-xl border border-line bg-paper p-3.5 flex items-center justify-between gap-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft block font-bold">
                Certified ULPIN
              </span>
              <span className="font-mono text-xs font-bold text-ink">
                {landParcel?.ulpin || "Pending Registration"}
              </span>
            </div>
            <span className="rounded bg-forest/10 text-forest px-2 py-1 font-mono text-[9px] font-bold border border-forest/20">
              PostGIS Bound
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 border-b border-line flex flex-wrap gap-6 text-xs font-mono uppercase tracking-wider">
          {[
            { id: "overview", label: "Overview" },
            { id: "documents", label: `Documents (${documents.length})` },
            { id: "ocr", label: "OCR Extraction" },
            { id: "verification", label: `Field Surveys (${fieldVerifications.length})` },
            { id: "spatial", label: "Spatial & Conflicts" },
            { id: "workflow", label: `Workflow (${statusHistory.length})` },
            { id: "dss", label: "DSS Scheme Matches" },
            { id: "audit", label: `Audit Trail` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === tab.id
                  ? "border-forest text-forest"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="mt-8 space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-line bg-paper p-5 space-y-3">
                <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-bold border-b border-line pb-2">
                  Claimant Demographics
                </h3>
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-ink-soft font-mono">Full Name:</span>
                  <span className="font-semibold text-ink">{claimant.full_name}</span>
                  <span className="text-ink-soft font-mono">Guardian / Father:</span>
                  <span className="font-semibold text-ink">{claimant.guardian_name || "—"}</span>
                  <span className="text-ink-soft font-mono">Category:</span>
                  <span className="font-semibold text-ink">{claimant.category === "ST" ? "Scheduled Tribe" : "OTFD"}</span>
                  <span className="text-ink-soft font-mono">Household Size:</span>
                  <span className="font-semibold text-ink">{claimant.household_size} members</span>
                  <span className="text-ink-soft font-mono">Village / Panchayat:</span>
                  <span className="font-semibold text-ink">{claimant.village}, {claimant.gram_panchayat || claimant.village}</span>
                  <span className="text-ink-soft font-mono">District & State:</span>
                  <span className="font-semibold text-ink">{claimant.district}, {claimant.state_code}</span>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-paper p-5 space-y-3">
                <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-bold border-b border-line pb-2">
                  Forest Land Parcel Details
                </h3>
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-ink-soft font-mono">Claim Type:</span>
                  <span className="font-semibold text-ink">{CLAIM_TYPE_LABELS[claim.claim_type]}</span>
                  <span className="text-ink-soft font-mono">Area Claimed:</span>
                  <span className="font-mono font-bold text-ink">{claim.area_claimed_hectares} ha</span>
                  <span className="text-ink-soft font-mono">Area Verified:</span>
                  <span className="font-mono font-bold text-ink">{claim.area_verified_hectares || claim.area_claimed_hectares} ha</span>
                  <span className="text-ink-soft font-mono">Survey / Plot No:</span>
                  <span className="font-mono font-semibold text-ink">{landParcel?.survey_number || claim.survey_number || "SV-01"} / {landParcel?.plot_number || claim.plot_number || "PL-01"}</span>
                  <span className="text-ink-soft font-mono">Current Stage:</span>
                  <span className="font-semibold text-ink capitalize">{claim.current_stage}</span>
                  <span className="text-ink-soft font-mono">Submission Date:</span>
                  <span className="font-mono text-ink">{claim.submitted_on}</span>
                </div>
              </div>
            </div>

            {claim.rejection_reason && (
              <div className="rounded-xl border border-rejected/30 bg-rejected/5 p-4 text-rejected">
                <strong>Statutory Rejection Reason:</strong> {claim.rejection_reason}
              </div>
            )}
            {claim.return_reason && (
              <div className="rounded-xl border border-clay/30 bg-clay/5 p-4 text-clay">
                <strong>Correction Instructions:</strong> {claim.return_reason}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="mt-8 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-lg font-semibold text-ink">
                Attached Identification & Statutory Verification Documents ({documents.length})
              </h3>
              <span className="text-xs text-ink-soft font-mono">
                Stored securely with PostGIS parcel binding
              </span>
            </div>

            {documents.length === 0 ? (
              <p className="text-ink-soft p-4">No documents attached to this claim.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => {
                  const docTypeLabel =
                    doc.document_type === "identity_document"
                      ? "Claimant ID (Aadhaar / Voter / Ration)"
                      : doc.document_type === "gram_sabha_resolution"
                      ? "Gram Sabha Resolution Letter"
                      : doc.document_type === "patta"
                      ? "Patta Deed / Revenue Record"
                      : doc.document_type === "land_record"
                      ? "Legacy Land / Tax Record"
                      : doc.document_type === "field_photo"
                      ? "Field Survey / Ground Evidence"
                      : "Claim Form (Form A/B/C)";

                  return (
                    <div key={doc.id} className="rounded-xl border border-line bg-paper p-5 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded bg-forest/10 text-forest px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-bold">
                            {docTypeLabel}
                          </span>
                          <span className="rounded bg-approved/10 text-approved px-2 py-0.5 font-mono text-[9px] font-bold">
                            ✓ {doc.review_status || "verified"}
                          </span>
                        </div>
                        <h4 className="font-semibold text-ink text-sm mt-2 truncate">
                          {doc.document_name}
                        </h4>
                        {doc.document_ref_number && (
                          <p className="font-mono text-xs text-clay font-bold mt-1">
                            Ref ID: {doc.document_ref_number}
                          </p>
                        )}
                        <p className="font-mono text-[10px] text-ink-soft mt-1">
                          Uploaded: {new Date(doc.uploaded_at || doc.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-line flex items-center justify-between text-[11px]">
                        <span className="font-mono text-ink-soft">
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "Document File"}
                        </span>
                        <span className="text-forest font-semibold">
                          {doc.ocr_status === "completed" ? "✓ OCR Processed" : "✓ Verified Attachment"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: OCR EXTRACTION */}
        {activeTab === "ocr" && (
          <div className="mt-8 space-y-6 text-xs">
            {ocrJobs.length === 0 ? (
              <p className="text-ink-soft">No OCR recognition records logged.</p>
            ) : (
              ocrJobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-line bg-paper p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div>
                      <h4 className="font-mono text-xs uppercase tracking-wider text-ink font-bold">
                        OCR Engine: {job.engine} ({job.language})
                      </h4>
                      <p className="font-mono text-[10px] text-ink-soft">
                        Processing Time: {job.processing_time_ms}ms · Overall Confidence: {job.confidence}%
                      </p>
                    </div>
                    <span className="rounded bg-forest/10 text-forest px-3 py-1 font-mono text-xs font-semibold">
                      Status: {job.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {job.fields?.map((f) => (
                      <div key={f.id} className="rounded border border-line bg-paper-raised p-3">
                        <span className="text-[10px] font-mono uppercase text-ink-soft block font-semibold">{f.field_name}</span>
                        <span className="font-semibold text-ink block mt-1">{f.field_value || "—"}</span>
                        <span className="text-[9px] font-mono text-forest mt-1 block">✓ {f.confidence}% confidence</span>
                      </div>
                    ))}
                  </div>

                  {job.raw_text && (
                    <div className="mt-4 pt-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft block font-bold">Raw OCR Output:</span>
                      <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded border border-line bg-paper-raised p-3 font-mono text-[11px] text-ink-soft">
                        {job.raw_text}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: FIELD VERIFICATION */}
        {activeTab === "verification" && (
          <div className="mt-8 space-y-4 text-xs">
            {fieldVerifications.length === 0 ? (
              <div className="p-8 text-center text-ink-soft">
                No on-ground field surveys recorded yet. You can request one from the Admin Console.
              </div>
            ) : (
              fieldVerifications.map((v) => (
                <div key={v.id} className="rounded-xl border border-line bg-paper p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="font-mono text-xs uppercase font-bold text-ink">
                      Visit Date: {v.visit_date}
                    </span>
                    <span className="rounded bg-water/10 text-water px-2.5 py-0.5 font-mono text-[10px] font-bold">
                      {v.status}
                    </span>
                  </div>
                  <p className="text-ink-soft">{v.notes || "Joint survey completed with Gram Sabha presence."}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: SPATIAL & CONFLICTS */}
        {activeTab === "spatial" && (
          <div className="mt-8 space-y-6 text-xs">
            <div className="rounded-xl border border-line bg-paper p-5 space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-bold border-b border-line pb-2">
                PostGIS Coordinate Geometry
              </h3>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-ink-soft font-mono">Centroid Latitude:</span>
                <span className="font-mono font-bold text-ink">{landParcel?.lat || 20.9517}</span>
                <span className="text-ink-soft font-mono">Centroid Longitude:</span>
                <span className="font-mono font-bold text-ink">{landParcel?.lng || 85.0985}</span>
                <span className="text-ink-soft font-mono">Spatial SRID:</span>
                <span className="font-mono font-bold text-ink">EPSG:4326 (WGS84)</span>
                <span className="text-ink-soft font-mono">Calculated Polygon Area:</span>
                <span className="font-mono font-bold text-ink">{landParcel?.area_calculated || claim.area_claimed_hectares} ha</span>
              </div>
            </div>

            {spatialConflicts.length > 0 && (
              <div className="rounded-xl border border-rejected/30 bg-rejected/5 p-5 space-y-3">
                <h3 className="font-mono text-xs uppercase tracking-wider text-rejected font-bold">
                  ⚠️ Spatial Intersections & Conflicts
                </h3>
                {spatialConflicts.map((c) => (
                  <div key={c.id} className="border-t border-rejected/20 pt-2">
                    <span className="font-bold text-ink block">{c.conflict_type}</span>
                    <p className="text-ink-soft">{c.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: WORKFLOW & HISTORY */}
        {activeTab === "workflow" && (
          <div className="mt-8 space-y-4 text-xs">
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-bold">
              Chronological Status Transitions
            </h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-line">
              {statusHistory.map((h, i) => (
                <div key={h.id || i} className="relative">
                  <span className="absolute -left-[20px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-forest text-paper-raised text-[9px] font-bold">
                    ✓
                  </span>
                  <div>
                    <p className="font-bold text-ink capitalize">{h.new_status}</p>
                    <p className="font-mono text-[10px] text-ink-soft">{new Date(h.created_at).toLocaleString()}</p>
                    <p className="text-ink-soft mt-0.5">{h.reason || "Status transition recorded."}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: DSS SCHEME CONVERGENCE */}
        {activeTab === "dss" && (
          <div className="mt-8 space-y-4 text-xs">
            <h3 className="font-display text-lg font-semibold text-ink">
              Evaluated Government Welfare Schemes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schemeResults.map((s) => (
                <div
                  key={s.schemeCode}
                  className={`rounded-xl border p-4 ${
                    s.eligible ? "border-approved/30 bg-approved/5" : "border-line bg-paper"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-semibold text-ink text-sm">{s.schemeName}</h4>
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                        s.eligible ? "bg-approved text-paper-raised" : "bg-line text-ink-soft"
                      }`}
                    >
                      {s.eligible ? "Eligible" : "Not Eligible"}
                    </span>
                  </div>
                  <p className="text-ink-soft mt-1">{s.schemeDescription}</p>
                  <div className="mt-3 pt-2 border-t border-line font-mono text-[10px] text-ink">
                    {s.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: AUDIT TRAIL */}
        {activeTab === "audit" && (
          <div className="mt-8 space-y-4 text-xs">
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-bold">
              Administrative & System Audit Logs
            </h3>
            <div className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-paper">
              {statusHistory.map((sh, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-ink block">claim.status_transition</span>
                    <span className="text-ink-soft text-[11px]">
                      Changed status from {sh.old_status || "initial"} to {sh.new_status}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-ink-soft">
                    {new Date(sh.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Welfare Card Modal */}
      {showWelfareModal && (
        <ConvergenceCardModal
          claim={claimMapRowFormat}
          onClose={() => setShowWelfareModal(false)}
        />
      )}
    </div>
  );
}
