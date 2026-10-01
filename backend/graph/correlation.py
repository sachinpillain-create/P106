"""
Graph correlation — PRD Section 8.7. CPU-only, deterministic.

Builds a case-scoped investigation graph connecting emails, senders,
domains, IPs, and URLs. Explicitly does NOT attempt to infer human
identity from connectivity (PRD 8.7 non-goal, echoed in PRD 5 non-goals).
"""
import networkx as nx
from typing import List, Dict


def build_case_graph(cases_data: List[Dict]) -> nx.MultiDiGraph:
    """
    cases_data: list of dicts, one per email in the case, each shaped like:
        {
          "email_id": str,
          "from_address": str,
          "reply_to": str | None,
          "from_domain": str | None,
          "candidate_ip": str | None,
          "asn": str | None,
          "urls": [str, ...],
        }
    """
    g = nx.MultiDiGraph()

    for item in cases_data:
        email_node = f"email:{item['email_id']}"
        g.add_node(email_node, kind="Email")

        if item.get("from_address"):
            sender_node = f"sender:{item['from_address']}"
            g.add_node(sender_node, kind="Sender")
            g.add_edge(email_node, sender_node, relation="SENT_FROM")

        if item.get("reply_to"):
            reply_node = f"sender:{item['reply_to']}"
            g.add_node(reply_node, kind="Sender")
            g.add_edge(email_node, reply_node, relation="REPLY_TO")

        if item.get("from_domain"):
            domain_node = f"domain:{item['from_domain']}"
            g.add_node(domain_node, kind="Domain")
            if item.get("from_address"):
                g.add_edge(f"sender:{item['from_address']}", domain_node, relation="RESOLVES_TO")

        if item.get("candidate_ip"):
            ip_node = f"ip:{item['candidate_ip']}"
            g.add_node(ip_node, kind="IP")
            if item.get("from_domain"):
                g.add_edge(f"domain:{item['from_domain']}", ip_node, relation="HOSTED_BY")

        if item.get("asn"):
            asn_node = f"asn:{item['asn']}"
            g.add_node(asn_node, kind="ASN")
            if item.get("candidate_ip"):
                g.add_edge(f"ip:{item['candidate_ip']}", asn_node, relation="HOSTED_BY")

        for url in item.get("urls", []):
            url_node = f"url:{url}"
            g.add_node(url_node, kind="URL")
            g.add_edge(email_node, url_node, relation="CONTAINS_URL")

    return g


def find_shared_infrastructure(g: nx.MultiDiGraph) -> List[dict]:
    """
    Identify IP/domain/ASN nodes shared by more than one email — the
    "repeated-infrastructure counts" and "campaign clusters" from PRD 8.7.
    """
    shared = []
    for node, attrs in g.nodes(data=True):
        if attrs.get("kind") in ("IP", "Domain", "ASN"):
            connected_emails = {
                n for n in nx.ancestors(g, node)
                if g.nodes[n].get("kind") == "Email"
            } | {
                n for n in nx.descendants(g, node)
                if g.nodes[n].get("kind") == "Email"
            }
            if len(connected_emails) > 1:
                shared.append({
                    "node": node,
                    "kind": attrs["kind"],
                    "connected_email_count": len(connected_emails),
                    "connected_emails": list(connected_emails),
                })
    return shared


def graph_to_json(g: nx.MultiDiGraph) -> dict:
    """Serialize for frontend graph visualization (Cytoscape.js-friendly)."""
    nodes = [{"id": n, "kind": attrs.get("kind", "Unknown")} for n, attrs in g.nodes(data=True)]
    edges = [
        {"source": u, "target": v, "relation": data.get("relation", "RELATED")}
        for u, v, data in g.edges(data=True)
    ]
    return {"nodes": nodes, "edges": edges}
