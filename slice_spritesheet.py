from PIL import Image
import os

# Configuration
input_file = "src/assets/Asteroid 01 - Explode.png"
output_dir = "src/assets/asteroid_frames"
frame_width = 96
frame_height = 96  # Updated to match actual height
num_frames = 6     # Updated to match actual number of frames in the image

def slice_spritesheet():
    print(f"Slicing spritesheet: {input_file}")
    
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")
    
    # Open the sprite sheet
    try:
        sprite_sheet = Image.open(input_file)
        print(f"Sprite sheet dimensions: {sprite_sheet.width}x{sprite_sheet.height}")
        
        # Calculate frames per row
        frames_per_row = sprite_sheet.width // frame_width
        print(f"Frames per row: {frames_per_row}")
        
        # Extract each frame
        for i in range(num_frames):
            left = (i % frames_per_row) * frame_width
            top = (i // frames_per_row) * frame_height
            right = left + frame_width
            bottom = top + frame_height
            
            print(f"Extracting frame {i} from position ({left},{top})")
            
            # Crop the frame
            frame = sprite_sheet.crop((left, top, right, bottom))
            
            # Save the frame
            output_file = os.path.join(output_dir, f"asteroid_frame_{i}.png")
            frame.save(output_file)
            print(f"Saved frame {i} to {output_file}")
            
            # For animation purposes, save the last frame as frame_6 as well
            if i == num_frames - 1:
                # Save a copy of the last frame as frame_6
                output_file = os.path.join(output_dir, f"asteroid_frame_6.png")
                frame.save(output_file)
                print(f"Saved duplicate of last frame as {output_file}")
        
        print("Finished slicing sprite sheet.")
    except Exception as e:
        print(f"Error slicing sprite sheet: {e}")

if __name__ == "__main__":
    slice_spritesheet() 