# Use an official Python runtime as a parent image
FROM node

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in package.json
RUN npm install

# Define environment variable
ENV DTOKEN token_goes_here

# Run app.js when the container launches
CMD ["node", "app.js"]
