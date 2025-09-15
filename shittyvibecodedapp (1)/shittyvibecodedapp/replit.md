# CryptoAlerts

## Overview

CryptoAlerts is a gamified quest system designed as a Telegram mini-app that allows users to manage character attributes, complete quests, and track progress through an RPG-style interface. The application features a modern React frontend with Express.js backend, implementing a comprehensive user progression system with admin management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Comprehensive component library built on Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with dark theme support and custom CSS variables
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Animations**: Framer Motion for smooth UI transitions and interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route organization
- **Development**: Hot module replacement with Vite integration for development workflow
- **Error Handling**: Centralized error handling middleware with structured error responses

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL support
- **Schema Management**: Type-safe schema definitions with Zod validation
- **Migrations**: Drizzle Kit for database migrations and schema management
- **Storage Pattern**: Repository pattern with interface-based storage abstraction supporting both memory and database implementations

### Data Models
- **Users**: Character progression system with telegram integration, XP/levels, and RPG attributes (intelligence, speed, defense, stamina, luck)
- **Quest System**: Hierarchical quest organization with groups, individual quests, progress tracking, and reward systems
- **User Progress**: Many-to-many relationship tracking quest completion and progress states with archive functionality
- **Archive System**: Complete quest lifecycle management with archive, delete, and undo operations
- **System Settings**: Global configuration for XP limits, attribute caps, and quest reset intervals

### Authentication & Integration
- **Telegram Integration**: Seamless Telegram Web App integration with user identification via Telegram ID
- **Session Management**: Express session handling with PostgreSQL session store
- **Authorization**: Role-based access control with admin privileges

### Real-time Features
- **Progress Tracking**: Live updates for quest completion and attribute changes
- **Leaderboards**: Dynamic ranking system based on user XP and achievements
- **Character Visualization**: Custom radar chart component for attribute display

### Development Environment
- **Replit Integration**: Specialized Replit plugins for development banner and cartographer
- **TypeScript Configuration**: Strict typing with path mapping for clean imports
- **Hot Reload**: Development server with automatic restart and error overlay
- **Build Process**: Optimized production builds with separate client/server bundling

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Neon database connector for PostgreSQL
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **connect-pg-simple**: PostgreSQL session store for Express

### UI & Styling Libraries
- **@radix-ui/***: Complete suite of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework with dark mode support
- **framer-motion**: Animation library for smooth UI interactions
- **lucide-react**: Icon library for consistent iconography

### State Management & Data Fetching
- **@tanstack/react-query**: Server state management with caching and synchronization
- **react-hook-form**: Form handling with validation
- **@hookform/resolvers**: Form validation resolver integration

### Development Tools
- **@replit/vite-plugin-***: Replit-specific development plugins
- **tsx**: TypeScript execution for development server
- **esbuild**: Fast JavaScript bundler for production builds

### Validation & Utilities
- **zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation utilities
- **clsx & tailwind-merge**: Conditional CSS class utilities