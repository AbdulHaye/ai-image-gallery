# AI Image Gallery - README

## 📋 Project Overview

The AI Image Gallery is a full-stack web application that allows users to upload images, get automatic AI-generated tags and descriptions, and search through their images using text or find similar images. The application features user authentication, image management, AI analysis, and advanced search capabilities.

## 🏗️ Architecture

- **Frontend**: React.js with Bootstrap for UI components
- **Backend**: Node.js with Express.js server
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth
- **File Storage**: Cloudinary (with Supabase Storage as alternative)
- **AI Services**: OpenAI GPT-4 Vision for image analysis
- **Image Processing**: Sharp for thumbnail generation
- **Debounce Search**: For search after minor delay/protect extra api calls

## 🚀 Features

- ✅ User authentication (Sign up/Sign in)
- ✅ Drag & drop image upload with progress indicators
- ✅ Automatic AI-generated tags and descriptions
- ✅ Thumbnail generation
- ✅ Text search by tags and descriptions
- ✅ Similar image search
- ✅ Color-based filtering
- ✅ Responsive design for mobile and desktop
- ✅ Protected routes and user-specific data access

## 🛠️ Prerequisites

Before running this application, make sure you have:

- Node.js (v14 or higher)
- npm or yarn package manager
- Accounts with the following services:
  - [Supabase](https://supabase.com/)
  - [Cloudinary](https://cloudinary.com/)
  - [OpenAI](https://openai.com/)

## 📁 Project Structure

## Backend Setup
```bash
cd backend
npm i
npm run dev
``` 

## Backend Setup
```bash
cd frontend
npm i
npm start
```
