# Employee Assessment System

A web application for defining and evaluating annual goals for company employees. This system enables managers to create goals for their subordinates, employees to review goals and provide self-assessment, and managers to make final evaluations.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

### Frontend
- **Astro 5**: Fast, modern framework for building websites with minimal JavaScript
- **React 19**: For interactive components where needed
- **TypeScript 5**: For static typing and better IDE support
- **Tailwind 4**: For efficient CSS styling
- **Shadcn/ui**: Accessible component library for React

### Backend
- **Supabase**: Complete backend solution that provides:
  - PostgreSQL database
  - SDK in multiple languages (Backend-as-a-Service)
  - Open-source solution that can be hosted locally or on your own server
  - Built-in user authentication

### CI/CD & Hosting
- **GitHub Actions**: For creating CI/CD pipelines
- **DigitalOcean**: For hosting the application via Docker image

## Getting Started

### Prerequisites

- Node.js (version 23.9.0)
- npm (comes with Node.js)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/krzys9876/10x-employee-assessment-system.git
   cd 10x-employee-assessment-system
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to http://localhost:3000

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run astro` - Run Astro CLI commands
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Run ESLint and automatically fix issues
- `npm run format` - Format code using Prettier

## Project Scope

### MVP Features

- Goal definition by managers (manual input or selection from predefined options)
- Goal review by employees (read-only)
- Self-assessment by employees
- Final assessment by managers
- Definition of employee-manager relationships

### Key Requirements

- Each goal has a weight and category
- Validation ensures the sum of goal weights equals 100%
- Single-session process without scrolling
- One-line interface showing all evaluation stages
- Secure access through login and authentication

### Project Boundaries

- Web application only (no mobile apps)
- Simple percentage-based calculations only
- No system notifications (handled outside the application)
- No integration with other company systems
- MVP to be delivered within two weeks of project start

## Project Status

The project is in the early development stage. MVP functionality is being implemented with a focus on delivering a working version within two weeks.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 