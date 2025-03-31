#!/usr/bin/env python3
"""
2D-to-3D Image Conversion for AR Menu
This script converts 2D food images to simple 3D GLTF models
for use in the AR Menu project.
"""

import os
import sys
import numpy as np
import cv2
from pygltflib import GLTF2, Scene, Node, Mesh, Primitive, Buffer, BufferView, Accessor, Material
from pygltflib import AccessorType, ComponentType, BufferTarget
import base64
from PIL import Image

def process_image(input_path, output_path, height=0.2):
    """
    Process a 2D image to create a simple 3D model:
    1. Remove background
    2. Create a 3D extrusion
    3. Save as GLTF file
    
    Args:
        input_path: Path to input image
        output_path: Path to output GLTF file
        height: Height of 3D extrusion (default: 0.2)
    """
    print(f"Processing {input_path}...")
    
    # Load the image
    img = cv2.imread(input_path)
    if img is None:
        print(f"Error: Could not load image {input_path}")
        return False
    
    # Resize if too large
    max_dim = 512
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))
        h, w = img.shape[:2]
    
    # Convert to RGBA (with transparency)
    img_rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    
    # Remove background (simple threshold-based method)
    # For real-world usage, consider using more advanced segmentation
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
    
    # Apply mask
    mask_rgba = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGRA)
    img_rgba[:, :, 3] = mask_rgba[:, :, 3]
    
    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Keep only largest contour
    if contours:
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Create a mesh from the contour
        vertices = []
        indices = []
        
        # Add front face vertices (z=0)
        for point in largest_contour.reshape(-1, 2):
            x, y = point
            # Normalize to -0.5 to 0.5 range
            x_norm = (x / w) - 0.5
            y_norm = 0.5 - (y / h)  # Flip Y
            vertices.extend([x_norm, y_norm, 0, 1, 1, 1, 1])  # XYZ + RGBA
        
        # Add back face vertices (z=-height)
        for point in largest_contour.reshape(-1, 2):
            x, y = point
            x_norm = (x / w) - 0.5
            y_norm = 0.5 - (y / h)
            vertices.extend([x_norm, y_norm, -height, 1, 1, 1, 1])
        
        # Create triangulation for front and back faces
        # This is a simplified approach - for complex shapes, consider proper triangulation
        front_start = 0
        back_start = len(largest_contour)
        
        # Create simple triangle fan for front face
        for i in range(1, len(largest_contour) - 1):
            indices.extend([front_start, front_start + i, front_start + i + 1])
        
        # Create simple triangle fan for back face (reverse winding)
        for i in range(1, len(largest_contour) - 1):
            indices.extend([back_start, back_start + i + 1, back_start + i])
        
        # Create side faces (connecting front and back)
        for i in range(len(largest_contour)):
            next_i = (i + 1) % len(largest_contour)
            
            # First triangle
            indices.extend([
                front_start + i,
                front_start + next_i,
                back_start + i
            ])
            
            # Second triangle
            indices.extend([
                front_start + next_i,
                back_start + next_i,
                back_start + i
            ])
        
        # Create a GLTF model
        create_gltf(vertices, indices, img_rgba, output_path)
        
        print(f"Successfully created 3D model: {output_path}")
        return True
    else:
        print("No contours found in the image")
        return False

