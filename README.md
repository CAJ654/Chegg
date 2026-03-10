
# CHEGG

A strategic Minecraft-based board game of minions and mana, based on the rules created by Gerg.

## Rules

Official Rulebook: [Google Doc](https://docs.google.com/document/d/1TM736HhNsh2nz8l3L-a6PuWAVxbnBSF__NB7qX7Wdlw/edit?usp=drivesdk)

## Project Setup

To connect this project to your GitHub repository and push your changes, run the following commands in your terminal:

```bash
git remote add origin https://github.com/CAJ654/Chegg.git
git branch -M main
git push -u origin main
```

## Docker Instructions

To build the Docker image for this application, run:

```bash
docker build -t chegg-arena .
```

To run the application using Docker Compose:

```bash
docker-compose up --build -d
```

## Credits

- **Rules:** [Gerg](https://youtube.com/@_gerg?si=nRy82bCPkNZAV9M_)
- **Code:** [CAJ654](https://github.com/CAJ654/Chegg)

## Technology Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + Shadcn UI
- **Icons:** Lucide React
- **Logic:** Custom game engine with support for 18 unique minion types.
