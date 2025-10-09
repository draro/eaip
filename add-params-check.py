#!/usr/bin/env python3
import re
import sys

files_to_fix = [
    "src/app/api/documents/[id]/validate/route.ts",
    "src/app/api/documents/[id]/version/route.ts",
    "src/app/api/notam/[id]/route.ts",
    "src/app/api/organizations/[id]/route.ts",
    "src/app/api/organizations/[id]/branding/route.ts",
    "src/app/api/organizations/[id]/users/route.ts",
    "src/app/api/users/[id]/route.ts",
    "src/app/api/users/[id]/disable/route.ts",
    "src/app/api/users/[id]/enable/route.ts",
    "src/app/api/users/[id]/reset-password/route.ts",
    "src/app/api/users/[id]/resend-password/route.ts",
    "src/app/api/versions/[id]/route.ts",
    "src/app/api/workflows/[id]/route.ts",
    "src/app/api/workflow/[id]/route.ts",
    "src/app/api/workflow/[id]/approve/route.ts",
]

null_check = """
    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
"""

for filepath in files_to_fix:
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        # Check if already has the null check
        if "if (!params?.id)" in content:
            print(f"✓ {filepath} already fixed")
            continue

        # Pattern: function declaration + try block + connectDB
        # We want to insert after connectDB() or at start of try if no connectDB
        pattern = r"(  try \{\n    await connectDB\(\);\n\n)(    (?:const|let|if|for|return|await|}\s*else))"

        if re.search(pattern, content):
            content = re.sub(pattern, r"\1" + null_check + r"\2", content)
            print(f"✓ Fixed {filepath}")
        else:
            # Try alternative pattern without connectDB
            pattern2 = r"(  try \{\n)(    (?:const|let|if|for|return|await).*params\.id)"
            if re.search(pattern2, content):
                content = re.sub(pattern2, r"\1" + null_check + r"\n\2", content)
                print(f"✓ Fixed {filepath} (alt pattern)")
            else:
                print(f"⚠ Could not find insertion point in {filepath}")
                continue

        with open(filepath, 'w') as f:
            f.write(content)
    except FileNotFoundError:
        print(f"✗ File not found: {filepath}")
    except Exception as e:
        print(f"✗ Error processing {filepath}: {e}")

print("\nDone! Run: npm run build")
