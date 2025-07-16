#!/usr/bin/env python3
"""
GPT-4o Mini Vision Card Identifier
Optimized for Pokemon card identification with cost tracking and budget controls
"""
import os
import time
import json
import base64
from typing import Dict, Optional, Union
from PIL import Image
import io
import openai
from datetime import datetime, date
import logging
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GPT4VisionIdentifier:
    def __init__(self, api_key: Optional[str] = None, daily_budget_usd: float = 0.10):
        """Initialize GPT-4o Mini vision identifier with budget controls"""
        self.client = openai.OpenAI(api_key=api_key or os.getenv('OPENAI_API_KEY'))
        self.daily_budget = daily_budget_usd
        self.daily_spending = self._get_daily_spending()
        
        # Pricing (as of 2024)
        self.input_cost_per_token = 0.00015 / 1000  # $0.15 per 1M tokens
        self.output_cost_per_token = 0.0006 / 1000   # $0.60 per 1M tokens
        
    def _get_daily_spending(self) -> float:
        """Get today's spending from log file"""
        log_file = f"gpt4_costs_{date.today().isoformat()}.json"
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r') as f:
                    data = json.load(f)
                    return data.get('total_cost', 0.0)
            except:
                return 0.0
        return 0.0
    
    def _log_request_cost(self, input_tokens: int, output_tokens: int, 
                         cost: float, success: bool, response_time_ms: int):
        """Log request details for cost tracking"""
        log_file = f"gpt4_costs_{date.today().isoformat()}.json"
        
        # Load existing data
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r') as f:
                    data = json.load(f)
            except:
                data = {'requests': [], 'total_cost': 0.0}
        else:
            data = {'requests': [], 'total_cost': 0.0}
        
        # Add new request
        data['requests'].append({
            'timestamp': datetime.now().isoformat(),
            'input_tokens': input_tokens,
            'output_tokens': output_tokens,
            'cost_usd': cost,
            'success': success,
            'response_time_ms': response_time_ms
        })
        data['total_cost'] = data.get('total_cost', 0.0) + cost
        
        # Save updated data
        with open(log_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        # Update daily spending
        self.daily_spending = data['total_cost']
        
        logger.info(f"GPT-4o request: ${cost:.4f} | Daily total: ${self.daily_spending:.4f}")
    
    def _check_budget(self) -> bool:
        """Check if we're within daily budget"""
        if self.daily_spending >= self.daily_budget:
            logger.warning(f"Daily budget exceeded: ${self.daily_spending:.4f} >= ${self.daily_budget:.4f}")
            return False
        return True
    
    def _encode_image(self, image_path_or_pil: Union[str, Image.Image]) -> str:
        """Convert image to base64 for GPT-4 Vision"""
        if isinstance(image_path_or_pil, str):
            # File path
            with open(image_path_or_pil, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
        else:
            # PIL Image
            buffer = io.BytesIO()
            image_path_or_pil.save(buffer, format="JPEG")
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    def identify_card(self, image_path_or_pil: Union[str, Image.Image]) -> Dict:
        """
        Identify Pokemon card using GPT-4o Mini Vision
        
        Returns:
        {
            "success": bool,
            "card": {
                "name": str,
                "set_code": str, 
                "number": str,
                "confidence": float
            },
            "cost_usd": float,
            "tokens": {"input": int, "output": int},
            "response_time_ms": int,
            "raw_response": str
        }
        """
        start_time = time.time()
        
        # Budget check
        if not self._check_budget():
            return {
                "success": False,
                "error": "Daily budget exceeded",
                "cost_usd": 0.0,
                "tokens": {"input": 0, "output": 0},
                "response_time_ms": 0
            }
        
        try:
            # Encode image
            base64_image = self._encode_image(image_path_or_pil)
            
            # Optimized prompt for Pokemon card identification
            prompt = """You are an expert Pokemon card identifier. Analyze this card image and return ONLY valid JSON in this exact format:

{"name": "Card Name", "set_code": "set1", "number": "123", "confidence": 0.95}

CRITICAL: Return ONLY the JSON object above, no markdown code blocks, no explanation, no other text.

Rules:
- If you can clearly identify the card: provide name, set_code, number, confidence (0.8-1.0)
- If uncertain but can see it's a Pokemon card: provide best guess with confidence (0.3-0.7)
- If not a Pokemon card or completely unclear: return {"name": null, "set_code": null, "number": null, "confidence": 0.0}
- set_code examples: "base1", "xy1", "sm1", "swsh1", "sv1" (use official Pokemon TCG set codes)
- For number, use format like "25" or "25/102", extract from the card"""

            # Make API call
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=150,
                timeout=10
            )
            
            # Calculate cost and timing
            response_time_ms = int((time.time() - start_time) * 1000)
            input_tokens = response.usage.prompt_tokens
            output_tokens = response.usage.completion_tokens
            cost = (input_tokens * self.input_cost_per_token + 
                   output_tokens * self.output_cost_per_token)
            
            # Parse response
            raw_response = response.choices[0].message.content.strip()
            
            # Clean response - remove markdown code blocks if present
            cleaned_response = raw_response
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response.replace('```json', '').replace('```', '').strip()
            elif cleaned_response.startswith('```'):
                cleaned_response = cleaned_response.replace('```', '').strip()
            
            try:
                card_data = json.loads(cleaned_response)
                success = True
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON response: {raw_response}")
                card_data = {"name": None, "set_code": None, "number": None, "confidence": 0.0}
                success = False
            
            # Log cost
            self._log_request_cost(input_tokens, output_tokens, cost, success, response_time_ms)
            
            return {
                "success": success,
                "card": card_data,
                "cost_usd": cost,
                "tokens": {"input": input_tokens, "output": output_tokens},
                "response_time_ms": response_time_ms,
                "raw_response": raw_response
            }
            
        except Exception as e:
            response_time_ms = int((time.time() - start_time) * 1000)
            logger.error(f"GPT-4o Mini error: {e}")
            
            # Log failed request (no cost)
            self._log_request_cost(0, 0, 0.0, False, response_time_ms)
            
            return {
                "success": False,
                "error": str(e),
                "cost_usd": 0.0,
                "tokens": {"input": 0, "output": 0},
                "response_time_ms": response_time_ms
            }
    
    def get_daily_cost_summary(self) -> Dict:
        """Get today's cost summary"""
        log_file = f"gpt4_costs_{date.today().isoformat()}.json"
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r') as f:
                    data = json.load(f)
                    return {
                        "date": date.today().isoformat(),
                        "total_cost": data.get('total_cost', 0.0),
                        "budget": self.daily_budget,
                        "budget_used_pct": (data.get('total_cost', 0.0) / self.daily_budget) * 100,
                        "requests_count": len(data.get('requests', [])),
                        "avg_cost_per_request": data.get('total_cost', 0.0) / max(len(data.get('requests', [])), 1)
                    }
            except:
                pass
        
        return {
            "date": date.today().isoformat(),
            "total_cost": 0.0,
            "budget": self.daily_budget,
            "budget_used_pct": 0.0,
            "requests_count": 0,
            "avg_cost_per_request": 0.0
        } 