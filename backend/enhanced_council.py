import numpy as np

def enhanced_council_predict(models, scalers, nasa_params_list, v_shape_detected=False, instrumental_detected=False, gas_giant_detected=False, gas_giant_confidence=0.0, gas_giant_type=""):
    """Enhanced prediction with SMART weighted voting and ADVANCED signal-based analysis"""
    
    features = np.array(nasa_params_list).reshape(1, -1)
    
    # Extract key parameters for analysis
    koi_period = nasa_params_list[0]
    koi_prad = nasa_params_list[1] 
    koi_depth = nasa_params_list[5] if len(nasa_params_list) > 5 else 0.001
    
    print("  🗳️  Enhanced Council voting with ADVANCED ALGORITHMS...")
    
    votes = {}
    predictions = {}
    confidences = {}
    
    # Specialist weights based on expertise
    specialist_weights = {
        'CELESTIAL_ORACLE': 1.3,      # Excellent at real planets
        'ATMOSPHERIC_WARRIOR': 1.2,   # Good atmospheric analysis
        'BACKYARD_GENIUS': 1.0,       # Balanced approach
        'CHAOS_MASTER': 1.4,          # Best at weird/edge cases
        'COSMIC_CONDUCTOR': 0.7       # Sometimes too pessimistic
    }
    
    # Get individual votes with weights
    total_weighted_confidence = 0.0
    total_weights = 0.0
    exoplanet_weighted_votes = 0.0
    specialist_details = []
    
    for name, model in models.items():
        try:
            if name in scalers:
                scaled_features = scalers[name].transform(features)
            else:
                scaled_features = features
            
            pred_prob = model.predict(scaled_features, verbose=0)[0][0]
            pred_class = "EXOPLANET" if pred_prob > 0.5 else "NOT_EXOPLANET"
            
            votes[name] = pred_class
            predictions[name] = pred_prob
            confidences[name] = pred_prob if pred_prob > 0.5 else (1 - pred_prob)
            
            # Apply specialist weights
            weight = specialist_weights.get(name, 1.0)
            
            # Dynamic weight adjustment based on signal characteristics
            if name == 'CHAOS_MASTER' and (koi_period < 2.0 or koi_depth > 0.05):
                weight *= 1.2  # Extra weight for weird signals
            elif name == 'CELESTIAL_ORACLE' and ((1.0 < koi_period < 50.0 and 0.5 < koi_prad < 10.0) or gas_giant_detected):
                weight *= 1.1  # Extra weight for normal planets OR confirmed gas giants
            elif name == 'COSMIC_CONDUCTOR' and pred_prob < 0.3:
                weight *= 0.5  # Reduce weight when overly pessimistic
            
            # SPECIAL GAS GIANT TREATMENT - Boost pro-exoplanet votes for confirmed gas giants
            if gas_giant_detected and gas_giant_confidence > 0.8 and pred_class == "EXOPLANET":
                weight *= 1.3  # Boost confidence in gas giant detections
            
            if pred_class == "EXOPLANET":
                exoplanet_weighted_votes += weight * pred_prob
            
            total_weighted_confidence += weight * pred_prob
            total_weights += weight
            
            specialist_details.append(f"{name} ({weight:.1f}x): {pred_class} ({pred_prob:.3f})")
            print(f"    {name} (weight {weight:.1f}): {pred_class} (confidence: {pred_prob:.3f})")
            
        except Exception as e:
            print(f"    💥 {name} failed: {e}")
            votes[name] = "ABSTAIN"
            predictions[name] = 0.5
            confidences[name] = 0.0
    
    # Signal-based analysis
    signal_flags = []
    advanced_score = 0.0
    
    # Calculate consensus strength first
    consensus_strength = exoplanet_weighted_votes / total_weights if total_weights > 0 else 0.0
    
    # CRITICAL: Add advanced detection penalties - BALANCED approach! (EXACT brutal reality test logic)
    if v_shape_detected:
        signal_flags.append("🔺 V-SHAPE ECLIPSE DETECTED (Binary signature)")
        # Smart penalty based on consensus and other factors
        if consensus_strength < 0.5:
            advanced_score += 1.5  # Very strong penalty for weak consensus
        elif consensus_strength < 0.8:
            advanced_score += 0.8  # Medium penalty for moderate consensus
        else:
            advanced_score += 0.5  # Light penalty for strong consensus
        print("🚨 ADVANCED DETECTION: V-shape eclipse signature!")
    
    if instrumental_detected:
        signal_flags.append("🔧 INSTRUMENTAL CORRELATION (Systematic artifact)")
        # Similar smart penalty but slightly lighter
        if consensus_strength < 0.5:
            advanced_score += 1.2  # Strong penalty for weak consensus
        elif consensus_strength < 0.8:
            advanced_score += 0.6  # Medium penalty for moderate consensus
        else:
            advanced_score += 0.4  # Light penalty for strong consensus
        print("🚨 ADVANCED DETECTION: Instrumental systematic!")
    
    # 🪐 GAS GIANT DETECTION - Use parameters from main.py analysis
    if gas_giant_detected:
        signal_flags.append(gas_giant_type)
        print(f"🪐 GAS GIANT CONFIRMED: {gas_giant_type}")
        print(f"   Gas giant confidence: {gas_giant_confidence:.2f}")
        
        # Gas giants get confidence boost (they're often real exoplanets)
        if gas_giant_confidence > 0.8:
            advanced_score -= 0.3  # High confidence gas giants get bonus
        elif gas_giant_confidence > 0.6:
            advanced_score -= 0.2  # Medium confidence gets smaller bonus
    
    # Signal-based flags, including gas-giant handling
    
    # 1. Extreme period check (contact binaries or impossible orbits)
    if koi_period < 0.3:  # Contact binary territory
        signal_flags.append(f"Contact binary period: {koi_period:.3f}d")
        advanced_score += 0.8
    elif koi_period < 0.7 and gas_giant_detected:  # Hot Jupiter too close - IMPOSSIBLE!
        signal_flags.append(f"IMPOSSIBLE Hot Jupiter orbit: {koi_period:.3f}d (too close to star)")
        advanced_score += 2.0  # DECISIVE PENALTY - Gas giants can't survive this close!
    elif abs(koi_period - 13.7) < 0.1:  # TESS systematic period
        signal_flags.append(f"TESS systematic period detected: {koi_period:.3f}d")
        advanced_score += 2.0  # DECISIVE PENALTY - Clear instrumental artifact!
    elif koi_period > 200.0:  # Very long period (rare)
        signal_flags.append(f"Extreme long period: {koi_period:.3f}d")
        advanced_score += 0.3
    
    # 2. Physically implausible planet sizes, with gas-giant handling
    if koi_prad > 80.0:  # Larger than any known planet (increased for ultra-hot Jupiters)
        signal_flags.append(f"IMPOSSIBLE planet size: {koi_prad:.1f} Earth radii")
        advanced_score += 1.2
    elif koi_prad > 60.0 and not gas_giant_detected:  # Very large but not a valid gas giant
        signal_flags.append(f"Suspicious large size: {koi_prad:.1f} Earth radii (not gas giant)")
        advanced_score += 0.9
    elif koi_prad > 20.0 and not gas_giant_detected:  # Large but not a valid gas giant
        signal_flags.append(f"Suspicious large size: {koi_prad:.1f} Earth radii (not gas giant)")
        advanced_score += 0.6
    elif koi_prad > 15.0 and not gas_giant_detected:  # Moderately large, not gas giant
        signal_flags.append(f"Large size warning: {koi_prad:.1f} Earth radii")
        advanced_score += 0.4
    
    # 3. Extreme transit depths
    if koi_depth > 0.3:  # >30% depth
        signal_flags.append(f"EXTREME depth: {koi_depth:.4f}")
        advanced_score += 1.0
    elif koi_depth > 0.15:  # >15% depth  
        signal_flags.append(f"Very deep transit: {koi_depth:.4f}")
        advanced_score += 0.6
    elif koi_depth > 0.08:  # >8% depth
        signal_flags.append(f"Deep transit: {koi_depth:.4f}")
        advanced_score += 0.3
    
    # 4. Consistency checks between parameters
    expected_depth = (koi_prad / 109.1)**2  # Expected depth from radius
    if abs(koi_depth - expected_depth) > expected_depth * 3:  # 3x discrepancy
        signal_flags.append(f"Depth-radius mismatch: {koi_depth:.4f} vs {expected_depth:.4f}")
        advanced_score += 0.5
    
    print(f"🧠 Advanced signal analysis:")
    print(f"   Signal-based red flags: {len(signal_flags)}")
    for flag in signal_flags:
        print(f"   - {flag}")
    print(f"   Advanced score: {advanced_score:.3f}")
    
    # ENHANCED DECISION LOGIC with confidence weighting
    if total_weights > 0:
        weighted_avg_confidence = total_weighted_confidence / total_weights
        exoplanet_strength = exoplanet_weighted_votes / total_weights
    else:
        weighted_avg_confidence = 0.5
        exoplanet_strength = 0.0
    
    # Count simple votes for consensus check
    exoplanet_votes = sum(1 for vote in votes.values() if vote == "EXOPLANET")
    not_exoplanet_votes = sum(1 for vote in votes.values() if vote == "NOT_EXOPLANET")
    
    # SMART DECISION ALGORITHM with AGGRESSIVE false positive rejection + SMART GAS GIANT SUPPORT
    
    # Define what constitutes "serious" vs "moderate" red flags
    serious_red_flags = advanced_score >= 1.0  # Impossible sizes, extreme depths, binaries, etc.
    moderate_red_flags = 0.4 <= advanced_score < 1.0  # Large size warnings, moderate issues
    low_red_flags = advanced_score < 0.4  # Minimal issues
    
    if gas_giant_detected and exoplanet_strength >= 0.6 and consensus_strength >= 0.7 and not serious_red_flags:
        # SMART GAS GIANT OVERRIDE: Only for STRONG Council consensus + reasonable physics
        # This prevents weak-consensus cases (like Ground-Based Hell) from being overridden
        # But allows strong-consensus legitimate Hot Jupiters to pass through
        if moderate_red_flags:
            # Gas giant helps overcome moderate red flags (like "large size warning")
            final_verdict = "EXOPLANET"
            confidence = min(exoplanet_strength * gas_giant_confidence * 0.8, 0.90)  # Slightly reduced confidence
            reason = f"🪐 Gas Giant detected (confidence {gas_giant_confidence:.1f}) + STRONG Council consensus (moderate flags ignored)"
        elif low_red_flags:
            # Gas giant with minimal red flags - high confidence
            final_verdict = "EXOPLANET"
            confidence = min(exoplanet_strength * gas_giant_confidence, 0.95)
            reason = f"🪐 Gas Giant detected (confidence {gas_giant_confidence:.1f}) + STRONG Council consensus (clean signal)"
        else:
            # Fallback to normal logic if no clear category
            final_verdict = "NOT_EXOPLANET"
            confidence = 0.75
            reason = "🛡️ Gas Giant detected but unclear red flag assessment"
    elif gas_giant_detected and (exoplanet_strength < 0.6 or consensus_strength < 0.7):
        # WEAK CONSENSUS GAS GIANT: Check if it's a legitimate difficult detection
        if advanced_score == 0.0 and exoplanet_votes >= 2:
            # This might be a difficult but real planet (like Ground-Based Hell)
            final_verdict = "EXOPLANET"
            confidence = 0.70  # Lower confidence due to weak consensus
            reason = f"🌟 Difficult Gas Giant detection: Weak consensus ({consensus_strength:.3f}) but clean physics"
        else:
            # Apply normal red flag logic (no override)
            final_verdict = "NOT_EXOPLANET"
            confidence = 0.85
            reason = f"🚨 Gas Giant detected but WEAK Council consensus ({consensus_strength:.3f}) - normal physics analysis"
    elif serious_red_flags:  # HIGH red flags - NEVER override these
        final_verdict = "NOT_EXOPLANET"
        confidence = 0.90
        reason = "🚨 HIGH red flags - Advanced physics analysis (Gas Giant detection cannot override)"
    elif advanced_score >= 0.8 and exoplanet_strength < 0.8:
        final_verdict = "NOT_EXOPLANET"
        confidence = 0.85
        reason = "🚫 Significant red flags + conservative approach"
    elif advanced_score >= 0.6 and not_exoplanet_votes >= 1:
        final_verdict = "NOT_EXOPLANET"
        confidence = 0.80
        reason = "⚠️ Moderate red flags + expert dissent"
    elif exoplanet_strength >= 0.85 and advanced_score <= 0.3:
        final_verdict = "EXOPLANET"
        confidence = min(exoplanet_strength, 0.95)
        reason = "✨ Very strong consensus + minimal flags"
    elif exoplanet_strength >= 0.7 and advanced_score <= 0.5:
        final_verdict = "EXOPLANET"
        confidence = exoplanet_strength * 0.9
        reason = "🤝 Strong consensus + acceptable flags"
    elif exoplanet_votes >= 4 and advanced_score <= 0.4:
        final_verdict = "EXOPLANET"
        confidence = weighted_avg_confidence * 0.85
        reason = "🗳️ Vote consensus + low flags"
    elif gas_giant_detected and gas_giant_confidence >= 0.85 and advanced_score <= 1.0 and exoplanet_votes >= 2:
        # Special handling for high-confidence gas giants
        final_verdict = "EXOPLANET"
        confidence = 0.80
        reason = f"🪐 High-confidence gas giant detected ({gas_giant_confidence:.2f}) + council support"
    else:
        final_verdict = "NOT_EXOPLANET"
        confidence = 0.75
        reason = "🛡️ CONSERVATIVE rejection (protection mode)"
    
    print(f"⚖️ ENHANCED COUNCIL DECISION:")
    print(f"   Weighted strength: {exoplanet_strength:.3f}")
    print(f"   Advanced score: {advanced_score:.3f}")
    print(f"   Reason: {reason}")
    print(f"⚖️ FINAL VERDICT: {final_verdict} (confidence: {confidence:.3f})")
    
    # Create signal analysis dictionary for API response
    signal_analysis = {
        "consensus_strength": float(consensus_strength),
        "advanced_score": float(advanced_score), 
        "signal_flags": len(signal_flags),
        "weighted_prediction": float(exoplanet_strength),
        "decision_reason": reason,
        "specialist_weights_used": {name: float(specialist_weights.get(name, 1.0)) for name in specialist_weights.keys()},
        # 🪐 GAS GIANT DETECTION DATA! 🪐
        "gas_giant_detected": bool(gas_giant_detected),
        "gas_giant_confidence": float(gas_giant_confidence),
        "gas_giant_type": str(gas_giant_type),
        "gas_giant_jupiter_radii": float(koi_prad / 11.2) if gas_giant_detected else 0.0
    }
    
    return final_verdict, confidence, votes, predictions, signal_analysis
