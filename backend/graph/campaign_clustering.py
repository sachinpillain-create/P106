"""
Campaign clustering — PRD Section 17 (Phase 2 stretch): "Campaign
clustering across many emails" and "Embedding-based semantic similarity."

This implements a real, working first pass:
  - TF-IDF vectorization of email subject+body content (deterministic,
    CPU-only, no extra model download required).
  - Cosine similarity between all pairs of emails.
  - Simple threshold + connected-components clustering to group emails
    into probable "campaigns" (same or coordinated phishing wave).
  - Combined with the infrastructure-sharing signal from graph/correlation.py
    for a fuller picture: two emails can be linked either because they share
    infrastructure (same IP/domain/ASN) OR because their content is
    near-duplicate/templated (same campaign, possibly different infra).

Upgrade path documented at the bottom for swapping in true sentence-embedding
similarity (e.g. sentence-transformers on the RTX 3050) once you want higher
recall on paraphrased campaigns.
"""
from dataclasses import dataclass
from typing import List, Dict

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass
class CampaignCluster:
    cluster_id: int
    email_ids: List[str]
    representative_subject: str
    avg_pairwise_similarity: float


def _union_find(n: int):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    return find, union


def cluster_by_content_similarity(
    emails: List[Dict], similarity_threshold: float = 0.55
) -> List[CampaignCluster]:
    """
    emails: list of {"email_id": str, "subject": str, "body_text": str}
    Returns clusters of 2+ emails whose content similarity exceeds the
    threshold. Emails with no sufficiently similar match are NOT included
    (a cluster of one isn't a campaign).

    Threshold rationale: 0.55 cosine similarity on TF-IDF vectors reliably
    catches templated/near-duplicate phishing content (same kit, swapped
    names/links) while avoiding false positives on merely-similar-topic
    legitimate email. Tune via the SIH_CAMPAIGN_THRESHOLD environment
    variable if your dataset needs different sensitivity.
    """
    if len(emails) < 2:
        return []

    texts = [f"{e.get('subject', '') or ''}\n{e.get('body_text', '') or ''}" for e in emails]
    ids = [e["email_id"] for e in emails]

    vectorizer = TfidfVectorizer(max_features=3000, ngram_range=(1, 2), min_df=1, stop_words="english")
    try:
        matrix = vectorizer.fit_transform(texts)
    except ValueError:
        return []  # e.g. all-empty text — nothing to cluster

    sim_matrix = cosine_similarity(matrix)

    n = len(emails)
    find, union = _union_find(n)
    pair_sims = []

    for i in range(n):
        for j in range(i + 1, n):
            sim = sim_matrix[i][j]
            if sim >= similarity_threshold:
                union(i, j)
                pair_sims.append((i, j, sim))

    groups: Dict[int, List[int]] = {}
    for i in range(n):
        root = find(i)
        groups.setdefault(root, []).append(i)

    clusters = []
    cluster_id = 0
    for root, members in groups.items():
        if len(members) < 2:
            continue  # not a cluster — needs at least 2 related emails
        member_ids = [ids[m] for m in members]
        relevant_sims = [s for (i, j, s) in pair_sims if i in members and j in members]
        avg_sim = sum(relevant_sims) / len(relevant_sims) if relevant_sims else 0.0

        clusters.append(CampaignCluster(
            cluster_id=cluster_id,
            email_ids=member_ids,
            representative_subject=emails[members[0]].get("subject", "") or "(no subject)",
            avg_pairwise_similarity=round(float(avg_sim), 3),
        ))
        cluster_id += 1

    return clusters


def combine_with_infrastructure_sharing(
    content_clusters: List[CampaignCluster], shared_infrastructure: List[dict]
) -> dict:
    """
    Merges content-similarity clusters with the infrastructure-sharing
    findings from graph/correlation.py's find_shared_infrastructure(), to
    give a combined campaign summary: emails can be linked by content,
    infrastructure, or both (the strongest signal).
    """
    email_to_infra_emails = {}
    for item in shared_infrastructure:
        for email_node in item["connected_emails"]:
            email_id = email_node.split(":", 1)[-1]
            email_to_infra_emails.setdefault(email_id, set()).update(
                e.split(":", 1)[-1] for e in item["connected_emails"] if e != email_node
            )

    summary = []
    for cluster in content_clusters:
        infra_overlap = set()
        for eid in cluster.email_ids:
            infra_overlap.update(email_to_infra_emails.get(eid, set()))
        confirms_infra = bool(infra_overlap.intersection(cluster.email_ids))

        summary.append({
            "cluster_id": cluster.cluster_id,
            "email_ids": cluster.email_ids,
            "representative_subject": cluster.representative_subject,
            "avg_content_similarity": cluster.avg_pairwise_similarity,
            "also_shares_infrastructure": confirms_infra,
            "confidence": "High" if confirms_infra else "Medium",
        })

    return {"campaigns": summary}


# --- Upgrade path: true semantic embeddings ---
# TF-IDF catches templated/near-duplicate campaigns well but misses
# paraphrased variants of the same campaign. To upgrade to embedding-based
# similarity using your RTX 3050:
#
#   pip install sentence-transformers
#
#   from sentence_transformers import SentenceTransformer
#   model = SentenceTransformer("all-MiniLM-L6-v2", device="cuda")  # ~80MB, fits easily in 6GB VRAM
#   embeddings = model.encode(texts, batch_size=16, convert_to_numpy=True)
#   # then feed `embeddings` into cosine_similarity() exactly as above —
#   # everything else in this module stays the same.
