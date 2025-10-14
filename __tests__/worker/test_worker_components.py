#!/usr/bin/env python3
"""Unit tests for worker components focusing on Supabase integration shims."""

import importlib.util
import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import numpy as np
import pytest

ROOT_DIR = Path(__file__).resolve().parents[2]
WORKER_DIR = ROOT_DIR / "worker"

# Ensure worker modules can be imported as top-level modules (mirroring runtime PYTHONPATH tweaks).
if str(WORKER_DIR) not in sys.path:
    sys.path.insert(0, str(WORKER_DIR))

# Provide lightweight stubs for optional heavy dependencies before importing worker modules.
if "open_clip" not in sys.modules:
    sys.modules["open_clip"] = SimpleNamespace(
        create_model_and_transforms=lambda *args, **kwargs: (
            SimpleNamespace(encode_image=lambda *encode_args, **encode_kwargs: None, eval=lambda: None),
            None,
            lambda image: image,
        )
    )


class _TorchStub(SimpleNamespace):
    def __init__(self):
        super().__init__()
        self.cuda = SimpleNamespace(is_available=lambda: False)

    def no_grad(self):
        class _Context:
            def __enter__(self_inner):  # noqa: N804
                return None

            def __exit__(self_inner, exc_type, exc, tb):  # noqa: N804
                return False

        return _Context()


if "torch" not in sys.modules:
    sys.modules["torch"] = _TorchStub()

if "ultralytics" not in sys.modules:
    sys.modules["ultralytics"] = SimpleNamespace(YOLO=MagicMock())

from clip_lookup import CLIPCardIdentifier

# Dynamically import worker.py so we can access helper functions without packaging tweaks.
_worker_spec = importlib.util.spec_from_file_location("worker_module", WORKER_DIR / "worker.py")
worker_module = importlib.util.module_from_spec(_worker_spec)
assert _worker_spec.loader is not None  # for mypy-type tools
_worker_spec.loader.exec_module(worker_module)

fetch_jobs_with_expired_visibility = worker_module.fetch_jobs_with_expired_visibility
resolve_card_uuid = worker_module.resolve_card_uuid
update_job_visibility_timeout = worker_module.update_job_visibility_timeout


class MockSupabaseRPCClient:
    """Capture RPC calls for find_similar_cards tests."""

    def __init__(self):
        self.calls = []

    def rpc(self, name, params):
        self.calls.append((name, params))

        class _Response:
            def __init__(self):
                self.data = [
                    {
                        "distance": 0.1,
                        "card_id": "sv1-1",
                        "name": "Stored Name",
                        "set_code": "sv1",
                        "card_number": "001",
                        "rarity": "rare",
                        "image_url": "https://example.com/card.png",
                    }
                ]

        return SimpleNamespace(execute=lambda: _Response())


def test_find_similar_cards_passes_similarity_threshold():
    """Ensure the RPC receives the provided similarity threshold without inversion."""
    supabase_client = MockSupabaseRPCClient()
    identifier = object.__new__(CLIPCardIdentifier)
    identifier.supabase_client = supabase_client
    identifier._get_name_from_api_id = lambda api_id: "Fallback Name"  # noqa: ARG005

    results = identifier.find_similar_cards(np.zeros(3), similarity_threshold=0.9, max_results=1)

    assert supabase_client.calls[0][1]["similarity_threshold"] == 0.9
    assert pytest.approx(results[0]["similarity"], abs=1e-6) == 0.9


class FallbackUpdateClient:
    """Simulate visibility timeout update falling back to the alternate column."""

    def __init__(self):
        self.responses = [Exception("column visibility_timeout_at does not exist"), SimpleNamespace(data=[])]
        self.payloads = []

    def from_(self, table_name):
        assert table_name == "job_queue"
        return FallbackUpdateQuery(self)


class FallbackUpdateQuery:
    def __init__(self, client):
        self.client = client

    def update(self, payload):
        self.payload = payload
        self.client.payloads.append(payload)
        return self

    def eq(self, column, value):
        self.column = column
        self.value = value
        return self

    def execute(self):
        response = self.client.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


def test_update_job_visibility_timeout_retries_alternate_column():
    """Visibility timeout updates should retry with the alternate column when the first fails."""
    client = FallbackUpdateClient()
    base_update = {"status": "processing"}
    iso_value = "2024-01-01T00:00:00Z"

    assert update_job_visibility_timeout(client, "job-123", iso_value, base_update) is True
    assert len(client.payloads) == 2
    assert client.payloads[0] == {"status": "processing", "visibility_timeout_at": iso_value}
    assert client.payloads[1] == {"status": "processing", "visibility_timeout": iso_value}


