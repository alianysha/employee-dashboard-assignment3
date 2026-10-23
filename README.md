
# Employa – Employee Management Dashboard

## Project Overview
Employa is a web-based employee management application built using the MERN stack. It allows users to register, log in, and manage employee records through a simple dashboard.

## Live Application
- **Frontend:** https://alia-employee-dashboard-web.onrender.com
- **Backend:** https://employee-dashboard-assignment3.onrender.com
- **GitHub Repository:** https://github.com/alianysha/employee-dashboard-assignment3

## Features
- User registration and login
- Secure password hashing
- JWT-based authentication
- View employee records
- Add new employees
- Edit employee details
- Delete employee records
- Search employee records
- Dashboard statistics for employees, positions, and office locations

## Technologies Used
- React
- Node.js
- Express.js
- MongoDB
- JSON Web Token (JWT)
- bcryptjs
- Vite
- Render

## Employee Information
Each employee record contains:
- Name
- Position
- Office location
- Salary

## Project Structure
- `app.js` – Backend server and API routes
- `package.json` – Backend dependencies and scripts
- `frontend-source/` – React frontend source code
- `.gitignore` – Files excluded from version control

## Local Setup

### Prerequisites
- Node.js and npm
- MongoDB database
- Git

### Backend Setup
1. Clone the repository:
   `git clone https://github.com/alianysha/employee-dashboard-assignment3.git`
2. Open the project folder.
3. Install dependencies using `npm install`.
4. Create a `.env` file using the required environment variables.
5. Start the backend using the start command configured in `package.json`.

### Frontend Setup
1. Open the `frontend-source` folder.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local URL displayed in the terminal.

## Environment Variables
Configure these variables in the backend `.env` file:
- `MONGODB_URI` – MongoDB connection string
- `JWT_SECRET` – Secret used to sign authentication tokens

Never commit the actual `.env` file or secret values to GitHub. Provide a `.env.example` file containing placeholder values only.

## Testing
The application has been tested on the deployed website for account registration, login, dashboard access, and employee management. Verify all CRUD operations before final submission.

## Limitations
- The application currently focuses on basic employee management.
- Employee records contain a limited set of fields.
- Advanced reporting and role-based permissions can be added in future versions.

## Future Improvements
- Add more employee details and departments.
- Add role-based access control.
- Add advanced filtering and sorting.
- Add export options for employee records.
- Improve automated testing and validation.

## Screenshots
Add screenshots of the following:
- Login page
- Registration page
- Employee dashboard
- Add employee form
- Edit employee form
- Mobile view

## Author
Student project – Employee Management Dashboard.
