# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Compile TypeScript to JavaScript
# The 'tsc' command is provided by the 'typescript' package in your devDependencies
RUN npm exec tsc -- -p tsconfig.json

# Your app binds to port 8080 so you need to tell Docker to expose it
EXPOSE 8080

# Define the command to run your app
CMD [ "node", "dist/index.js" ]