class FallbackSelectClient:
    """Simulate visibility timeout selection fallback behaviour."""

    def __init__(self):
        self.responses = [
            Exception("column visibility_timeout_at does not exist"),
            SimpleNamespace(data=[{"id": "job-1", "retry_count": 0, "scan_upload_id": "upload-1"}]),
        ]
        self.lte_columns = []

    def from_(self, table_name):
        assert table_name == "job_queue"
        return FallbackSelectQuery(self)


class FallbackSelectQuery:
    def __init__(self, client):
        self.client = client

    def select(self, columns):
        self.columns = columns
        return self

    def in_(self, column, values):
        self.in_args = (column, tuple(values))
        return self

    def lte(self, column, cutoff):
        self.client.lte_columns.append(column)
        self.lte_args = (column, cutoff)
        return self

    def execute(self):
        response = self.client.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


def test_fetch_jobs_with_expired_visibility_fallbacks_column():
    """Selecting stale jobs should retry with the alternate visibility column."""
    client = FallbackSelectClient()
    jobs = fetch_jobs_with_expired_visibility(client, ["processing"], "2024-01-01T00:00:00Z")

    assert jobs == [{"id": "job-1", "retry_count": 0, "scan_upload_id": "upload-1"}]
    assert client.lte_columns == ["visibility_timeout_at", "visibility_timeout"]


class FakeSupabaseClient:
    """Minimal supabase client stub for resolve_card_uuid testing."""

    def __init__(self):
        self.inserted_cards = []
        self.upserts = []
        self.card_select_calls = 0

    def from_(self, table_name):
        return FakeQuery(self, table_name)

    def _execute(self, query):
        if query.table == "card_keys":
            if query.operation == "upsert":
                self.upserts.append(query.payload)
                return SimpleNamespace(data=[query.payload])
            return SimpleNamespace(data=None)
        if query.table == "cards":
            if query.operation == "insert":
                self.inserted_cards.append(query.payload)
                return SimpleNamespace(data=[{"id": "uuid-123"}])
            self.card_select_calls += 1
            if self.card_select_calls == 1:
                return SimpleNamespace(data=None)
            if query.single_mode:
                return SimpleNamespace(data={"id": "uuid-123"})
            return SimpleNamespace(data=[{"id": "uuid-123"}])
        if query.table == "card_embeddings":
            return SimpleNamespace(
                data={
                    "card_id": "sv1-1",
                    "name": "Test Card",
                    "set_code": "sv1",
                    "card_number": "001",
                    "rarity": "rare",
                    "image_url": "https://example.com/card.png",
                }
            )
        raise AssertionError(f"Unhandled operation {query.operation} on table {query.table}")


class FakeQuery:
    def __init__(self, client, table):
        self.client = client
        self.table = table
        self.filters = {}
        self.single_mode = False
        self.payload = None
        self.operation = None

    def select(self, columns):
        self.operation = "select"
        self.columns = columns
        return self

    def eq(self, column, value):
        self.filters[column] = value
        return self

    def single(self):
        self.single_mode = True
        return self

    def insert(self, payload):
        self.operation = "insert"
        self.payload = payload
        return self

    def upsert(self, payload, on_conflict=None):
        self.operation = "upsert"
        self.payload = payload
        self.on_conflict = on_conflict
        return self

    def update(self, payload):
        self.operation = "update"
        self.payload = payload
        return self

    def execute(self):
        return self.client._execute(self)


def test_resolve_card_uuid_auto_creation_sets_image_fields():
    """Auto-created cards should include both image_url and image_urls for compatibility."""
    client = FakeSupabaseClient()
    card_uuid = resolve_card_uuid(client, "clip", "sv1-1")

    assert card_uuid == "uuid-123"
    assert client.inserted_cards, "Expected a card insert to occur"
    inserted_card = client.inserted_cards[0]
    assert inserted_card["image_url"] == "https://example.com/card.png"
    assert inserted_card["image_urls"] == {
        "large": "https://example.com/card.png",
        "small": "https://example.com/card.png",
    }
    assert client.upserts == [
        {"source": "clip", "external_id": "sv1-1", "card_id": "uuid-123"}
    ]
