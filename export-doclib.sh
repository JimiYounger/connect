#!/usr/bin/env bash

FEATURE_DIR="src/features/documentLibrary"
OUTPUT="documentLibrary_combined.md"

# 1) Start fresh
echo "# 📚 documentLibrary Feature — Combined" > "$OUTPUT"
echo "" >> "$OUTPUT"

# 2) Optional: include a mini‐TOC of filenames
echo "## File Structure" >> "$OUTPUT"
find "$FEATURE_DIR" -type f | sed "s|$FEATURE_DIR/| - |" | sort >> "$OUTPUT"
echo "" >> "$OUTPUT"

# 3) Loop through every file in documentLibrary
find "$FEATURE_DIR" -type f | sort | while read -r file; do
  echo -e "\n\n---\n### File: \`$file\`\n---\n" >> "$OUTPUT"
  cat "$file" >> "$OUTPUT"
done

echo "✅ All documentLibrary files consolidated into $OUTPUT"
