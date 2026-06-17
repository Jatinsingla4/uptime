"""
SitePulse AI Bridge — RunPod Python Service
FastAPI endpoints for ML-heavy tasks that can't run in CF Workers.

Endpoints:
  POST /embed      — batch embedding generation
  POST /cluster    — error clustering on crawl results
  POST /recommend  — prioritized fix recommendations
  POST /summarize  — LLM incident summary
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import numpy as np

app = FastAPI(title="SitePulse AI Bridge", version="1.0.0")


# ─── Schemas ─────────────────────────────────────────────────────────────────

class EmbedRequest(BaseModel):
    texts: list[str]
    model: str = "BAAI/bge-small-en-v1.5"


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]
    model: str
    tokens_used: int


class ClusterItem(BaseModel):
    url: str
    status_code: Optional[int]
    error_reason: Optional[str]
    parent_url: Optional[str]


class ClusterRequest(BaseModel):
    items: list[ClusterItem]
    job_id: str
    n_clusters: int = 5


class ClusterResult(BaseModel):
    cluster_id: int
    label: str
    items: list[str]
    root_cause: str
    affected_count: int


class ClusterResponse(BaseModel):
    clusters: list[ClusterResult]
    job_id: str


class RecommendRequest(BaseModel):
    job_id: str
    broken_count: int
    clusters: list[ClusterResult]
    site_url: str


class RecommendResponse(BaseModel):
    recommendations: list[dict]
    priority: str


class SummarizeRequest(BaseModel):
    project_id: str
    incident_id: str
    start_ms: int
    end_ms: Optional[int]
    error_summary: Optional[str]
    downtime_seconds: Optional[int]


class SummarizeResponse(BaseModel):
    summary: str
    severity: str
    suggested_actions: list[str]


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"ok": True}


@app.post("/embed", response_model=EmbedResponse)
async def embed(req: EmbedRequest):
    """
    Generate embeddings for a batch of texts.
    In production: load BGE model on GPU, cache it in module scope.
    """
    if len(req.texts) > 512:
        raise HTTPException(status_code=400, detail="Max 512 texts per batch")

    # Placeholder: return zero vectors (replace with actual model inference)
    dim = 384  # BGE-small embedding dim
    embeddings = [[0.0] * dim for _ in req.texts]

    return EmbedResponse(
        embeddings=embeddings,
        model=req.model,
        tokens_used=sum(len(t.split()) for t in req.texts),
    )


@app.post("/cluster", response_model=ClusterResponse)
async def cluster(req: ClusterRequest):
    """
    Cluster broken links by error pattern.
    Groups by: status_code, error_reason, URL path prefix.
    """
    if not req.items:
        return ClusterResponse(clusters=[], job_id=req.job_id)

    # Group by status code first (simple heuristic, replace with k-means on embeddings)
    groups: dict[str, list[str]] = {}
    for item in req.items:
        key = str(item.status_code) if item.status_code else (item.error_reason or "unknown")
        if key not in groups:
            groups[key] = []
        groups[key].append(item.url)

    clusters = [
        ClusterResult(
            cluster_id=i,
            label=f"HTTP {key}" if key.isdigit() else key,
            items=urls,
            root_cause=_infer_root_cause(key),
            affected_count=len(urls),
        )
        for i, (key, urls) in enumerate(groups.items())
    ]

    return ClusterResponse(clusters=clusters, job_id=req.job_id)


@app.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
    """Generate prioritized fix recommendations from clusters."""
    recs = []
    for cluster in sorted(req.clusters, key=lambda c: c.affected_count, reverse=True):
        recs.append({
            "priority": "high" if cluster.affected_count > 10 else "medium",
            "action": f"Fix {cluster.affected_count} URLs returning {cluster.label}",
            "root_cause": cluster.root_cause,
            "affected_urls": cluster.items[:5],
        })

    return RecommendResponse(
        recommendations=recs,
        priority="high" if req.broken_count > 20 else "medium",
    )


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    """Generate human-readable incident summary."""
    duration = f"{req.downtime_seconds // 60}m" if req.downtime_seconds else "ongoing"
    return SummarizeResponse(
        summary=f"Site was unreachable for {duration}. {req.error_summary or 'No additional details.'}",
        severity="critical" if (req.downtime_seconds or 0) > 3600 else "high",
        suggested_actions=[
            "Check server health and application logs",
            "Verify DNS resolution",
            "Review recent deployments",
        ],
    )


def _infer_root_cause(status_key: str) -> str:
    causes = {
        "404": "Resource not found — likely moved or deleted. Update or remove these links.",
        "500": "Server-side error — check application logs for exceptions.",
        "503": "Service temporarily unavailable — may indicate overload or maintenance.",
        "301": "Permanent redirect — update source links to avoid redirect chains.",
        "timeout": "Request timed out — server may be slow or unreachable.",
        "dns_error": "DNS resolution failed — domain may have expired or misconfigured.",
        "ssl_error": "TLS certificate error — certificate may be expired or misconfigured.",
    }
    return causes.get(status_key, f"HTTP {status_key} response — investigate origin server.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
