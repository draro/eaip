#!/bin/bash
# Script to fix all remaining TypeScript errors related to params
# Run this after committing current changes

echo "Fixing TypeScript params errors..."

# List of files that need params null check added
files=(
  "src/app/api/documents/[id]/route.ts"
  "src/app/api/documents/[id]/validate/route.ts"
  "src/app/api/documents/[id]/version/route.ts"
  "src/app/api/notam/[id]/route.ts"
  "src/app/api/organizations/[id]/route.ts"
  "src/app/api/organizations/[id]/branding/route.ts"
  "src/app/api/organizations/[id]/users/route.ts"
  "src/app/api/users/[id]/route.ts"
  "src/app/api/users/[id]/disable/route.ts"
  "src/app/api/users/[id]/enable/route.ts"
  "src/app/api/users/[id]/reset-password/route.ts"
  "src/app/api/users/[id]/resend-password/route.ts"
  "src/app/api/versions/[id]/route.ts"
  "src/app/api/workflows/[id]/route.ts"
  "src/app/api/workflow/[id]/route.ts"
  "src/app/api/workflow/[id]/approve/route.ts"
)

for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Skipping $file (not found)"
    continue
  fi

  # Check if file already has the null check
  if grep -q "if (!params?.id)" "$file"; then
    echo "✓ $file already fixed"
    continue
  fi

  echo "Fixing $file..."

  # Add null check after connectDB() or at the start of try block
  # This pattern looks for:  try {\n    await connectDB();\n\n    (anything accessing params.id)
  # And inserts the null check

  perl -i -pe 's/(try \{[^\n]*\n(?:    await connectDB\(\);[^\n]*\n)?[^\n]*\n)(    (?:const|let).*params\.id)/$1    if (!params?.id) {\n      return NextResponse.json(\n        { success: false, error: '\''Document ID is required'\'' },\n        { status: 400 }\n      );\n    }\n\n$2/g' "$file"

  # Also handle cases where params is used directly without await connectDB
  perl -i -pe 's/(async function \w+\([^)]*\) \{[^\n]*\n  try \{[^\n]*\n)(    (?:const|let).*params\.id)/$1    if (!params?.id) {\n      return NextResponse.json(\n        { success: false, error: '\''ID is required'\'' },\n        { status: 400 }\n      );\n    }\n\n$2/g' "$file"
done

echo ""
echo "Done! Now run: npm run build"
