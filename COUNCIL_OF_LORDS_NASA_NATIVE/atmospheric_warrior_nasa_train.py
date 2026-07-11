#!/usr/bin/env python3
"""
🔥⚔️ ATMOSPHERIC WARRIOR AI - NASA NATIVE VERSION ⚔️🔥
Atmospheric analysis specialist trained on REAL NASA exoplanet catalog parameters
BATTLEFIELD: STELLAR TEMPERATURES, PLANET MASSES, ATMOSPHERIC CONDITIONS

Features: [pl_orbper, pl_rade, st_teff, st_rad, st_mass, sy_dist, pl_orbeccen, pl_bmasse]
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization, Input, LeakyReLU
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.regularizers import l2, l1_l2
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import warnings
import joblib
from datetime import datetime
import sys
import os

# Add the parent directory to Python path to import the data generator
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from nasa_catalog_data_generator import NASACatalogDataGenerator

warnings.filterwarnings('ignore')

def atmospheric_warrior_nasa_loss(y_true, y_pred):
    """
    ⚔️🌡️ ATMOSPHERIC WARRIOR NASA LOSS FUNCTION 🌡️⚔️
    Specialized for atmospheric parameter analysis from NASA data
    """
    # Base binary crossentropy
    bce = tf.keras.losses.binary_crossentropy(y_true, y_pred)
    
    # ATMOSPHERIC COMBAT PENALTIES
    # AGGRESSIVE penalty for missing atmospheric signatures (high recall)
    fn_penalty = tf.where(tf.equal(y_true, 1), 
                         tf.square(1 - y_pred) * 5.0,  # WARRIOR-LEVEL FN penalty
                         tf.zeros_like(y_pred))
    
    # TACTICAL penalty for atmospheric false alarms
    fp_penalty = tf.where(tf.equal(y_true, 0), 
                         tf.square(y_pred) * 2.5,  # Higher FP penalty than Oracle
                         tf.zeros_like(y_pred))
    
    # ATMOSPHERIC CERTAINTY requirement
    confidence = tf.abs(y_pred - 0.5) * 2.0
    uncertainty_penalty = tf.reduce_mean(tf.square(1 - confidence)) * 0.4
    
    # Increase the reward for decisive atmospheric detections
    decisive_bonus = tf.where(
        tf.logical_and(tf.equal(tf.round(y_pred), y_true), confidence > 0.8),
        -confidence * 0.2,  # Higher bonus for very confident correct predictions
        tf.zeros_like(y_pred)
    )
    
    # ATMOSPHERIC STABILITY penalty (penalize middle-ground predictions)
    stability_penalty = tf.reduce_mean(tf.square(y_pred - tf.round(y_pred))) * 0.3
    
    total_loss = (bce + 
                 tf.reduce_mean(fn_penalty) + 
                 tf.reduce_mean(fp_penalty) + 
                 uncertainty_penalty + 
                 tf.reduce_mean(decisive_bonus) +
                 stability_penalty)
    
    return total_loss

def atmospheric_warrior_nasa_metric(y_true, y_pred):
    """NASA atmospheric detection metric with warrior aggression"""
    y_true = tf.cast(y_true, tf.float32)
    y_pred_binary = tf.cast(y_pred > 0.45, tf.float32)  # More aggressive threshold
    
    # Calculate warrior recall (must catch atmospheric signatures)
    tp = tf.reduce_sum(y_true * y_pred_binary)
    fn = tf.reduce_sum(y_true * (1 - y_pred_binary))
    recall = tp / (tp + fn + tf.keras.backend.epsilon())
    
    # Calculate precision with atmospheric focus
    fp = tf.reduce_sum((1 - y_true) * y_pred_binary)
    precision = tp / (tp + fp + tf.keras.backend.epsilon())
    
    # Warrior F1 with recall emphasis
    f1_warrior = (3 * precision * recall) / (2 * precision + recall + tf.keras.backend.epsilon())
    
    return f1_warrior

def create_atmospheric_warrior_nasa_architecture():
    """
    ⚔️🌡️ Build NASA-native ATMOSPHERIC WARRIOR architecture
    Optimized for atmospheric analysis from NASA catalog data
    """
    input_layer = Input(shape=(8,), name='nasa_atmospheric_input')
    
    # ATMOSPHERIC COMBAT LAYERS
    x = Dense(320, kernel_regularizer=l1_l2(l1=0.0001, l2=0.0005), name='atmospheric_combat_1')(input_layer)
    x = LeakyReLU(alpha=0.1, name='warrior_activation_1')(x)
    x = BatchNormalization(name='atmospheric_norm_1')(x)
    x = Dropout(0.3, name='atmospheric_dropout_1')(x)
    
    # TEMPERATURE & MASS ANALYSIS
    x = Dense(160, kernel_regularizer=l1_l2(l1=0.0001, l2=0.0005), name='temperature_analysis')(x)
    x = LeakyReLU(alpha=0.1, name='warrior_activation_2')(x)
    x = BatchNormalization(name='atmospheric_norm_2')(x)
    x = Dropout(0.25, name='temperature_dropout')(x)
    
    # STELLAR INFLUENCE LAYERS
    x = Dense(80, kernel_regularizer=l1_l2(l1=0.0001, l2=0.0005), name='stellar_influence')(x)
    x = LeakyReLU(alpha=0.1, name='warrior_activation_3')(x)
    x = BatchNormalization(name='atmospheric_norm_3')(x)
    x = Dropout(0.2, name='stellar_dropout')(x)
    
    # ATMOSPHERIC SIGNATURE DETECTION
    x = Dense(40, kernel_regularizer=l2(0.0005), name='signature_detection_1')(x)
    x = LeakyReLU(alpha=0.1, name='warrior_activation_4')(x)
    x = BatchNormalization(name='atmospheric_norm_4')(x)
    x = Dropout(0.15, name='signature_dropout')(x)
    
    x = Dense(20, kernel_regularizer=l2(0.0005), name='signature_detection_2')(x)
    x = LeakyReLU(alpha=0.1, name='warrior_activation_5')(x)
    
    # Final output layer
    output = Dense(1, activation='sigmoid', name='atmospheric_warrior_verdict')(x)
    
    model = Model(inputs=input_layer, outputs=output, name='ATMOSPHERIC_WARRIOR_NASA_AI')
    
    # Aggressive optimizer for atmospheric combat
    optimizer = Adam(learning_rate=0.0015, beta_1=0.9, beta_2=0.999, epsilon=1e-8)
    
    model.compile(
        optimizer=optimizer,
        loss=atmospheric_warrior_nasa_loss,
        metrics=[atmospheric_warrior_nasa_metric, 'accuracy', 'precision', 'recall']
    )
    
    return model

def train_atmospheric_warrior_nasa():
    """Train the NASA-native ATMOSPHERIC WARRIOR AI"""
    
    print("🔥⚔️" + "="*80 + "⚔️🔥")
    print("🌡️ ATMOSPHERIC WARRIOR AI - NASA NATIVE VERSION")
    print("🌡️ ATMOSPHERIC ANALYSIS SPECIALIST FOR NASA DATA")
    print("🌡️ MISSION: DETECT EXOPLANET ATMOSPHERIC SIGNATURES")
    print("🔥⚔️" + "="*80 + "⚔️🔥")
    
    # Generate NASA catalog training data
    generator = NASACatalogDataGenerator()
    X, y = generator.generate_training_data(180000, positive_fraction=0.62)  # 62% confirmed exoplanets
    
    print(f"🌡️📊 ATMOSPHERIC WARRIOR NASA DATASET:")
    print(f"   Total samples: {len(X)}")
    print(f"   Atmospheric targets: {np.sum(y)} ({np.mean(y)*100:.1f}%)")
    print(f"   False atmospheres: {len(y) - np.sum(y)} ({(1-np.mean(y))*100:.1f}%)")
    
    # Split with stratification
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    # Atmospheric-grade standardization
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    
    print("🌡️⚔️ ASSEMBLING ATMOSPHERIC WARRIOR ARCHITECTURE...")
    model = create_atmospheric_warrior_nasa_architecture()
    print(f"🌡️⚙️ Warrior Arsenal: {model.count_params():,} parameters")
    
    # Atmospheric combat callbacks
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=18, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor='val_loss', factor=0.3, patience=8, min_lr=1e-7, verbose=1),
        ModelCheckpoint('ATMOSPHERIC_WARRIOR_NASA_checkpoint.h5', 
                       monitor='val_atmospheric_warrior_nasa_metric', 
                       save_best_only=True, verbose=1, mode='max')
    ]
    
    print("🌡️⚔️ ATMOSPHERIC WARRIOR ENTERING COMBAT...")
    
    history = model.fit(
        X_train_scaled, y_train,
        validation_data=(X_val_scaled, y_val),
        epochs=100,
        batch_size=256,
        callbacks=callbacks,
        verbose=1,
        class_weight={0: 1.0, 1: 1.3}  # More aggressive bias toward atmospheric detection
    )
    
    # ATMOSPHERIC COMBAT EVALUATION
    print("\\n🌡️📊 ATMOSPHERIC WARRIOR NASA COMBAT RESULTS:")
    
    val_loss, val_metric, val_acc, val_prec, val_rec = model.evaluate(X_val_scaled, y_val, verbose=0)
    y_pred = model.predict(X_val_scaled, verbose=0)
    y_pred_binary = (y_pred > 0.45).astype(int).flatten()  # Warrior threshold
    
    accuracy = accuracy_score(y_val, y_pred_binary)
    precision = precision_score(y_val, y_pred_binary)
    recall = recall_score(y_val, y_pred_binary)
    f1 = f1_score(y_val, y_pred_binary)
    
    print(f"⚔️ ATMOSPHERIC COMBAT PERFORMANCE:")
    print(f"   Accuracy:  {accuracy:.3f} ({accuracy*100:.1f}%)")
    print(f"   Precision: {precision:.3f} ({precision*100:.1f}%)")
    print(f"   Recall:    {recall:.3f} ({recall*100:.1f}%)")
    print(f"   F1 Score:  {f1:.3f}")
    print(f"   Warrior Aggression: {100-45}% threshold bias")
    
    # Save the atmospheric warrior and scaler
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    model_path = f"ATMOSPHERIC_WARRIOR_NASA_{timestamp}.h5"
    scaler_path = f"ATMOSPHERIC_WARRIOR_NASA_SCALER_{timestamp}.pkl"
    
    model.save(model_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"💾 Saved NASA-native Atmospheric Warrior: {model_path}")
    print(f"💾 Saved scaler: {scaler_path}")
    
    # Atmospheric warrior targets check
    if accuracy >= 0.88 and precision >= 0.87 and recall >= 0.92:
        print("🎉 VICTORY! ATMOSPHERIC WARRIOR READY FOR NASA COMBAT!")
        print("🏆 Atmospheric signatures will not escape detection!")
    else:
        print("⚡ Warrior needs more training. Battle recommendations:")
        print("   - Increase atmospheric data diversity")
        print("   - Adjust warrior aggression parameters")
        print("   - Enhance atmospheric feature extraction")
    
    return model, scaler, history

if __name__ == "__main__":
    # Train the NASA-native Atmospheric Warrior
    model, scaler, history = train_atmospheric_warrior_nasa()
    
    print("\\n🌡️⚔️ ATMOSPHERIC WARRIOR NASA TRAINING COMPLETE!")
    print("🔥 Ready to battle for atmospheric exoplanet detection!")
