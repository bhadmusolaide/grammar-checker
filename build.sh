#!/bin/bash

cd grammar-checker
npm install --force
npm run build --no-lint

echo "Build completed successfully!"