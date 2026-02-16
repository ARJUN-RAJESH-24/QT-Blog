# Use an official Nginx runtime as a parent image
FROM nginx:alpine

# Copy the static content to the Nginx html directory
COPY public /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
