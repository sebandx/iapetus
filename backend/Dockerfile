# ===== BUILDER STAGE =====
# This stage creates a reliable environment to build your TypeScript code.
FROM node:20 AS builder

WORKDIR /usr/src/app

# Copy the package.json AND package-lock.json
# The package-lock.json is crucial for 'npm ci'
COPY package*.json ./

# Use 'npm ci' (Clean Install) instead of 'npm install'.
# This is the recommended command for automated environments like this.
# It installs all dependencies, including devDependencies, from the lock file.
RUN npm ci

# Copy the rest of your source code
COPY . .

# Run the build script to compile TypeScript to JavaScript
RUN npm run build


# ===== PRODUCTION STAGE =====
# This stage creates the final, lean image with only what's needed to run the app.
FROM node:20-slim

WORKDIR /usr/src/app

# Copy only the package.json to install production dependencies
COPY package.json ./

# Install ONLY the production dependencies.
RUN npm install --omit=dev

# Copy the compiled code from the 'builder' stage into this final stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the port the app runs on
EXPOSE 8080

# The command to run the final, compiled application
CMD [ "node", "dist/index.js" ]
