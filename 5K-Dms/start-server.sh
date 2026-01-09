#!/bin/bash

echo "Starting 5K Dormitory Management System..."
echo ""
echo "Make sure you have:"
echo "1. MySQL database running"
echo "2. Database '5kdms_db' created"
echo "3. .env file configured in backend folder"
echo ""

cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "Starting server..."
echo "Server will be available at http://localhost:3000"
echo ""

npm start

