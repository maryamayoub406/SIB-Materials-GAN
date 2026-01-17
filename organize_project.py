# Project Organization Script
# Run this to create a clean professional structure

import os
import shutil

def organize_project():
    """Organize SIB-FYP project into professional structure"""
    
    base_dir = r'c:\Users\Abdul Manan\Desktop\SIB-FYP'
    
    print("="*70)
    print("PROFESSIONAL PROJECT ORGANIZATION")
    print("="*70)
    
    # Create folder structure
    folders = {
        'Code': 'Main notebook and code files',
        'Models': 'Trained ML models',
        'Data/Training_Data': 'Original training datasets',
        'Data/Generated_Materials': 'GAN-generated materials',
        'Data/Top_Candidates': 'Filtered top candidates',
        'Results/Visualizations': 'All figures and plots',
        'Results/Reports': 'Evaluation reports',
        'Utils': 'Utility scripts and mappings',
        'Documentation': 'Project documentation'
    }
    
    print("\n📁 Creating folder structure...\n")
    for folder, description in folders.items():
        folder_path = os.path.join(base_dir, folder)
        os.makedirs(folder_path, exist_ok=True)
        print(f"  ✓ {folder:30s} - {description}")
    
    # File organization mapping
    file_organization = {
        # Code
        'Code/': [
            'Model_Training_SIB.ipynb'
        ],
        
        # Models (trained ML models)
        'Models/': [
            'gan_model_checkpoint.pth',
            'model_bandgap.pkl',
            'model_density.pkl',
            'model_stability.pkl'
        ],
        
        # Data - Training
        'Data/Training_Data/': [
            'sodium_cathode_materials.pkl',
            'composition_matrix.npy',
            'composition_matrix_enhanced.npy'
        ],
        
        # Data - Generated Materials
        'Data/Generated_Materials/': [
            'generated_materials.csv',
            'generated_materials.pkl',
            'generated_materials_with_predictions.csv',
            'generated_formulas.pkl',
            'generated_vectors.npy'
        ],
        
        # Data - Top Candidates
        'Data/Top_Candidates/': [
            'top_candidates.csv',
            'TOP_50_CANDIDATES.xlsx'
        ],
        
        # Results - Visualizations
        'Results/Visualizations/': [
            '01_Model_Performance_Dashboard.png',
            '02_Property_Distributions.png',
            '03_Element_Frequency_Analysis.png',
            '04_Top_Candidates_Analysis.png',
            '05_Project_Summary_Infographic.png',
            '06_Methodology_Workflow.png',
            'training_progress.png'
        ],
        
        # Results - Reports
        'Results/Reports/': [
            'COMPREHENSIVE_MODEL_EVALUATION.txt',
            'DIVERSITY_ANALYSIS_REPORT.txt'
        ],
        
        # Utils
        'Utils/': [
            'element_mappings.json',
            'Phase5_DFT_Preparation.py'
        ],
        
        # Documentation
        'Documentation/': [
            'IMPROVEMENTS_TO_ADD.md'
        ]
    }
    
    print("\n📦 Moving files to appropriate directories...\n")
    
    moved = 0
    skipped = 0
    
    for destination, files in file_organization.items():
        for filename in files:
            src = os.path.join(base_dir, filename)
            dest_dir = os.path.join(base_dir, destination)
            dest = os.path.join(dest_dir, filename)
            
            if os.path.exists(src):
                try:
                    # Check if file already exists in destination
                    if os.path.exists(dest):
                        print(f"  → {filename:45s} already in {destination}")
                        skipped += 1
                    else:
                        shutil.move(src, dest)
                        print(f"  ✓ {filename:45s} → {destination}")
                        moved += 1
                except Exception as e:
                    print(f"  ⚠️ Error moving {filename}: {e}")
            else:
                # File not found - might already be organized
                if os.path.exists(dest):
                    print(f"  ✓ {filename:45s} already in {destination}")
                    skipped += 1
                else:
                    print(f"  ⚠️ Not found: {filename}")
    
    print("\n" + "="*70)
    print(f"✅ Organization complete!")
    print(f"   Files moved: {moved}")
    print(f"   Files already organized: {skipped}")
    print("="*70)
    
    # Check for remaining files in root
    print("\n🔍 Checking for remaining files in root directory...\n")
    
    root_files = []
    for item in os.listdir(base_dir):
        item_path = os.path.join(base_dir, item)
        if os.path.isfile(item_path):
            # Exclude README.md and this script
            if item not in ['README.md', 'organize_project.py', '.gitignore']:
                root_files.append(item)
    
    if root_files:
        print("  Files remaining in root directory (may be unnecessary):")
        for f in root_files:
            print(f"    • {f}")
        print("\n  Recommendation: Review these files and delete if not needed")
    else:
        print("  ✓ No unnecessary files in root directory")
    
    print("\n" + "="*70)
    print("📂 FINAL PROJECT STRUCTURE")
    print("="*70)
    print("""
SIB-FYP/
├── Code/                       (Main code)
├── Models/                     (Trained models - 4 files)
├── Data/
│   ├── Training_Data/          (Original data - 3 files)
│   ├── Generated_Materials/    (GAN outputs - 5 files)
│   └── Top_Candidates/         (Filtered results - 2 files)
├── Results/
│   ├── Visualizations/         (Figures - 7 files)
│   └── Reports/                (Text reports - 2 files)
├── Utils/                      (Utilities - 2 files)
├── Documentation/              (Guides - 1+ files)
└── README.md                   (Project overview)
    """)
    
    print("="*70)
    print("✅ PROJECT READY FOR:")
    print("   • Thesis submission")
    print("   • Final year defense")
    print("   • Portfolio showcase")
    print("   • GitHub upload")
    print("="*70)

if __name__ == "__main__":
    organize_project()
