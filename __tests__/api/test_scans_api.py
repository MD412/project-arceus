#!/usr/bin/env python3
"""
Integration tests for the scans API
Tests API endpoints, authentication, and data flow
"""
import pytest
import requests
import json
from datetime import datetime


class TestScansAPI:
    """Test the scans API endpoints"""
    
    BASE_URL = "http://localhost:3000/api"
    
    @pytest.fixture
    def scan_id(self):
        """Provide a test scan ID"""
        # This would be a known test scan in the database
        return "d9708c50-a40f-4f87-9c0b-53efb0c0c895"
    
    def test_get_scan_details(self, scan_id):
        """Test GET /api/scans/[id]"""
        response = requests.get(f"{self.BASE_URL}/scans/{scan_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "id" in data
        assert "processing_status" in data
        assert "results" in data
        
        # Check enriched cards if processing is complete
        if data["processing_status"] == "completed":
            assert "enriched_cards" in data["results"]
            assert isinstance(data["results"]["enriched_cards"], list)
            
            # Check card structure
            if len(data["results"]["enriched_cards"]) > 0:
                card = data["results"]["enriched_cards"][0]
                assert "card_name" in card
                assert "confidence" in card
                assert "crop_url" in card
    
    def test_get_nonexistent_scan(self):
        """Test GET /api/scans/[id] with invalid ID"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{self.BASE_URL}/scans/{fake_id}")
        
        assert response.status_code == 404
        assert "error" in response.json()
    
    def test_api_handles_missing_columns(self):
        """Test API handles missing pokemon_tcg_api_id gracefully"""
        # This was the original bug - API should not reference non-existent columns
        scan_id = "d9708c50-a40f-4f87-9c0b-53efb0c0c895"
        response = requests.get(f"{self.BASE_URL}/scans/{scan_id}")
        
        # Should not get a database error
        assert response.status_code in [200, 404]
        
        # If successful, should not contain error about missing column
        if response.status_code == 200:
            data = response.json()
            assert "column" not in str(data).lower()
            assert "pokemon_tcg_api_id" not in str(data)
    
    @pytest.mark.skip(reason="Requires authentication")
    def test_rename_scan(self, scan_id):
        """Test PATCH /api/scans/[id] for renaming"""
        new_title = f"Test Scan {datetime.now().isoformat()}"
        
        response = requests.patch(
            f"{self.BASE_URL}/scans/{scan_id}",
            json={"scan_title": new_title},
            headers={"x-user-id": "test-user-id"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["scan"]["scan_title"] == new_title
    
    @pytest.mark.skip(reason="Requires authentication")
    def test_delete_scan(self, scan_id):
        """Test DELETE /api/scans/[id]"""
        response = requests.delete(
            f"{self.BASE_URL}/scans/{scan_id}",
            headers={"x-user-id": "test-user-id"}
        )
        
        # Should return 202 Accepted for async delete
        assert response.status_code == 202
        assert response.json()["accepted"] == True


class TestCardCorrections:
    """Test card correction functionality"""
    
    BASE_URL = "http://localhost:3000/api"
    
    @pytest.mark.skip(reason="Requires authentication")
    def test_correct_card_identification(self):
        """Test PATCH /api/scans/[id]/cards for corrections"""
        scan_id = "test-scan-id"
        
        correction_data = {
            "cardIndex": 0,
            "correctedData": {
                "card_name": "Charizard ex",
                "enrichment_success": True,
                "identification_confidence": 100
            }
        }
        
        response = requests.patch(
            f"{self.BASE_URL}/scans/{scan_id}/cards",
            json=correction_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        assert "message" in response.json()


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 