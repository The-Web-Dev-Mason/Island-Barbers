#!/bin/bash

# Find all HTML files except index.html
files=$(find . -name "*.html" -not -path "./index.html")

for file in $files; do
    echo "Updating $file..."
    
    # Simple replacements
    perl -i -pe 's/75 Westferry Rd/22 Westferry Rd/g' "$file"
    perl -i -pe 's/E14 8LH/E14 8LW/g' "$file"
    perl -i -pe 's/<p>Isle of Dogs<\/p>/<p>Windmill House<\/p>/g' "$file"
    perl -i -pe 's/47 Upper North St/47a Upper North St/g' "$file"
    perl -i -pe 's/info\@islandbarbers\.net/info\@islandbarbers.com/g' "$file"
    perl -i -pe 's/07956 123 456/07956 525191/g' "$file"
    perl -i -pe 's/Under 11/Under 12/g' "$file"
    perl -i -pe 's/Copyright &copy; 2023/Copyright &copy; 2025/g' "$file"
    
    # Multiline replacement for Dagenham using -0777 to read whole file
    perl -i -0777 -pe 's/<h4 style="color: #fff; font-size: 1rem; margin-top: 15px;">Dagenham<\/h4>\s*<p>RM9 6FQ<\/p>/<h4 style="color: #fff; font-size: 1rem; margin-top: 15px;">Dagenham<\/h4>\n                    <p>Unit 7<\/p>\n                    <p>Batts House<\/p>\n                    <p>Merrielands Cres<\/p>\n                    <p>Dagenham<\/p>\n                    <p>RM9 6FQ<\/p>/gs' "$file"
done

echo "Update complete."
