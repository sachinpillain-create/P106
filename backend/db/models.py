"""
SQLAlchemy ORM models implementing the data model in PRD Section 13.
SQLite is used as the zero-server local database (PRD Section 12).
"""
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Case(Base):
    __tablename__ = "cases"

    case_id = Column(String, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="open")  # open, closed, escalated
    analyst = Column(String, nullable=True)
    conclusion = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    evidence_items = relationship("Evidence", back_populates="case")
    audit_events = relationship("AuditEvent", back_populates="case")


class Evidence(Base):
    __tablename__ = "evidence"

    evidence_id = Column(String, primary_key=True)
    case_id = Column(String, ForeignKey("cases.case_id"))
    filename = Column(String)
    sha256 = Column(String, index=True)
    ingested_at = Column(DateTime, default=datetime.utcnow)
    raw_path = Column(String)  # path to immutable raw evidence on disk
    analyst_session = Column(String, nullable=True)

    case = relationship("Case", back_populates="evidence_items")
    email = relationship("Email", back_populates="evidence", uselist=False)


class Email(Base):
    __tablename__ = "emails"

    email_id = Column(String, primary_key=True)
    evidence_id = Column(String, ForeignKey("evidence.evidence_id"))
    message_id = Column(String, nullable=True)
    subject = Column(Text, nullable=True)
    from_display = Column(String, nullable=True)
    from_address = Column(String, nullable=True)
    reply_to = Column(String, nullable=True)
    return_path = Column(String, nullable=True)
    date_header = Column(String, nullable=True)
    body_text = Column(Text, nullable=True)
    body_html_sanitized = Column(Text, nullable=True)

    evidence = relationship("Evidence", back_populates="email")
    header_hops = relationship("HeaderHop", back_populates="email")
    indicators = relationship("Indicator", back_populates="email")
    ml_results = relationship("MLResult", back_populates="email")


class HeaderHop(Base):
    __tablename__ = "header_hops"

    hop_id = Column(String, primary_key=True)
    email_id = Column(String, ForeignKey("emails.email_id"))
    hop_index = Column(Integer)  # order in chronological (send->receive) direction
    received_raw = Column(Text)
    ip = Column(String, nullable=True)
    hostname = Column(String, nullable=True)
    timestamp = Column(String, nullable=True)
    trust_level = Column(String, default="untrusted")  # trusted, boundary, untrusted

    email = relationship("Email", back_populates="header_hops")


class DomainIntel(Base):
    __tablename__ = "domain_intel"

    domain = Column(String, primary_key=True)
    registrar = Column(String, nullable=True)
    created_date = Column(String, nullable=True)
    age_days = Column(Integer, nullable=True)
    mx_records = Column(Text, nullable=True)  # JSON-encoded list
    reputation = Column(String, nullable=True)
    lookup_source = Column(String, nullable=True)
    lookup_timestamp = Column(DateTime, nullable=True)


class IPIntel(Base):
    __tablename__ = "ip_intel"

    ip = Column(String, primary_key=True)
    country = Column(String, nullable=True)
    region = Column(String, nullable=True)
    city = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    asn = Column(String, nullable=True)
    isp = Column(String, nullable=True)
    is_hosting = Column(Boolean, default=False)
    is_private = Column(Boolean, default=False)
    lookup_source = Column(String, nullable=True)
    lookup_timestamp = Column(DateTime, nullable=True)


class Indicator(Base):
    __tablename__ = "indicators"

    indicator_id = Column(String, primary_key=True)
    email_id = Column(String, ForeignKey("emails.email_id"))
    type = Column(String)  # e.g. url, ip_literal, lookalike_domain, urgency_cue
    value = Column(Text)
    severity = Column(String)  # low, medium, high
    source = Column(String)
    confidence = Column(String)  # High, Medium, Low

    email = relationship("Email", back_populates="indicators")


class MLResult(Base):
    __tablename__ = "ml_results"

    ml_result_id = Column(String, primary_key=True)
    email_id = Column(String, ForeignKey("emails.email_id"))
    model = Column(String)
    version = Column(String)
    predicted_class = Column(String)
    probability = Column(Float)
    latency_ms = Column(Float)
    device_used = Column(String)  # cpu / cuda
    top_features = Column(Text, nullable=True)  # JSON-encoded

    email = relationship("Email", back_populates="ml_results")


class GraphEdge(Base):
    __tablename__ = "graph_edges"

    edge_id = Column(String, primary_key=True)
    case_id = Column(String, ForeignKey("cases.case_id"))
    source = Column(String)
    relation = Column(String)
    target = Column(String)
    confidence = Column(String, nullable=True)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    event_id = Column(String, primary_key=True)
    case_id = Column(String, ForeignKey("cases.case_id"))
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor = Column(String, nullable=True)
    evidence_hash = Column(String, nullable=True)
    detail = Column(Text, nullable=True)

    case = relationship("Case", back_populates="audit_events")
