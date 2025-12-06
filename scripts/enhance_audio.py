import sys
import numpy as np
import soundfile as sf
import noisereduce as nr

def main():
    if len(sys.argv) != 3:
        print("Usage: python enhance_audio.py <input_file> <output_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    print("Starting audio enhancement...")
    
    # Load audio file
    print("Loading audio file...")
    audio, sr = sf.read(input_file)
    
    print(f"   Sample rate: {sr} Hz")
    print(f"   Duration: {len(audio) / sr:.2f} seconds")
    
    # Handle stereo to mono conversion
    if len(audio.shape) > 1:
        print(f"   Channels: {audio.shape[1]} (converting to mono)")
        audio = np.mean(audio, axis=1)
    else:
        print("   Channels: 1 (mono)")
    
    # Reduce noise with moderate settings
    print("Reducing noise...")
    reduced_noise = nr.reduce_noise(
        y=audio, 
        sr=sr,
        stationary=True,
    prop_decrease=0.5,        # Light reduction (less aggressive)
    freq_mask_smooth_hz=1000, # Even smoother frequency
    time_mask_smooth_ms=100   # Even smoother time
    )
    print("Noise reduced")
    
    # Normalize audio
    print("Normalizing volume...")
    max_val = np.max(np.abs(reduced_noise))
    if max_val > 0:
        normalized_audio = reduced_noise / max_val * 0.95
    else:
        normalized_audio = reduced_noise
    print("Volume normalized")
    
    # Save enhanced audio
    print(f"Saving to {output_file}...")
    sf.write(output_file, normalized_audio, sr)
    
    print("File saved successfully")
    print("Enhancement complete!")

if __name__ == "__main__":
    main()