#!/usr/bin/env python3
"""
👑🌟 SUPREME CALIBRATED ENSEMBLE - NASA NATIVE VERSION 🌟👑
Meta-optimizer for NASA-native Council of Lords ensemble
ORCHESTRATES THE COUNCIL'S COLLECTIVE WISDOM ON REAL NASA DATA

Features: [5 specialist predictions + 8 NASA catalog features = 13 total]
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization, Input, Concatenate
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.regularizers import l2
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.ensemble import VotingClassifier
import warnings
import joblib
from datetime import datetime
import sys
import os

# Add the parent directory to Python path to import the data generator
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from nasa_catalog_data_generator import NASACatalogDataGenerator

warnings.filterwarnings('ignore')

def supreme_ensemble_nasa_loss(y_true, y_pred):
    """
    👑🌟 SUPREME ENSEMBLE NASA LOSS FUNCTION 🌟👑
    Meta-optimization loss for orchestrating NASA-native specialist predictions
    """
    # Base binary crossentropy
    bce = tf.keras.losses.binary_crossentropy(y_true, y_pred)
    
    # Classification penalties
    # CRITICAL penalty for missing confirmed exoplanets
    fn_penalty = tf.where(tf.equal(y_true, 1), 
                         tf.square(1 - y_pred) * 5.5,  # Supreme FN penalty
                         tf.zeros_like(y_pred))
    
    # CALIBRATED penalty for false confirmations
    fp_penalty = tf.where(tf.equal(y_true, 0), 
                         tf.square(y_pred) * 2.8,  # Balanced FP penalty
                         tf.zeros_like(y_pred))
    
    # Confidence requirement
    confidence = tf.abs(y_pred - 0.5) * 2.0
    uncertainty_penalty = tf.reduce_mean(tf.square(1 - confidence)) * 0.35
    
    # ENSEMBLE HARMONY BONUS
    harmony_bonus = tf.where(
        tf.logical_and(tf.equal(tf.round(y_pred), y_true), confidence > 0.7),
        -confidence * 0.22,  # Supreme bonus for confident correct predictions
        tf.zeros_like(y_pred)
    )
    
    # META-OPTIMIZATION STABILITY
    stability_penalty = tf.reduce_mean(tf.abs(y_pred - tf.reduce_mean(y_pred))) * 0.12
    
    total_loss = (bce + 
                 tf.reduce_mean(fn_penalty) + 
                 tf.reduce_mean(fp_penalty) + 
                 uncertainty_penalty + 
                 tf.reduce_mean(harmony_bonus) +
                 stability_penalty)
    
    return total_loss

def supreme_ensemble_nasa_metric(y_true, y_pred):
    """NASA supreme ensemble metric with meta-optimization focus"""
    y_true = tf.cast(y_true, tf.float32)
    y_pred_binary = tf.cast(y_pred > 0.5, tf.float32)  # Supreme threshold
    
    # Calculate supreme recall
    tp = tf.reduce_sum(y_true * y_pred_binary)
    fn = tf.reduce_sum(y_true * (1 - y_pred_binary))
    recall = tp / (tp + fn + tf.keras.backend.epsilon())
    
    # Calculate supreme precision
    fp = tf.reduce_sum((1 - y_true) * y_pred_binary)
    precision = tp / (tp + fp + tf.keras.backend.epsilon())
    
    # Supreme F1 with ensemble harmony
    f1_supreme = 2 * (precision * recall) / (precision + recall + tf.keras.backend.epsilon())
    
    return f1_supreme

def create_supreme_ensemble_nasa_architecture():
    """
    👑🌟 Build NASA-native SUPREME CALIBRATED ENSEMBLE architecture
    Meta-optimizer that learns to combine specialist predictions optimally
    """
    # Input for 5 specialist predictions + 8 NASA features = 13 total
    input_layer = Input(shape=(13,), name='supreme_nasa_input')
    
    # Meta-analysis layers
    x = Dense(128, activation='relu', kernel_regularizer=l2(0.0003), name='supreme_meta_1')(input_layer)
    x = BatchNormalization(name='supreme_norm_1')(x)
    x = Dropout(0.2, name='supreme_dropout_1')(x)
    
    # ENSEMBLE HARMONY LAYERS
    x = Dense(64, activation='relu', kernel_regularizer=l2(0.0003), name='ensemble_harmony_1')(x)
    x = BatchNormalization(name='supreme_norm_2')(x)
    x = Dropout(0.18, name='harmony_dropout_1')(x)
    
    x = Dense(32, activation='relu', kernel_regularizer=l2(0.0003), name='ensemble_harmony_2')(x)
    x = BatchNormalization(name='supreme_norm_3')(x)
    x = Dropout(0.15, name='harmony_dropout_2')(x)
    
    # Calibration layers
    x = Dense(16, activation='relu', kernel_regularizer=l2(0.0003), name='supreme_calibration')(x)
    x = BatchNormalization(name='supreme_norm_4')(x)
    x = Dropout(0.12, name='calibration_dropout')(x)
    
    # Final output layer
    output = Dense(1, activation='sigmoid', name='supreme_ensemble_verdict')(x)
    
    model = Model(inputs=input_layer, outputs=output, name='SUPREME_CALIBRATED_ENSEMBLE_NASA_AI')
    
    # Supreme optimizer
    optimizer = Adam(learning_rate=0.0008, beta_1=0.9, beta_2=0.999, epsilon=1e-8)
    
    model.compile(
        optimizer=optimizer,
        loss=supreme_ensemble_nasa_loss,
        metrics=[supreme_ensemble_nasa_metric, 'accuracy', 'precision', 'recall']
    )
    
    return model

def simulate_specialist_predictions(X, specialist_accuracy=0.85):
    """
    Simulate the 5 NASA-native specialist predictions for training the Supreme Ensemble
    In real deployment, these would come from the actual trained specialists
    """
    n_samples = len(X)
    
    # Simulate 5 specialist predictions with different characteristics
    specialist_preds = np.zeros((n_samples, 5))
    
    # Each specialist has slightly different decision boundaries based on NASA features
    for i in range(5):
        # Create specialist-specific feature combinations
        if i == 0:  # Celestial Oracle - focuses on orbital period and planet radius
            decision = 0.3 * X[:, 0] + 0.4 * X[:, 1] + 0.1 * X[:, 2] + 0.2 * np.random.normal(0, 0.1, n_samples)
        elif i == 1:  # Atmospheric Warrior - focuses on stellar temp and mass
            decision = 0.2 * X[:, 0] + 0.3 * X[:, 2] + 0.4 * X[:, 4] + 0.1 * np.random.normal(0, 0.1, n_samples)
        elif i == 2:  # Backyard Genius - balanced approach
            decision = 0.2 * X[:, 0] + 0.2 * X[:, 1] + 0.2 * X[:, 2] + 0.2 * X[:, 3] + 0.2 * np.random.normal(0, 0.1, n_samples)
        elif i == 3:  # Chaos Master - focuses on eccentricity and distance
            decision = 0.1 * X[:, 0] + 0.2 * X[:, 5] + 0.5 * X[:, 6] + 0.2 * np.random.normal(0, 0.15, n_samples)
        else:  # Cosmic Conductor - focuses on harmonic relationships
            decision = 0.3 * X[:, 0] + 0.2 * X[:, 7] + 0.3 * X[:, 4] + 0.2 * np.random.normal(0, 0.12, n_samples)
        
        # Apply sigmoid and add specialist-specific noise
        specialist_preds[:, i] = 1 / (1 + np.exp(-decision))
        
        # Add specialist-specific accuracy variation
        accuracy_noise = np.random.normal(0, 1 - specialist_accuracy, n_samples)
        specialist_preds[:, i] = np.clip(specialist_preds[:, i] + accuracy_noise, 0, 1)
    
    return specialist_preds

def train_supreme_ensemble_nasa():
    """Train the NASA-native SUPREME CALIBRATED ENSEMBLE AI"""
    
    print("👑🌟" + "="*80 + "🌟👑")
    print("👑 SUPREME CALIBRATED ENSEMBLE - NASA NATIVE VERSION")
    print("👑 META-OPTIMIZER FOR NASA-NATIVE COUNCIL OF LORDS")
    print("👑 MISSION: ORCHESTRATE SUPREME EXOPLANET DETECTION")
    print("👑🌟" + "="*80 + "🌟👑")
    
    # Generate NASA catalog training data
    generator = NASACatalogDataGenerator()
    X_nasa, y = generator.generate_training_data(250000, positive_fraction=0.63)  # 63% confirmed
    
    # Simulate specialist predictions (in real deployment, these come from trained specialists)
    print("👑🤖 SIMULATING NASA-NATIVE SPECIALIST PREDICTIONS...")
    specialist_preds = simulate_specialist_predictions(X_nasa, specialist_accuracy=0.88)
    
    # Combine specialist predictions with NASA features
    X_combined = np.hstack([specialist_preds, X_nasa])  # 5 + 8 = 13 features
    
    print(f"👑📊 SUPREME ENSEMBLE NASA DATASET:")
    print(f"   Total supreme samples: {len(X_combined)}")
    print(f"   Features: 5 specialists + 8 NASA = {X_combined.shape[1]}")
    print(f"   Supreme targets: {np.sum(y)} ({np.mean(y)*100:.1f}%)")
    print(f"   Supreme negatives: {len(y) - np.sum(y)} ({(1-np.mean(y))*100:.1f}%)")
    
    # Split with stratification
    X_train, X_val, y_train, y_val = train_test_split(X_combined, y, test_size=0.2, stratify=y, random_state=42)
    
    # Supreme standardization
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    
    print("👑🏗️ CONSTRUCTING SUPREME ENSEMBLE ARCHITECTURE...")
    model = create_supreme_ensemble_nasa_architecture()
    print(f"👑⚙️ Supreme Arsenal: {model.count_params():,} parameters")
    
    # Supreme training callbacks
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=25, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=12, min_lr=1e-7, verbose=1),
        ModelCheckpoint('SUPREME_CALIBRATED_ENSEMBLE_NASA_checkpoint.h5', 
                       monitor='val_supreme_ensemble_nasa_metric', 
                       save_best_only=True, verbose=1, mode='max')
    ]
    
    print("👑🌟 SUPREME ENSEMBLE BEGINNING META-OPTIMIZATION...")
    
    history = model.fit(
        X_train_scaled, y_train,
        validation_data=(X_val_scaled, y_val),
        epochs=150,
        batch_size=512,
        callbacks=callbacks,
        verbose=1,
        class_weight={0: 1.0, 1: 1.25}  # Supreme bias toward detection
    )
    
    # Evaluation
    print("\\n👑📊 SUPREME ENSEMBLE NASA PERFORMANCE:")
    
    val_loss, val_metric, val_acc, val_prec, val_rec = model.evaluate(X_val_scaled, y_val, verbose=0)
    y_pred = model.predict(X_val_scaled, verbose=0)
    y_pred_binary = (y_pred > 0.5).astype(int).flatten()
    
    accuracy = accuracy_score(y_val, y_pred_binary)
    precision = precision_score(y_val, y_pred_binary)
    recall = recall_score(y_val, y_pred_binary)
    f1 = f1_score(y_val, y_pred_binary)
    
    print(f"👑 SUPREME PERFORMANCE:")
    print(f"   Accuracy:  {accuracy:.3f} ({accuracy*100:.1f}%)")
    print(f"   Precision: {precision:.3f} ({precision*100:.1f}%)")
    print(f"   Recall:    {recall:.3f} ({recall*100:.1f}%)")
    print(f"   F1 Score:  {f1:.3f}")
    
    # Save the supreme ensemble and scaler
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    model_path = f"SUPREME_CALIBRATED_ENSEMBLE_NASA_{timestamp}.h5"
    scaler_path = f"SUPREME_CALIBRATED_ENSEMBLE_NASA_SCALER_{timestamp}.pkl"
    
    model.save(model_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"💾 Saved NASA-native Supreme Ensemble: {model_path}")
    print(f"💾 Saved scaler: {scaler_path}")
    
    # Supreme achievement check
    if accuracy >= 0.92 and precision >= 0.91 and recall >= 0.91:
        print("🎉 SUPREME SUCCESS! NASA-NATIVE COUNCIL OF LORDS READY!")
        print("🏆 Meta-optimization achieved supreme performance!")
    else:
        print("⚡ Supreme ensemble needs refinement. Recommendations:")
        print("   - Increase meta-optimization complexity")
        print("   - Enhance specialist diversity")
        print("   - Adjust supreme calibration parameters")
    
    return model, scaler, history

if __name__ == "__main__":
    # Train the NASA-native Supreme Calibrated Ensemble
    model, scaler, history = train_supreme_ensemble_nasa()
    
    print("\\n👑🌟 SUPREME CALIBRATED ENSEMBLE NASA TRAINING COMPLETE!")
    print("👑 Meta-optimizer ready to lead the NASA-native Council of Lords!")
