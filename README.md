# SpecifyAI – AI Powered Requirement Analysis Platform

Built using DigitalOcean Gradient™ AI for intelligent requirement analysis.

SpecifyAI is a cloud-deployed web application that helps users convert project ideas into structured technical specifications using AI.

The system allows users to create projects, input requirements, and generate AI-assisted specifications to accelerate software planning.

---

## Live Demo

Application URL:

http://specifyai.159.89.165.42.nip.io

---

## Features

- User authentication (register/login)
- Project creation and management
- AI powered requirement analysis
- Automatic generation of structured specifications
- Dashboard interface for managing projects
- Cloud-deployed full stack application

---

## System Architecture

Frontend  
React + Vite

Backend  
Node.js + Express

Database  
MongoDB (DigitalOcean Managed Database)

Deployment  
DigitalOcean Droplet  
Nginx reverse proxy  
PM2 process manager  
GitHub CI/CD automatic deployment

---

## Technology Stack

Frontend
- React
- Vite
- Tailwind CSS

Backend
- Node.js
- Express.js

Database
- MongoDB

DevOps
- DigitalOcean Cloud Server
- Nginx
- PM2
- GitHub Actions (CI/CD)

---

## Deployment Architecture

User Browser  
↓  
Nginx Web Server  
↓  
Node.js Express API  
↓  
MongoDB Database  

The system is deployed on a cloud server and uses Nginx as a reverse proxy to route requests between the frontend and backend services.

---

## How It Works

1. User registers or logs into the platform
2. User creates a new project
3. User enters a project requirement or description
4. The AI engine processes the input
5. The system generates a structured specification

---

## Security & Reliability

- Helmet security headers
- Rate limiting for API protection
- Environment variable configuration
- Process management using PM2
- Cloud database hosting

---

## Repository Structure

SpecifyAI-project
│
├── specifyai-frontend # React application
├── specifyai-backend # Node.js API
└── README.md



---

## Future Improvements

- Domain name and HTTPS support
- Advanced AI requirement analysis
- Collaboration features for teams
- Export specifications to PDF or documentation formats

---

## Author

Khansa Ahmed

---

## Hackathon Submission

SpecifyAI demonstrates how AI can assist developers and teams in transforming ideas into structured software requirements using an accessible web platform deployed on cloud infrastructure.


## Updates After Hackathon Submission
- Improved UI/UX
