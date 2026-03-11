
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

## Docker Instructions (Firebase Studio / IDX)

In this environment, Docker is often pre-configured. If you encounter permissions errors with `sudo`, it is likely because the environment manages root access differently.

### 1. Check Docker Status
Verify if Docker is already available and usable without sudo:
```bash
docker --version
```

### 2. Building the Image
Use the following command (the dot at the end is required):
```bash
docker build -t chegg .
```

### 3. Running the Container
```bash
docker run -p 3000:3000 chegg
```

### Troubleshooting "Sudo" Errors
If you see an error like `sudo: /usr/bin/sudo must be owned by uid 0`, it is because `pkgs.sudo` was added to `.idx/dev.nix`. Removing that entry and rebuilding the environment will restore the system's built-in `sudo`.

## Credits

- **Rules:** [Gerg](https://youtube.com/@_gerg?si=nRy82bCPkNZAV9M_)
- **Code:** [CAJ654](https://github.com/CAJ654)

## Technology Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + Shadcn UI
- **Icons:** Lucide React
- **Logic:** Custom game engine with support for 18 unique minion types.
