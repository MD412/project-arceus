#!/usr/bin/env python3
"""
Complete Demo Runner

Simulates the full card enrichment workflow:
1. Simulated computer vision detections
2. Card enrichment with real names
3. Formatted output for UI display

This shows exactly what your weekend demo will look like!
"""

import json
from datetime import datetime
from supabase_adapter import SupabaseCardEnricher, DetectionInput, EnrichmentResult
from typing import List, Dict

def create_demo_detections() -> List[DetectionInput]:
    """Create realistic demo detections"""
    demo_cards = [
        "Charizard ex",
        "Pikachu V", 
        "Mewtwo GX",
        "Gardevoir ex",
        "Blastoise",
        "Unknown Card",
        "Charizard",
        "Pikachu",
        "Lucario"
    ]
    
    detections = []
    for i, predicted_name in enumerate(demo_cards):
        detection = DetectionInput(
            detection_id=f"demo_det_{i+1:03d}",
            job_id="demo_job_weekend",
            predicted_name=predicted_name,
            confidence=0.75 + (i * 0.02),  # Varying confidence
            bounding_box={
                "x": 50 + (i % 3) * 200,
                "y": 50 + (i // 3) * 250, 
                "width": 180,
                "height": 240
            },
            cropped_image_path=f"/uploads/crops/demo_crop_{i+1:03d}.jpg",
            tile_source=f"tile_{(i % 9) + 1}"
        )
        detections.append(detection)
    
    return detections

def format_demo_results(enrichment_results: List[EnrichmentResult]) -> Dict:
    """Format results for UI display"""
    
    demo_output = {
        "job_id": "demo_job_weekend",
        "processed_at": datetime.now().isoformat(),
        "summary": {
            "total_detections": len(enrichment_results),
            "identified": 0,
            "unidentified": 0,
            "errors": 0,
            "success_rate": 0.0
        },
        "detections": []
    }
    
    for result in enrichment_results:
        detection_output = {
            "detection_id": result.detection_id,
            "status": "identified" if result.success else "unidentified",
            "processing_time_ms": result.processing_time_ms,
            "bounding_box": {"x": 100, "y": 100, "width": 180, "height": 240}  # Mock data
        }
        
        if result.success and result.best_match:
            # Successful identification
            demo_output["summary"]["identified"] += 1
            
            match = result.best_match
            detection_output.update({
                "card_name": match.card_name,
                "set_name": match.set_name,
                "set_code": match.set_code,
                "card_number": match.card_number,
                "rarity": match.rarity,
                "pokemon_name": match.pokemon_name,
                "image_urls": match.image_urls,
                "market_price": 45.99 if "Charizard" in match.card_name else 12.50,  # Mock pricing
                "identification_confidence": result.identification_confidence,
                "identification_method": result.identification_method,
                "match_type": match.match_type
            })
        else:
            # Failed identification
            demo_output["summary"]["unidentified"] += 1
            detection_output.update({
                "error_message": result.error_message,
                "fallback_display": "Unknown Card - Help us train this!"
            })
        
        demo_output["detections"].append(detection_output)
    
    # Calculate success rate
    total = demo_output["summary"]["total_detections"]
    identified = demo_output["summary"]["identified"]
    demo_output["summary"]["success_rate"] = (identified / total * 100) if total > 0 else 0
    
    return demo_output

def print_demo_summary(demo_data: Dict):
    """Print beautiful demo summary"""
    print(f"\n🎯 PROJECT ARCEUS - WEEKEND DEMO RESULTS")
    print("=" * 65)
    
    summary = demo_data["summary"]
    print(f"📊 SUMMARY:")
    print(f"  Job ID: {demo_data['job_id']}")
    print(f"  Processed: {demo_data['processed_at']}")
    print(f"  Total Detections: {summary['total_detections']}")
    print(f"  ✅ Identified: {summary['identified']}")
    print(f"  ❓ Unidentified: {summary['unidentified']}")
    print(f"  Success Rate: {summary['success_rate']:.1f}%")
    
    print(f"\n🃏 IDENTIFIED CARDS:")
    for detection in demo_data["detections"]:
        if detection["status"] == "identified":
            confidence = detection.get("identification_confidence", 0)
            price = detection.get("market_price", 0)
            
            print(f"  • {detection['card_name']}")
            print(f"    Set: {detection['set_name']} ({detection['set_code']} #{detection['card_number']})")
            print(f"    Rarity: {detection['rarity']} | Price: ${price:.2f}")
            print(f"    Confidence: {confidence:.1f}% | Method: {detection['identification_method']}")
            print()
    
    unidentified = [d for d in demo_data["detections"] if d["status"] == "unidentified"]
    if unidentified:
        print(f"❓ UNIDENTIFIED CARDS: {len(unidentified)}")
        for detection in unidentified[:3]:  # Show first 3
            print(f"  • {detection['detection_id']}: {detection.get('error_message', 'Unknown error')}")
    
    print(f"\n🚀 READY FOR WEEKEND DEMO!")
    print(f"This shows real card names instead of 'Unknown Card' placeholders.")
    print(f"Your computer vision now has Pokemon card intelligence! 🤯")

def main():
    """Run the complete demo"""
    print("🎬 Starting Project Arceus Weekend Demo...")
    print("Simulating computer vision → card enrichment → UI display")
    
    try:
        # Step 1: Create enricher
        enricher = SupabaseCardEnricher()
        print("✅ Card enrichment system initialized")
        
        # Step 2: Create demo detections
        detections = create_demo_detections()
        print(f"✅ Created {len(detections)} demo detections")
        
        # Step 3: Enrich all detections
        print("🔍 Enriching detections with card identification...")
        enrichment_results = []
        for detection in detections:
            result = enricher.enrich_detection(detection)
            enrichment_results.append(result)
        
        # Step 4: Format for UI
        demo_data = format_demo_results(enrichment_results)
        
        # Step 5: Display results
        print_demo_summary(demo_data)
        
        # Step 6: Save for UI integration
        output_file = "weekend_demo_results.json"
        with open(output_file, 'w') as f:
            json.dump(demo_data, f, indent=2, default=str)
        
        print(f"\n💾 Demo results saved to: {output_file}")
        print(f"🔗 Wire this JSON into your UI components!")
        
        # Step 7: Show UI integration example
        print(f"\n📱 UI INTEGRATION EXAMPLE:")
        print(f"```javascript")
        print(f"// In your React component:")
        print(f"const demoResults = require('./weekend_demo_results.json');")
        print(f"")
        print(f"// Instead of showing 'Unknown Card':")
        print(f"detection.status === 'identified' ? (")
        print(f"  <CardDisplay")
        print(f"    name={{detection.card_name}}")
        print(f"    set={{detection.set_name}}")
        print(f"    price={{detection.market_price}}")
        print(f"    confidence={{detection.identification_confidence}}")
        print(f"    imageUrl={{detection.image_urls.large}}")
        print(f"  />")
        print(f") : (")
        print(f"  <UnknownCard message='Help us train this!' />")
        print(f")")
        print(f"```")
        
        return True
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print(f"\n🎉 Demo complete! You're ready to blow minds this weekend! 🚀")
    else:
        print(f"\n💥 Demo had issues - check the logs above") 