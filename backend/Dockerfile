# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
# This leverages Docker's layer caching for faster builds
COPY package*.json ./

# --- THE CRITICAL FIX ---
# Explicitly install ALL dependencies, including devDependencies needed for the build.
# Some build environments (like this one) default to production mode, which skips them.
RUN npm install --include=dev

# Copy the rest of the application's source code
COPY . .

# Now, this command will have access to the 'typescript' package to compile your code
RUN npm run build

# After the build, prune the devDependencies to keep the final image small and secure
RUN npm prune --production

# Your app binds to port 8080, so you need to tell Docker to expose it
EXPOSE 8080

# Define the command to run the compiled JavaScript application
CMD [ "node", "dist/index.js" ]