def create_gltf(vertices, indices, texture_img, output_path):
    """
    Create a GLTF file from vertices, indices and texture
    
    Args:
        vertices: List of vertex data (position + color)
        indices: List of triangle indices
        texture_img: Texture image (RGBA)
        output_path: Path to save the GLTF file
    """
    # Convert lists to numpy arrays
    vertices_np = np.array(vertices, dtype=np.float32)
    indices_np = np.array(indices, dtype=np.uint16)
    
    # Create buffer for vertex and index data
    vertex_buffer = vertices_np.tobytes()
    index_buffer = indices_np.tobytes()
    
    # Encode texture
    _, png_data = cv2.imencode('.png', texture_img)
    texture_buffer = png_data.tobytes()
    texture_base64 = base64.b64encode(texture_buffer).decode('ascii')
    
    # Create a new GLTF object
    gltf = GLTF2()
    
    # Add a scene
    gltf.scenes.append(Scene(nodes=[0]))
    gltf.scene = 0
    
    # Add a node
    gltf.nodes.append(Node(mesh=0))
    
    # Add a mesh with one primitive
    gltf.meshes.append(Mesh(primitives=[
        Primitive(
            attributes={
                "POSITION": 0,
                "COLOR_0": 1
            },
            indices=2,
            material=0
        )
    ]))
    
    # Add material with basic settings
    gltf.materials.append(Material(
        pbrMetallicRoughness={
            "baseColorFactor": [1.0, 1.0, 1.0, 1.0],
            "metallicFactor": 0.0,
            "roughnessFactor": 1.0
        },
        name="FoodMaterial"
    ))
    
    # Create buffer views
    # Vertex data buffer view
    gltf.bufferViews.append(BufferView(
        buffer=0,
        byteOffset=0,
        byteLength=len(vertex_buffer),
        target=BufferTarget.ARRAY_BUFFER.value
    ))
    
    # Index data buffer view
    gltf.bufferViews.append(BufferView(
        buffer=0,
        byteOffset=len(vertex_buffer),
        byteLength=len(index_buffer),
        target=BufferTarget.ELEMENT_ARRAY_BUFFER.value
    ))
    
    # Add accessors
    # Position accessor
    gltf.accessors.append(Accessor(
        bufferView=0,
        byteOffset=0,
        componentType=ComponentType.FLOAT.value,
        count=len(vertices_np) // 7,
        type=AccessorType.VEC3.value,
        max=[np.max(vertices_np[::7]), np.max(vertices_np[1::7]), np.max(vertices_np[2::7])],
        min=[np.min(vertices_np[::7]), np.min(vertices_np[1::7]), np.min(vertices_np[2::7])]
    ))
    
    # Color accessor
    gltf.accessors.append(Accessor(
        bufferView=0,
        byteOffset=12,  # 3 floats (12 bytes) after position
        componentType=ComponentType.FLOAT.value,
        count=len(vertices_np) // 7,
        type=AccessorType.VEC4.value
    ))
    
    # Index accessor
    gltf.accessors.append(Accessor(
        bufferView=1,
        byteOffset=0,
        componentType=ComponentType.UNSIGNED_SHORT.value,
        count=len(indices_np),
        type=AccessorType.SCALAR.value
    ))
    
    # Add buffer
    combined_buffer = vertex_buffer + index_buffer
    gltf.buffers.append(Buffer(
        byteLength=len(combined_buffer),
        uri=f"data:application/octet-stream;base64,{base64.b64encode(combined_buffer).decode('ascii')}"
    ))
    
    # Save the model
    gltf.save(output_path)

def batch_process(input_folder, output_folder, height=0.2):
    """
    Process all images in a folder
    
    Args:
        input_folder: Folder with input images
        output_folder: Folder for output GLTF files
        height: Height of 3D extrusion (default: 0.2)
    """
    # Create output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)
    
    # Get all jpg and png files
    image_files = [f for f in os.listdir(input_folder) 
                 if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    if not image_files:
        print(f"No image files found in {input_folder}")
        return
    
    print(f"Found {len(image_files)} images to process")
    
    success_count = 0
    for img_file in image_files:
        input_path = os.path.join(input_folder, img_file)
        output_filename = os.path.splitext(img_file)[0] + '.gltf'
        output_path = os.path.join(output_folder, output_filename)
        
        if process_image(input_path, output_path, height):
            success_count += 1
    
    print(f"Successfully processed {success_count} out of {len(image_files)} images")

def main():
    """Main function to process command line arguments"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Convert 2D food images to 3D GLTF models')
    parser.add_argument('--input', '-i', required=True, help='Input image file or folder')
    parser.add_argument('--output', '-o', required=True, help='Output GLTF file or folder')
    parser.add_argument('--height', '-z', type=float, default=0.2, help='Height of 3D extrusion (default: 0.2)')
    parser.add_argument('--batch', '-b', action='store_true', help='Process all images in input folder')
    
    args = parser.parse_args()
    
    if args.batch:
        batch_process(args.input, args.output, args.height)
    else:
        process_image(args.input, args.output, args.height)

if __name__ == '__main__':
    main()