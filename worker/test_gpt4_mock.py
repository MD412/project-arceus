#!/usr/bin/env python3
"""
Mock GPT-4o Mini Test - validates code structure without API calls
"""
import json
from unittest.mock import Mock, patch
from gpt4_vision_identifier import GPT4VisionIdentifier

def create_mock_response():
    """Create a mock OpenAI response"""
    mock_response = Mock()
    mock_response.choices = [Mock()]
    mock_response.choices[0].message.content = json.dumps({
        "name": "Pikachu",
        "set_code": "base1",
        "number": "25",
        "confidence": 0.95
    })
    mock_response.usage = Mock()
    mock_response.usage.prompt_tokens = 150
    mock_response.usage.completion_tokens = 25
    return mock_response

def test_gpt4_mock():
    """Test GPT-4 identifier with mocked API calls"""
    print("🧪 Mock GPT-4o Mini Testing")
    print("=" * 50)
    
    # Mock the OpenAI client
    with patch('openai.OpenAI') as mock_openai:
        # Setup mock
        mock_client = Mock()
        mock_openai.return_value = mock_client
        mock_client.chat.completions.create.return_value = create_mock_response()
        
        # Test with mock API key
        identifier = GPT4VisionIdentifier(api_key="mock_key", daily_budget_usd=0.05)
        
        # Test with a fake image path (won't actually read file due to mocking)
        with patch('builtins.open', mock_open_file_mock()):
            result = identifier.identify_card("fake_image.jpg")
        
        print("✅ Mock API call successful!")
        print(f"   Card: {result['card']['name']} | {result['card']['set_code']}-{result['card']['number']}")
        print(f"   Confidence: {result['card']['confidence']}")
        print(f"   Cost: ${result['cost_usd']:.4f}")
        print(f"   Response time: {result['response_time_ms']}ms")
        print(f"   Success: {result['success']}")
        
        # Test cost summary
        summary = identifier.get_daily_cost_summary()
        print(f"\n📊 Daily Summary:")
        print(f"   Total cost: ${summary['total_cost']:.4f}")
        print(f"   Budget used: {summary['budget_used_pct']:.1f}%")
        print(f"   Requests: {summary['requests_count']}")
        
        print("\n🎉 Code structure validation successful!")
        print("🔑 Ready for real API key testing")

def mock_open_file_mock():
    """Mock file opening for base64 encoding"""
    from unittest.mock import mock_open
    return mock_open(read_data=b"fake_image_data")

if __name__ == "__main__":
    test_gpt4_mock() 