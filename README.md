
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

### Installing Docker (In-Studio / Linux Terminal)
If you are working in a Linux-based terminal environment (like Firebase Studio's terminal), you can use the included official convenience script:

```bash
# Make the script executable
chmod +x get-docker.sh

# Run the installation script
sudo ./get-docker.sh
```

### Starting the Docker Daemon
Before building or running images, ensure the Docker service is active:

```bash
sudo systemctl start docker
```

### Building the Image
To build the Docker image for this application, run (don't forget the dot at the end!):

```bash
docker build -t chegg .
```

### Starting the Container
To run the container you just built:

```bash
docker run -p 3000:3000 chegg
```

### Running with Compose
If you prefer using Docker Compose (recommended for production-like setups):

```bash
docker-compose up --build -d
```

## Credits

- **Rules:** [Gerg](https://youtube.com/@_gerg?si=nRy82bCPkNZAV9M_)
- **Code:** [CAJ654](https://github.com/CAJ654)

## Technology Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + Shadcn UI
- **Icons:** Lucide React
- **Logic:** Custom game engine with support for 18 unique minion types.
