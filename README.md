# Guitar Lesson Planning App

A web application for planning and managing individual guitar lessons. It helps music teachers organize students, weekly schedules, lessons, annual plans, reusable teaching activities, and academic calendars.

## Features

- **Students:** Manage student records, dates of birth, active status, weekly schedules, and academic grade.
- **Teaching locations:** Create and manage schools or teaching locations, assign a color to each location, and associate students with a location.
- **Student list:** Search students, show or hide inactive students, sort by name, grade, or age, and group students by teaching location.
- **Lessons:** Manage individual lesson records and review lesson history.
- **Annual planning:** Organize planned repertoire, studies, and other teaching objectives for each student.
- **Activity library:** Maintain a reusable collection of teaching activities and musical resources.
- **Calendar:** Manage academic-year dates, holidays, vacations, and other events.
- **Lesson generation:** Generate lessons based on student schedules and the selected academic year.
- **Data backup:** Export and import application data.

## Technology stack

- React
- TypeScript
- Vite
- Bun
- TanStack Router
- Tailwind CSS
- shadcn/ui components
- Lucide icons
- GitHub Pages for deployment
- GitHub Actions for automated deployment

## Requirements

- [Bun](https://bun.sh/) installed on your computer.
- Git installed and access to the repository.

## Local development

Clone the repository and install the dependencies:

```bash
git clone https://github.com/carbonne56/guitar-lesson-planning-app.git
cd guitar-lesson-planning-app
bun install
```

Start the development server:

```bash
bun run dev
```

Open the local URL displayed in the terminal.

## Build

To check the application and generate a production build:

```bash
bun run build
```

Run this command before committing and publishing changes.

## Deployment

The application is deployed to GitHub Pages. GitHub Actions automates the deployment workflow when changes are pushed to the `main` branch.

Typical workflow:

```bash
git status
bun run build
git add .
git commit -m "Describe your changes"
git push origin main
```

Check the **Actions** tab in the GitHub repository to confirm that the deployment workflow completes successfully.

## Data storage and backups

Application data is stored in the browser using `localStorage`.

This means that data is associated with the browser and website origin where it was created. It is not automatically synchronized between different browsers or devices.

**Important:**
- Export backups regularly using the application's data export feature.
- Keep backup files in a safe location.
- Avoid clearing the browser's site data unless you have a current backup.
- When importing a backup, make sure it is the intended file.

Publishing a new version of the application does not normally erase existing `localStorage` data, provided the website origin remains the same.

## Project status

The application is actively used for day-to-day guitar lesson planning and management. Development prioritizes practical workflows, reliable data handling, and incremental improvements.

Possible future enhancements include reporting and analysis tools for reviewing teaching activity, student attendance, and progress over time.

## License

No license has been specified for this project. Check the repository's licensing terms before redistributing or reusing the code.
