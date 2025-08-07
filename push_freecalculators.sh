#!/bin/bash
echo "🚀 Pushing FreeCalculators repo..."

cd ~/FreeCalculators || exit 1

git add .
git commit -m "✨ Update app.js with API fallback and cached data support"
git push

echo "✅ FreeCalculators pushed successfully."
